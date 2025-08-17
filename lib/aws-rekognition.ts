import { 
  RekognitionClient, 
  DetectFacesCommand, 
  CompareFacesCommand,
  DetectFacesRequest,
  CompareFacesRequest,
  FaceDetail,
  ComparedFace
} from '@aws-sdk/client-rekognition';
import { fromEnv } from '@aws-sdk/credential-providers';

// AWS Rekognition service wrapper for SafeTrade identity verification
export class AWSRekognitionService {
  private client: RekognitionClient | null = null;

  constructor() {
    // Check if we're in development mode or AWS credentials are not configured
    const isAWSConfigured = process.env.AWS_ACCESS_KEY_ID && 
                           process.env.AWS_SECRET_ACCESS_KEY &&
                           process.env.AWS_ACCESS_KEY_ID !== 'your_aws_access_key_here';
    
    if (!isAWSConfigured) {
      console.warn('⚠️ AWS credentials not configured. Face detection will use fallback mode.');
      // Don't initialize client in development mode
      return;
    }

    // Initialize AWS Rekognition client with environment credentials
    try {
      this.client = new RekognitionClient({
        region: process.env.AWS_REGION || 'us-east-1',
        credentials: fromEnv(),
      });
      console.log('✅ AWS Rekognition client initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize AWS Rekognition client:', error);
    }
  }

