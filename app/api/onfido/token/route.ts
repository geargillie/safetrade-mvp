import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { DefaultApi, Configuration, Region } from '@onfido/api';

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

    const { userId } = await request.json();

    if (userId !== user.id) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    // Get user profile for applicant creation
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('first_name, last_name, email')
      .eq('id', userId)
      .single();

    if (!profile) {
      return NextResponse.json({ message: 'User profile not found' }, { status: 404 });
    }

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
        const applicant = await onfido.createApplicant({
          first_name: profile.first_name || 'Unknown',
          last_name: profile.last_name || 'Unknown',
          email: profile.email || user.email || '',
          id_numbers: []
        });

        applicantId = applicant.data.id;

        // Store applicant ID in database
        await supabase
          .from('identity_verifications')
          .upsert({
            user_id: userId,
            provider: 'onfido',
            onfido_applicant_id: applicantId,
            status: 'started',
            started_at: new Date().toISOString()
          });
      }

      // Generate SDK token
      const sdkToken = await onfido.generateSdkToken({
        applicant_id: applicantId,
        referrer: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      });

      return NextResponse.json({
        token: sdkToken.data.token,
        applicantId
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