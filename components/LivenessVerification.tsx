'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';

interface LivenessVerificationProps {
  userId: string;
  onComplete: (result: { 
    verified: boolean; 
    score: number; 
    message: string;
  }) => void;
  onError: (error: string) => void;
}

type VerificationStep = 'intro' | 'camera' | 'capture' | 'processing' | 'complete';

export default function LivenessVerification({ 
  userId, 
  onComplete, 
  onError 
}: LivenessVerificationProps) {
  const [currentStep, setCurrentStep] = useState<VerificationStep>('intro');
  const [loading, setLoading] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [instruction, setInstruction] = useState('');
  const [countdown, setCountdown] = useState(0);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Instructions for liveness check
  const instructions = [
    'Look straight at the camera',
    'Slowly turn your head to the left',
    'Slowly turn your head to the right',
    'Smile naturally',
    'Blink twice'
  ];

  useEffect(() => {
    return () => {
      // Cleanup camera stream on unmount
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: 640, 
          height: 480,
          facingMode: 'user'
        }
      });
      
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setCurrentStep('capture');
      startLivenessSequence();
    } catch (error) {
      console.error('Error accessing camera:', error);
      onError('Unable to access camera. Please ensure camera permissions are granted.');
    }
  };

  const startLivenessSequence = () => {
    let instructionIndex = 0;
    setInstruction(instructions[instructionIndex]);
    
    const interval = setInterval(() => {
      instructionIndex++;
      if (instructionIndex < instructions.length) {
        setInstruction(instructions[instructionIndex]);
      } else {
        clearInterval(interval);
        startCountdown();
      }
    }, 3000);
  };

  const startCountdown = () => {
    setInstruction('Get ready for capture');
    setCountdown(3);
    
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          captureImage();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const processLivenessVerification = async (imageData: string) => {
    setLoading(true);
    console.log('🚀 Starting liveness verification for user:', userId);
    
    try {
      const response = await fetch('/api/verify-liveness', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          imageData,
          timestamp: new Date().toISOString()
        })
      });

      const result = await response.json();
      console.log('📊 Liveness verification result:', { 
        status: response.status, 
        verified: result.verified,
        score: result.score,
        error: result.error 
      });
      
      if (response.ok) {
        if (result.verified) {
          setCurrentStep('complete');
          onComplete({
            verified: result.verified,
            score: result.score,
            message: result.message
          });
        } else {
          // Verification completed but failed - reset to allow retry
          console.log('❌ Verification failed, resetting UI');
          setCurrentStep('intro');
          setCapturedImage(null);
          onError(result.message || 'Liveness verification failed. Please try again with better lighting.');
        }
      } else {
        console.error('❌ Liveness verification API error:', result);
        setCurrentStep('intro');
        setCapturedImage(null);
        onError(result.error || `Verification failed (${response.status})`);
      }
    } catch (error) {
      console.error('❌ Liveness verification network error:', error);
      setCurrentStep('intro');
      setCapturedImage(null);
      onError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const captureImage = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) {
      console.error('❌ Missing video or canvas ref');
      return;
    }

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext('2d');
    
    if (!context) {
      console.error('❌ Could not get canvas context');
      return;
    }

    // Ensure video has valid dimensions
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      console.error('❌ Video has no dimensions:', { width: video.videoWidth, height: video.videoHeight });
      onError('Camera not ready. Please try again.');
      return;
    }

    console.log('📹 Video dimensions:', { width: video.videoWidth, height: video.videoHeight });
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);
    
    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);
    setCapturedImage(imageDataUrl);
    
    // Validate captured image before processing
    console.log('📸 Captured image details:', {
      length: imageDataUrl.length,
      starts: imageDataUrl.substring(0, 50),
      isValidFormat: imageDataUrl.startsWith('data:image/'),
      hasBase64: imageDataUrl.includes(',')
    });
    
    if (!imageDataUrl.startsWith('data:image/') || imageDataUrl.length < 1000) {
      console.error('❌ Invalid captured image format');
      onError('Failed to capture image properly. Please try again.');
      return;
    }
    
    // Stop camera stream
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    
    setCurrentStep('processing');
    processLivenessVerification(imageDataUrl);
  }, [stream, processLivenessVerification]);

  const retryVerification = () => {
    setCapturedImage(null);
    setCountdown(0);
    setInstruction('');
    setCurrentStep('intro');
  };

  const renderIntroStep = () => (
    <div className="text-center">
      <div style={{
        width: '4rem',
        height: '4rem',
        backgroundColor: 'var(--brand-primary)',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 1.5rem auto'
      }}>
        <span className="text-white text-2xl">📷</span>
      </div>
      
      <h3 style={{
        fontSize: '1.5rem',
        fontWeight: '600',
        color: 'var(--neutral-900)',
        margin: '0 0 1rem 0'
      }}>
        Liveness Verification
      </h3>
      
      <p style={{
        fontSize: '1rem',
        color: 'var(--neutral-600)',
        margin: '0 0 2rem 0',
        maxWidth: '400px',
        marginLeft: 'auto',
        marginRight: 'auto',
        lineHeight: '1.5'
      }}>
        We&apos;ll guide you through a quick liveness check to verify your identity. 
        This helps ensure the security of all transactions on SafeTrade.
      </p>

      <div style={{
        backgroundColor: 'var(--neutral-50)',
        border: '1px solid var(--neutral-200)',
        borderRadius: '0.75rem',
        padding: '1.5rem',
        margin: '0 0 2rem 0',
        textAlign: 'left'
      }}>
        <h4 style={{
          fontSize: '1rem',
          fontWeight: '600',
          color: 'var(--neutral-900)',
          margin: '0 0 1rem 0'
        }}>
          What to expect:
        </h4>
        <ul className="space-y-2" style={{
          fontSize: '0.875rem',
          color: 'var(--neutral-700)'
        }}>
          <li className="flex items-start gap-2">
            <span style={{color: 'var(--success)'}}>✓</span>
            <span>Position your face clearly in the camera frame</span>
          </li>
          <li className="flex items-start gap-2">
            <span style={{color: 'var(--success)'}}>✓</span>
            <span>Follow simple head movement instructions</span>
          </li>
          <li className="flex items-start gap-2">
            <span style={{color: 'var(--success)'}}>✓</span>
            <span>Takes about 30 seconds to complete</span>
          </li>
        </ul>
      </div>

      <button
        onClick={() => setCurrentStep('camera')}
        className="btn btn-primary"
        style={{
          padding: '0.75rem 2rem',
          fontSize: '1rem',
          fontWeight: '600'
        }}
      >
        Start Verification
      </button>
    </div>
  );

  const renderCameraStep = () => (
    <div className="text-center">
      <h3 style={{
        fontSize: '1.25rem',
        fontWeight: '600',
        color: 'var(--neutral-900)',
        margin: '0 0 1rem 0'
      }}>
        Camera Access Required
      </h3>
      
      <p style={{
        fontSize: '0.875rem',
        color: 'var(--neutral-600)',
        margin: '0 0 2rem 0'
      }}>
        Click &quot;Allow&quot; when prompted to enable camera access for verification.
      </p>

      <button
        onClick={startCamera}
        className="btn btn-primary"
        style={{
          padding: '0.75rem 2rem',
          fontSize: '1rem',
          fontWeight: '600'
        }}
      >
        Enable Camera
      </button>
    </div>
  );

  const renderCaptureStep = () => (
    <div className="text-center">
      <div style={{
        position: 'relative',
        display: 'inline-block',
        borderRadius: '1rem',
        overflow: 'hidden',
        border: '2px solid var(--brand-primary)',
        marginBottom: '1.5rem'
      }}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{
            width: '320px',
            height: '240px',
            objectFit: 'cover'
          }}
        />
        
        {countdown > 0 && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: '4rem',
            fontWeight: '700',
            color: 'var(--brand-primary)',
            textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
          }}>
            {countdown}
          </div>
        )}
      </div>

      <canvas ref={canvasRef} style={{ display: 'none' }} />

      <div style={{
        backgroundColor: 'var(--brand-50)',
        border: '1px solid var(--brand-200)',
        borderRadius: '0.75rem',
        padding: '1rem',
        margin: '0 auto',
        maxWidth: '320px'
      }}>
        <p style={{
          fontSize: '1rem',
          fontWeight: '600',
          color: 'var(--brand-800)',
          margin: '0'
        }}>
          {instruction || 'Please wait...'}
        </p>
      </div>
    </div>
  );

  const renderProcessingStep = () => (
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 mx-auto mb-4" style={{
        borderWidth: '3px',
        borderColor: 'var(--neutral-200)',
        borderTopColor: 'var(--brand-primary)'
      }}></div>
      
      <h3 style={{
        fontSize: '1.25rem',
        fontWeight: '600',
        color: 'var(--neutral-900)',
        margin: '0 0 0.5rem 0'
      }}>
        Processing Verification
      </h3>
      
      <p style={{
        fontSize: '0.875rem',
        color: 'var(--neutral-600)'
      }}>
        Analyzing your liveness verification...
      </p>

      {capturedImage && (
        <div className="mt-4">
          <div style={{
            width: '200px',
            height: '150px',
            borderRadius: '0.5rem',
            border: '1px solid var(--neutral-200)',
            margin: '0 auto',
            backgroundImage: `url(${capturedImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }} />
        </div>
      )}
    </div>
  );

  const renderCompleteStep = () => (
    <div className="text-center">
      <div style={{
        width: '4rem',
        height: '4rem',
        backgroundColor: 'var(--success)',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 1.5rem auto'
      }}>
        <span className="text-white text-2xl">✓</span>
      </div>
      
      <h3 style={{
        fontSize: '1.5rem',
        fontWeight: '600',
        color: 'var(--neutral-900)',
        margin: '0 0 1rem 0'
      }}>
        Verification Complete
      </h3>
      
      <p style={{
        fontSize: '1rem',
        color: 'var(--neutral-600)',
        margin: '0'
      }}>
        Your identity has been successfully verified!
      </p>
    </div>
  );

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '1rem',
      border: '1px solid var(--neutral-200)',
      padding: '2rem',
      maxWidth: '500px',
      margin: '0 auto'
    }}>
      {currentStep === 'intro' && renderIntroStep()}
      {currentStep === 'camera' && renderCameraStep()}
      {currentStep === 'capture' && renderCaptureStep()}
      {currentStep === 'processing' && renderProcessingStep()}
      {currentStep === 'complete' && renderCompleteStep()}
      
      {currentStep === 'processing' && !loading && (
        <div className="mt-4 text-center">
          <button
            onClick={retryVerification}
            className="btn btn-secondary"
            style={{
              padding: '0.5rem 1rem',
              fontSize: '0.875rem'
            }}
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}