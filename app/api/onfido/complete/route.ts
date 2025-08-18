import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { DefaultApi, Configuration, Region, ReportName } from '@onfido/api';

// Initialize Onfido API client
const configuration = new Configuration({
  apiToken: process.env.ONFIDO_API_TOKEN!,
  region: Region.EU // or US based on your preference
});
const onfido = new DefaultApi(configuration);

export async function POST(request: NextRequest) {
  try {
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

    if (!verification?.onfido_applicant_id) {
      return NextResponse.json({ message: 'Verification session not found' }, { status: 404 });
    }

    const applicantId = verification.onfido_applicant_id;

    try {
      // Create a check to verify the documents and face
      const check = await onfido.createCheck({
        applicant_id: applicantId,
        report_names: [
          ReportName.Document,
          ReportName.FacialSimilarityPhoto
        ]
      });

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
      const maxAttempts = 12; // 1 minute with 5-second intervals
      
      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
        
        const checkResult = await onfido.findCheck(check.data.id);
        
        if (checkResult.data.status === 'complete') {
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
            await supabase
              .from('user_profiles')
              .update({
                identity_verified: true,
                verification_level: 'enhanced',
                verified_at: new Date().toISOString()
              })
              .eq('id', userId);
          }

          return NextResponse.json({
            verified: isVerified,
            status: finalStatus,
            message: isVerified 
              ? 'Identity verification completed successfully'
              : 'Identity verification failed. Please try again with better lighting and clear documents.',
            checkId: check.data.id,
            result: checkResult.data.result
          });
        }
        
        attempts++;
      }

      // If we reach here, verification is still processing
      return NextResponse.json({
        verified: false,
        status: 'processing',
        message: 'Verification is being processed. You will be notified when it\'s complete.',
        checkId: check.data.id
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