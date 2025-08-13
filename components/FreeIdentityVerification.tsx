'use client';

import React, { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';

interface FreeIdentityVerificationProps {
  userId: string;
  onComplete: (result: any) => void;
  onError: (error: string) => void;
}

type VerificationStep = 'intro' | 'document' | 'selfie' | 'liveness' | 'processing' | 'complete';

export default function FreeIdentityVerification({ 
  userId, 
  onComplete, 
  onError 
}: FreeIdentityVerificationProps) {
  const [currentStep, setCurrentStep] = useState<VerificationStep>('intro');
  const [loading, setLoading] = useState(false);
  const [documentImage, setDocumentImage] = useState<string | null>(null);
  const [selfieImage, setSelfieImage] = useState<string | null>(null);
  const [livenessImages, setLivenessImages] = useState<string[]>([]);
  const [extractedData, setExtractedData] = useState<any>(null);
  
  const webcamRef = useRef<Webcam>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Document upload handler
  const handleDocumentUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      onError('File size must be less than 5MB');
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      onError('Please upload an image file');
      return;
    }

    setLoading(true);
    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        setDocumentImage(base64);
        
        // Extract text from document using OCR
        await extractDocumentData(base64);
        setCurrentStep('selfie');
      };
      reader.readAsDataURL(file);
    } catch (error) {
      onError('Failed to process document');
    } finally {
      setLoading(false);
    }
  }, [onError]);

  // Extract data from document using free OCR
  const extractDocumentData = async (imageBase64: string) => {
    try {
      // This would use Tesseract.js (free OCR) in a real implementation
      // For demo purposes, we'll simulate extraction
      const mockExtractedData = {
        documentType: 'drivers_license',
        name: 'Extracted from document',
        dateOfBirth: 'Extracted from document',
        documentNumber: 'Extracted from document',
        confidence: 0.85
      };
      
      setExtractedData(mockExtractedData);
    } catch (error) {
      console.error('OCR extraction failed:', error);
      // Continue without extraction for MVP
    }
  };

  // Capture selfie
  const captureSelfie = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setSelfieImage(imageSrc);
      setCurrentStep('liveness');
    }
  }, []);

  // Liveness check - capture multiple photos
  const performLivenessCheck = useCallback(async () => {
    setLoading(true);
    const images: string[] = [];
    
    try {
      // Capture 3 images for basic liveness check
      for (let i = 0; i < 3; i++) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const imageSrc = webcamRef.current?.getScreenshot();
        if (imageSrc) {
          images.push(imageSrc);
        }
      }
      
      setLivenessImages(images);
      setCurrentStep('processing');
      
      // Process verification
      await processVerification();
      
    } catch (error) {
      onError('Liveness check failed');
    } finally {
      setLoading(false);
    }
  }, [onError]);

  // Process all verification data
  const processVerification = async () => {
    try {
      setLoading(true);
      
      const verificationData = {
        userId,
        documentImage,
        selfieImage,
        livenessImages,
        extractedData,
        timestamp: new Date().toISOString(),
        method: 'free_verification'
      };

      const response = await fetch('/api/identity/free-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(verificationData),
      });

      if (!response.ok) {
        throw new Error('Verification processing failed');
      }

      const result = await response.json();
      setCurrentStep('complete');
      
      setTimeout(() => {
        onComplete(result);
      }, 2000);
      
    } catch (error) {
      onError('Failed to process verification');
    } finally {
      setLoading(false);
    }
  };

  const renderIntroStep = () => (
    <div className="text-center">
      <div className="mb-6">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          🛡️
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Quick Identity Check</h2>
        <p className="text-gray-600">
          Verify your identity in under 2 minutes to start trading securely on SafeTrade
        </p>
      </div>

      <div className="bg-green-50 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-green-900 mb-2">✅ FREE Verification Process</h3>
        <div className="text-sm text-green-800 space-y-1 text-left">
          <p>• Upload government ID (driver's license, passport, etc.)</p>
          <p>• Take a quick selfie</p>
          <p>• Simple liveness check (blink or turn head)</p>
          <p>• All data encrypted and processed securely</p>
        </div>
      </div>

      <button
        onClick={() => setCurrentStep('document')}
        className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium"
      >
        Start Verification (FREE)
      </button>
      
      <p className="text-xs text-gray-500 mt-4">
        Powered by SafeTrade's secure verification system
      </p>
    </div>
  );

  const renderDocumentStep = () => (
    <div>
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold mb-2">Step 1: Upload Government ID</h3>
        <p className="text-gray-600">
          Upload a clear photo of your driver's license, passport, or government ID
        </p>
      </div>

      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleDocumentUpload}
          className="hidden"
        />
        
        {!documentImage ? (
          <div>
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              📄
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Upload Document'}
            </button>
            <p className="text-sm text-gray-500 mt-2">
              Supports JPG, PNG (max 5MB)
            </p>
          </div>
        ) : (
          <div>
            <img 
              src={documentImage} 
              alt="Uploaded document" 
              className="max-w-full max-h-64 mx-auto rounded-lg"
            />
            <div className="mt-4">
              <button
                onClick={() => setCurrentStep('selfie')}
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 mr-4"
              >
                Continue
              </button>
              <button
                onClick={() => {
                  setDocumentImage(null);
                  setExtractedData(null);
                }}
                className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600"
              >
                Retake
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 bg-blue-50 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">Tips for best results:</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Ensure all text is clearly visible</li>
          <li>• Avoid glare and shadows</li>
          <li>• Keep the document flat and straight</li>
          <li>• Use good lighting</li>
        </ul>
      </div>
    </div>
  );

  const renderSelfieStep = () => (
    <div>
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold mb-2">Step 2: Take a Selfie</h3>
        <p className="text-gray-600">
          Take a clear photo of yourself to match with your ID
        </p>
      </div>

      <div className="text-center">
        {!selfieImage ? (
          <div>
            <div className="rounded-lg overflow-hidden mb-4 inline-block">
              <Webcam
                ref={webcamRef}
                audio={false}
                screenshotFormat="image/jpeg"
                className="w-80 h-60 object-cover"
              />
            </div>
            <div>
              <button
                onClick={captureSelfie}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                📸 Capture Selfie
              </button>
            </div>
          </div>
        ) : (
          <div>
            <img 
              src={selfieImage} 
              alt="Selfie" 
              className="w-80 h-60 object-cover rounded-lg mx-auto mb-4"
            />
            <div>
              <button
                onClick={() => setCurrentStep('liveness')}
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 mr-4"
              >
                Continue
              </button>
              <button
                onClick={() => setSelfieImage(null)}
                className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600"
              >
                Retake
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderLivenessStep = () => (
    <div>
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold mb-2">Step 3: Liveness Check</h3>
        <p className="text-gray-600">
          Look at the camera and follow the simple instructions
        </p>
      </div>

      <div className="text-center">
        <div className="rounded-lg overflow-hidden mb-4 inline-block">
          <Webcam
            ref={webcamRef}
            audio={false}
            screenshotFormat="image/jpeg"
            className="w-80 h-60 object-cover"
          />
        </div>
        
        <div className="mb-4">
          <p className="text-lg font-medium text-gray-700">
            Please look directly at the camera
          </p>
          <p className="text-sm text-gray-500">
            We'll capture a few images to verify you're a real person
          </p>
        </div>

        <button
          onClick={performLivenessCheck}
          disabled={loading}
          className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {loading ? 'Checking...' : 'Start Liveness Check'}
        </button>
      </div>
    </div>
  );

  const renderProcessingStep = () => (
    <div className="text-center">
      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-6"></div>
      <h3 className="text-xl font-semibold mb-2">Processing Verification</h3>
      <p className="text-gray-600">
        Please wait while we verify your identity and documents...
      </p>
      <div className="mt-6 bg-blue-50 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          This usually takes 10-30 seconds
        </p>
      </div>
    </div>
  );

  const renderCompleteStep = () => (
    <div className="text-center">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
        ✅
      </div>
      <h3 className="text-xl font-semibold text-green-800 mb-2">Verification Complete!</h3>
      <p className="text-gray-600">
        Your identity has been successfully verified. You can now access all SafeTrade features.
      </p>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Progress indicator */}
      <div className="flex items-center mb-8">
        {['intro', 'document', 'selfie', 'liveness', 'processing', 'complete'].map((step, index) => {
          const stepNames = ['Start', 'Document', 'Selfie', 'Liveness', 'Processing', 'Complete'];
          const currentIndex = ['intro', 'document', 'selfie', 'liveness', 'processing', 'complete'].indexOf(currentStep);
          const isActive = index === currentIndex;
          const isCompleted = index < currentIndex;
          
          return (
            <React.Fragment key={step}>
              <div className={`flex items-center ${isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-medium ${
                  isActive 
                    ? 'border-blue-600 bg-blue-50' 
                    : isCompleted
                    ? 'border-green-600 bg-green-50'
                    : 'border-gray-200 bg-gray-50'
                }`}>
                  {isCompleted ? '✓' : index + 1}
                </div>
                <span className="ml-2 text-sm font-medium hidden sm:block">{stepNames[index]}</span>
              </div>
              {index < stepNames.length - 1 && (
                <div className="flex-1 h-0.5 bg-gray-200 mx-2"></div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Step content */}
      {currentStep === 'intro' && renderIntroStep()}
      {currentStep === 'document' && renderDocumentStep()}
      {currentStep === 'selfie' && renderSelfieStep()}
      {currentStep === 'liveness' && renderLivenessStep()}
      {currentStep === 'processing' && renderProcessingStep()}
      {currentStep === 'complete' && renderCompleteStep()}
    </div>
  );
}