  /**
   * Detect faces in an image and analyze quality
   * @param imageBuffer - Image buffer (JPEG/PNG)
   * @returns Face detection results with quality metrics
   */
  async detectFaces(imageBuffer: Buffer): Promise<{
    faceDetected: boolean;
    confidence: number;
    faceCount: number;
    qualityScore: number;
    details: {
      brightness: number;
      sharpness: number;
      emotions: Array<{ type: string; confidence: number }>;
      landmarks: boolean;
      eyesOpen: boolean;
      mouthOpen: boolean;
      pose: { roll: number; yaw: number; pitch: number };
    };
    reason?: string;
  }> {
    // Check if AWS client is available
    if (!this.client) {
      return this.fallbackFaceDetection(imageBuffer);
    }
    
    try {
      const detectParams: DetectFacesRequest = {
        Image: {
          Bytes: imageBuffer,
        },
        Attributes: ['ALL'], // Get all face attributes including quality, emotions, etc.
      };

      const command = new DetectFacesCommand(detectParams);
      const response = await this.client!.send(command);

      if (!response.FaceDetails || response.FaceDetails.length === 0) {
        return {
          faceDetected: false,
          confidence: 0,
          faceCount: 0,
          qualityScore: 0,
          details: this.getEmptyDetails(),
          reason: 'No faces detected in the image'
        };
      }

      // Analyze the first (primary) face
      const primaryFace = response.FaceDetails[0] as FaceDetail;
      const faceCount = response.FaceDetails.length;

      // Check for multiple faces (should be rejected for identity verification)
      if (faceCount > 1) {
        return {
          faceDetected: false,
          confidence: primaryFace.Confidence || 0,
          faceCount,
          qualityScore: 0,
          details: this.getEmptyDetails(),
          reason: `Multiple faces detected (${faceCount}). Please ensure only one person is in the photo.`
        };
      }

      // Calculate quality score based on AWS Rekognition metrics
      const qualityScore = this.calculateQualityScore(primaryFace);
      
      // Minimum quality thresholds for identity verification
      const minConfidence = 95; // Very high confidence for face detection
      const minQuality = 70;    // Minimum quality score

      const faceDetected = (primaryFace.Confidence || 0) >= minConfidence && qualityScore >= minQuality;

      const details = this.extractFaceDetails(primaryFace);

      let reason: string | undefined;
      if (!faceDetected) {
        const reasons = [];
        if ((primaryFace.Confidence || 0) < minConfidence) {
          reasons.push(`low face confidence (${Math.round(primaryFace.Confidence || 0)}%)`);
        }
        if (qualityScore < minQuality) {
          reasons.push(`poor image quality (${Math.round(qualityScore)}%)`);
        }
        if (!details.eyesOpen) {
          reasons.push('eyes not clearly visible');
        }
        reason = `Face verification failed: ${reasons.join(', ')}`;
      }

      return {
        faceDetected,
        confidence: (primaryFace.Confidence || 0) / 100,
        faceCount,
        qualityScore,
        details,
        reason
      };

    } catch (error) {
      console.error('AWS Rekognition face detection error:', error);
      
      // Check for specific AWS permission errors
      if (error instanceof Error) {
        if (error.message.includes('not authorized to perform: rekognition:DetectFaces')) {
          return {
            faceDetected: false,
            confidence: 0,
            faceCount: 0,
            qualityScore: 0,
            details: this.getEmptyDetails(),
            reason: 'AWS Rekognition permissions not configured. Please contact support or configure proper AWS IAM permissions for face detection.'
          };
        }
        
        if (error.message.includes('The security token included in the request is invalid')) {
          return {
            faceDetected: false,
            confidence: 0,
            faceCount: 0,
            qualityScore: 0,
            details: this.getEmptyDetails(),
            reason: 'AWS credentials are invalid. Please check your AWS access keys configuration.'
          };
        }
      }
      
      return {
        faceDetected: false,
        confidence: 0,
        faceCount: 0,
        qualityScore: 0,
        details: this.getEmptyDetails(),
        reason: `Face detection service error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Compare two faces for identity verification
   * @param sourceImageBuffer - ID document photo
   * @param targetImageBuffer - Selfie photo
   * @returns Face comparison results
   */
  async compareFaces(sourceImageBuffer: Buffer, targetImageBuffer: Buffer): Promise<{
    match: boolean;
    similarity: number;
    confidence: number;
    details: {
      sourceFaceDetected: boolean;
      targetFaceDetected: boolean;
      qualityCheck: boolean;
    };
    reason?: string;
  }> {
    // Check if AWS client is available
    if (!this.client) {
      return this.fallbackFaceComparison(sourceImageBuffer, targetImageBuffer);
    }
    
    try {
      const compareParams: CompareFacesRequest = {
        SourceImage: {
          Bytes: sourceImageBuffer,
        },
        TargetImage: {
          Bytes: targetImageBuffer,
        },
        SimilarityThreshold: 80, // High threshold for identity verification
      };

      const command = new CompareFacesCommand(compareParams);
      const response = await this.client!.send(command);

      // Check if source face was detected
      if (!response.SourceImageFace) {
        return {
          match: false,
          similarity: 0,
          confidence: 0,
          details: {
            sourceFaceDetected: false,
            targetFaceDetected: false,
            qualityCheck: false,
          },
          reason: 'No face detected in ID document photo'
        };
      }

      // Check if any matching faces were found
      if (!response.FaceMatches || response.FaceMatches.length === 0) {
        return {
          match: false,
          similarity: 0,
          confidence: response.SourceImageFace.Confidence || 0,
          details: {
            sourceFaceDetected: true,
            targetFaceDetected: false,
            qualityCheck: (response.SourceImageFace.Confidence || 0) > 95,
          },
          reason: 'No matching face found in selfie photo'
        };
      }

      // Get the best match
      const bestMatch = response.FaceMatches[0];
      const similarity = bestMatch.Similarity || 0;
      const targetFace = bestMatch.Face as ComparedFace;

      // High thresholds for identity verification
      const minSimilarity = 90;  // 90% similarity required
      const minConfidence = 95;  // 95% confidence required

      const match = similarity >= minSimilarity && 
                   (response.SourceImageFace.Confidence || 0) >= minConfidence &&
                   (targetFace.Confidence || 0) >= minConfidence;

      let reason: string | undefined;
      if (!match) {
        const reasons = [];
        if (similarity < minSimilarity) {
          reasons.push(`low similarity (${Math.round(similarity)}%)`);
        }
        if ((response.SourceImageFace.Confidence || 0) < minConfidence) {
          reasons.push('poor ID photo quality');
        }
        if ((targetFace.Confidence || 0) < minConfidence) {
          reasons.push('poor selfie quality');
        }
        reason = `Face comparison failed: ${reasons.join(', ')}`;
      }

      return {
        match,
        similarity,
        confidence: Math.min(
          response.SourceImageFace.Confidence || 0,
          targetFace.Confidence || 0
        ) / 100,
        details: {
          sourceFaceDetected: true,
          targetFaceDetected: true,
          qualityCheck: (response.SourceImageFace.Confidence || 0) > 95 && 
                       (targetFace.Confidence || 0) > 95,
        },
        reason
      };

    } catch (error) {
      console.error('AWS Rekognition face comparison error:', error);
      
      // Check for specific AWS permission errors
      if (error instanceof Error) {
        if (error.message.includes('not authorized to perform: rekognition:CompareFaces')) {
          return {
            match: false,
            similarity: 0,
            confidence: 0,
            details: {
              sourceFaceDetected: false,
              targetFaceDetected: false,
              qualityCheck: false,
            },
            reason: 'AWS Rekognition permissions not configured. Please contact support or configure proper AWS IAM permissions for face comparison.'
          };
        }
        
        if (error.message.includes('The security token included in the request is invalid')) {
          return {
            match: false,
            similarity: 0,
            confidence: 0,
            details: {
              sourceFaceDetected: false,
              targetFaceDetected: false,
              qualityCheck: false,
            },
            reason: 'AWS credentials are invalid. Please check your AWS access keys configuration.'
          };
        }
      }
      
      return {
        match: false,
        similarity: 0,
        confidence: 0,
        details: {
          sourceFaceDetected: false,
          targetFaceDetected: false,
          qualityCheck: false,
        },
        reason: `Face comparison service error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Calculate overall quality score based on AWS Rekognition face attributes
   */
  private calculateQualityScore(face: FaceDetail): number {
    let qualityScore = 0;

    // Brightness (0-100)
    const brightness = face.Quality?.Brightness || 0;
    if (brightness >= 30 && brightness <= 80) {
      qualityScore += 25; // Good lighting
    } else if (brightness >= 20 && brightness <= 90) {
      qualityScore += 15; // Acceptable lighting
    }

    // Sharpness (0-100)
    const sharpness = face.Quality?.Sharpness || 0;
    if (sharpness >= 80) {
      qualityScore += 25; // Sharp image
    } else if (sharpness >= 60) {
      qualityScore += 15; // Acceptable sharpness
    }

    // Eyes open
    if (face.EyesOpen?.Value) {
      qualityScore += 20;
    }

    // Face pose (looking straight at camera)
    const pose = face.Pose;
    if (pose) {
      const roll = Math.abs(pose.Roll || 0);
      const yaw = Math.abs(pose.Yaw || 0);
      const pitch = Math.abs(pose.Pitch || 0);
      
      if (roll <= 15 && yaw <= 15 && pitch <= 15) {
        qualityScore += 20; // Good pose
      } else if (roll <= 25 && yaw <= 25 && pitch <= 25) {
        qualityScore += 10; // Acceptable pose
      }
    }

    // Confidence bonus
    const confidence = face.Confidence || 0;
    if (confidence >= 99) {
      qualityScore += 10;
    } else if (confidence >= 95) {
      qualityScore += 5;
    }

    return Math.min(100, qualityScore);
  }

  /**
   * Extract detailed face information for logging/debugging
   */
  private extractFaceDetails(face: FaceDetail) {
    return {
      brightness: face.Quality?.Brightness || 0,
      sharpness: face.Quality?.Sharpness || 0,
      emotions: (face.Emotions || []).map(emotion => ({
        type: emotion.Type || 'UNKNOWN',
        confidence: emotion.Confidence || 0
      })),
      landmarks: (face.Landmarks?.length || 0) > 0,
      eyesOpen: face.EyesOpen?.Value || false,
      mouthOpen: face.MouthOpen?.Value || false,
      pose: {
        roll: face.Pose?.Roll || 0,
        yaw: face.Pose?.Yaw || 0,
        pitch: face.Pose?.Pitch || 0
      }
    };
  }

  /**
   * Return empty details structure for error cases
   */
  private getEmptyDetails() {
    return {
      brightness: 0,
      sharpness: 0,
      emotions: [],
      landmarks: false,
      eyesOpen: false,
      mouthOpen: false,
      pose: { roll: 0, yaw: 0, pitch: 0 }
    };
  }

  /**
   * Fallback face detection for development mode (when AWS is not configured)
   */
  private async fallbackFaceDetection(imageBuffer: Buffer) {
    console.log('🔄 Using fallback face detection (development mode)');
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Basic image validation
    const imageSize = imageBuffer.length;
    
    // Very basic heuristics - should be replaced with AWS Rekognition in production
    const isJPEG = imageBuffer[0] === 0xFF && imageBuffer[1] === 0xD8;
    const isPNG = imageBuffer[0] === 0x89 && imageBuffer[1] === 0x50;
    
    if (!isJPEG && !isPNG) {
      return {
        faceDetected: false,
        confidence: 0,
        faceCount: 0,
        qualityScore: 0,
        details: this.getEmptyDetails(),
        reason: 'Invalid image format - only JPEG and PNG supported'
      };
    }
    
    if (imageSize < 5000) {
      return {
        faceDetected: false,
        confidence: 0.1,
        faceCount: 0,
        qualityScore: 20,
        details: this.getEmptyDetails(),
        reason: 'Image too small for reliable face detection'
      };
    }
    
    // Simple heuristic: assume face detected if image is reasonable size and format
    // This is NOT secure and should only be used in development
    const mockFaceDetected = imageSize > 10000 && imageSize < 1000000;
    
    return {
      faceDetected: mockFaceDetected,
      confidence: mockFaceDetected ? 0.85 : 0.3,
      faceCount: mockFaceDetected ? 1 : 0,
      qualityScore: mockFaceDetected ? 75 : 25,
      details: {
        brightness: 50,
        sharpness: 70,
        emotions: mockFaceDetected ? [{ type: 'CALM', confidence: 80 }] : [],
        landmarks: mockFaceDetected,
        eyesOpen: mockFaceDetected,
        mouthOpen: false,
        pose: { roll: 0, yaw: 0, pitch: 0 }
      },
      reason: mockFaceDetected ? undefined : 'Development mode: basic validation failed'
    };
  }

  /**
   * Fallback face comparison for development mode (when AWS is not configured)
   */
  private async fallbackFaceComparison(sourceImageBuffer: Buffer, targetImageBuffer: Buffer) {
    console.log('🔄 Using fallback face comparison (development mode)');
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Basic validation
    const sourceSize = sourceImageBuffer.length;
    const targetSize = targetImageBuffer.length;
    
    if (sourceSize < 5000 || targetSize < 5000) {
      return {
        match: false,
        similarity: 0,
        confidence: 0,
        details: {
          sourceFaceDetected: sourceSize >= 5000,
          targetFaceDetected: targetSize >= 5000,
          qualityCheck: false,
        },
        reason: 'One or both images are too small for comparison'
      };
    }
    
    // Mock comparison result - should be replaced with AWS Rekognition in production
    const mockSimilarity = 85 + Math.random() * 10; // 85-95% similarity
    const mockMatch = mockSimilarity >= 80;
    
    return {
      match: mockMatch,
      similarity: mockSimilarity,
      confidence: 0.9,
      details: {
        sourceFaceDetected: true,
        targetFaceDetected: true,
        qualityCheck: true,
      },
      reason: mockMatch ? undefined : 'Development mode: simulated low similarity'
    };
  }
}

// Singleton instance
export const rekognitionService = new AWSRekognitionService();