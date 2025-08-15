// app/listings/create/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ImageUpload from '@/components/ImageUpload'
import StreamlinedVerification from '@/components/StreamlinedVerification'

export default function CreateListing() {
  const router = useRouter()
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [isVerified, setIsVerified] = useState<boolean | null>(null)
  const [showVerification, setShowVerification] = useState(false)
  const [verificationStatus, setVerificationStatus] = useState<{ verified: boolean; status: string; method?: string } | null>(null)
  const [canSkip, setCanSkip] = useState(false)
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    make: '',
    model: '',
    year: '',
    mileage: '',
    vin: '',
    condition: '',
    city: '',
    zipCode: ''
  })

  const [images, setImages] = useState<string[]>([])
  const [vinVerification, setVinVerification] = useState<{
    loading: boolean
    result: { 
      success?: boolean; 
      data?: unknown;
      isValid?: boolean;
      isStolen?: boolean;
      warnings?: string[];
      alerts?: { message: string }[];
      stolenCheck?: { 
        details?: { source?: string }; 
        lastChecked?: string 
      };
      vehicleInfo?: {
        year?: number;
        make?: string;
        model?: string;
        bodyStyle?: string;
        engineSize?: string;
        transmission?: string;
        fuelType?: string;
        color?: string;
        msrp?: number;
        sources?: string[];
        error?: string;
      };
    } | null;
    error: string | null
  }>({ loading: false, result: null, error: null })

  useEffect(() => {
    getUser()
  }, [])

  const getUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/auth/login')
      return
    }

    // Debug: Check user profile verification status
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('identity_verified, verification_level, verified_at')
      .eq('id', user.id)
      .single()
    
    console.log('👤 User profile verification info:', userProfile)
    
    setUser(user)
    
    // Check identity verification status
    await checkVerificationStatus(user.id)
  }

  const checkVerificationStatus = async (userId: string) => {
    try {
      console.log('🔍 Checking verification status for user:', userId)
      
      // Check both basic and enhanced verification status
      const [basicResponse, enhancedResponse] = await Promise.all([
        fetch(`/api/identity/free-verify?userId=${userId}`),
        fetch(`/api/identity/enhanced-verify?userId=${userId}`)
      ])
      
      console.log('📊 Response status:', {
        basic: basicResponse.status,
        enhanced: enhancedResponse.status
      })
      
      let isVerified = false
      let verificationData = null
      
      // Check enhanced verification first (higher priority)
      if (enhancedResponse.ok) {
        const enhancedData = await enhancedResponse.json()
        console.log('🔒 Enhanced verification data:', enhancedData)
        if (enhancedData.verified) {
          isVerified = true
          verificationData = { ...enhancedData, method: 'enhanced' }
          console.log('✅ User is ENHANCED verified!')
        }
      } else {
        console.log('❌ Enhanced verification response not OK:', enhancedResponse.status)
      }
      
      // If not enhanced verified, check basic verification
      if (!isVerified && basicResponse.ok) {
        const basicData = await basicResponse.json()
        console.log('🆔 Basic verification data:', basicData)
        if (basicData.verified) {
          isVerified = true
          verificationData = { ...basicData, method: 'basic' }
          console.log('✅ User is BASIC verified!')
        } else {
          verificationData = basicData
          console.log('❌ User is NOT verified - basic data:', basicData)
        }
      } else if (!isVerified) {
        console.log('❌ Basic verification response not OK:', basicResponse.status)
      }
      
      console.log('🎯 Final verification result:', {
        isVerified,
        verificationData,
        status: verificationData?.status
      })
      
      setVerificationStatus(verificationData)
      setIsVerified(isVerified)
      
      if (!isVerified && verificationData?.status === 'not_started') {
        // User hasn't started verification yet
        setShowVerification(false) // Don't auto-show, let them click
      }
    } catch (error) {
      console.error('❌ Error checking verification status:', error)
      setIsVerified(false)
    }
  }

  const handleVerificationComplete = (result: { verified?: boolean; status?: string; score?: number; message?: string }) => {
    console.log('Verification completed:', result)
    if (result.verified) {
      setIsVerified(true)
      setVerificationStatus({ verified: true, status: result.status || 'verified' })
      setShowVerification(false)
      setMessage('Verification completed successfully! You can now create listings.')
    }
  }

  const handleVerificationError = (error: string) => {
    console.error('Verification error:', error)
    setMessage(`Verification error: ${error}`)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const verifyVIN = async (vin: string) => {
    if (!vin || vin.length !== 17) return
    
    setVinVerification({ loading: true, result: null, error: null })
    
    try {
      const response = await fetch('/api/verify-vin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vin })
      })
      
      const result = await response.json()
      
      if (response.ok) {
        setVinVerification({ loading: false, result, error: null })
      } else {
        setVinVerification({ loading: false, result: null, error: result.message || 'VIN verification failed' })
      }
    } catch (error) {
      setVinVerification({ loading: false, result: null, error: 'Network error during VIN verification' })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      if (!user) {
        throw new Error('User not authenticated')
      }

      // Create listing in Supabase
      const { data, error } = await supabase
        .from('listings')
        .insert({
          user_id: user.id,
          title: formData.title,
          description: formData.description,
          price: parseFloat(formData.price),
          make: formData.make,
          model: formData.model,
          year: parseInt(formData.year),
          mileage: parseInt(formData.mileage),
          vin: formData.vin,
          condition: formData.condition,
          city: formData.city,
          zip_code: formData.zipCode,
          images,
          vin_verified: vinVerification.result?.isValid || false,
          theft_record_checked: Boolean(vinVerification.result?.stolenCheck),
          theft_record_found: vinVerification.result?.isStolen || false,
          total_loss_checked: true,
          total_loss_found: false,
          vin_verification_date: vinVerification.result?.stolenCheck?.lastChecked || new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error

      router.push(`/listings/${data.id}`)
    } catch (error) {
      console.error('Error creating listing:', error)
      setMessage(error instanceof Error ? error.message : 'Failed to create listing')
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return <div className="text-center py-8">Loading...</div>
  }

  // Show verification requirement if user is not verified
  if (isVerified === false && !showVerification) {
    return (
      <div className="min-h-screen" style={{backgroundColor: 'var(--neutral-50)', padding: '2rem 0'}}>
        <div className="container">
          <div className="card text-center" style={{maxWidth: '600px', margin: '0 auto'}}>
            <div style={{
              width: '4rem',
              height: '4rem',
              backgroundColor: 'var(--warning)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem auto'
            }}>
              <span className="text-white text-2xl">⚠️</span>
            </div>
            <h2 className="text-heading-lg mb-4">Identity Verification Required</h2>
            <p className="text-body mb-6">
              To create listings and start selling on SafeTrade, you need to verify your identity. 
              This helps us maintain a trusted marketplace for all users.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => setShowVerification(true)}
                className="btn btn-primary"
              >
                Verify Identity Now
              </button>
              <Link href="/listings" className="btn btn-secondary">
                Browse Listings Instead
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show verification modal if requested
  if (showVerification && user?.id) {
    return (
      <div className="min-h-screen" style={{backgroundColor: 'var(--neutral-50)', padding: '2rem 0'}}>
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-heading-xl">Identity Verification</h1>
            <button
              onClick={() => setShowVerification(false)}
              className="btn btn-secondary"
            >
              ← Back to Form
            </button>
          </div>
          
          <StreamlinedVerification
            userId={user.id}
            onComplete={handleVerificationComplete}
            onError={handleVerificationError}
          />
          
          <div className="text-center mt-6">
            <button
              onClick={() => {
                setCanSkip(true)
                setShowVerification(false)
                setIsVerified(null)
              }}
              className="link text-body-sm"
            >
              Skip verification for now
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Main create listing form
  return (
    <div className="min-h-screen" style={{backgroundColor: 'var(--neutral-50)', padding: '2rem 0'}}>
      <div className="container">
        <div className="text-center mb-8">
          <h1 className="text-heading-xl mb-4">Create New Listing</h1>
          <p className="text-body">Create a professional listing with verification and security</p>
        </div>

        <div className="card" style={{maxWidth: '800px', margin: '0 auto'}}>
          {/* Verification status badge */}
          {isVerified && (
            <div className="badge badge-success mb-6" style={{
              backgroundColor: 'var(--success-50)',
              border: '1px solid var(--success-200)',
              padding: '1rem 1.5rem',
              fontSize: '0.95rem',
              width: '100%',
              justifyContent: 'flex-start'
            }}>
              <span className="mr-2" style={{color: 'var(--success)'}}>✅</span>
              <span style={{color: 'var(--success)', fontWeight: '600'}}>
                Identity Verified - Trusted Seller
                {verificationStatus?.method === 'enhanced' && (
                  <span className="ml-2 badge badge-info" style={{
                    backgroundColor: 'var(--info-50)',
                    color: 'var(--info)',
                    fontSize: '0.75rem',
                    padding: '0.25rem 0.5rem'
                  }}>
                    ENHANCED
                  </span>
                )}
              </span>
            </div>
          )}

          {canSkip && !isVerified && (
            <div className="badge badge-warning mb-6" style={{
              backgroundColor: 'var(--warning-50)',
              border: '1px solid var(--warning-200)',
              padding: '1rem 1.5rem',
              fontSize: '0.95rem',
              width: '100%',
              justifyContent: 'flex-start'
            }}>
              <span className="mr-2" style={{color: 'var(--warning)'}}>⚠️</span>
              <span style={{color: 'var(--warning)', fontWeight: '600'}}>Unverified Seller</span>
            </div>
          )}
        
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Info */}
            <div className="space-y-6">
              <h3 className="text-heading-md border-b border-neutral-200 pb-3">Basic Information</h3>
              
              <div>
                <label className="form-label">Listing Title</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="form-input"
                  required
                  placeholder="e.g., 2019 Honda CBR600RR - Excellent Condition"
                />
              </div>

              <div>
                <label className="form-label">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="form-input"
                  rows={4}
                  required
                  placeholder="Describe your motorcycle, its condition, any modifications, service history, etc."
                />
              </div>

              <div className="grid grid-cols-1 md-grid-cols-2 gap-6">
                <div>
                  <label className="form-label">Price ($)</label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    className="form-input"
                    required
                    min="0"
                    step="0.01"
                    placeholder="15000"
                  />
                </div>
                <div>
                  <label className="form-label">Condition</label>
                  <select
                    name="condition"
                    value={formData.condition}
                    onChange={handleInputChange}
                    className="form-input"
                    required
                  >
                    <option value="">Select condition</option>
                    <option value="excellent">Excellent</option>
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                    <option value="poor">Poor</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Vehicle Details */}
            <div className="space-y-6">
              <h3 className="text-heading-md border-b border-neutral-200 pb-3">Vehicle Details</h3>
              
              <div className="grid grid-cols-1 md-grid-cols-3 gap-6">
                <div>
                  <label className="form-label">Make</label>
                  <input
                    type="text"
                    name="make"
                    value={formData.make}
                    onChange={handleInputChange}
                    className="form-input"
                    required
                    placeholder="Honda"
                  />
                </div>
                <div>
                  <label className="form-label">Model</label>
                  <input
                    type="text"
                    name="model"
                    value={formData.model}
                    onChange={handleInputChange}
                    className="form-input"
                    required
                    placeholder="CBR600RR"
                  />
                </div>
                <div>
                  <label className="form-label">Year</label>
                  <input
                    type="number"
                    name="year"
                    value={formData.year}
                    onChange={handleInputChange}
                    className="form-input"
                    required
                    min="1900"
                    max={new Date().getFullYear() + 1}
                    placeholder="2019"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md-grid-cols-2 gap-6">
                <div>
                  <label className="form-label">Mileage</label>
                  <input
                    type="number"
                    name="mileage"
                    value={formData.mileage}
                    onChange={handleInputChange}
                    className="form-input"
                    required
                    min="0"
                    placeholder="12000"
                  />
                </div>
                <div>
                  <label className="form-label">
                    VIN (17 characters)
                    <span className="text-body-sm ml-1" style={{color: 'var(--neutral-500)'}}>
                      - Used for theft verification
                    </span>
                  </label>
                  <input
                    type="text"
                    name="vin"
                    value={formData.vin}
                    onChange={(e) => {
                      handleInputChange(e)
                      if (e.target.value.length === 17) {
                        verifyVIN(e.target.value)
                      }
                    }}
                    className="form-input"
                    maxLength={17}
                    placeholder="1HGBH41JXMN109186"
                    style={{
                      borderColor: formData.vin.length === 17 
                        ? vinVerification.result?.isValid 
                          ? 'var(--success)' 
                          : vinVerification.result?.isValid === false 
                          ? 'var(--error)' 
                          : 'var(--neutral-200)'
                        : 'var(--neutral-200)'
                    }}
                  />
                  
                  {vinVerification.loading && (
                    <div className="mt-2 text-body-sm" style={{color: 'var(--info)'}}>
                      Verifying VIN...
                    </div>
                  )}
                  
                  {vinVerification.result && (
                    <div className="mt-2">
                      {vinVerification.result.isValid ? (
                        <div className="bg-success-50 border border-success-200 text-success-700 px-3 py-2 rounded-md text-sm">
                          <div className="flex items-center">
                            <span className="mr-2">✅</span>
                            <strong>VIN Verified</strong>
                          </div>
                          <div className="text-sm mt-1">
                            Valid VIN • Theft Check: {vinVerification.result.isStolen ? 'STOLEN' : 'CLEAN'}
                          </div>
                        </div>
                      ) : (
                        <div className="bg-warning-50 border border-warning-200 text-warning-700 px-3 py-2 rounded-md text-sm">
                          <div className="flex items-center">
                            <span className="mr-2">⚠️</span>
                            <strong>VIN Warning</strong>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {vinVerification.error && (
                    <div className="mt-2 bg-error-50 border border-error-200 text-error-700 px-3 py-2 rounded-md text-sm">
                      Error: {vinVerification.error}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="space-y-6">
              <h3 className="text-heading-md border-b border-neutral-200 pb-3">Location</h3>
              
              <div className="grid grid-cols-1 md-grid-cols-2 gap-6">
                <div>
                  <label className="form-label">City</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="form-input"
                    required
                    placeholder="San Francisco"
                  />
                </div>
                <div>
                  <label className="form-label">ZIP Code</label>
                  <input
                    type="text"
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleInputChange}
                    className="form-input"
                    required
                    placeholder="94102"
                  />
                </div>
              </div>
            </div>

            {/* Images */}
            <div className="space-y-6">
              <h3 className="text-heading-md border-b border-neutral-200 pb-3">Photos</h3>
              <ImageUpload 
                onImagesUploaded={setImages}
                existingImages={images}
                maxImages={10}
              />
            </div>

            {message && (
              <div style={{
                padding: '1rem',
                borderRadius: '0.5rem',
                backgroundColor: message.includes('error') ? 'var(--error-50)' : 'var(--success-50)',
                border: `1px solid ${message.includes('error') ? 'var(--error-200)' : 'var(--success-200)'}`,
                color: message.includes('error') ? 'var(--error-700)' : 'var(--success-700)'
              }}>
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-lg w-full"
            >
              {loading ? 'Creating Listing...' : 'Create Listing'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}