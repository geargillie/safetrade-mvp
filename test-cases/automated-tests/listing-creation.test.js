// test-cases/automated-tests/listing-creation.test.js
// Automated tests for SafeTrade listing creation flow

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { supabase } from '@/lib/supabase';
import CreateListing from '@/app/listings/create/page';

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(() => ({
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
    })),
  },
}));

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

describe('Listing Creation Flow', () => {
  const mockUser = {
    id: 'test-user-123',
    email: 'test@example.com',
  };

  beforeEach(() => {
    // Setup authenticated user
    supabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('TC-LC-001: Step Navigation Forward', () => {
    test('should navigate through all 4 steps successfully', async () => {
      const user = userEvent.setup();
      render(<CreateListing />);

      // Step 1: Basic Information
      expect(screen.getByText('Basic Information')).toBeInTheDocument();
      
      await user.type(screen.getByPlaceholderText(/e.g., 2019 Honda CBR600RR/), '2019 Honda CBR600RR Sport Bike');
      await user.type(screen.getByPlaceholderText(/Describe the condition/), 'Excellent condition motorcycle with low miles');
      await user.type(screen.getByPlaceholderText('15000'), '12000');
      await user.selectOptions(screen.getByDisplayValue('Select condition'), 'excellent');

      await user.click(screen.getByText('Continue'));

      // Step 2: Vehicle Details
      await waitFor(() => {
        expect(screen.getByText('Vehicle Details')).toBeInTheDocument();
      });

      await user.selectOptions(screen.getByDisplayValue('Select make'), 'Honda');
      await user.type(screen.getByPlaceholderText('CB650R'), 'CBR600RR');
      await user.type(screen.getByPlaceholderText('2019'), '2019');
      await user.type(screen.getByPlaceholderText('12000'), '15000');
      await user.type(screen.getByPlaceholderText('1HGBH41JXMN109186'), '1HGBH41JXMN109186');

      await user.click(screen.getByText('Continue'));

      // Step 3: Location & Photos
      await waitFor(() => {
        expect(screen.getByText('Location & Photos')).toBeInTheDocument();
      });

      await user.type(screen.getByPlaceholderText('Los Angeles'), 'San Diego');
      await user.type(screen.getByPlaceholderText('90210'), '92101');

      // Mock successful image upload
      const imageFile = new File(['mock image'], 'test.jpg', { type: 'image/jpeg' });
      const imageInput = screen.getByLabelText(/upload/i);
      await user.upload(imageInput, imageFile);

      await user.click(screen.getByText('Continue to Review'));

      // Step 4: Review & Publish
      await waitFor(() => {
        expect(screen.getByText('Review & Publish')).toBeInTheDocument();
      });

      expect(screen.getByText('2019 Honda CBR600RR Sport Bike')).toBeInTheDocument();
      expect(screen.getByText('$12,000')).toBeInTheDocument();
    });
  });

  describe('TC-LC-002: Step Navigation Backward', () => {
    test('should navigate backward and preserve data', async () => {
      const user = userEvent.setup();
      render(<CreateListing />);

      // Fill Step 1
      await user.type(screen.getByPlaceholderText(/e.g., 2019 Honda CBR600RR/), 'Test Title');
      await user.click(screen.getByText('Continue'));

      // Go to Step 2, then back to Step 1
      await waitFor(() => {
        expect(screen.getByText('Vehicle Details')).toBeInTheDocument();
      });
      
      await user.click(screen.getByText('Back'));

      await waitFor(() => {
        expect(screen.getByText('Basic Information')).toBeInTheDocument();
      });

      // Verify data persisted
      expect(screen.getByDisplayValue('Test Title')).toBeInTheDocument();
    });
  });

  describe('TC-LC-004: Title Validation', () => {
    test('should show error for empty title', async () => {
      const user = userEvent.setup();
      render(<CreateListing />);

      await user.click(screen.getByText('Continue'));

      expect(screen.getByText('Title is required')).toBeInTheDocument();
    });

    test('should accept valid title', async () => {
      const user = userEvent.setup();
      render(<CreateListing />);

      await user.type(screen.getByPlaceholderText(/e.g., 2019 Honda CBR600RR/), '2019 Honda CBR600RR Sport Bike');

      expect(screen.queryByText('Title is required')).not.toBeInTheDocument();
    });
  });

  describe('TC-LC-005: Description Validation', () => {
    test('should show error for empty description', async () => {
      const user = userEvent.setup();
      render(<CreateListing />);

      await user.type(screen.getByPlaceholderText(/e.g., 2019 Honda CBR600RR/), 'Valid Title');
      await user.click(screen.getByText('Continue'));

      expect(screen.getByText('Description is required')).toBeInTheDocument();
    });

    test('should accept valid description', async () => {
      const user = userEvent.setup();
      render(<CreateListing />);

      await user.type(screen.getByPlaceholderText(/e.g., 2019 Honda CBR600RR/), 'Valid Title');
      await user.type(screen.getByPlaceholderText(/Describe the condition/), 'This is a valid description');

      expect(screen.queryByText('Description is required')).not.toBeInTheDocument();
    });
  });

  describe('TC-LC-006: Price Validation', () => {
    test.each([
      ['empty', '', 'Valid price is required'],
      ['zero', '0', 'Valid price is required'],
      ['negative', '-100', 'Valid price is required'],
    ])('should show error for %s price', async (scenario, price, expectedError) => {
      const user = userEvent.setup();
      render(<CreateListing />);

      await user.type(screen.getByPlaceholderText(/e.g., 2019 Honda CBR600RR/), 'Valid Title');
      await user.type(screen.getByPlaceholderText(/Describe the condition/), 'Valid description');
      
      if (price) {
        await user.type(screen.getByPlaceholderText('15000'), price);
      }

      await user.click(screen.getByText('Continue'));

      expect(screen.getByText(expectedError)).toBeInTheDocument();
    });

    test('should accept valid price', async () => {
      const user = userEvent.setup();
      render(<CreateListing />);

      await user.type(screen.getByPlaceholderText(/e.g., 2019 Honda CBR600RR/), 'Valid Title');
      await user.type(screen.getByPlaceholderText(/Describe the condition/), 'Valid description');
      await user.type(screen.getByPlaceholderText('15000'), '12000');
      await user.selectOptions(screen.getByDisplayValue('Select condition'), 'excellent');

      await user.click(screen.getByText('Continue'));

      expect(screen.queryByText('Valid price is required')).not.toBeInTheDocument();
    });
  });

  describe('TC-LC-008: VIN Validation', () => {
    test('should show error for invalid VIN length', async () => {
      const user = userEvent.setup();
      render(<CreateListing />);

      // Navigate to Step 2
      await fillStep1AndContinue(user);
      
      await user.type(screen.getByPlaceholderText('1HGBH41JXMN109186'), '123456789');
      await user.click(screen.getByText('Continue'));

      expect(screen.getByText('Valid 17-character VIN is required')).toBeInTheDocument();
    });

    test('should accept valid 17-character VIN', async () => {
      const user = userEvent.setup();
      render(<CreateListing />);

      await fillStep1AndContinue(user);
      
      await user.selectOptions(screen.getByDisplayValue('Select make'), 'Honda');
      await user.type(screen.getByPlaceholderText('CB650R'), 'CBR600RR');
      await user.type(screen.getByPlaceholderText('2019'), '2019');
      await user.type(screen.getByPlaceholderText('12000'), '15000');
      await user.type(screen.getByPlaceholderText('1HGBH41JXMN109186'), '1HGBH41JXMN109186');

      await user.click(screen.getByText('Continue'));

      expect(screen.queryByText('Valid 17-character VIN is required')).not.toBeInTheDocument();
    });
  });

  describe('TC-LC-015: Final Submission', () => {
    test('should submit listing successfully', async () => {
      const mockInsert = jest.fn().mockResolvedValue({
        data: { id: 'new-listing-123', title: 'Test Listing' },
        error: null,
      });

      supabase.from.mockReturnValue({
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: mockInsert,
          })),
        })),
      });

      const user = userEvent.setup();
      render(<CreateListing />);

      // Complete all steps
      await completeAllSteps(user);

      // Submit
      await user.click(screen.getByText('Publish Listing'));

      await waitFor(() => {
        expect(mockInsert).toHaveBeenCalled();
      });
    });
  });

  // Helper functions
  async function fillStep1AndContinue(user) {
    await user.type(screen.getByPlaceholderText(/e.g., 2019 Honda CBR600RR/), 'Test Title');
    await user.type(screen.getByPlaceholderText(/Describe the condition/), 'Test description');
    await user.type(screen.getByPlaceholderText('15000'), '12000');
    await user.selectOptions(screen.getByDisplayValue('Select condition'), 'excellent');
    await user.click(screen.getByText('Continue'));
    
    await waitFor(() => {
      expect(screen.getByText('Vehicle Details')).toBeInTheDocument();
    });
  }

  async function completeAllSteps(user) {
    // Step 1
    await user.type(screen.getByPlaceholderText(/e.g., 2019 Honda CBR600RR/), '2019 Honda CBR600RR');
    await user.type(screen.getByPlaceholderText(/Describe the condition/), 'Excellent condition');
    await user.type(screen.getByPlaceholderText('15000'), '12000');
    await user.selectOptions(screen.getByDisplayValue('Select condition'), 'excellent');
    await user.click(screen.getByText('Continue'));

    // Step 2
    await waitFor(() => {
      expect(screen.getByText('Vehicle Details')).toBeInTheDocument();
    });
    await user.selectOptions(screen.getByDisplayValue('Select make'), 'Honda');
    await user.type(screen.getByPlaceholderText('CB650R'), 'CBR600RR');
    await user.type(screen.getByPlaceholderText('2019'), '2019');
    await user.type(screen.getByPlaceholderText('12000'), '15000');
    await user.type(screen.getByPlaceholderText('1HGBH41JXMN109186'), '1HGBH41JXMN109186');
    await user.click(screen.getByText('Continue'));

    // Step 3
    await waitFor(() => {
      expect(screen.getByText('Location & Photos')).toBeInTheDocument();
    });
    await user.type(screen.getByPlaceholderText('Los Angeles'), 'San Diego');
    await user.type(screen.getByPlaceholderText('90210'), '92101');
    
    // Mock image upload
    const imageFile = new File(['mock image'], 'test.jpg', { type: 'image/jpeg' });
    const imageInput = screen.getByLabelText(/upload/i);
    await user.upload(imageInput, imageFile);
    
    await user.click(screen.getByText('Continue to Review'));

    // Step 4
    await waitFor(() => {
      expect(screen.getByText('Review & Publish')).toBeInTheDocument();
    });
  }
});

// Progress calculation tests
describe('TC-LC-003: Progress Calculation', () => {
  test('should calculate progress correctly', async () => {
    const user = userEvent.setup();
    render(<CreateListing />);

    // Initial progress should be 0%
    expect(screen.getByText('0% complete')).toBeInTheDocument();

    // Fill title field
    await user.type(screen.getByPlaceholderText(/e.g., 2019 Honda CBR600RR/), 'Test Title');
    
    // Progress should update (exact percentage depends on implementation)
    await waitFor(() => {
      const progressText = screen.getByText(/\d+% complete/);
      expect(progressText).toBeInTheDocument();
      expect(progressText.textContent).not.toBe('0% complete');
    });
  });
});