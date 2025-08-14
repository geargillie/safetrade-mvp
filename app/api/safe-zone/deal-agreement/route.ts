import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// GET - Get deal agreement for a conversation
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');
    const userId = searchParams.get('userId');

    if (!conversationId || !userId) {
      return NextResponse.json({ 
        error: 'conversationId and userId are required' 
      }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get deal agreement with privacy protection
    const { data, error } = await supabase
      .from('deal_agreements')
      .select(`
        *,
        safe_zone:safe_zones(*),
        listing:listings(title, price, make, model, year, city, zip_code),
        buyer:user_profiles!buyer_id(id, first_name, last_name),
        seller:user_profiles!seller_id(id, first_name, last_name)
      `)
      .eq('conversation_id', conversationId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching deal agreement:', error);
      return NextResponse.json({ 
        error: 'Failed to fetch deal agreement', 
        details: error.message 
      }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({
        dealAgreement: null,
        privacyRevealed: false
      });
    }

    // Check if privacy should be revealed to this user
    const privacyRevealed = data.privacy_revealed && 
      (data.buyer_agreed && data.seller_agreed);

    // Mask sensitive data if privacy not revealed
    const response = {
      ...data,
      buyer: privacyRevealed ? data.buyer : {
        id: data.buyer.id,
        first_name: data.buyer_id === userId ? data.buyer.first_name : 'Buyer',
        last_name: data.buyer_id === userId ? data.buyer.last_name : ''
      },
      seller: privacyRevealed ? data.seller : {
        id: data.seller.id,
        first_name: data.seller_id === userId ? data.seller.first_name : 'Seller',
        last_name: data.seller_id === userId ? data.seller.last_name : ''
      },
      safe_zone: privacyRevealed ? data.safe_zone : null,
      custom_meeting_location: privacyRevealed ? data.custom_meeting_location : null
    };

    return NextResponse.json({
      dealAgreement: response,
      privacyRevealed,
      userRole: data.buyer_id === userId ? 'buyer' : 'seller'
    });

  } catch (error) {
    console.error('Deal agreement fetch error:', error);
    return NextResponse.json({
      error: 'Failed to fetch deal agreement',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST - Create or update deal agreement
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      conversationId,
      listingId,
      buyerId,
      sellerId,
      agreedPrice,
      originalPrice,
      userRole, // 'buyer' or 'seller'
      safeZoneId,
      customMeetingLocation,
      meetingDatetime
    } = body;

    if (!conversationId || !listingId || !buyerId || !sellerId || !userRole) {
      return NextResponse.json({ 
        error: 'Missing required fields' 
      }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get existing agreement or create new one
    const { data: existingAgreement } = await supabase
      .from('deal_agreements')
      .select('*')
      .eq('conversation_id', conversationId)
      .eq('listing_id', listingId)
      .single();

    const now = new Date().toISOString();
    const updateData: Record<string, unknown> = {
      updated_at: now
    };

    // Update agreement status based on user role
    if (userRole === 'buyer') {
      updateData.buyer_agreed = true;
      updateData.buyer_agreed_at = now;
    } else if (userRole === 'seller') {
      updateData.seller_agreed = true;
      updateData.seller_agreed_at = now;
    }

    // Update price if provided
    if (agreedPrice !== undefined) {
      updateData.agreed_price = agreedPrice;
    }
    if (originalPrice !== undefined) {
      updateData.original_price = originalPrice;
    }

    // Update meeting details if provided
    if (safeZoneId) {
      updateData.safe_zone_id = safeZoneId;
    }
    if (customMeetingLocation) {
      updateData.custom_meeting_location = customMeetingLocation;
    }
    if (meetingDatetime) {
      updateData.meeting_datetime = meetingDatetime;
    }

    let result;

    if (existingAgreement) {
      // Update existing agreement
      const { data, error } = await supabase
        .from('deal_agreements')
        .update(updateData)
        .eq('id', existingAgreement.id)
        .select('*')
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Create new agreement
      const newAgreement = {
        conversation_id: conversationId,
        listing_id: listingId,
        buyer_id: buyerId,
        seller_id: sellerId,
        agreed_price: agreedPrice || originalPrice,
        original_price: originalPrice,
        safe_zone_id: safeZoneId,
        custom_meeting_location: customMeetingLocation,
        meeting_datetime: meetingDatetime,
        ...updateData
      };

      const { data, error } = await supabase
        .from('deal_agreements')
        .insert(newAgreement)
        .select('*')
        .single();

      if (error) throw error;
      result = data;
    }

    // Check if both parties have agreed
    const bothAgreed = result.buyer_agreed && result.seller_agreed;
    
    if (bothAgreed && !result.privacy_revealed) {
      // Reveal privacy and update status
      const { error: privacyError } = await supabase
        .from('deal_agreements')
        .update({
          privacy_revealed: true,
          privacy_revealed_at: now,
          deal_status: 'agreed'
        })
        .eq('id', result.id);

      if (privacyError) {
        console.error('Error updating privacy status:', privacyError);
      }

      // Log privacy revelation
      await supabase
        .from('privacy_protection_log')
        .insert([
          {
            deal_agreement_id: result.id,
            user_id: buyerId,
            data_type: 'name',
            revealed_to: sellerId,
            reason: 'deal_agreed'
          },
          {
            deal_agreement_id: result.id,
            user_id: sellerId,
            data_type: 'name',
            revealed_to: buyerId,
            reason: 'deal_agreed'
          }
        ]);

      result.privacy_revealed = true;
      result.deal_status = 'agreed';
    }

    return NextResponse.json({
      success: true,
      dealAgreement: result,
      privacyRevealed: bothAgreed,
      bothPartiesAgreed: bothAgreed,
      message: bothAgreed ? 
        'Both parties have agreed! Contact details are now available.' : 
        'Your agreement has been recorded. Waiting for the other party.'
    });

  } catch (error) {
    console.error('Deal agreement error:', error);
    return NextResponse.json({
      error: 'Failed to process deal agreement',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}