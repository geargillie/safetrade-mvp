import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { DefaultApi, Configuration, Region, ReportName } from '@onfido/api';
import { MockOnfidoService } from '@/lib/onfido-mock';

// Initialize Onfido API client with fallback
const apiToken = process.env.ONFIDO_API_TOKEN;
if (!apiToken || apiToken === 'your_onfido_api_token_here') {
  console.warn('ONFIDO_API_TOKEN not configured - Onfido verification will not work');
}

const configuration = new Configuration({
  apiToken: apiToken || 'placeholder_token',
  region: Region.EU // or US based on your preference
});
const onfido = new DefaultApi(configuration);

export async function POST(request: NextRequest) {
  try {
    // Check if we should use mock mode
    const useMockMode = MockOnfidoService.isMockMode();
    
    if (!useMockMode && (!apiToken || apiToken === 'your_onfido_api_token_here' || apiToken === 'placeholder_token')) {
      return NextResponse.json({ 
        message: 'Onfido service not configured. Please contact support.',
        verified: false,
        status: 'configuration_error'
      }, { status: 503 });
    }

    // Verify user authentication
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { userId, onfidoData } = await request.json();

    if (userId !== user.id) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    // Get the verification record
    const { data: verification } = await supabase
      .from('identity_verifications')
      .select('onfido_applicant_id')
      .eq('user_id', userId)
      .eq('provider', 'onfido')
      .single();

    let applicantId: string;

    if (!verification?.onfido_applicant_id) {
      if (useMockMode) {
        // In mock mode, create a temporary applicant ID if verification record doesn't exist
        applicantId = onfidoData.applicant_id || `mock_applicant_${userId.substring(0, 8)}`;
        console.log('🧪 Mock Mode: Using temporary applicant ID:', applicantId);
      } else {
        return NextResponse.json({ message: 'Verification session not found' }, { status: 404 });
      }
    } else {
      applicantId = verification.onfido_applicant_id;
    }

    try {
      // Create a check to verify the documents and face
      let check: { data: { id: string; status?: string; result?: string } };
      
      if (useMockMode) {
        // Use mock service
        const mockCheck = MockOnfidoService.createCheck({
          applicant_id: applicantId,
          report_names: ['document', 'facial_similarity_photo']
        });
        check = { data: mockCheck };
        console.log('🧪 Mock Mode: Created mock Onfido check:', mockCheck.id);
      } else {
        // Use real Onfido API
        check = await onfido.createCheck({
          applicant_id: applicantId,
          report_names: [
            ReportName.Document,
            ReportName.FacialSimilarityPhoto
          ]
        });
      }

      // Update verification status to processing
      await supabase
        .from('identity_verifications')
        .update({
          onfido_check_id: check.data.id,
          status: 'processing',
          completed_at: new Date().toISOString(),
          metadata: onfidoData
        })
        .eq('user_id', userId)
        .eq('provider', 'onfido');

      // Poll for check results (in production, use webhooks)
      let attempts = 0;
      const maxAttempts = useMockMode ? 3 : 12; // Shorter polling for mock mode
      
      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, useMockMode ? 2000 : 5000)); // Shorter delay for mock
        
        let checkResult: { data: { id: string; status?: string; result?: string } | null };
        
        if (useMockMode) {
          const mockResult = MockOnfidoService.findCheck(check.data.id);
          checkResult = { data: mockResult };
          console.log('🧪 Mock Mode: Check status:', mockResult?.status);
        } else {
          checkResult = await onfido.findCheck(check.data.id);
        }
        
        if (checkResult.data?.status === 'complete') {
          const isVerified = checkResult.data.result === 'clear';
          const finalStatus = isVerified ? 'verified' : 'failed';
          
          // Update verification status
          await supabase
            .from('identity_verifications')
            .update({
              status: finalStatus,
              verified: isVerified,
              result: checkResult.data.result,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', userId)
            .eq('provider', 'onfido');

          // Update user profile verification status
          if (isVerified) {
            console.log('🔄 Updating user profile verification status for user:', userId);
            const { error: profileError } = await supabase
              .from('user_profiles')
              .update({
                identity_verified: true,
                verification_level: 'enhanced',
                verified_at: new Date().toISOString()
              })
              .eq('id', userId);

            if (profileError) {
              console.error('❌ Error updating user profile:', profileError);
            } else {
              console.log('✅ User profile updated successfully');
            }
          }

          return NextResponse.json({
            verified: isVerified,
            status: finalStatus,
            message: isVerified 
              ? (useMockMode ? '🧪 Mock verification completed successfully' : 'Identity verification completed successfully')
              : 'Identity verification failed. Please try again with better lighting and clear documents.',
            checkId: check.data.id,
            result: checkResult.data.result,
            mockMode: useMockMode
          });
        }
        
        attempts++;
      }

      // If we reach here, verification is still processing
      return NextResponse.json({
        verified: false,
        status: 'processing',
        message: useMockMode 
          ? '🧪 Mock verification is being processed...'
          : 'Verification is being processed. You will be notified when it\'s complete.',
        checkId: check.data.id,
        mockMode: useMockMode
      });

    } catch (onfidoError) {
      console.error('Onfido check creation error:', onfidoError);
      
      // Update verification status to failed
      await supabase
        .from('identity_verifications')
        .update({
          status: 'failed',
          error_message: 'Onfido verification failed',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('provider', 'onfido');

      return NextResponse.json({
        verified: false,
        status: 'failed',
        message: 'Verification processing failed. Please try again.',
        error: onfidoError instanceof Error ? onfidoError.message : 'Unknown error'
      });
    }

  } catch (error) {
    console.error('Error completing Onfido verification:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}