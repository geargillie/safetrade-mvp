'use client';

import React, { useState, useRef, useCallback } from 'react';

interface SimpleVerificationProps {
  userId: string;
  onComplete: (result: { 
    verified: boolean; 
    message: string;
  }) => void;
  onError: (error: string) => void;
}

type VerificationStep = 'intro' | 'id-upload' | 'photo-capture' | 'processing' | 'complete';

export default function SimpleVerification({ 
  userId, 
  onComplete, 
  onError 
}: SimpleVerificationProps) {
  const [currentStep, setCurrentStep] = useState<VerificationStep>('intro');
  const [loading, setLoading] = useState(false);
  const [idImage, setIdImage] = useState<string | null>(null);
  const [photoImage, setPhotoImage] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [videoReady, setVideoReady] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Cleanup camera stream
  React.useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  // Handle video readiness
  const handleVideoReady = useCallback(() => {
    if (videoRef.current) {
      console.log('Video ready check:', {
        readyState: videoRef.current.readyState,
        videoWidth: videoRef.current.videoWidth,
        videoHeight: videoRef.current.videoHeight,
        srcObject: !!videoRef.current.srcObject,
        paused: videoRef.current.paused
      });
      
      // More lenient check - video is ready if it has dimensions or readyState >= 2
      if ((videoRef.current.videoWidth > 0 && videoRef.current.videoHeight > 0) || 
          videoRef.current.readyState >= 2) {
        console.log('Video is ready for capture');
        setVideoReady(true);
      }
    }
  }, []);

  // Reset video ready state when stream changes
  React.useEffect(() => {
    setVideoReady(false);
    if (videoRef.current && stream) {
      const video = videoRef.current;
      
      // Add multiple event listeners for better compatibility
      video.addEventListener('loadedmetadata', handleVideoReady);
      video.addEventListener('canplay', handleVideoReady);
      video.addEventListener('playing', handleVideoReady);
      video.addEventListener('loadeddata', handleVideoReady);
      
      // Fallback timer - force ready after 2 seconds to ensure video shows
      const fallbackTimer = setTimeout(() => {
        console.log('Fallback timer triggered - forcing video ready');
        if (videoRef.current) {
          console.log('Video dimensions:', videoRef.current.videoWidth, 'x', videoRef.current.videoHeight);
          setVideoReady(true);
        }
      }, 2000);
      
      // Also check immediately in case video is already ready
      const checkTimer = setTimeout(() => {
        handleVideoReady();
      }, 100);
      
      return () => {
        video.removeEventListener('loadedmetadata', handleVideoReady);
        video.removeEventListener('canplay', handleVideoReady);
        video.removeEventListener('playing', handleVideoReady);
        video.removeEventListener('loadeddata', handleVideoReady);
        clearTimeout(fallbackTimer);
        clearTimeout(checkTimer);
      };
    }
  }, [stream, handleVideoReady]);

  // Handle ID document upload
  const handleIdUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    if (file.size > 10 * 1024 * 1024) {
      onError('File size must be less than 10MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      onError('Please upload an image file');
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setIdImage(base64);
      setCurrentStep('photo-capture');
    };
    reader.onerror = () => {
      onError('Failed to read file. Please try again.');
    };
    reader.readAsDataURL(file);
  }, [onError]);

  // Start camera for photo capture
  const startCamera = useCallback(async () => {
    try {
      console.log('🎥 Starting camera...');
      console.log('Browser capabilities:', {
        hasGetUserMedia: !!navigator.mediaDevices?.getUserMedia,
        hasMediaDevices: !!navigator.mediaDevices,
        userAgent: navigator.userAgent,
        isSecureContext: window.isSecureContext
      });
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 1280, min: 640 }, 
          height: { ideal: 720, min: 480 },
          facingMode: 'user'
        },
        audio: false
      });
      
      console.log('✅ Camera stream obtained:', {
        streamId: mediaStream.id,
        tracks: mediaStream.getTracks().map(track => ({
          kind: track.kind,
          enabled: track.enabled,
          readyState: track.readyState,
          muted: track.muted
        }))
      });
      
      setStream(mediaStream);
      
      if (videoRef.current) {
        console.log('🎥 Setting video srcObject...');
        videoRef.current.srcObject = mediaStream;
        
        // Wait a bit for the srcObject to be set
        setTimeout(async () => {
          if (videoRef.current) {
            console.log('🎬 Video element state after srcObject set:', {
              srcObject: !!videoRef.current.srcObject,
              readyState: videoRef.current.readyState,
              videoWidth: videoRef.current.videoWidth,
              videoHeight: videoRef.current.videoHeight,
              paused: videoRef.current.paused,
              ended: videoRef.current.ended,
              muted: videoRef.current.muted
            });
            
            // Explicitly play the video to ensure it shows
            try {
              await videoRef.current.play();
              console.log('✅ Video play() successful');
            } catch (playError) {
              console.log('⚠️ Video play() failed:', playError);
            }
          }
        }, 100);
      } else {
        console.error('❌ videoRef.current is null!');
      }
    } catch (error) {
      console.error('Camera access error:', error);
      onError('Camera access is required. Please allow camera permissions and try again.');
    }
  }, [onError]);

  // Capture photo from camera
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !stream) {
      onError('Camera not ready. Please try again.');
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      onError('Failed to capture photo. Please try again.');
      return;
    }

    // More lenient dimension check - use default if no dimensions
    let width = video.videoWidth || 640;
    let height = video.videoHeight || 480;
    
    // If still no dimensions, try to force them
    if (width === 0 || height === 0) {
      console.log('Using fallback dimensions');
      width = 640;
      height = 480;
    }
    
    console.log('Capturing photo with dimensions:', width, 'x', height);

    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(video, 0, 0, width, height);

    // Use higher quality for better file size
    const photoDataUrl = canvas.toDataURL('image/jpeg', 0.92);
    console.log('Photo captured, data URL length:', photoDataUrl.length);
    
    // Stop camera
    stream.getTracks().forEach(track => track.stop());
    setStream(null);
    
    setPhotoImage(photoDataUrl);
    setCurrentStep('processing');
    
    // Submit verification
    submitVerification(idImage!, photoDataUrl);
  }, [stream, idImage, onError, videoReady]);

  // Submit verification to API
  const submitVerification = async (idImageData: string, photoImageData: string) => {
    setLoading(true);
    
    try {
      const response = await fetch('/api/verify-identity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          idImage: idImageData,
          photoImage: photoImageData,
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Verification failed (${response.status})`);
      }

      const result = await response.json();
      
      if (result.verified) {
        setCurrentStep('complete');
        onComplete({
          verified: true,
          message: 'Identity verification completed successfully'
        });
      } else {
        setCurrentStep('intro');
        setIdImage(null);
        setPhotoImage(null);
        onError(result.message || 'Verification failed. Please try again.');
      }
    } catch (error) {
      console.error('Verification error:', error);
      setCurrentStep('intro');
      setIdImage(null);
      setPhotoImage(null);
      const errorMessage = error instanceof Error ? error.message : 'Verification failed';
      onError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Reset verification
  const resetVerification = () => {
    setCurrentStep('intro');
    setIdImage(null);
    setPhotoImage(null);
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const renderIntro = () => (
    <div className="text-center">
      <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto mb-6">
        <span className="text-white text-2xl">🆔</span>
      </div>
      
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        Identity Verification
      </h2>
      
      <p className="text-gray-600 mb-8 max-w-md mx-auto">
        To ensure secure trading, we need to verify your identity with a government-issued ID and a photo of yourself.
      </p>

      <div className="bg-gray-50 rounded-xl p-6 mb-8 text-left max-w-md mx-auto">
        <h3 className="font-semibold text-gray-900 mb-4">You&apos;ll need:</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-700">Government-issued photo ID</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-700">Camera access for selfie</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-700">2-3 minutes of your time</span>
          </div>
        </div>
      </div>

      <button
        onClick={() => setCurrentStep('id-upload')}
        className="bg-black text-white px-8 py-3 rounded-xl font-semibold hover:bg-gray-800 transition-colors"
      >
        Start Verification
      </button>
    </div>
  );

  const renderIdUpload = () => (
    <div className="text-center">
      <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
        <span className="text-white text-xl">📄</span>
      </div>
      
      <h3 className="text-xl font-bold text-gray-900 mb-4">
        Upload Your ID
      </h3>
      
      <p className="text-gray-600 mb-8">
        Upload a clear photo of your government-issued ID (driver&apos;s license, passport, or state ID)
      </p>

      {!idImage ? (
        <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 mb-6">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleIdUpload}
            className="hidden"
          />
          
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-xl">📎</span>
          </div>
          
          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-black text-white px-6 py-3 rounded-xl font-semibold hover:bg-gray-800 transition-colors"
            disabled={loading}
          >
            Choose File
          </button>
          
          <p className="text-sm text-gray-500 mt-4">
            JPG, PNG up to 10MB
          </p>
        </div>
      ) : (
        <div className="mb-6">
          <div className="bg-green-50 border border-green-200 rounded-xl p-6">
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-xl">✓</span>
            </div>
            <p className="text-green-800 font-semibold">ID uploaded successfully</p>
            <button
              onClick={() => setIdImage(null)}
              className="text-green-600 text-sm mt-2 hover:underline"
            >
              Upload different ID
            </button>
          </div>
          
          <button
            onClick={() => setCurrentStep('photo-capture')}
            className="bg-black text-white px-8 py-3 rounded-xl font-semibold hover:bg-gray-800 transition-colors mt-6"
          >
            Continue
          </button>
        </div>
      )}
    </div>
  );

  const renderPhotoCapture = () => (
    <div className="text-center">
      <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-6">
        <span className="text-white text-xl">📷</span>
      </div>
      
      <h3 className="text-xl font-bold text-gray-900 mb-4">
        Take Your Photo
      </h3>
      
      <p className="text-gray-600 mb-8">
        Take a clear photo of yourself for identity verification
      </p>

      <div className="bg-gray-50 rounded-xl p-6 mb-6">
        {!stream ? (
          <div>
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📷</span>
            </div>
            <button
              onClick={startCamera}
              className="bg-black text-white px-6 py-3 rounded-xl font-semibold hover:bg-gray-800 transition-colors"
            >
              Start Camera
            </button>
          </div>
        ) : (
          <div>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              controls={false}
              className="w-80 h-60 rounded-xl bg-gray-900 mb-4 mx-auto block object-cover"
              style={{
                maxWidth: '100%',
                height: '240px',
                width: '320px',
                display: 'block',
                margin: '0 auto',
                border: '2px solid #e5e7eb',
                backgroundColor: '#111827'
              }}
              onLoadedMetadata={() => console.log('📺 Video metadata loaded')}
              onCanPlay={() => console.log('📺 Video can play')}
              onPlaying={() => console.log('📺 Video is playing')}
              onLoadedData={() => console.log('📺 Video data loaded')}
              onError={(e) => console.error('📺 Video error:', e)}
            />
            {!videoReady ? (
              <div className="text-center">
                <div className="animate-pulse w-3 h-3 bg-blue-500 rounded-full mx-auto mb-2"></div>
                <p className="text-sm text-gray-600 mb-4">Camera initializing...</p>
                <button
                  disabled
                  className="bg-gray-400 text-white px-6 py-3 rounded-xl font-semibold cursor-not-allowed mb-3"
                >
                  Please Wait...
                </button>
                <br />
                <button
                  onClick={() => setVideoReady(true)}
                  className="text-blue-600 hover:text-blue-800 text-sm underline"
                >
                  Camera ready? Click to continue
                </button>
              </div>
            ) : (
              <button
                onClick={capturePhoto}
                className="bg-black text-white px-6 py-3 rounded-xl font-semibold hover:bg-gray-800 transition-colors"
              >
                Capture Photo
              </button>
            )}
          </div>
        )}
      </div>
      
      <canvas ref={canvasRef} className="hidden" />
      
      <button
        onClick={() => setCurrentStep('id-upload')}
        className="text-gray-600 hover:text-gray-800 transition-colors"
      >
        ← Back to ID upload
      </button>
    </div>
  );

  const renderProcessing = () => (
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-3 border-gray-200 border-t-black mx-auto mb-6"></div>
      
      <h3 className="text-xl font-bold text-gray-900 mb-4">
        Verifying Your Identity
      </h3>
      
      <p className="text-gray-600 mb-8">
        Please wait while we securely verify your documents...
      </p>

      <div className="bg-gray-50 rounded-xl p-6 max-w-sm mx-auto">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="animate-pulse w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-sm text-gray-700">Analyzing ID document</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="animate-pulse w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-sm text-gray-700">Verifying photo match</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="animate-pulse w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-sm text-gray-700">Security validation</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderComplete = () => (
    <div className="text-center">
      <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
        <span className="text-white text-2xl">✓</span>
      </div>
      
      <h3 className="text-2xl font-bold text-gray-900 mb-4">
        Verification Complete!
      </h3>
      
      <p className="text-gray-600 mb-8">
        Your identity has been successfully verified. You can now create listings and start trading on SafeTrade.
      </p>

      <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-6 max-w-md mx-auto">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Verification Status:</span>
          <span className="text-green-700 font-semibold">Verified ✓</span>
        </div>
        <div className="flex items-center justify-between text-sm mt-2">
          <span className="text-gray-600">Completed:</span>
          <span className="text-gray-900">{new Date().toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
        {/* Progress indicator */}
        {currentStep !== 'intro' && currentStep !== 'complete' && (
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${
                ['id-upload', 'photo-capture', 'processing'].includes(currentStep) 
                  ? 'bg-black' : 'bg-gray-200'
              }`}></div>
              <div className={`w-12 h-1 ${
                ['photo-capture', 'processing'].includes(currentStep) 
                  ? 'bg-black' : 'bg-gray-200'
              }`}></div>
              <div className={`w-3 h-3 rounded-full ${
                ['photo-capture', 'processing'].includes(currentStep) 
                  ? 'bg-black' : 'bg-gray-200'
              }`}></div>
              <div className={`w-12 h-1 ${
                currentStep === 'processing' 
                  ? 'bg-black' : 'bg-gray-200'
              }`}></div>
              <div className={`w-3 h-3 rounded-full ${
                currentStep === 'processing' 
                  ? 'bg-black' : 'bg-gray-200'
              }`}></div>
            </div>
          </div>
        )}

        {/* Step content */}
        {currentStep === 'intro' && renderIntro()}
        {currentStep === 'id-upload' && renderIdUpload()}
        {currentStep === 'photo-capture' && renderPhotoCapture()}
        {currentStep === 'processing' && renderProcessing()}
        {currentStep === 'complete' && renderComplete()}

        {/* Retry button for failed verifications */}
        {currentStep === 'intro' && (idImage || photoImage) && (
          <div className="mt-6 text-center">
            <button
              onClick={resetVerification}
              className="text-gray-500 text-sm hover:text-gray-700 transition-colors"
            >
              Reset verification
            </button>
          </div>
        )}
      </div>
    </div>
  );
}