import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PhoneVerification from '@/components/PhoneVerification'

// Mock fetch
const mockFetch = jest.fn()
global.fetch = mockFetch

describe('PhoneVerification', () => {
  const mockOnVerified = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders phone input form initially', () => {
    render(<PhoneVerification onVerified={mockOnVerified} />)
    
    expect(screen.getByPlaceholderText('(555) 123-4567')).toBeInTheDocument()
    expect(screen.getByText(/send verification code/i)).toBeInTheDocument()
  })

  it('formats phone number as user types', async () => {
    const user = userEvent.setup()
    render(<PhoneVerification onVerified={mockOnVerified} />)
    
    const phoneInput = screen.getByPlaceholderText('(555) 123-4567')
    
    await user.type(phoneInput, '5551234567')
    
    expect(phoneInput).toHaveValue('(555) 123-4567')
  })

  it('sends verification code when phone form is submitted', async () => {
    const user = userEvent.setup()
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, message: 'Code sent' })
    })

    render(<PhoneVerification onVerified={mockOnVerified} />)
    
    const phoneInput = screen.getByPlaceholderText('(555) 123-4567')
    const sendButton = screen.getByText(/send verification code/i)
    
    await user.type(phoneInput, '5551234567')
    await user.click(sendButton)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/verify-phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: '(555) 123-4567', action: 'send' })
      })
    })
  })

  it('shows code input form after sending code', async () => {
    const user = userEvent.setup()
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, message: 'Code sent' })
    })

    render(<PhoneVerification onVerified={mockOnVerified} />)
    
    const phoneInput = screen.getByPlaceholderText('(555) 123-4567')
    const sendButton = screen.getByText(/send verification code/i)
    
    await user.type(phoneInput, '5551234567')
    await user.click(sendButton)

    await waitFor(() => {
      expect(screen.getByPlaceholderText('123456')).toBeInTheDocument()
      expect(screen.getByText(/verify phone/i)).toBeInTheDocument()
    })
  })

  it('verifies code when code form is submitted', async () => {
    const user = userEvent.setup()
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: 'Code sent' })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: 'Verified' })
      })

    render(<PhoneVerification onVerified={mockOnVerified} />)
    
    // First send code
    const phoneInput = screen.getByPlaceholderText('(555) 123-4567')
    const sendButton = screen.getByText(/send verification code/i)
    
    await user.type(phoneInput, '5551234567')
    await user.click(sendButton)

    // Then verify code
    await waitFor(async () => {
      const codeInput = screen.getByPlaceholderText('123456')
      const verifyButton = screen.getByText(/verify phone/i)
      
      await user.type(codeInput, '123456')
      await user.click(verifyButton)
    })

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/verify-phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: '(555) 123-4567', code: '123456', action: 'verify' })
      })
    })
  })

  it('calls onVerified when verification is successful', async () => {
    const user = userEvent.setup()
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: 'Code sent' })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: 'Verified' })
      })

    render(<PhoneVerification onVerified={mockOnVerified} />)
    
    // Send code
    const phoneInput = screen.getByPlaceholderText('(555) 123-4567')
    const sendButton = screen.getByText(/send verification code/i)
    
    await user.type(phoneInput, '5551234567')
    await user.click(sendButton)

    // Wait for code step and verify
    await waitFor(async () => {
      const codeInput = screen.getByPlaceholderText('123456')
      const verifyButton = screen.getByText(/verify phone/i)
      
      await user.type(codeInput, '123456')
      await user.click(verifyButton)
      
      // Wait for success message
      await waitFor(() => {
        expect(screen.getByText(/phone verified successfully/i)).toBeInTheDocument()
      })
      
      expect(mockOnVerified).toHaveBeenCalled()
    })
  })

  it('shows error message on failed verification', async () => {
    const user = userEvent.setup()
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: false, message: 'Invalid phone number' })
    })

    render(<PhoneVerification onVerified={mockOnVerified} />)
    
    const phoneInput = screen.getByPlaceholderText('(555) 123-4567')
    await user.type(phoneInput, '5551234567')
    
    const sendButton = screen.getByText(/send verification code/i)
    await user.click(sendButton)

    await waitFor(() => {
      expect(screen.getByText(/error.*invalid phone number/i)).toBeInTheDocument()
    })
  })

  it('allows user to go back and change phone number', async () => {
    const user = userEvent.setup()
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, message: 'Code sent' })
    })

    render(<PhoneVerification onVerified={mockOnVerified} />)
    
    // Send code
    const phoneInput = screen.getByPlaceholderText('(555) 123-4567')
    const sendButton = screen.getByText(/send verification code/i)
    
    await user.type(phoneInput, '5551234567')
    await user.click(sendButton)

    // Wait for code step then click back
    await waitFor(async () => {
      const backButton = screen.getByText(/change phone number/i)
      await user.click(backButton)
    })

    await waitFor(() => {
      expect(screen.getByPlaceholderText('(555) 123-4567')).toBeInTheDocument()
      expect(screen.getByText(/send verification code/i)).toBeInTheDocument()
    })
  })

  it('handles loading state correctly', async () => {
    const user = userEvent.setup()
    mockFetch.mockImplementation(() => new Promise(() => {})) // Never resolves

    render(<PhoneVerification onVerified={mockOnVerified} />)
    
    const phoneInput = screen.getByPlaceholderText('(555) 123-4567')
    const sendButton = screen.getByText(/send verification code/i)
    
    await user.type(phoneInput, '5551234567')
    await user.click(sendButton)

    await waitFor(() => {
      expect(sendButton).toBeDisabled()
    })
  })
})