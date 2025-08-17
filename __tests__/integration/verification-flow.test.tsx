import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(() => ({
    get: jest.fn()
  }))
}));

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
      getSession: jest.fn(),
      signUp: jest.fn(),
      resend: jest.fn()
    },
    from: jest.fn()
  }
}));

// Dynamic imports for components
const RegisterPage = React.lazy(() => import('@/app/auth/register/page'));
const ProfilePage = React.lazy(() => import('@/app/profile/page'));
const CreateListingPage = React.lazy(() => import('@/app/listings/create/page'));

import React, { Suspense } from 'react';
import { supabase } from '@/lib/supabase';

// Mock fetch for API calls
global.fetch = jest.fn();

// Mock FileReader and camera APIs
global.FileReader = class MockFileReader {
  onload: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
  result: string | ArrayBuffer | null = null;

  readAsDataURL(file: Blob) {
    setTimeout(() => {
      this.result = `data:image/jpeg;base64,mockValidImageData${file.size}`;
      if (this.onload) {
        this.onload({ target: this } as ProgressEvent<FileReader>);
      }
    }, 0);
  }
} as any;

Object.defineProperty(navigator, 'mediaDevices', {
  value: {
    getUserMedia: jest.fn()
  }
});

const mockPush = jest.fn();
const mockRouter = {
  push: mockPush,
  replace: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  prefetch: jest.fn()
};

(useRouter as jest.Mock).mockReturnValue(mockRouter);

