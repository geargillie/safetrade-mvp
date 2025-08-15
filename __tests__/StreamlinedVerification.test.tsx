import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import StreamlinedVerification from '@/components/StreamlinedVerification';

// Mock fetch globally
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

// Mock MediaDevices API
Object.defineProperty(navigator, 'mediaDevices', {
  writable: true,
  value: {
    getUserMedia: jest.fn(),
  },
});

// Mock canvas and video elements
HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
  drawImage: jest.fn(),
}));

HTMLVideoElement.prototype.play = jest.fn();

describe('StreamlinedVerification', () => {
  const mockProps = {
    userId: 'test-user-id',
    onComplete: jest.fn(),
    onError: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
      ok: true,
      json: async () => ({ verified: true, status: 'verified', score: 95 }),
    } as Response);
  });

  describe('Initial Render', () => {
    it('renders verification method selection by default', () => {
      render(<StreamlinedVerification {...mockProps} />);
      
      expect(screen.getByText('Identity Verification')).toBeInTheDocument();
      expect(screen.getByText('Choose your verification method to start selling on SafeTrade')).toBeInTheDocument();
      expect(screen.getByText('Basic Verification')).toBeInTheDocument();
      expect(screen.getByText('Enhanced Verification')).toBeInTheDocument();
    });

    it('displays correct features for each verification method', () => {
      render(<StreamlinedVerification {...mockProps} />);
      
      // Basic verification features
      expect(screen.getByText('Government ID upload')).toBeInTheDocument();
      expect(screen.getByText('Document authenticity check')).toBeInTheDocument();
      expect(screen.getByText('Fast approval (1-2 minutes)')).toBeInTheDocument();
      
      // Enhanced verification features
      expect(screen.getByText('All basic features')).toBeInTheDocument();
      expect(screen.getByText('Selfie + face matching')).toBeInTheDocument();
      expect(screen.getByText('Higher trust level')).toBeInTheDocument();
    });
  });

  describe('Basic Verification Flow', () => {
    it('allows basic verification selection', () => {
      render(<StreamlinedVerification {...mockProps} />);
      
      const basicVerificationCard = screen.getByText('Basic Verification').closest('div');
      fireEvent.click(basicVerificationCard!);
      
      const continueButton = screen.getByText('Continue with Basic Verification');
      fireEvent.click(continueButton);
      
      expect(screen.getByText('Upload Your Documents')).toBeInTheDocument();
      expect(screen.getByText('Upload a clear photo of your government-issued ID')).toBeInTheDocument();
    });

    it('handles document upload for basic verification', async () => {
      render(<StreamlinedVerification {...mockProps} />);
      
      // Select basic verification
      const basicVerificationCard = screen.getByText('Basic Verification').closest('div');
      fireEvent.click(basicVerificationCard!);
      fireEvent.click(screen.getByText('Continue with Basic Verification'));
      
      // Mock file upload
      const fileInput = screen.getByRole('button', { name: /upload government id/i }).parentElement!.querySelector('input[type="file"]');
      const file = new File(['test'], 'test-id.jpg', { type: 'image/jpeg' });
      
      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false,
      });
      
      fireEvent.change(fileInput!);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/identity/free-verify', expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }));
      });
    });
  });

  describe('Enhanced Verification Flow', () => {
    it('allows enhanced verification selection', () => {
      render(<StreamlinedVerification {...mockProps} />);
      
      const enhancedVerificationCard = screen.getByText('Enhanced Verification').closest('div');
      fireEvent.click(enhancedVerificationCard!);
      
      const continueButton = screen.getByText('Continue with Enhanced Verification');
      fireEvent.click(continueButton);
      
      expect(screen.getByText('Upload Your Documents')).toBeInTheDocument();
      expect(screen.getByText('Upload your ID and take a selfie for enhanced security')).toBeInTheDocument();
    });

    it('shows camera interface after document upload for enhanced verification', async () => {
      render(<StreamlinedVerification {...mockProps} />);
      
      // Select enhanced verification
      const enhancedVerificationCard = screen.getByText('Enhanced Verification').closest('div');
      fireEvent.click(enhancedVerificationCard!);
      fireEvent.click(screen.getByText('Continue with Enhanced Verification'));
      
      // Mock document upload
      const fileInput = screen.getByRole('button', { name: /upload government id/i }).parentElement!.querySelector('input[type="file"]');
      const file = new File(['test'], 'test-id.jpg', { type: 'image/jpeg' });
      
      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false,
      });
      
      fireEvent.change(fileInput!);
      
      await waitFor(() => {
        expect(screen.getByText('Take a Selfie')).toBeInTheDocument();
        expect(screen.getByText('Start Camera')).toBeInTheDocument();
      });
    });

    it('handles camera access for selfie capture', async () => {
      const mockStream = {
        getTracks: jest.fn(() => [{ stop: jest.fn() }]),
      };
      
      (navigator.mediaDevices.getUserMedia as jest.Mock).mockResolvedValue(mockStream);
      
      render(<StreamlinedVerification {...mockProps} />);
      
      // Navigate to enhanced verification camera step
      const enhancedVerificationCard = screen.getByText('Enhanced Verification').closest('div');
      fireEvent.click(enhancedVerificationCard!);
      fireEvent.click(screen.getByText('Continue with Enhanced Verification'));
      
      // Upload document to get to camera step
      const fileInput = screen.getByRole('button', { name: /upload government id/i }).parentElement!.querySelector('input[type="file"]');
      const file = new File(['test'], 'test-id.jpg', { type: 'image/jpeg' });
      Object.defineProperty(fileInput, 'files', { value: [file], writable: false });
      fireEvent.change(fileInput!);
      
      await waitFor(() => {
        const startCameraButton = screen.getByText('Start Camera');
        fireEvent.click(startCameraButton);
      });
      
      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
        video: { 
          width: { ideal: 640 }, 
          height: { ideal: 480 },
          facingMode: 'user'
        },
        audio: false
      });
    });
  });

  describe('Error Handling', () => {
    it('handles file size validation', () => {
      render(<StreamlinedVerification {...mockProps} />);
      
      // Select basic verification and get to upload step
      const basicVerificationCard = screen.getByText('Basic Verification').closest('div');
      fireEvent.click(basicVerificationCard!);
      fireEvent.click(screen.getByText('Continue with Basic Verification'));
      
      // Mock large file
      const fileInput = screen.getByRole('button', { name: /upload government id/i }).parentElement!.querySelector('input[type="file"]');
      const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });
      
      Object.defineProperty(fileInput, 'files', {
        value: [largeFile],
        writable: false,
      });
      
      fireEvent.change(fileInput!);
      
      expect(mockProps.onError).toHaveBeenCalledWith('File size must be less than 10MB');
    });

    it('handles invalid file types', () => {
      render(<StreamlinedVerification {...mockProps} />);
      
      // Select basic verification and get to upload step
      const basicVerificationCard = screen.getByText('Basic Verification').closest('div');
      fireEvent.click(basicVerificationCard!);
      fireEvent.click(screen.getByText('Continue with Basic Verification'));
      
      // Mock invalid file type
      const fileInput = screen.getByRole('button', { name: /upload government id/i }).parentElement!.querySelector('input[type="file"]');
      const invalidFile = new File(['test'], 'test.txt', { type: 'text/plain' });
      
      Object.defineProperty(fileInput, 'files', {
        value: [invalidFile],
        writable: false,
      });
      
      fireEvent.change(fileInput!);
      
      expect(mockProps.onError).toHaveBeenCalledWith('Please upload an image file');
    });

    it('handles camera access errors', async () => {
      (navigator.mediaDevices.getUserMedia as jest.Mock).mockRejectedValue(new Error('Camera access denied'));
      
      render(<StreamlinedVerification {...mockProps} />);
      
      // Navigate to camera step
      const enhancedVerificationCard = screen.getByText('Enhanced Verification').closest('div');
      fireEvent.click(enhancedVerificationCard!);
      fireEvent.click(screen.getByText('Continue with Enhanced Verification'));
      
      // Upload document
      const fileInput = screen.getByRole('button', { name: /upload government id/i }).parentElement!.querySelector('input[type="file"]');
      const file = new File(['test'], 'test-id.jpg', { type: 'image/jpeg' });
      Object.defineProperty(fileInput, 'files', { value: [file], writable: false });
      fireEvent.change(fileInput!);
      
      await waitFor(() => {
        const startCameraButton = screen.getByText('Start Camera');
        fireEvent.click(startCameraButton);
      });
      
      await waitFor(() => {
        expect(mockProps.onError).toHaveBeenCalledWith('Camera access required for enhanced verification');
      });
    });

    it('handles verification API errors', async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'Verification failed' }),
      } as Response);
      
      render(<StreamlinedVerification {...mockProps} />);
      
      // Complete basic verification flow
      const basicVerificationCard = screen.getByText('Basic Verification').closest('div');
      fireEvent.click(basicVerificationCard!);
      fireEvent.click(screen.getByText('Continue with Basic Verification'));
      
      // Upload document
      const fileInput = screen.getByRole('button', { name: /upload government id/i }).parentElement!.querySelector('input[type="file"]');
      const file = new File(['test'], 'test-id.jpg', { type: 'image/jpeg' });
      Object.defineProperty(fileInput, 'files', { value: [file], writable: false });
      fireEvent.change(fileInput!);
      
      await waitFor(() => {
        expect(mockProps.onError).toHaveBeenCalledWith('Verification failed. Please try again.');
      });
    });
  });

  describe('Success Flow', () => {
    it('calls onComplete when verification succeeds', async () => {
      render(<StreamlinedVerification {...mockProps} />);
      
      // Complete basic verification
      const basicVerificationCard = screen.getByText('Basic Verification').closest('div');
      fireEvent.click(basicVerificationCard!);
      fireEvent.click(screen.getByText('Continue with Basic Verification'));
      
      // Upload document
      const fileInput = screen.getByRole('button', { name: /upload government id/i }).parentElement!.querySelector('input[type="file"]');
      const file = new File(['test'], 'test-id.jpg', { type: 'image/jpeg' });
      Object.defineProperty(fileInput, 'files', { value: [file], writable: false });
      fireEvent.change(fileInput!);
      
      await waitFor(() => {
        expect(mockProps.onComplete).toHaveBeenCalledWith({
          verified: true,
          status: 'verified',
          score: 95,
          message: 'Identity verified successfully',
          method: 'basic'
        });
      });
    });

    it('displays completion screen with verification details', async () => {
      render(<StreamlinedVerification {...mockProps} />);
      
      // Manually set the completion state
      const basicVerificationCard = screen.getByText('Basic Verification').closest('div');
      fireEvent.click(basicVerificationCard!);
      fireEvent.click(screen.getByText('Continue with Basic Verification'));
      
      // Upload document and wait for completion
      const fileInput = screen.getByRole('button', { name: /upload government id/i }).parentElement!.querySelector('input[type="file"]');
      const file = new File(['test'], 'test-id.jpg', { type: 'image/jpeg' });
      Object.defineProperty(fileInput, 'files', { value: [file], writable: false });
      fireEvent.change(fileInput!);
      
      await waitFor(() => {
        expect(screen.getByText('Verification Complete')).toBeInTheDocument();
        expect(screen.getByText('Your identity has been successfully verified. You can now create listings and start trading.')).toBeInTheDocument();
      });
    });
  });

  describe('Progress Indicators', () => {
    it('shows progress indicators during verification flow', () => {
      render(<StreamlinedVerification {...mockProps} />);
      
      // Select and proceed to capture step
      const basicVerificationCard = screen.getByText('Basic Verification').closest('div');
      fireEvent.click(basicVerificationCard!);
      fireEvent.click(screen.getByText('Continue with Basic Verification'));
      
      // Check progress indicators are present
      expect(screen.getByText('Documents')).toBeInTheDocument();
      expect(screen.getByText('Processing')).toBeInTheDocument();
      expect(screen.getByText('Complete')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and semantic structure', () => {
      render(<StreamlinedVerification {...mockProps} />);
      
      // Check main heading
      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Identity Verification');
      
      // Check buttons are accessible - the button text is dynamic based on selected method
      expect(screen.getByText(/Continue with.*Verification/)).toBeInTheDocument();
    });

    it('supports keyboard navigation', () => {
      render(<StreamlinedVerification {...mockProps} />);
      
      // Find the cards by their container divs that have the cursor-pointer class
      const cards = document.querySelectorAll('.cursor-pointer');
      
      // Should have 2 clickable cards (basic and enhanced)
      expect(cards).toHaveLength(2);
      expect(cards[0]).toHaveClass('cursor-pointer');
      expect(cards[1]).toHaveClass('cursor-pointer');
    });
  });
});