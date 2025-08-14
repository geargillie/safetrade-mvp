import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import FreeIdentityVerification from '@/components/FreeIdentityVerification'

// Mock fetch
global.fetch = jest.fn()

const mockProps = {
  userId: 'user-123',
  onComplete: jest.fn(),
  onError: jest.fn()
}

describe('FreeIdentityVerification', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockClear()
  })

  it('renders intro step initially', () => {
    render(<FreeIdentityVerification {...mockProps} />)
    
    expect(screen.getByText('Government ID Verification')).toBeInTheDocument()
    expect(screen.getByText('Upload Government ID')).toBeInTheDocument()
  })

  it('moves to document upload step when clicked', async () => {
    render(<FreeIdentityVerification {...mockProps} />)
    
    const uploadButton = screen.getByText('Upload Government ID')
    fireEvent.click(uploadButton)
    
    expect(screen.getByText('Upload Your Government ID')).toBeInTheDocument()
    expect(screen.getByText('Select Document')).toBeInTheDocument()
  })

  it('validates file size', async () => {
    render(<FreeIdentityVerification {...mockProps} />)
    
    // Go to document step
    fireEvent.click(screen.getByText('Upload Government ID'))
    
    // Create a large file (>10MB)
    const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.jpg', {
      type: 'image/jpeg'
    })
    
    const fileInput = screen.getByLabelText(/select document/i)
    await userEvent.upload(fileInput, largeFile)
    
    expect(mockProps.onError).toHaveBeenCalledWith('File size must be less than 10MB')
  })

  it('validates file type', async () => {
    render(<FreeIdentityVerification {...mockProps} />)
    
    // Go to document step
    fireEvent.click(screen.getByText('Upload Government ID'))
    
    // Create a non-image file
    const textFile = new File(['content'], 'document.txt', {
      type: 'text/plain'
    })
    
    const fileInput = screen.getByLabelText(/select document/i)
    await userEvent.upload(fileInput, textFile)
    
    expect(mockProps.onError).toHaveBeenCalledWith('Please upload an image file')
  })

  it('processes valid document upload', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        verified: true,
        score: 95,
        message: 'Verification successful'
      })
    })

    render(<FreeIdentityVerification {...mockProps} />)
    
    // Go to document step
    fireEvent.click(screen.getByText('Upload Government ID'))
    
    // Create a valid image file
    const imageFile = new File(['image content'], 'id.jpg', {
      type: 'image/jpeg'
    })
    
    const fileInput = screen.getByLabelText(/select document/i)
    await userEvent.upload(fileInput, imageFile)
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/verify-government-id', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('"userId":"user-123"')
      })
    })
  })

  it('handles verification success', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        verified: true,
        score: 95,
        message: 'ID Verification Complete!'
      })
    })

    render(<FreeIdentityVerification {...mockProps} />)
    
    // Go to document step and upload file
    fireEvent.click(screen.getByText('Upload Government ID'))
    
    const imageFile = new File(['image content'], 'id.jpg', {
      type: 'image/jpeg'
    })
    
    const fileInput = screen.getByLabelText(/select document/i)
    await userEvent.upload(fileInput, imageFile)
    
    await waitFor(() => {
      expect(mockProps.onComplete).toHaveBeenCalledWith({
        verified: true,
        score: 95,
        message: 'ID Verification Complete!'
      })
    })
  })

  it('handles verification failure', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        verified: false,
        score: 60,
        message: 'Verification failed'
      })
    })

    render(<FreeIdentityVerification {...mockProps} />)
    
    // Go to document step and upload file
    fireEvent.click(screen.getByText('Upload Government ID'))
    
    const imageFile = new File(['image content'], 'id.jpg', {
      type: 'image/jpeg'
    })
    
    const fileInput = screen.getByLabelText(/select document/i)
    await userEvent.upload(fileInput, imageFile)
    
    await waitFor(() => {
      expect(mockProps.onComplete).toHaveBeenCalledWith({
        verified: false,
        score: 60,
        message: 'Verification failed'
      })
    })
  })

  it('handles API errors', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        error: 'Server error'
      })
    })

    render(<FreeIdentityVerification {...mockProps} />)
    
    // Go to document step and upload file
    fireEvent.click(screen.getByText('Upload Government ID'))
    
    const imageFile = new File(['image content'], 'id.jpg', {
      type: 'image/jpeg'
    })
    
    const fileInput = screen.getByLabelText(/select document/i)
    await userEvent.upload(fileInput, imageFile)
    
    await waitFor(() => {
      expect(mockProps.onError).toHaveBeenCalledWith('Verification failed. Please try again.')
    })
  })

  it('shows processing state during verification', async () => {
    ;(global.fetch as jest.Mock).mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        json: async () => ({ verified: true, score: 95 })
      }), 100))
    )

    render(<FreeIdentityVerification {...mockProps} />)
    
    // Go to document step and upload file
    fireEvent.click(screen.getByText('Upload Government ID'))
    
    const imageFile = new File(['image content'], 'id.jpg', {
      type: 'image/jpeg'
    })
    
    const fileInput = screen.getByLabelText(/select document/i)
    await userEvent.upload(fileInput, imageFile)
    
    expect(screen.getByText('Processing...')).toBeInTheDocument()
  })
})