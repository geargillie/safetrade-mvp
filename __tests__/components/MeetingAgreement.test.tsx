import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import MeetingAgreement from '@/components/MeetingAgreement'

describe('MeetingAgreement', () => {
  const defaultProps = {
    listingId: 'test-listing',
    conversationId: 'test-conversation',
    listingTitle: 'Test Motorcycle',
    listingPrice: 10000,
    listingCity: 'Newark',
    listingZipCode: '07101',
    isSellerView: false,
    onSelectMeetingLocation: jest.fn(),
    onCancel: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Agreement Step', () => {
    it('renders buyer view correctly', () => {
      render(<MeetingAgreement {...defaultProps} />)
      
      expect(screen.getByText(/ready to buy/i)).toBeInTheDocument()
      expect(screen.getByText('Test Motorcycle')).toBeInTheDocument()
      expect(screen.getByText('$10,000')).toBeInTheDocument()
      expect(screen.getByText(/yes, i want to buy/i)).toBeInTheDocument()
    })

    it('renders seller view correctly', () => {
      render(<MeetingAgreement {...defaultProps} isSellerView={true} />)
      
      expect(screen.getByText(/purchase interest/i)).toBeInTheDocument()
      expect(screen.getByText(/buyer is interested/i)).toBeInTheDocument()
      expect(screen.getByText(/arrange meeting/i)).toBeInTheDocument()
    })

    it('calls onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup()
      render(<MeetingAgreement {...defaultProps} />)
      
      const cancelButton = screen.getByText(/cancel/i)
      await user.click(cancelButton)
      
      expect(defaultProps.onCancel).toHaveBeenCalled()
    })

    it('proceeds to price step when proceed button is clicked', async () => {
      const user = userEvent.setup()
      render(<MeetingAgreement {...defaultProps} />)
      
      const proceedButton = screen.getByText(/yes, i want to buy/i)
      await user.click(proceedButton)
      
      await waitFor(() => {
        expect(screen.getByText(/agree on final price/i)).toBeInTheDocument()
      })
    })
  })

  describe('Price Step', () => {
    it('displays price negotiation form', async () => {
      const user = userEvent.setup()
      render(<MeetingAgreement {...defaultProps} />)
      
      const proceedButton = screen.getByText(/yes, i want to buy/i)
      await user.click(proceedButton)

      await waitFor(() => {
        expect(screen.getByText(/agree on final price/i)).toBeInTheDocument()
        expect(screen.getByDisplayValue('10000')).toBeInTheDocument()
      })
    })

    it('updates agreed price when input changes', async () => {
      const user = userEvent.setup()
      render(<MeetingAgreement {...defaultProps} />)
      
      const proceedButton = screen.getByText(/yes, i want to buy/i)
      await user.click(proceedButton)

      await waitFor(async () => {
        const priceInput = screen.getByDisplayValue('10000')
        await user.clear(priceInput)
        await user.type(priceInput, '9500')
        
        expect(priceInput).toHaveValue(9500)
      })
    })

    it('shows price change indicator when price is negotiated', async () => {
      const user = userEvent.setup()
      render(<MeetingAgreement {...defaultProps} />)
      
      const proceedButton = screen.getByText(/yes, i want to buy/i)
      await user.click(proceedButton)

      await waitFor(async () => {
        const priceInput = screen.getByDisplayValue('10000')
        await user.clear(priceInput)
        await user.type(priceInput, '9500')
        
        expect(screen.getByText(/price change detected/i)).toBeInTheDocument()
        expect(screen.getByText(/-\$500 below asking price/i)).toBeInTheDocument()
      })
    })

    it('disables continue button for invalid price', async () => {
      const user = userEvent.setup()
      render(<MeetingAgreement {...defaultProps} />)
      
      const proceedButton = screen.getByText(/yes, i want to buy/i)
      await user.click(proceedButton)

      await waitFor(async () => {
        const priceInput = screen.getByDisplayValue('10000')
        await user.clear(priceInput)
        
        const continueButton = screen.getByText(/agree on \$/i)
        expect(continueButton).toBeDisabled()
      })
    })

    it('proceeds to location step when valid price is agreed', async () => {
      const user = userEvent.setup()
      render(<MeetingAgreement {...defaultProps} />)
      
      const proceedButton = screen.getByText(/yes, i want to buy/i)
      await user.click(proceedButton)

      await waitFor(async () => {
        const continueButton = screen.getByText(/agree on \$10,000/i)
        await user.click(continueButton)
        
        expect(screen.getByText(/choose safe meeting location/i)).toBeInTheDocument()
      })
    })
  })

  describe('Location Step', () => {
    it('displays meeting location suggestions', async () => {
      const user = userEvent.setup()
      render(<MeetingAgreement {...defaultProps} />)
      
      // Navigate through steps
      await user.click(screen.getByText(/yes, i want to buy/i))
      
      await waitFor(async () => {
        await user.click(screen.getByText(/agree on \$10,000/i))
        
        expect(screen.getByText(/choose safe meeting location/i)).toBeInTheDocument()
        expect(screen.getByText(/public police station parking lot/i)).toBeInTheDocument()
      })
    })

    it('allows selecting custom location', async () => {
      const user = userEvent.setup()
      render(<MeetingAgreement {...defaultProps} />)
      
      // Navigate to location step
      await user.click(screen.getByText(/yes, i want to buy/i))
      await waitFor(async () => {
        await user.click(screen.getByText(/agree on \$10,000/i))
      })

      await waitFor(async () => {
        const customRadio = screen.getByRole('radio', { name: /other public location/i })
        await user.click(customRadio)
        
        expect(screen.getByPlaceholderText(/walmart parking lot/i)).toBeInTheDocument()
      })
    })

    it('validates date and time selection', async () => {
      const user = userEvent.setup()
      render(<MeetingAgreement {...defaultProps} />)
      
      // Navigate to location step
      await user.click(screen.getByText(/yes, i want to buy/i))
      await waitFor(async () => {
        await user.click(screen.getByText(/agree on \$10,000/i))
      })

      await waitFor(() => {
        const continueButton = screen.getByText(/continue/i)
        expect(continueButton).toBeDisabled()
      })
    })

    it('enables continue when all fields are filled', async () => {
      const user = userEvent.setup()
      render(<MeetingAgreement {...defaultProps} />)
      
      // Navigate to location step
      await user.click(screen.getByText(/yes, i want to buy/i))
      await waitFor(async () => {
        await user.click(screen.getByText(/agree on \$10,000/i))
      })

      // Wait for location step to render first
      await waitFor(() => {
        expect(screen.getByText(/choose safe meeting location/i)).toBeInTheDocument()
      })

      await waitFor(async () => {
        // Select a location
        const locationRadio = screen.getAllByRole('radio')[0]
        await user.click(locationRadio)
        
        // Set date (tomorrow)
        const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        fireEvent.change(dateInput, { target: { value: tomorrow.toISOString().split('T')[0] } })
        
        // Set time
        const timeSelect = screen.getByRole('combobox')
        await user.selectOptions(timeSelect, '2:00 PM')
        
        const continueButton = screen.getByText(/continue/i)
        expect(continueButton).not.toBeDisabled()
      })
    })
  })

  describe('Confirmation Step', () => {
    it('displays meeting confirmation details', async () => {
      const user = userEvent.setup()
      render(<MeetingAgreement {...defaultProps} />)
      
      // Navigate through all steps
      await user.click(screen.getByText(/yes, i want to buy/i))
      
      await waitFor(async () => {
        await user.click(screen.getByText(/agree on \$10,000/i))
      })

      // Wait for location step to render first
      await waitFor(() => {
        expect(screen.getByText(/choose safe meeting location/i)).toBeInTheDocument()
      })

      await waitFor(async () => {
        // Fill location form
        const locationRadio = screen.getAllByRole('radio')[0]
        await user.click(locationRadio)
        
        const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        fireEvent.change(dateInput, { target: { value: tomorrow.toISOString().split('T')[0] } })
        
        const timeSelect = screen.getByRole('combobox')
        await user.selectOptions(timeSelect, '2:00 PM')
        
        await user.click(screen.getByText(/continue/i))
      })

      await waitFor(() => {
        expect(screen.getByText(/confirm meeting details/i)).toBeInTheDocument()
        expect(screen.getByText('Test Motorcycle')).toBeInTheDocument()
        expect(screen.getByText('$10,000')).toBeInTheDocument()
      })
    })

    it('calls onSelectMeetingLocation when meeting is confirmed', async () => {
      const user = userEvent.setup()
      render(<MeetingAgreement {...defaultProps} />)
      
      // Navigate through all steps
      await user.click(screen.getByText(/yes, i want to buy/i))
      
      await waitFor(async () => {
        await user.click(screen.getByText(/agree on \$10,000/i))
      })

      // Wait for location step to render first
      await waitFor(() => {
        expect(screen.getByText(/choose safe meeting location/i)).toBeInTheDocument()
      })

      await waitFor(async () => {
        // Fill location form
        const locationRadio = screen.getAllByRole('radio')[0]
        await user.click(locationRadio)
        
        const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        fireEvent.change(dateInput, { target: { value: tomorrow.toISOString().split('T')[0] } })
        
        const timeSelect = screen.getByRole('combobox')
        await user.selectOptions(timeSelect, '2:00 PM')
        
        await user.click(screen.getByText(/continue/i))
      })

      await waitFor(async () => {
        const confirmButton = screen.getByRole('button', { name: /confirm meeting/i })
        await user.click(confirmButton)
        
        expect(defaultProps.onSelectMeetingLocation).toHaveBeenCalledWith(
          expect.any(String),
          expect.stringContaining('at 2:00 PM'),
          10000
        )
      })
    })
  })

  describe('Navigation', () => {
    it('allows going back between steps', async () => {
      const user = userEvent.setup()
      render(<MeetingAgreement {...defaultProps} />)
      
      // Go to price step
      await user.click(screen.getByText(/yes, i want to buy/i))
      
      await waitFor(async () => {
        // Go back to agreement
        await user.click(screen.getByText(/back/i))
        
        expect(screen.getByText(/ready to buy/i)).toBeInTheDocument()
      })
    })
  })
})