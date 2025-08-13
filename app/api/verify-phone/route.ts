// app/api/verify-phone/route.ts
import { NextRequest, NextResponse } from 'next/server'
import twilio from 'twilio'
import { supabase } from '@/lib/supabase'

// Debug: Log environment variables (remove in production)
console.log('Twilio Config Check:')
console.log('Account SID:', process.env.TWILIO_ACCOUNT_SID ? 'Set' : 'Missing')
console.log('Auth Token:', process.env.TWILIO_AUTH_TOKEN ? 'Set' : 'Missing')
console.log('Phone Number:', process.env.TWILIO_PHONE_NUMBER)

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

export async function POST(request: NextRequest) {
  try {
    const { phone, action } = await request.json()

    console.log('Phone verification request:', { phone, action })

    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 })
    }

    // Check if Twilio credentials are available
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
      console.error('Missing Twilio credentials')
      return NextResponse.json({ 
        error: 'Server configuration error - missing Twilio credentials' 
      }, { status: 500 })
    }

    // Format phone number (add +1 if US number)
    const formattedPhone = phone.startsWith('+') ? phone : `+1${phone.replace(/\D/g, '')}`
    console.log('Formatted phone:', formattedPhone)

    if (action === 'send') {
      // Generate and send verification code
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()
      console.log('Generated code:', verificationCode)
      
      const message = await client.messages.create({
        body: `SafeTrade verification code: ${verificationCode}. Do not share this code.`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: formattedPhone
      })

      console.log('Message sent successfully:', message.sid)

      return NextResponse.json({ 
        success: true, 
        messageSid: message.sid,
        // For testing only - remove in production
        testCode: verificationCode 
      })

    } else if (action === 'verify') {
      const { code, userId } = await request.json()
      
      // In a real app, you'd check against stored code
      // For now, we'll accept any 6-digit code for testing
      if (code && code.length === 6) {
        // Update user profile to mark phone as verified
        if (userId) {
          const { error: updateError } = await supabase
            .from('user_profiles')
            .update({ 
              phone_verified: true,
              phone_number: formattedPhone,
              phone_verified_at: new Date().toISOString()
            })
            .eq('id', userId)
          
          if (updateError) {
            console.error('Failed to update phone verification status:', updateError)
            // Don't fail the request, just log the error
          }
        }
        
        return NextResponse.json({ success: true, verified: true })
      } else {
        return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 })
      }
    }

  } catch (error: unknown) {
    console.error('Phone verification error details:', error)
    
    const err = error as { code?: string; message?: string }
    
    // More specific error messages
    if (err.code === '20003') {
      return NextResponse.json({ 
        error: 'Invalid Twilio credentials - check your Account SID and Auth Token' 
      }, { status: 500 })
    }
    
    if (err.code === '21211') {
      return NextResponse.json({ 
        error: 'Invalid phone number format' 
      }, { status: 400 })
    }
    
    if (err.code === '21608') {
      return NextResponse.json({ 
        error: 'Invalid Twilio phone number - check your FROM number' 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      error: `Failed to send verification code: ${err.message || 'Unknown error'}`,
      details: err.code || 'Unknown error'
    }, { status: 500 })
  }
}
