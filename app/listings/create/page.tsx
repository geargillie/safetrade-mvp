// app/listings/create/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ImageUpload from '@/components/ImageUpload'
import OnfidoVerification from '@/components/OnfidoVerification'

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
      data?: {
        vin?: string;
        isValid?: boolean;
        isStolen?: boolean;
        isTotalLoss?: boolean;
        vehicleInfo?: {
          year?: string;
          make?: string;
          model?: string;
          vehicleType?: string;
          engineSize?: string;
          fuelType?: string;
          bodyClass?: string;
          plantCountry?: string;
        };
        stolenCheck?: { 
          checked?: boolean;
          sources?: string[];
          isStolen?: boolean;
          lastChecked?: string;
        };
        totalLossCheck?: {
          checked?: boolean;
          sources?: string[];
          isTotalLoss?: boolean;
          lastChecked?: string;
        };
        alerts?: { message: string }[];
      };
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
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

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
      
      // Check user_profiles table for verification status
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('identity_verified, verification_level, verified_at')
        .eq('id', userId)
        .single()
      
      if (error) {
        console.log('❌ Error fetching profile:', error.message)
        setIsVerified(false)
        return
      }
      
      // Also check identity_verifications table for detailed status
      const { data: verification } = await supabase
        .from('identity_verifications')
        .select('status, verified')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      
      const isVerified = profile?.identity_verified || false
      
      // Determine status based on verification table or profile
      let status = 'not_started'
      let method = 'none'
      
      if (isVerified) {
        status = 'verified'
        method = profile?.verification_level === 'enhanced' ? 'enhanced' : 'basic'
      } else if (verification?.status === 'failed') {
        status = 'failed'
      } else if (verification?.status === 'processing') {
        status = 'processing'
      } else if (verification?.status) {
        status = verification.status
      }
      
      const verificationData = {
        verified: isVerified,
        status: status,
        method: method
      }
      
      console.log('🎯 Final verification result:', {
        isVerified,
        verificationData,
        profile,
        verification,
        userId: userId
      });
      
      console.log('🔍 Debug: Setting verification status to:', {
        verified: isVerified,
        status: status,
        method: method
      });
      
      setVerificationStatus(verificationData)
      setIsVerified(isVerified)
      
      if (!isVerified && status === 'not_started') {
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
    } else {
      // Handle verification failure case
      console.error('Verification completed but not verified:', result)
      setIsVerified(false)
      setVerificationStatus({ verified: false, status: result.status || 'failed' })
      setMessage(`Verification failed: ${result.message || 'Please try again.'}`)
      // Keep verification modal open so user can retry
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
        
        // Auto-fill form fields from VIN verification result
        if (result.success && result.data?.vehicleInfo) {
          const vehicleInfo = result.data.vehicleInfo
          setFormData(prev => ({
            ...prev,
            make: vehicleInfo.make !== 'Unknown' ? vehicleInfo.make || prev.make : prev.make,
            model: vehicleInfo.model !== 'Unknown' ? vehicleInfo.model || prev.model : prev.model,
            year: vehicleInfo.year !== 'Unknown' ? vehicleInfo.year || prev.year : prev.year,
            // Auto-generate title if fields are available
            title: vehicleInfo.year && vehicleInfo.make && vehicleInfo.model !== 'Unknown' 
              ? `${vehicleInfo.year} ${vehicleInfo.make} ${vehicleInfo.model}`
              : prev.title
          }))
        }
      } else {
        setVinVerification({ loading: false, result: null, error: result.message || 'VIN verification failed' })
      }
    } catch {
      setVinVerification({ loading: false, result: null, error: 'Network error during VIN verification' })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    console.log('Starting listing creation...')
    console.log('Form data:', formData)
    console.log('Images:', images)
    console.log('User:', user)

    try {
      if (!user) {
        throw new Error('User not authenticated')
      }

      // Prepare listing data
      const listingData = {
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
        vin_verified: Boolean(vinVerification.result?.success && vinVerification.result?.data?.isValid),
        theft_record_checked: Boolean(vinVerification.result?.success && vinVerification.result?.data?.stolenCheck),
        theft_record_found: Boolean(vinVerification.result?.data?.isStolen),
        total_loss_checked: true,
        total_loss_found: false,
        vin_verification_date: vinVerification.result?.data?.stolenCheck?.lastChecked || new Date().toISOString()
      }

      console.log('Listing data to insert:', listingData)

      // Create listing in Supabase
      const { data, error } = await supabase
        .from('listings')
        .insert(listingData)
        .select()
        .single()

      if (error) {
        console.error('Supabase error:', error)
        throw error
      }

      if (!data) {
        throw new Error('No data returned from listing creation')
      }

      console.log('Listing created successfully:', data)
      console.log('Redirecting to:', `/listings/${data.id}`)
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

  // Show verification requirement if user is not verified and hasn't chosen to skip
  if (isVerified === false && !showVerification && !canSkip) {
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
            <h2 className="text-heading-lg mb-4">Identity Verification Recommended</h2>
            <p className="text-body mb-6">
              Verified sellers get more views and build trust with buyers. 
              Verification helps us maintain a safe marketplace for everyone.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => setShowVerification(true)}
                className="btn btn-primary"
              >
                Verify Identity Now
              </button>
              <button
                onClick={() => setCanSkip(true)}
                className="btn btn-secondary"
              >
                Create Listing Without Verification
              </button>
            </div>
            <div className="mt-4">
              <Link href="/listings" className="link text-body-sm">
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
          
          <OnfidoVerification
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
    <div className="min-h-screen bg-gray-50">
      {/* Clean Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-6 py-8">
          <h1 className="text-3xl font-light text-gray-900">Create Listing</h1>
          <p className="text-gray-600 mt-2">Fill out the details below to list your motorcycle</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Verification Status */}
        {isVerified && (
          <div className="mb-6 p-3 bg-green-50 border-l-4 border-green-400 rounded-r">
            <div className="flex items-center">
              <svg className="w-4 h-4 text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-sm text-green-800 font-medium">Identity Verified</span>
            </div>
          </div>
        )}

        {canSkip && !isVerified && (
          <div className="mb-6 p-3 bg-amber-50 border-l-4 border-amber-400 rounded-r">
            <div className="flex items-center">
              <svg className="w-4 h-4 text-amber-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
              </svg>
              <span className="text-sm text-amber-800 font-medium">Unverified Seller</span>
            </div>
          </div>
        )}
        {/* Clean Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            
            {/* Basic Information */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-6">Basic Information</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    placeholder="e.g., 2019 Honda CBR600RR - Excellent Condition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={4}
                    required
                    placeholder="Describe your motorcycle's condition, features, and history..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Price</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-gray-500">$</span>
                      <input
                        type="number"
                        name="price"
                        value={formData.price}
                        onChange={handleInputChange}
                        className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                        min="0"
                        step="0.01"
                        placeholder="15,000"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Condition</label>
                    <select
                      name="condition"
                      value={formData.condition}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            </div>

            {/* Vehicle Details */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-6">Vehicle Details</h2>
              <div className="space-y-6">
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Make</label>
                    <input
                      type="text"
                      name="make"
                      value={formData.make}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                      placeholder="Honda"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Model</label>
                    <input
                      type="text"
                      name="model"
                      value={formData.model}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                      placeholder="CBR600RR"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
                    <input
                      type="number"
                      name="year"
                      value={formData.year}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                      min="1900"
                      max={new Date().getFullYear() + 1}
                      placeholder="2019"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Mileage</label>
                    <input
                      type="number"
                      name="mileage"
                      value={formData.mileage}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                      min="0"
                      placeholder="12,000"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">VIN (17 characters)</label>
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
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono ${
                      formData.vin.length === 17 
                        ? vinVerification.result?.success && vinVerification.result.data?.isValid 
                          ? 'border-green-500' 
                          : vinVerification.result && (!vinVerification.result.success || vinVerification.result.data?.isValid === false)
                          ? 'border-red-500' 
                          : 'border-gray-300'
                        : 'border-gray-300'
                    }`}
                    maxLength={17}
                    placeholder="1HGBH41JXMN109186"
                  />
                  
                  {vinVerification.loading && (
                    <p className="mt-1 text-xs text-blue-600">Verifying VIN...</p>
                  )}
                  
                  {vinVerification.result && (
                    <div className="mt-1">
                      {vinVerification.result?.success && vinVerification.result.data?.isValid ? (
                        <p className="text-xs text-green-600">
                          ✓ VIN verified • Theft check: {vinVerification.result.data?.isStolen ? 'STOLEN' : 'Clean'}
                        </p>
                      ) : (
                        <p className="text-xs text-amber-600">⚠ Please check VIN</p>
                      )}
                    </div>
                  )}
                  
                  {vinVerification.error && (
                    <p className="mt-1 text-xs text-red-600">{vinVerification.error}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Location */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-6">Location</h2>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    placeholder="San Francisco"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">ZIP Code</label>
                  <input
                    type="text"
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    placeholder="94102"
                  />
                </div>
              </div>
            </div>

            {/* Photos */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-6">Photos</h2>
              <ImageUpload 
                onImagesUploaded={setImages}
                existingImages={images}
                maxImages={10}
              />
            </div>

            {/* Message */}
            {message && (
              <div className={`p-3 rounded-md ${
                message.includes('error') 
                  ? 'bg-red-50 text-red-700 border border-red-200' 
                  : 'bg-green-50 text-green-700 border border-green-200'
              }`}>
                {message}
              </div>
            )}

            {/* Submit */}
            <div className="pt-6 border-t border-gray-200">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gray-900 text-white py-3 px-4 rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Creating Listing...' : 'Create Listing'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}