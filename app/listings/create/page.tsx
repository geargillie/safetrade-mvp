// app/listings/create/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import ImageUpload from '@/components/ImageUpload'
import FreeIdentityVerification from '@/components/FreeIdentityVerification'
import EnhancedIDVerification from '@/components/EnhancedIDVerification'

export default function CreateListing() {
  const router = useRouter()
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [isVerified, setIsVerified] = useState<boolean | null>(null)
  const [showVerification, setShowVerification] = useState(false)
  const [verificationStatus, setVerificationStatus] = useState<{ verified: boolean; status: string; method?: string } | null>(null)
  const [verificationMethod, setVerificationMethod] = useState<'basic' | 'enhanced' | null>(null)
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
        make?: string;
        model?: string;
        year?: string;
        msrp?: number;
        sources?: string[];
        error?: string;
        bodyStyle?: string;
        engineSize?: string;
        transmission?: string;
        fuelType?: string;
        color?: string;
        trim?: string;
      };
    } | null
    error: string
  }>({ loading: false, result: null, error: '' })

  useEffect(() => {
    checkUser()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth/login')
      return
    }
    
    // Check if user profile exists
    console.log('Checking for existing profile for user:', user.id)
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('id', user.id)
      .single()
    
    console.log('Profile check result:', { profile, profileError })
    
    // If profile doesn't exist, create it
    if (!profile || (profileError && typeof profileError === 'object' && profileError !== null && 'code' in profileError && (profileError as { code: string }).code === 'PGRST116')) {
      console.log('Creating missing profile for user:', user.id)
      console.log('User metadata:', user.user_metadata)
      
      const profileData = {
        id: user.id,
        first_name: user.user_metadata?.first_name || 'User',
        last_name: user.user_metadata?.last_name || '',
        phone_verified: false,
        id_document_verified: false,
        trust_score: 0,
        identity_verified: false,
        verification_level: null,
        verified_at: null,
        phone: null,
        city: null,
        zip_code: null
      }
      
      console.log('Profile data to insert:', profileData)
      
      // Use upsert instead of insert to handle conflicts
      const { data: insertResult, error: insertError } = await supabase
        .from('user_profiles')
        .upsert(profileData, { onConflict: 'id' })
        .select()
      
      if (insertError) {
        console.error('Error creating profile:', insertError)
        console.error('Error details:', {
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint,
          code: insertError.code
        })
        setMessage('Error: Could not create user profile. Please contact support.')
        return
      }
      
      console.log('Profile created successfully:', insertResult)
    } else if (profileError && typeof profileError === 'object' && profileError !== null && 'code' in profileError && (profileError as { code: string }).code !== 'PGRST116') {
      console.error('Error checking profile:', profileError)
      setMessage('Error: Could not check user profile. Please contact support.')
      return
    }
    
    setUser(user)
    
    // Check identity verification status
    await checkVerificationStatus(user.id)
  }

  const checkVerificationStatus = async (userId: string) => {
    try {
      // Check both basic and enhanced verification status
      const [basicResponse, enhancedResponse] = await Promise.all([
        fetch(`/api/identity/free-verify?userId=${userId}`),
        fetch(`/api/identity/enhanced-verify?userId=${userId}`)
      ])
      
      let isVerified = false
      let verificationData = null
      
      // Check enhanced verification first (higher priority)
      if (enhancedResponse.ok) {
        const enhancedData = await enhancedResponse.json()
        if (enhancedData.verified) {
          isVerified = true
          verificationData = { ...enhancedData, method: 'enhanced' }
        }
      }
      
      // If not enhanced verified, check basic verification
      if (!isVerified && basicResponse.ok) {
        const basicData = await basicResponse.json()
        if (basicData.verified) {
          isVerified = true
          verificationData = { ...basicData, method: 'basic' }
        } else {
          verificationData = basicData
        }
      }
      
      setVerificationStatus(verificationData)
      setIsVerified(isVerified)
      
      if (!isVerified && verificationData?.status === 'not_started') {
        // User hasn't started verification yet
        setShowVerification(false) // Don't auto-show, let them click
      }
    } catch (error) {
      console.error('Error checking verification status:', error)
      setIsVerified(false)
    }
  }

  const handleVerificationComplete = (result: { verified?: boolean; status?: string; score?: number; message?: string }) => {
    console.log('Verification completed:', result)
    if (result.verified) {
      setIsVerified(true)
      setVerificationStatus({ ...verificationStatus, verified: true, status: 'verified' })
      setShowVerification(false)
      setMessage('✅ Identity verified successfully! You can now create listings.')
    } else {
      setVerificationStatus({ 
        verified: result.verified || false,
        status: result.status || 'failed'
      })
      setMessage(`Identity verification: ${result.message}`)
    }
  }

  const handleVerificationError = (error: string) => {
    console.error('Identity verification error:', error)
    setMessage(`Identity verification error: ${error}`)
  }

  const suggestPrice = (msrp: number, year: string | number) => {
    if (!msrp || !year || year === 'Unknown') return ''
    
    const vehicleYear = typeof year === 'string' ? parseInt(year) : year
    const currentYear = new Date().getFullYear()
    const age = currentYear - vehicleYear
    
    // Motorcycle depreciation calculation
    let depreciationRate = 0
    
    if (age <= 1) depreciationRate = 0.10
    else if (age <= 2) depreciationRate = 0.20
    else if (age <= 3) depreciationRate = 0.30
    else if (age <= 4) depreciationRate = 0.40
    else if (age <= 5) depreciationRate = 0.50
    else depreciationRate = 0.50 + ((age - 5) * 0.05)
    
    depreciationRate = Math.min(depreciationRate, 0.80)
    
    const suggestedPrice = Math.round(msrp * (1 - depreciationRate))
    return Math.round(suggestedPrice / 500) * 500
  }

  const suggestCondition = (year: string | number) => {
    if (!year || year === 'Unknown') return ''
    
    const vehicleYear = typeof year === 'string' ? parseInt(year) : year
    const currentYear = new Date().getFullYear()
    const age = currentYear - vehicleYear
    
    if (age <= 2) return 'Excellent'
    if (age <= 5) return 'Very Good'
    if (age <= 10) return 'Good'
    if (age <= 15) return 'Fair'
    return 'Fair'
  }

  const generateVehicleDescription = (vehicleInfo: { make?: string; model?: string; year?: string; fuelType?: string; bodyClass?: string; error?: string; engineSize?: string; transmission?: string; bodyStyle?: string; color?: string; msrp?: number; sources?: string[] }) => {
    if (!vehicleInfo || vehicleInfo.error) return ''
    
    const parts = []
    
    if (vehicleInfo.year && vehicleInfo.make && vehicleInfo.model) {
      parts.push(`This ${vehicleInfo.year} ${vehicleInfo.make} ${vehicleInfo.model}`)
    }
    
    if (vehicleInfo.engineSize) {
      parts.push(`features a ${vehicleInfo.engineSize} engine`)
    }
    
    if (vehicleInfo.transmission) {
      parts.push(`with ${vehicleInfo.transmission.toLowerCase()} transmission`)
    }
    
    if (vehicleInfo.bodyStyle) {
      parts.push(`Built as a ${vehicleInfo.bodyStyle.toLowerCase()}`)
    }
    
    if (vehicleInfo.fuelType) {
      parts.push(`running on ${vehicleInfo.fuelType.toLowerCase()}`)
    }
    
    if (vehicleInfo.color) {
      parts.push(`Available in ${vehicleInfo.color.toLowerCase()}`)
    }
    
    if (vehicleInfo.msrp) {
      parts.push(`Original MSRP: $${vehicleInfo.msrp.toLocaleString()}`)
    }
    
    parts.push(`\n\n✅ Vehicle information verified through ${vehicleInfo.sources?.join(' & ') || 'official databases'}`)
    parts.push('✅ VIN checked against NICB stolen vehicle database')
    
    return parts.join('. ') + '.'
  }

  const handleVinVerification = async (vin: string) => {
    if (vin.length !== 17) return
    
    setVinVerification({ loading: true, result: null, error: '' })
    
    try {
      const response = await fetch('/api/verify-vin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vin })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'VIN verification failed')
      }
      
      if (data.success) {
        setVinVerification({ 
          loading: false, 
          result: data.data, 
          error: '' 
        })
        
        // Enhanced auto-fill with all available vehicle data
        if (data.data.vehicleInfo && !data.data.vehicleInfo.error) {
          const vehicleInfo = data.data.vehicleInfo
          
          const suggestedPrice = suggestPrice(vehicleInfo.msrp, vehicleInfo.year)
          
          // Use functional update to preserve the current VIN value
          setFormData(prevFormData => {
            const newFormData = {
              ...prevFormData,
              // Basic vehicle info (preserve existing VIN from current state)
              make: vehicleInfo.make && vehicleInfo.make !== 'Unknown' ? vehicleInfo.make : prevFormData.make,
              model: vehicleInfo.model && vehicleInfo.model !== 'Unknown' ? vehicleInfo.model : prevFormData.model,
              year: vehicleInfo.year && vehicleInfo.year !== 'Unknown' ? vehicleInfo.year.toString() : prevFormData.year,
              
              // Auto-generate title if we have good data
              title: (vehicleInfo.year && vehicleInfo.make && vehicleInfo.model && 
                     vehicleInfo.year !== 'Unknown' && vehicleInfo.make !== 'Unknown' && vehicleInfo.model !== 'Unknown')
                ? `${vehicleInfo.year} ${vehicleInfo.make} ${vehicleInfo.model}${vehicleInfo.trim ? ` ${vehicleInfo.trim}` : ''}`
                : prevFormData.title,
              
              // Enhanced description with vehicle details (only if empty)
              description: prevFormData.description || generateVehicleDescription(vehicleInfo),
              
              // Smart condition suggestion (only if empty)
              condition: prevFormData.condition || suggestCondition(vehicleInfo.year),
              
              // Suggested price (only if empty)
              price: prevFormData.price || (suggestedPrice ? suggestedPrice.toString() : ''),
              
              // Keep existing VIN from the parameter (most current value)
              vin: vin, // Use the vin parameter instead of prevFormData.vin
              city: prevFormData.city,
              zipCode: prevFormData.zipCode,
              mileage: prevFormData.mileage
            }
            
            return newFormData
          })
          
          // Show user what was auto-filled with details
          const filledFields = []
          if (vehicleInfo.make && vehicleInfo.make !== 'Unknown') filledFields.push('make')
          if (vehicleInfo.model && vehicleInfo.model !== 'Unknown') filledFields.push('model')
          if (vehicleInfo.year && vehicleInfo.year !== 'Unknown') filledFields.push('year')
          if (suggestCondition(vehicleInfo.year)) filledFields.push('condition')
          if (vehicleInfo.msrp) filledFields.push('suggested price')
          
          if (filledFields.length > 0) {
            setMessage(`✅ Auto-filled: ${filledFields.join(', ')} from ${vehicleInfo.sources?.join(' & ') || 'vehicle databases'}`)
            setTimeout(() => setMessage(''), 5000)
          }
        }
      } else {
        setVinVerification({ 
          loading: false, 
          result: null, 
          error: data.message || 'Verification failed' 
        })
      }
    } catch (error: unknown) {
      setVinVerification({ 
        loading: false, 
        result: null, 
        error: (error as { message?: string }).message || 'Unknown error' 
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      if (!user) {
        throw new Error('Please log in to create a listing')
      }

      // Check verification status again before submission (allow skip if enabled)
      if (!isVerified && !canSkip) {
        throw new Error('Identity verification required to create listings')
      }

      if (!formData.title || !formData.price || !formData.make || !formData.vin) {
        throw new Error('Please fill in all required fields')
      }

      if (!vinVerification.result || !vinVerification.result.isValid) {
        throw new Error('Please wait for VIN verification to complete and ensure VIN is valid')
      }

      if (vinVerification.result.isStolen) {
        throw new Error('Cannot list stolen vehicles')
      }

      const { data, error } = await supabase
        .from('listings')
        .insert({
          seller_id: user.id,
          title: formData.title,
          description: formData.description,
          price: parseFloat(formData.price),
          make: formData.make,
          model: formData.model,
          year: formData.year ? parseInt(formData.year) : null,
          mileage: formData.mileage ? parseInt(formData.mileage) : null,
          vin: formData.vin.toUpperCase(),
          condition: formData.condition,
          city: formData.city,
          zip_code: formData.zipCode,
          vin_verified: vinVerification.result?.isValid && !vinVerification.result?.isStolen,
          theft_record_checked: true,
          theft_record_found: vinVerification.result?.isStolen || false,
          theft_record_details: vinVerification.result?.stolenCheck || null,
          total_loss_checked: true,
          total_loss_found: (vinVerification.result as Record<string, unknown>)?.isTotalLoss as boolean || false,
          total_loss_details: (vinVerification.result as Record<string, unknown>)?.totalLossCheck as Record<string, unknown> || null,
          vin_verification_date: new Date().toISOString(),
          status: 'available'
        })
        .select()

      if (error) throw error

      // Save images if listing was created successfully
      if (data && data[0] && images.length > 0) {
        const listingId = data[0].id
        
        // Insert images with proper order
        const imageInserts = images.map((imageUrl, index) => ({
          listing_id: listingId,
          image_url: imageUrl,
          is_primary: index === 0, // First image is primary
          sort_order: index
        }))
        
        const { error: imageError } = await supabase
          .from('listing_images')
          .insert(imageInserts)
        
        if (imageError) {
          console.error('Failed to save images:', imageError)
          // Don't fail the whole listing creation for image errors
        }
      }

      setMessage('Listing created successfully!')
      setTimeout(() => {
        router.push('/listings')
      }, 2000)

    } catch (error: unknown) {
      const err = error as { message?: string }
      setMessage(`Error: ${err.message || 'Unknown error'}`)
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
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
              🛡️
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Identity Verification Required
            </h1>
            
            <p className="text-gray-600 mb-6">
              To maintain SafeTrade&apos;s military-grade security standards, all sellers must verify their identity 
              before creating listings. This helps protect buyers and builds trust in our marketplace.
            </p>

            {/* Current verification status */}
            {verificationStatus && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-gray-900 mb-2">Current Status:</h3>
                {verificationStatus.status === 'not_started' && (
                  <p className="text-yellow-600">❌ Identity verification not started</p>
                )}
                {verificationStatus.status === 'pending_review' && (
                  <p className="text-blue-600">⏳ Identity verification under review (typically 2-5 minutes)</p>
                )}
                {verificationStatus.status === 'failed' && (
                  <p className="text-red-600">❌ Identity verification failed - please try again</p>
                )}
              </div>
            )}

            {/* Security features highlight */}
            <div className="bg-blue-50 rounded-lg p-4 mb-6 text-left">
              <h3 className="font-semibold text-blue-900 mb-2">🛡️ Why We Verify Sellers</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Prevent stolen vehicle listings</li>
                <li>• Stop scammers and fraudulent sellers</li>
                <li>• Build buyer confidence and trust</li>
                <li>• Comply with anti-money laundering laws</li>
                <li>• Enable secure payment processing</li>
              </ul>
            </div>

            <div className="space-y-4">
              <button
                onClick={() => setShowVerification(true)}
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium"
              >
                Start Identity Verification (FREE)
              </button>
              
              <div className="text-sm text-gray-500">
                <p>✅ Quick 2-minute process</p>
                <p>✅ Government ID + liveness check</p>
                <p>✅ Bank-level encryption & security</p>
              </div>
              
              <div className="space-y-2">
                <button
                  onClick={() => {
                    setCanSkip(true)
                    setIsVerified(null) // This will show the create listing form
                  }}
                  className="w-full text-yellow-600 hover:text-yellow-800 underline text-sm bg-yellow-50 py-2 rounded"
                >
                  ⚠️ Skip Verification & Create Listing Anyway
                </button>
                
                <button
                  onClick={() => router.push('/listings')}
                  className="text-gray-600 hover:text-gray-800 underline text-sm"
                >
                  Browse listings instead
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show verification modal if requested
  if (showVerification && user?.id) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900">
                {verificationMethod ? (
                  verificationMethod === 'enhanced' ? 'Enhanced Verification' : 'Basic Verification'
                ) : (
                  'Choose Your Verification Level'
                )}
              </h1>
              <button
                onClick={() => {
                  setShowVerification(false)
                  setVerificationMethod(null)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            {!verificationMethod ? (
              <div className="space-y-6">
                <p className="text-gray-600 text-center mb-6">
                  Select the verification method that works best for you
                </p>
                
                {/* Verification method selection */}
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Enhanced Verification Option */}
                  <div 
                    className="border-2 border-blue-200 rounded-lg p-6 cursor-pointer hover:border-blue-400 transition-colors bg-gradient-to-br from-blue-50 to-purple-50"
                    onClick={() => setVerificationMethod('enhanced')}
                  >
                    <div className="text-center">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
                        🔐
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Enhanced Verification</h3>
                      <p className="text-sm text-gray-600 mb-4">Real-time liveness detection + face matching</p>
                      
                      <div className="bg-white rounded-lg p-3 mb-4">
                        <div className="text-xs text-gray-700 space-y-1 text-left">
                          <p>✅ Real-time liveness detection</p>
                          <p>✅ Face matching with ID photo</p>
                          <p>✅ Advanced fraud protection</p>
                          <p>✅ Highest security level</p>
                          <p>✅ Instant verification</p>
                        </div>
                      </div>
                      
                      <div className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded">
                        RECOMMENDED
                      </div>
                    </div>
                  </div>
                  
                  {/* Basic Verification Option */}
                  <div 
                    className="border-2 border-gray-200 rounded-lg p-6 cursor-pointer hover:border-gray-400 transition-colors"
                    onClick={() => setVerificationMethod('basic')}
                  >
                    <div className="text-center">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        🆔
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Basic Verification</h3>
                      <p className="text-sm text-gray-600 mb-4">Document upload verification</p>
                      
                      <div className="bg-gray-50 rounded-lg p-3 mb-4">
                        <div className="text-xs text-gray-700 space-y-1 text-left">
                          <p>✅ Government ID upload</p>
                          <p>✅ Document authenticity check</p>
                          <p>✅ Basic fraud protection</p>
                          <p>⚠️ No liveness detection</p>
                          <p>⚠️ No face matching</p>
                        </div>
                      </div>
                      
                      <div className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded">
                        BASIC
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <span className="text-yellow-600">ℹ️</span>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">
                        Optional but Recommended
                      </h3>
                      <p className="text-sm text-yellow-700 mt-1">
                        Identity verification helps build trust with buyers and unlocks advanced features. 
                        You can also skip this step and create listings with limited functionality.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="text-center">
                  <button
                    onClick={() => {
                      setCanSkip(true)
                      setShowVerification(false)
                      setIsVerified(null) // This will show the create listing form
                    }}
                    className="text-sm text-gray-600 hover:text-gray-800 underline"
                  >
                    Skip for now (create listing without verification)
                  </button>
                </div>
              </div>
            ) : verificationMethod === 'enhanced' ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Enhanced Verification</h3>
                  <button
                    onClick={() => setVerificationMethod(null)}
                    className="text-sm text-blue-600 hover:text-blue-800 underline"
                  >
                    ← Choose Different Method
                  </button>
                </div>
                
                <EnhancedIDVerification
                  userId={user.id}
                  onComplete={handleVerificationComplete}
                  onError={handleVerificationError}
                />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Basic Verification</h3>
                  <button
                    onClick={() => setVerificationMethod(null)}
                    className="text-sm text-blue-600 hover:text-blue-800 underline"
                  >
                    ← Choose Different Method
                  </button>
                </div>
                
                <FreeIdentityVerification
                  userId={user.id}
                  onComplete={handleVerificationComplete}
                  onError={handleVerificationError}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Show loading state while checking verification (unless user can skip)
  if (isVerified === null && !canSkip) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking verification status...</p>
        </div>
      </div>
    )
  }

  // Main listing creation form (only shows if verified)
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          {/* Verification status badge */}
          {isVerified ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <span className="text-green-600 mr-2">✅</span>
                <span className="text-green-800 font-medium">
                  Identity Verified - Trusted Seller
                  {verificationStatus?.method === 'enhanced' && (
                    <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded font-normal">
                      ENHANCED
                    </span>
                  )}
                </span>
              </div>
              <p className="text-green-700 text-sm mt-1">
                Your identity has been verified{verificationStatus?.method === 'enhanced' ? ' with advanced biometric security' : ''}. Buyers will see you as a trusted seller.
              </p>
            </div>
          ) : canSkip ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <span className="text-yellow-600 mr-2">⚠️</span>
                <span className="text-yellow-800 font-medium">Unverified Seller - Limited Features</span>
              </div>
              <p className="text-yellow-700 text-sm mt-1">
                You&apos;re creating a listing without identity verification. Your listing will be marked as &quot;unverified&quot; and may receive fewer inquiries.
              </p>
              <div className="mt-2">
                <button
                  onClick={() => setShowVerification(true)}
                  className="text-sm text-blue-600 hover:text-blue-800 underline"
                >
                  Complete verification now to unlock full features
                </button>
              </div>
            </div>
          ) : null}

          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            List Your Motorcycle
          </h1>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title * {formData.title && vinVerification.result?.vehicleInfo && (
                    <span className="text-green-600 text-xs">✅ Auto-filled</span>
                  )}
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="2020 Honda CBR600RR - Low Miles"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price * {formData.price && vinVerification.result?.vehicleInfo?.msrp && (
                    <span className="text-green-600 text-xs">✅ Suggested based on MSRP</span>
                  )}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500">$</span>
                  <input
                    type="number"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="10000"
                  />
                </div>
                {vinVerification.result?.vehicleInfo?.msrp && (
                  <p className="text-xs text-gray-500 mt-1">
                    Original MSRP: ${vinVerification.result.vehicleInfo.msrp.toLocaleString()}
                  </p>
                )}
              </div>

              {/* VIN Verification */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  VIN (17 characters) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.vin}
                  onChange={(e) => {
                    const newVin = e.target.value.toUpperCase()
                    setFormData({ ...formData, vin: newVin })
                    
                    // Only trigger verification when VIN is exactly 17 characters
                    if (newVin.length === 17) {
                      handleVinVerification(newVin)
                    } else if (newVin.length < 17) {
                      // Clear verification results if VIN is incomplete
                      setVinVerification({ loading: false, result: null, error: '' })
                    }
                  }}
                  onBlur={(e) => {
                    // Trigger verification on blur if VIN is 17 characters
                    const vin = e.target.value.toUpperCase()
                    if (vin.length === 17 && !vinVerification.result && !vinVerification.loading) {
                      handleVinVerification(vin)
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="1HD1KB4137Y123456"
                  maxLength={17}
                />
                
                {/* VIN Verification Status */}
                {vinVerification.loading && (
                  <div className="mt-2 flex items-center text-blue-600">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="text-sm">Checking real-time NICB stolen vehicle database...</span>
                  </div>
                )}
                
                {vinVerification.result && (
                  <div className="mt-2 space-y-2">
                    {vinVerification.result.isStolen ? (
                      <div className="bg-red-100 border border-red-300 text-red-700 px-3 py-2 rounded-md">
                        <div className="flex items-center">
                          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                          <strong>STOLEN VEHICLE ALERT</strong>
                        </div>
                        <div className="text-sm mt-1">
                          NICB REAL-TIME STOLEN VEHICLE CHECK FAILED - This vehicle has been reported stolen in the National Insurance Crime Bureau database. Listing is blocked for your protection.
                        </div>
                      </div>
                    ) : vinVerification.result.isValid ? (
                      <div className="bg-green-100 border border-green-300 text-green-700 px-3 py-2 rounded-md">
                        <div className="flex items-center">
                          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <strong>✅ VIN Verified</strong>
                        </div>
                        <div className="text-sm mt-1">
                          Valid VIN • NICB Real-time Check: CLEAN
                          {vinVerification.result.vehicleInfo && !vinVerification.result.vehicleInfo.error && (
                            <div className="mt-2 p-2 bg-blue-50 rounded border-l-4 border-blue-400">
                              <div className="font-medium text-blue-800">Vehicle Information:</div>
                              <div className="text-blue-700 text-xs space-y-1 mt-1">
                                {vinVerification.result.vehicleInfo.year && vinVerification.result.vehicleInfo.make && vinVerification.result.vehicleInfo.model && (
                                  <div><strong>Vehicle:</strong> {vinVerification.result.vehicleInfo.year} {vinVerification.result.vehicleInfo.make} {vinVerification.result.vehicleInfo.model}</div>
                                )}
                                {vinVerification.result.vehicleInfo.bodyStyle && (
                                  <div><strong>Body Style:</strong> {vinVerification.result.vehicleInfo.bodyStyle}</div>
                                )}
                                {vinVerification.result.vehicleInfo.engineSize && (
                                  <div><strong>Engine:</strong> {vinVerification.result.vehicleInfo.engineSize}</div>
                                )}
                                {vinVerification.result.vehicleInfo.transmission && (
                                  <div><strong>Transmission:</strong> {vinVerification.result.vehicleInfo.transmission}</div>
                                )}
                                {vinVerification.result.vehicleInfo.fuelType && (
                                  <div><strong>Fuel Type:</strong> {vinVerification.result.vehicleInfo.fuelType}</div>
                                )}
                                {vinVerification.result.vehicleInfo.color && (
                                  <div><strong>Color:</strong> {vinVerification.result.vehicleInfo.color}</div>
                                )}
                                {vinVerification.result.vehicleInfo.msrp && (
                                  <div><strong>Original MSRP:</strong> ${vinVerification.result.vehicleInfo.msrp.toLocaleString()}</div>
                                )}
                                <div><strong>Data Sources:</strong> {vinVerification.result.vehicleInfo.sources?.join(', ') || 'NHTSA, NICB'}</div>
                              </div>
                            </div>
                          )}
                          {vinVerification.result.warnings && vinVerification.result.warnings.length > 0 && (
                            <div className="text-yellow-600 mt-1">
                              ⚠️ {vinVerification.result.warnings.join(', ')}
                            </div>
                          )}
                          <div className="text-xs text-gray-500 mt-1">
                            Source: {vinVerification.result.stolenCheck?.details?.source || 'NICB'} • 
                            Checked: {new Date(vinVerification.result.stolenCheck?.lastChecked || '').toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-yellow-100 border border-yellow-300 text-yellow-700 px-3 py-2 rounded-md">
                        <div className="flex items-center">
                          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          <strong>VIN Warning</strong>
                        </div>
                        <div className="text-sm mt-1">
                          {vinVerification.result.alerts?.map((alert: { message: string }) => alert.message).join(', ')}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {vinVerification.error && (
                  <div className="mt-2 bg-red-100 border border-red-300 text-red-700 px-3 py-2 rounded-md text-sm">
                    Error: {vinVerification.error}
                  </div>
                )}
              </div>
            </div>

            {/* Vehicle Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Vehicle Details</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Make * {formData.make && vinVerification.result?.vehicleInfo && (
                      <span className="text-green-600 text-xs">✅ Auto-filled</span>
                    )}
                  </label>
                  <select
                    required
                    value={formData.make}
                    onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Make</option>
                    <option value="Harley-Davidson">Harley-Davidson</option>
                    <option value="Honda">Honda</option>
                    <option value="Yamaha">Yamaha</option>
                    <option value="Suzuki">Suzuki</option>
                    <option value="Kawasaki">Kawasaki</option>
                    <option value="Ducati">Ducati</option>
                    <option value="BMW">BMW</option>
                    <option value="KTM">KTM</option>
                    <option value="Triumph">Triumph</option>
                    <option value="Indian">Indian</option>
                    <option value="Aprilia">Aprilia</option>
                    <option value="Benelli">Benelli</option>
                    <option value="Buell">Buell</option>
                    <option value="Can-Am">Can-Am</option>
                    <option value="Husqvarna">Husqvarna</option>
                    <option value="Moto Guzzi">Moto Guzzi</option>
                    <option value="MV Agusta">MV Agusta</option>
                    <option value="Polaris">Polaris</option>
                    <option value="Royal Enfield">Royal Enfield</option>
                    <option value="Victory">Victory</option>
                    <option value="Zero">Zero</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Model {formData.model && vinVerification.result?.vehicleInfo && (
                      <span className="text-green-600 text-xs">✅ Auto-filled</span>
                    )}
                  </label>
                  <input
                    type="text"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="CBR600RR"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Year {formData.year && vinVerification.result?.vehicleInfo && (
                      <span className="text-green-600 text-xs">✅ Auto-filled</span>
                    )}
                  </label>
                  <input
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="2020"
                    min="1980"
                    max={new Date().getFullYear() + 1}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mileage
                  </label>
                  <input
                    type="number"
                    value={formData.mileage}
                    onChange={(e) => setFormData({ ...formData, mileage: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="15000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Condition {formData.condition && vinVerification.result?.vehicleInfo && (
                      <span className="text-green-600 text-xs">✅ Suggested by age</span>
                    )}
                  </label>
                  <select
                    value={formData.condition}
                    onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select</option>
                    <option value="Excellent">Excellent</option>
                    <option value="Very Good">Very Good</option>
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                    <option value="Poor">Poor</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-gray-900">Location</h3>
                <div className="text-sm text-green-600 flex items-center">
                  🛡️ Your address stays private
                </div>
              </div>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-green-800">
                  <strong>Privacy Protected:</strong> We only collect your city and ZIP code. 
                  Your exact address is never stored or shared. Buyers will see your general area until you choose to meet.
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City
                  </label>
                  <select
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select City</option>
                    <option value="Newark">Newark</option>
                    <option value="Jersey City">Jersey City</option>
                    <option value="Paterson">Paterson</option>
                    <option value="Elizabeth">Elizabeth</option>
                    <option value="Edison">Edison</option>
                    <option value="Trenton">Trenton</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Zip Code
                  </label>
                  <input
                    type="text"
                    value={formData.zipCode}
                    onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="07101"
                    maxLength={5}
                  />
                </div>
              </div>
            </div>

            {/* Images */}
            <div className="space-y-4">
              <ImageUpload
                onImagesUploaded={setImages}
                maxImages={8}
                existingImages={images}
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe your motorcycle's condition, features, modifications, etc."
              />
            </div>

            {message && (
              <div className={`p-3 rounded text-sm ${
                message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
              }`}>
                {message}
              </div>
            )}

            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={loading || (!isVerified && !canSkip)}
                className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? 'Creating Listing...' : canSkip && !isVerified ? 'Create Unverified Listing' : 'Create Listing'}
              </button>
              
              <button
                type="button"
                onClick={() => router.push('/listings')}
                className="flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
