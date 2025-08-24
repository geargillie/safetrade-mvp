import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { DefaultApi, Configuration, Region } from '@onfido/api';
import { MockOnfidoService } from '@/lib/onfido-mock';

// Initialize Onfido API client with fallback
const apiToken = process.env.ONFIDO_API_TOKEN;
if (!apiToken || apiToken === 'your_onfido_api_token_here') {
  console.warn('ONFIDO_API_TOKEN not configured - using mock mode for development');
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
        error: 'configuration_error'
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

    const { userId } = await request.json();

    if (userId !== user.id) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    // Get user profile for applicant creation, fallback to auth user data if no profile exists
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('first_name, last_name, email')
      .eq('id', userId)
      .single();

    // Use profile data if available, otherwise use auth user metadata
    const firstName = profile?.first_name || user.user_metadata?.first_name || 'User';
    const lastName = profile?.last_name || user.user_metadata?.last_name || '';
    const email = profile?.email || user.email || '';

    console.log('Using user data for verification:', { firstName, lastName, email: email.substring(0, 5) + '...' });

    // Create or get existing Onfido applicant
    let applicantId: string;

    try {
      // Check if applicant already exists
      const { data: existingVerification } = await supabase
        .from('identity_verifications')
        .select('onfido_applicant_id')
        .eq('user_id', userId)
        .eq('provider', 'onfido')
        .single();

      if (existingVerification?.onfido_applicant_id) {
        applicantId = existingVerification.onfido_applicant_id;
      } else {
        // Create new applicant
        let applicant: { data: { id: string } };
        
        if (useMockMode) {
          const mockApplicant = MockOnfidoService.createApplicant({
            first_name: firstName,
            last_name: lastName,
            email: email
          });
          applicant = { data: mockApplicant };
          console.log('🧪 Mock Mode: Created mock applicant:', mockApplicant.id);
        } else {
          applicant = await onfido.createApplicant({
            first_name: firstName,
            last_name: lastName,
            email: email,
            id_numbers: []
          });
        }

        applicantId = applicant.data.id;

        // Store applicant ID in database
        const { error: insertError } = await supabase
          .from('identity_verifications')
          .upsert({
            user_id: userId,
            provider: 'onfido',
            onfido_applicant_id: applicantId,
            status: 'started',
            started_at: new Date().toISOString()
          });

        if (insertError) {
          console.error('Error creating verification record:', insertError);
          // Continue anyway for mock mode - we'll handle this in the complete endpoint
        } else {
          console.log('✅ Verification record created successfully');
        }
      }

      // Generate SDK token
      let sdkToken: { data: { token: string } };
      
      if (useMockMode) {
        const mockToken = MockOnfidoService.generateSdkToken();
        sdkToken = { data: mockToken };
        console.log('🧪 Mock Mode: Generated mock SDK token');
      } else {
        sdkToken = await onfido.generateSdkToken({
          applicant_id: applicantId,
          referrer: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
        });
      }

      return NextResponse.json({
        token: sdkToken.data.token,
        applicantId,
        mockMode: useMockMode,
        message: useMockMode ? '🧪 Using mock Onfido verification for development' : undefined
      });

    } catch (onfidoError) {
      console.error('Onfido API error:', onfidoError);
      return NextResponse.json(
        { message: 'Failed to create verification session' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error generating Onfido token:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}