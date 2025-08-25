// app/listings/[id]/edit/page.tsx - Edit Listing Page
'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import ImageUpload from '@/components/ImageUpload'

export default function EditListing() {
  const router = useRouter()
  const params = useParams()
  const listingId = params.id as string
  
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [listingNotFound, setListingNotFound] = useState(false)
  const [unauthorized, setUnauthorized] = useState(false)
  
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
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    getUser()
  }, [])

  useEffect(() => {
    if (user && listingId) {
      fetchListing()
    }
  }, [user, listingId])

  const getUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/auth/login')
      return
    }
    
    setUser(user)
  }

  const fetchListing = async () => {
    try {
      const { data: listing, error } = await supabase
        .from('listings')
        .select('*')
        .eq('id', listingId)
        .single()

      if (error || !listing) {
        setListingNotFound(true)
        setLoading(false)
        return
      }

      // Check if user owns this listing
      if (listing.user_id !== user?.id) {
        setUnauthorized(true)
        setLoading(false)
        return
      }

      // Populate form with existing data
      setFormData({
        title: listing.title || '',
        description: listing.description || '',
        price: listing.price?.toString() || '',
        make: listing.make || '',
        model: listing.model || '',
        year: listing.year?.toString() || '',
        mileage: listing.mileage?.toString() || '',
        vin: listing.vin || '',
        condition: listing.condition || '',
        city: listing.city || '',
        zipCode: listing.zip_code || ''
      })

      setImages(listing.images || [])
      setLoading(false)
    } catch (error) {
      console.error('Error fetching listing:', error)
      setMessage('Failed to load listing data')
      setLoading(false)
    }
  }

  const validateForm = () => {
    const errors: Record<string, string> = {}
    
    if (!formData.title.trim()) errors.title = 'Title is required'
    if (!formData.description.trim()) errors.description = 'Description is required'
    if (!formData.price || parseFloat(formData.price) <= 0) errors.price = 'Valid price is required'
    if (!formData.condition) errors.condition = 'Condition is required'
    if (!formData.make.trim()) errors.make = 'Make is required'
    if (!formData.model.trim()) errors.model = 'Model is required'
    if (!formData.year || parseInt(formData.year) < 1900) errors.year = 'Valid year is required'
    if (!formData.mileage || parseInt(formData.mileage) < 0) errors.mileage = 'Valid mileage is required'
    if (!formData.vin || formData.vin.length !== 17) errors.vin = 'Valid 17-character VIN is required'
    if (!formData.city.trim()) errors.city = 'City is required'
    if (!formData.zipCode.trim()) errors.zipCode = 'ZIP code is required'
    if (images.length === 0) errors.images = 'At least one photo is required'
    
    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      setMessage('Please correct the validation errors below')
      return
    }
    
    setSaving(true)
    setMessage('')

    try {
      const updateData = {
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
        updated_at: new Date().toISOString()
      }

      // Get the current session to include in the request
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('You must be logged in to update listings');
      }

      const response = await fetch(`/api/listings/${listingId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      })

      const result = await response.json()

      if (response.ok) {
        setMessage('Listing updated successfully!')
        setTimeout(() => {
          router.push(`/listings/${listingId}`)
        }, 1500)
      } else {
        throw new Error(result.error || 'Failed to update listing')
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to update listing')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading listing data</h3>
          <p className="text-sm text-gray-600">Please wait while we fetch your listing...</p>
        </div>
      </div>
    )
  }

  if (listingNotFound) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="w-16 h-16 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Listing Not Found</h2>
          <p className="text-gray-600 mb-6">The listing you&apos;re trying to edit doesn&apos;t exist or has been removed.</p>
          <Link
            href="/listings"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Listings
          </Link>
        </div>
      </div>
    )
  }

  if (unauthorized) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="w-16 h-16 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-6">You can only edit your own listings.</p>
          <Link
            href="/listings"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Listings
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-3">
          <div className="flex items-center gap-2 text-sm">
            <Link href={`/listings/${listingId}`} className="text-gray-500 hover:text-gray-700 transition-colors">
              View listing
            </Link>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-gray-900 font-medium">Edit listing</span>
          </div>
        </div>
      </div>

      {/* Compact Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <h1 className="text-2xl font-semibold text-gray-900">
            Edit listing
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Update your motorcycle details
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-4 h-[calc(100vh-120px)]">
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden h-full flex flex-col">
          <form ref={formRef} onSubmit={handleSubmit} className="h-full flex flex-col overflow-hidden">
            
            {/* All fields in compact layout */}
            <div className="p-6 flex-1 overflow-y-auto">
              <div className="space-y-6">
                
                {/* Basic Info Row */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                  <div className="lg:col-span-2">
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      Title *
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-blue-500 ${
                        validationErrors.title ? 'border-red-300 focus:border-red-500' : ''
                      }`}
                      placeholder="2019 Honda CBR600RR Sport Bike"
                    />
                    {validationErrors.title && (
                      <p className="text-xs text-red-600 mt-1">{validationErrors.title}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      Price (USD) *
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">$</div>
                      <input
                        type="number"
                        name="price"
                        value={formData.price}
                        onChange={handleInputChange}
                        className={`w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-blue-500 ${
                          validationErrors.price ? 'border-red-300 focus:border-red-500' : ''
                        }`}
                        min="0"
                        step="100"
                        placeholder="15000"
                      />
                    </div>
                    {validationErrors.price && (
                      <p className="text-xs text-red-600 mt-1">{validationErrors.price}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      Condition *
                    </label>
                    <select
                      name="condition"
                      value={formData.condition}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-blue-500 appearance-none bg-white ${
                        validationErrors.condition ? 'border-red-300 focus:border-red-500' : ''
                      }`}
                    >
                      <option value="">Select</option>
                      <option value="excellent">Excellent</option>
                      <option value="good">Good</option>
                      <option value="fair">Fair</option>
                      <option value="poor">Poor</option>
                    </select>
                    {validationErrors.condition && (
                      <p className="text-xs text-red-600 mt-1">{validationErrors.condition}</p>
                    )}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Description *
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-blue-500 resize-none ${
                      validationErrors.description ? 'border-red-300 focus:border-red-500' : ''
                    }`}
                    rows={2}
                    placeholder="Describe condition, maintenance history, and key details..."
                  />
                  {validationErrors.description && (
                    <p className="text-xs text-red-600 mt-1">{validationErrors.description}</p>
                  )}
                </div>

                {/* Vehicle Details Row */}
                <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">Make *</label>
                    <input
                      type="text"
                      name="make"
                      value={formData.make}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-blue-500 ${
                        validationErrors.make ? 'border-red-300' : ''
                      }`}
                      placeholder="Honda"
                    />
                    {validationErrors.make && <p className="text-xs text-red-600 mt-1">{validationErrors.make}</p>}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">Model *</label>
                    <input
                      type="text"
                      name="model"
                      value={formData.model}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-blue-500 ${
                        validationErrors.model ? 'border-red-300' : ''
                      }`}
                      placeholder="CBR600RR"
                    />
                    {validationErrors.model && <p className="text-xs text-red-600 mt-1">{validationErrors.model}</p>}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">Year *</label>
                    <input
                      type="number"
                      name="year"
                      value={formData.year}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-blue-500 ${
                        validationErrors.year ? 'border-red-300' : ''
                      }`}
                      min="1900"
                      max={new Date().getFullYear() + 1}
                      placeholder="2019"
                    />
                    {validationErrors.year && <p className="text-xs text-red-600 mt-1">{validationErrors.year}</p>}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">Miles *</label>
                    <input
                      type="number"
                      name="mileage"
                      value={formData.mileage}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-blue-500 ${
                        validationErrors.mileage ? 'border-red-300' : ''
                      }`}
                      min="0"
                      placeholder="12000"
                    />
                    {validationErrors.mileage && <p className="text-xs text-red-600 mt-1">{validationErrors.mileage}</p>}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">City *</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-blue-500 ${
                        validationErrors.city ? 'border-red-300' : ''
                      }`}
                      placeholder="San Francisco"
                    />
                    {validationErrors.city && <p className="text-xs text-red-600 mt-1">{validationErrors.city}</p>}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">ZIP *</label>
                    <input
                      type="text"
                      name="zipCode"
                      value={formData.zipCode}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-blue-500 ${
                        validationErrors.zipCode ? 'border-red-300' : ''
                      }`}
                      placeholder="94102"
                    />
                    {validationErrors.zipCode && <p className="text-xs text-red-600 mt-1">{validationErrors.zipCode}</p>}
                  </div>
                </div>

                {/* VIN Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Vehicle Identification Number (VIN) *
                  </label>
                  <input
                    type="text"
                    name="vin"
                    value={formData.vin}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm focus:outline-none focus:border-blue-500 ${
                      validationErrors.vin ? 'border-red-300 focus:border-red-500' : ''
                    }`}
                    maxLength={17}
                    placeholder="1HGBH41JXMN109186"
                  />
                  {validationErrors.vin && (
                    <p className="text-xs text-red-600 mt-1">{validationErrors.vin}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">17-character code found on frame or registration</p>
                </div>

                {/* Photos */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium text-gray-900">Photos *</label>
                    <span className="text-xs text-gray-600">{images.length}/10</span>
                  </div>
                  <ImageUpload 
                    onImagesUploaded={setImages}
                    existingImages={images}
                    maxImages={10}
                  />
                  {validationErrors.images && (
                    <p className="text-xs text-red-600 mt-1">{validationErrors.images}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Footer with Message and Submit */}
            <div className="p-4 border-t border-gray-200 bg-gray-50 flex-shrink-0">
              {message && (
                <div className={`p-3 rounded-lg mb-3 ${message.includes('error') || message.includes('failed') || message.includes('correct')
                  ? 'bg-red-50 border border-red-200 text-red-800' 
                  : 'bg-green-50 border border-green-200 text-green-800'
                }`}>
                  <div className="flex items-center gap-2">
                    {message.includes('error') || message.includes('failed') || message.includes('correct') ? (
                      <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    <span className="text-sm font-medium">{message}</span>
                  </div>
                </div>
              )}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-md transition-colors"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <span>Save Changes</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}