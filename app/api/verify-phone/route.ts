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
    const requestBody = await request.json()
    const { phone, action } = requestBody

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
      // Check if user is trying to verify the same number as our Twilio sender number
      if (formattedPhone === process.env.TWILIO_PHONE_NUMBER) {
        console.log('User trying to verify Twilio sender number - using development bypass')
        const verificationCode = '123456' // Fixed code for development/testing
        
        return NextResponse.json({ 
          success: true, 
          messageSid: 'dev-bypass',
          testCode: verificationCode,
          message: 'Development bypass: Phone number matches Twilio sender. Use code: 123456'
        })
      }
      
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
      const { code, userId } = requestBody
      
      // In a real app, you'd check against stored code
      // For now, we'll accept any 6-digit code for testing, or the special dev bypass code
      if (code && (code.length === 6 || code === '123456')) {
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
    
    // Handle the specific error for same From/To numbers
    if (err.message && err.message.includes('cannot be the same')) {
      return NextResponse.json({ 
        error: 'Cannot verify the Twilio sender phone number. Please use a different number or contact support.',
        suggestion: 'This appears to be a development/testing setup issue.'
      }, { status: 400 })
    }

    return NextResponse.json({ 
      error: `Failed to send verification code: ${err.message || 'Unknown error'}`,
      details: err.code || 'Unknown error'
    }, { status: 500 })
  }
}