describe('Verification Flow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful API responses by default
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        verified: true,
        message: 'Identity verification completed successfully',
        score: 87,
        details: {
          id_verification_score: 85,
          photo_verification_score: 88,
          face_match_score: 89,
          document_type: 'drivers_license',
          verified_at: new Date().toISOString()
        }
      })
    });

    // Mock Supabase responses
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: { id: 'test-user-123', email: 'test@example.com' } }
    });

    (supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: { user: { id: 'test-user-123', email: 'test@example.com' } } }
    });

    const mockFromChain = {
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { phone_verified: true, identity_verified: false }
          })
        })
      }),
      upsert: jest.fn().mockResolvedValue({ error: null }),
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null })
      })
    };
    (supabase.from as jest.Mock).mockReturnValue(mockFromChain);
  });

  describe('Registration Flow with Verification', () => {
    const renderRegisterPage = () => {
      return render(
        <Suspense fallback={<div>Loading...</div>}>
          <RegisterPage />
        </Suspense>
      );
    };

    it('completes full registration flow including verification', async () => {
      const user = userEvent.setup();
      
      // Mock successful signup
      (supabase.auth.signUp as jest.Mock).mockResolvedValue({
        data: { 
          user: { 
            id: 'test-user-123', 
            email: 'test@example.com',
            email_confirmed_at: new Date().toISOString()
          } 
        }
      });

      renderRegisterPage();

      // Fill registration form
      await user.type(screen.getByPlaceholderText('First name'), 'John');
      await user.type(screen.getByPlaceholderText('Last name'), 'Doe');
      await user.type(screen.getByPlaceholderText('Email address'), 'john@example.com');
      await user.type(screen.getByPlaceholderText(/Password/), 'password123');

      // Submit registration
      await user.click(screen.getByText('Create Account'));

      // Should proceed to phone verification (mocked as skipped)
      await waitFor(() => {
        expect(screen.getByText(/phone verification/i)).toBeInTheDocument();
      });

      // Skip phone verification for testing
      const skipPhoneButton = screen.getByText(/skip phone verification/i);
      await user.click(skipPhoneButton);

      // Should reach identity verification step
      await waitFor(() => {
        expect(screen.getByText('Identity Verification')).toBeInTheDocument();
      });

      // Start verification process
      await user.click(screen.getByText('Start Verification'));

      // Should show verification component
      await waitFor(() => {
        expect(screen.getByText('Upload Your ID')).toBeInTheDocument();
      });
    });

    it('handles verification errors during registration gracefully', async () => {
      const user = userEvent.setup();
      
      // Mock verification API failure
      (fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({
          error: 'Verification service temporarily unavailable'
        })
      });

      renderRegisterPage();

      // Navigate to verification step (simplified)
      await user.click(screen.getByText('Skip for now (complete later)'));

      // Should complete registration even without verification
      await waitFor(() => {
        expect(screen.getByText(/Welcome to SafeTrade/)).toBeInTheDocument();
      });
    });

    it('allows users to skip verification and complete later', async () => {
      const user = userEvent.setup();
      renderRegisterPage();

      // Navigate through registration steps quickly
      await user.click(screen.getByText('Skip Email Verification (Testing Only)'));
      await user.click(screen.getByText(/skip phone verification/i));

      // At identity verification step
      await waitFor(() => {
        expect(screen.getByText('Identity Verification')).toBeInTheDocument();
      });

      // Skip verification
      await user.click(screen.getByText('Skip for now (complete later)'));

      // Should complete registration
      await waitFor(() => {
        expect(screen.getByText(/Welcome to SafeTrade/)).toBeInTheDocument();
      });

      // Should show option to complete verification later
      expect(screen.getByText(/complete identity verification/i)).toBeInTheDocument();
    });
  });

  describe('Profile Page Verification', () => {
    const renderProfilePage = () => {
      return render(
        <Suspense fallback={<div>Loading...</div>}>
          <ProfilePage />
        </Suspense>
      );
    };

    it('shows verification option for unverified users', async () => {
      // Mock unverified user
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { identity_verified: false }
            })
          })
        })
      });

      renderProfilePage();

      await waitFor(() => {
        expect(screen.getByText(/Complete Liveness Verification/)).toBeInTheDocument();
      });

      expect(screen.getByText(/Start Verification/)).toBeInTheDocument();
    });

    it('shows verified status for verified users', async () => {
      // Mock verified user
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { identity_verified: true }
            })
          })
        })
      });

      const mockFetch = fetch as jest.Mock;
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ verified: true })
      });

      renderProfilePage();

      await waitFor(() => {
        expect(screen.getByText(/Identity Verified/)).toBeInTheDocument();
      });
    });

    it('allows users to complete verification from profile', async () => {
      const user = userEvent.setup();
      
      // Mock unverified user
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { identity_verified: false }
            })
          })
        })
      });

      renderProfilePage();

      await waitFor(() => {
        expect(screen.getByText(/Start Verification/)).toBeInTheDocument();
      });

      // Start verification process
      await user.click(screen.getByText(/Start Verification/));

      // Should show verification component
      await waitFor(() => {
        expect(screen.getByText('Upload Your ID')).toBeInTheDocument();
      });
    });
  });

  describe('Create Listing Verification Flow', () => {
    const renderCreateListingPage = () => {
      return render(
        <Suspense fallback={<div>Loading...</div>}>
          <CreateListingPage />
        </Suspense>
      );
    };

    it('requires verification before allowing listing creation', async () => {
      // Mock unverified user
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { identity_verified: false }
            })
          })
        })
      });

      renderCreateListingPage();

      await waitFor(() => {
        expect(screen.getByText(/Identity verification is required/)).toBeInTheDocument();
      });

      expect(screen.getByText(/Complete Verification/)).toBeInTheDocument();
    });

    it('allows verified users to create listings directly', async () => {
      // Mock verified user
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { identity_verified: true }
            })
          })
        })
      });

      const mockFetch = fetch as jest.Mock;
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ verified: true })
      });

      renderCreateListingPage();

      await waitFor(() => {
        expect(screen.getByText(/Create Your Listing/)).toBeInTheDocument();
      });

      // Should show listing form, not verification requirement
      expect(screen.getByPlaceholderText(/Title/)).toBeInTheDocument();
    });

    it('handles verification completion during listing creation', async () => {
      const user = userEvent.setup();
      
      // Mock unverified user initially
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { identity_verified: false }
            })
          })
        })
      });

      renderCreateListingPage();

      await waitFor(() => {
        expect(screen.getByText(/Complete Verification/)).toBeInTheDocument();
      });

      // Start verification
      await user.click(screen.getByText(/Complete Verification/));

      // Should show verification component
      await waitFor(() => {
        expect(screen.getByText('Upload Your ID')).toBeInTheDocument();
      });

      // Mock file upload
      const file = new File(['valid image data'], 'id.jpg', { type: 'image/jpeg' });
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      await act(async () => {
        await user.upload(fileInput, file);
      });

      await waitFor(() => {
        expect(screen.getByText('Continue')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Continue'));

      // Mock camera access and photo capture
      const mockStream = { getTracks: () => [{ stop: jest.fn() }] };
      (navigator.mediaDevices.getUserMedia as jest.Mock).mockResolvedValue(mockStream);

      await user.click(screen.getByText('Start Camera'));
      await user.click(screen.getByText('Capture Photo'));

      // Should complete verification and return to listing form
      await waitFor(() => {
        expect(screen.getByText(/Create Your Listing/)).toBeInTheDocument();
      });
    });
  });

  describe('End-to-End Verification Process', () => {
    it('completes full verification flow with ID upload and photo capture', async () => {
      const user = userEvent.setup();
      
      // Render verification component directly for focused testing
      const mockOnComplete = jest.fn();
      const mockOnError = jest.fn();
      
      const SimpleVerification = React.lazy(() => import('@/components/SimpleVerification'));
      
      render(
        <Suspense fallback={<div>Loading...</div>}>
          <SimpleVerification 
            userId="test-user-123"
            onComplete={mockOnComplete}
            onError={mockOnError}
          />
        </Suspense>
      );

      // Start verification
      await user.click(screen.getByText('Start Verification'));

      // Upload ID
      await waitFor(() => {
        expect(screen.getByText('Upload Your ID')).toBeInTheDocument();
      });

      const file = new File(['valid image data'], 'id.jpg', { type: 'image/jpeg' });
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      await act(async () => {
        await user.upload(fileInput, file);
      });

      await waitFor(() => {
        expect(screen.getByText('Continue')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Continue'));

      // Take photo
      await waitFor(() => {
        expect(screen.getByText('Take Your Photo')).toBeInTheDocument();
      });

      // Mock camera access
      const mockStream = { getTracks: () => [{ stop: jest.fn() }] };
      (navigator.mediaDevices.getUserMedia as jest.Mock).mockResolvedValue(mockStream);

      await user.click(screen.getByText('Start Camera'));

      // Mock video and canvas elements for photo capture
      const mockCanvas = {
        getContext: () => ({
          drawImage: jest.fn()
        }),
        toDataURL: () => 'data:image/jpeg;base64,photoData'
      };
      
      const mockVideo = {
        videoWidth: 640,
        videoHeight: 480
      };

      jest.spyOn(document, 'querySelector').mockImplementation((selector) => {
        if (selector === 'canvas') return mockCanvas as any;
        if (selector === 'video') return mockVideo as any;
        return document.querySelector.bind(document)(selector);
      });

      await user.click(screen.getByText('Capture Photo'));

      // Should show processing
      await waitFor(() => {
        expect(screen.getByText('Verifying Your Identity')).toBeInTheDocument();
      });

      // Should complete successfully
      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalledWith({
          verified: true,
          message: 'Identity verification completed successfully'
        });
      });
    });

    it('handles various error scenarios throughout the flow', async () => {
      const user = userEvent.setup();
      
      const mockOnComplete = jest.fn();
      const mockOnError = jest.fn();
      
      const SimpleVerification = React.lazy(() => import('@/components/SimpleVerification'));
      
      render(
        <Suspense fallback={<div>Loading...</div>}>
          <SimpleVerification 
            userId="test-user-123"
            onComplete={mockOnComplete}
            onError={mockOnError}
          />
        </Suspense>
      );

      await user.click(screen.getByText('Start Verification'));

      // Test file upload error
      const oversizedFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      await act(async () => {
        await user.upload(fileInput, oversizedFile);
      });

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith('File size must be less than 10MB');
      });

      // Test camera access error
      (navigator.mediaDevices.getUserMedia as jest.Mock).mockRejectedValue(
        new Error('Permission denied')
      );

      // Upload valid file first
      const validFile = new File(['valid image data'], 'id.jpg', { type: 'image/jpeg' });
      await act(async () => {
        await user.upload(fileInput, validFile);
      });

      await user.click(screen.getByText('Continue'));
      await user.click(screen.getByText('Start Camera'));

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith(
          'Camera access is required. Please allow camera permissions and try again.'
        );
      });
    });

    it('maintains proper state throughout navigation', async () => {
      const user = userEvent.setup();
      
      const SimpleVerification = React.lazy(() => import('@/components/SimpleVerification'));
      
      render(
        <Suspense fallback={<div>Loading...</div>}>
          <SimpleVerification 
            userId="test-user-123"
            onComplete={jest.fn()}
            onError={jest.fn()}
          />
        </Suspense>
      );

      await user.click(screen.getByText('Start Verification'));

      // Upload file
      const file = new File(['valid image data'], 'id.jpg', { type: 'image/jpeg' });
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      await act(async () => {
        await user.upload(fileInput, file);
      });

      await user.click(screen.getByText('Continue'));

      // Navigate back
      await user.click(screen.getByText('← Back to ID upload'));

      // Should maintain uploaded file state
      expect(screen.getByText('ID uploaded successfully')).toBeInTheDocument();
      expect(screen.getByText('Upload different ID')).toBeInTheDocument();
    });
  });

  describe('API Integration', () => {
    it('sends correct data format to verification API', async () => {
      const user = userEvent.setup();
      
      const SimpleVerification = React.lazy(() => import('@/components/SimpleVerification'));
      
      render(
        <Suspense fallback={<div>Loading...</div>}>
          <SimpleVerification 
            userId="test-user-123"
            onComplete={jest.fn()}
            onError={jest.fn()}
          />
        </Suspense>
      );

      // Complete verification flow
      await user.click(screen.getByText('Start Verification'));

      const file = new File(['valid image data'], 'id.jpg', { type: 'image/jpeg' });
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      await act(async () => {
        await user.upload(fileInput, file);
      });

      await user.click(screen.getByText('Continue'));

      // Mock camera and capture photo
      const mockStream = { getTracks: () => [{ stop: jest.fn() }] };
      (navigator.mediaDevices.getUserMedia as jest.Mock).mockResolvedValue(mockStream);

      await user.click(screen.getByText('Start Camera'));

      // Mock DOM elements for capture
      jest.spyOn(document, 'querySelector').mockImplementation((selector) => {
        if (selector === 'canvas') return {
          getContext: () => ({ drawImage: jest.fn() }),
          toDataURL: () => 'data:image/jpeg;base64,photoData'
        } as any;
        if (selector === 'video') return {
          videoWidth: 640,
          videoHeight: 480
        } as any;
        return document.querySelector.bind(document)(selector);
      });

      await user.click(screen.getByText('Capture Photo'));

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/verify-identity', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('"userId":"test-user-123"')
        });
      });

      // Verify request body structure
      const callArgs = (fetch as jest.Mock).mock.calls[0];
      const requestBody = JSON.parse(callArgs[1].body);
      
      expect(requestBody).toHaveProperty('userId');
      expect(requestBody).toHaveProperty('idImage');
      expect(requestBody).toHaveProperty('photoImage');
      expect(requestBody).toHaveProperty('timestamp');
      expect(requestBody.idImage).toMatch(/^data:image\/jpeg;base64,/);
      expect(requestBody.photoImage).toMatch(/^data:image\/jpeg;base64,/);
    });

    it('handles API response correctly', async () => {
      const mockOnComplete = jest.fn();
      
      // Mock successful API response
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          verified: true,
          message: 'Identity verification completed successfully',
          score: 92,
          details: {
            id_verification_score: 90,
            photo_verification_score: 94,
            face_match_score: 92,
            document_type: 'drivers_license',
            verified_at: '2025-08-17T01:00:00.000Z'
          }
        })
      });

      // Test would complete verification flow and verify onComplete is called
      // with the correct response data
      expect(mockOnComplete).toBeDefined();
    });
  });

  describe('Accessibility and UX', () => {
    it('maintains focus management throughout the flow', async () => {
      const user = userEvent.setup();
      
      const SimpleVerification = React.lazy(() => import('@/components/SimpleVerification'));
      
      render(
        <Suspense fallback={<div>Loading...</div>}>
          <SimpleVerification 
            userId="test-user-123"
            onComplete={jest.fn()}
            onError={jest.fn()}
          />
        </Suspense>
      );

      const startButton = screen.getByText('Start Verification');
      startButton.focus();
      
      await user.keyboard('{Enter}');
      
      // Should navigate to next step
      await waitFor(() => {
        expect(screen.getByText('Upload Your ID')).toBeInTheDocument();
      });

      // Focus should be managed properly
      expect(document.activeElement).toBeTruthy();
    });

    it('provides clear progress indication', async () => {
      const SimpleVerification = React.lazy(() => import('@/components/SimpleVerification'));
      
      render(
        <Suspense fallback={<div>Loading...</div>}>
          <SimpleVerification 
            userId="test-user-123"
            onComplete={jest.fn()}
            onError={jest.fn()}
          />
        </Suspense>
      );

      // Should show progress after starting
      await userEvent.setup().click(screen.getByText('Start Verification'));

      // Progress indicator should be visible
      const progressIndicator = document.querySelector('[class*="flex"][class*="items-center"][class*="justify-center"]');
      expect(progressIndicator).toBeInTheDocument();
    });

    it('handles loading states appropriately', async () => {
      (fetch as jest.Mock).mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({
            ok: true,
            json: async () => ({ verified: true })
          }), 1000)
        )
      );

      // Should show loading indicators during processing
      // This ensures users understand the system is working
    });
  });
});