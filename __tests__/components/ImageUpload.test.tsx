import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ImageUpload from '@/components/ImageUpload'

// Mock fetch for Cloudinary API
const mockFetch = jest.fn()
global.fetch = mockFetch

// Mock process.env
const originalEnv = process.env
beforeAll(() => {
  process.env = {
    ...originalEnv,
    NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: 'test-cloud'
  }
})

afterAll(() => {
  process.env = originalEnv
})

describe('ImageUpload', () => {
  const mockOnImagesUploaded = jest.fn()
  
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders upload area', () => {
    render(<ImageUpload onImagesUploaded={mockOnImagesUploaded} />)
    
    expect(screen.getByText(/upload images/i)).toBeInTheDocument()
    expect(screen.getByText(/drag.*drop.*images here/i)).toBeInTheDocument()
  })

  it('shows existing images if provided', () => {
    const existingImages = ['http://test.com/image1.jpg', 'http://test.com/image2.jpg']
    
    render(
      <ImageUpload 
        onImagesUploaded={mockOnImagesUploaded} 
        existingImages={existingImages}
      />
    )
    
    const images = screen.getAllByRole('img')
    expect(images).toHaveLength(2)
  })

  it('respects maxImages limit', () => {
    render(<ImageUpload onImagesUploaded={mockOnImagesUploaded} maxImages={2} />)
    
    expect(screen.getByText(/up to 2 images/i)).toBeInTheDocument()
  })

  it('opens file dialog when click to upload', async () => {
    const user = userEvent.setup()
    render(<ImageUpload onImagesUploaded={mockOnImagesUploaded} />)
    
    const uploadArea = screen.getByText(/click to upload/i)
    await user.click(uploadArea)
    
    // File input should be clicked (we can't test the actual dialog)
    expect(screen.getByRole('button', { hidden: true })).toBeInTheDocument()
  })

  it('handles file selection and upload', async () => {
    const user = userEvent.setup()
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        secure_url: 'https://cloudinary.com/uploaded-image.jpg'
      })
    })

    render(<ImageUpload onImagesUploaded={mockOnImagesUploaded} />)
    
    const fileInput = screen.getByRole('button', { hidden: true })
    const testFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    
    await user.upload(fileInput, testFile)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.cloudinary.com/v1_1/test-cloud/image/upload',
        expect.objectContaining({
          method: 'POST',
          body: expect.any(FormData)
        })
      )
    })
  })

  it('shows loading state during upload', async () => {
    const user = userEvent.setup()
    mockFetch.mockImplementation(() => new Promise(() => {})) // Never resolves

    render(<ImageUpload onImagesUploaded={mockOnImagesUploaded} />)
    
    const fileInput = screen.getByRole('button', { hidden: true })
    const testFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    
    await user.upload(fileInput, testFile)

    await waitFor(() => {
      expect(screen.getByText(/uploading/i)).toBeInTheDocument()
    })
  })

  it('calls onImagesUploaded after successful upload', async () => {
    const user = userEvent.setup()
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        secure_url: 'https://cloudinary.com/uploaded-image.jpg'
      })
    })

    render(<ImageUpload onImagesUploaded={mockOnImagesUploaded} />)
    
    const fileInput = screen.getByRole('button', { hidden: true })
    const testFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    
    await user.upload(fileInput, testFile)

    await waitFor(() => {
      expect(mockOnImagesUploaded).toHaveBeenCalledWith([
        'https://cloudinary.com/uploaded-image.jpg'
      ])
    })
  })

  it('handles upload errors gracefully', async () => {
    const user = userEvent.setup()
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400
    })

    render(<ImageUpload onImagesUploaded={mockOnImagesUploaded} />)
    
    const fileInput = screen.getByRole('button', { hidden: true })
    const testFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    
    await user.upload(fileInput, testFile)

    await waitFor(() => {
      expect(screen.getByText(/upload failed/i)).toBeInTheDocument()
    })
  })

  it('allows removing uploaded images', async () => {
    const user = userEvent.setup()
    const existingImages = ['http://test.com/image1.jpg']
    
    render(
      <ImageUpload 
        onImagesUploaded={mockOnImagesUploaded} 
        existingImages={existingImages}
      />
    )
    
    const removeButton = screen.getByLabelText(/remove image/i)
    await user.click(removeButton)

    await waitFor(() => {
      expect(mockOnImagesUploaded).toHaveBeenCalledWith([])
    })
  })

  it('validates file types', async () => {
    const user = userEvent.setup()
    render(<ImageUpload onImagesUploaded={mockOnImagesUploaded} />)
    
    const fileInput = screen.getByRole('button', { hidden: true })
    const testFile = new File(['test'], 'test.txt', { type: 'text/plain' })
    
    await user.upload(fileInput, testFile)

    await waitFor(() => {
      expect(screen.getByText(/please select valid image files/i)).toBeInTheDocument()
    })
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('enforces maximum file count', async () => {
    const user = userEvent.setup()
    const existingImages = ['http://test.com/image1.jpg', 'http://test.com/image2.jpg']
    
    render(
      <ImageUpload 
        onImagesUploaded={mockOnImagesUploaded} 
        maxImages={2}
        existingImages={existingImages}
      />
    )
    
    const fileInput = screen.getByRole('button', { hidden: true })
    const testFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    
    await user.upload(fileInput, testFile)

    await waitFor(() => {
      expect(screen.getByText(/maximum.*2.*images/i)).toBeInTheDocument()
    })
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('handles drag and drop', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        secure_url: 'https://cloudinary.com/uploaded-image.jpg'
      })
    })

    render(<ImageUpload onImagesUploaded={mockOnImagesUploaded} />)
    
    const dropArea = screen.getByText(/drag.*drop/i).closest('div')
    const testFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    
    fireEvent.dragEnter(dropArea!)
    fireEvent.dragOver(dropArea!)
    fireEvent.drop(dropArea!, {
      dataTransfer: {
        files: [testFile]
      }
    })

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled()
    })
  })
})