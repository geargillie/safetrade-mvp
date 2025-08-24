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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-orange-500 rounded-full animate-spin mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading listing data</h3>
          <p className="text-sm text-gray-600">Please wait while we fetch your listing...</p>
        </div>
      </div>
    )
  }

  if (listingNotFound) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center">
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
            className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-colors"
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center">
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
            className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-colors"
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Header */}
      <div className="bg-white/95 backdrop-blur-sm border-b border-gray-200/60 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href={`/listings/${listingId}`} className="group flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
                <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="text-sm font-medium">Back to listing</span>
              </Link>
              <div className="w-1 h-4 bg-gray-300 rounded-full" />
              <h1 className="text-xl font-semibold text-gray-900">Edit Listing</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="bg-white rounded-xl border border-gray-200/60 shadow-sm overflow-hidden">
          <form ref={formRef} onSubmit={handleSubmit} className="p-8 space-y-6">
            
            {/* Basic Information Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center text-white text-lg font-bold shadow-sm">
                  📝
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Basic Information</h2>
                  <p className="text-sm text-gray-600">Update your motorcycle details</p>
                </div>
              </div>
              
              {/* Title Field */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <span>Motorcycle Title & Description</span>
                  <span className="text-red-500">*</span>
                </label>
                <div className="relative group">
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    onFocus={() => setFocusedField('title')}
                    onBlur={() => setFocusedField(null)}
                    className={`w-full px-4 py-3 border-2 rounded-lg transition-all duration-200 focus:outline-none ${
                      validationErrors.title 
                        ? 'border-red-300 focus:border-red-500 bg-red-50/50'
                        : focusedField === 'title'
                        ? 'border-orange-400 bg-orange-50/30 shadow-sm shadow-orange-500/10'
                        : 'border-gray-200 hover:border-gray-300 focus:border-orange-400'
                    }`}
                    placeholder="e.g., 2019 Honda CBR600RR Sport Bike - Low Miles, Excellent Condition"
                  />
                </div>
                {validationErrors.title && (
                  <p className="text-xs text-red-600 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
                    </svg>
                    <span>{validationErrors.title}</span>
                  </p>
                )}
              </div>

              {/* Description Field */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <span>Detailed Description</span>
                  <span className="text-red-500">*</span>
                </label>
                <div className="relative group">
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    onFocus={() => setFocusedField('description')}
                    onBlur={() => setFocusedField(null)}
                    className={`w-full px-4 py-3 border-2 rounded-lg transition-all duration-200 focus:outline-none resize-none ${
                      validationErrors.description 
                        ? 'border-red-300 focus:border-red-500 bg-red-50/50'
                        : focusedField === 'description'
                        ? 'border-orange-400 bg-orange-50/30 shadow-sm shadow-orange-500/10'
                        : 'border-gray-200 hover:border-gray-300 focus:border-orange-400'
                    }`}
                    rows={6}
                    placeholder="Detailed description of your motorcycle..."
                  />
                </div>
                {validationErrors.description && (
                  <p className="text-xs text-red-600 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
                    </svg>
                    <span>{validationErrors.description}</span>
                  </p>
                )}
              </div>

              {/* Price and Condition Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Price Field */}
                <div className="space-y-3 md:col-span-1">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                    <span>Asking Price (USD)</span>
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-semibold">
                      $
                    </div>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      onFocus={() => setFocusedField('price')}
                      onBlur={() => setFocusedField(null)}
                      className={`w-full pl-8 pr-4 py-3 border-2 rounded-lg transition-all duration-200 focus:outline-none ${
                        validationErrors.price 
                          ? 'border-red-300 focus:border-red-500 bg-red-50/50'
                          : focusedField === 'price'
                          ? 'border-orange-400 bg-orange-50/30 shadow-sm shadow-orange-500/10'
                          : 'border-gray-200 hover:border-gray-300 focus:border-orange-400'
                      }`}
                      min="0"
                      step="100"
                      placeholder="15000"
                    />
                  </div>
                  {validationErrors.price && (
                    <p className="text-xs text-red-600 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
                      </svg>
                      <span>{validationErrors.price}</span>
                    </p>
                  )}
                </div>

                {/* Condition Field */}
                <div className="space-y-3 md:col-span-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                    <span>Overall Condition</span>
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="relative group">
                    <select
                      name="condition"
                      value={formData.condition}
                      onChange={handleInputChange}
                      onFocus={() => setFocusedField('condition')}
                      onBlur={() => setFocusedField(null)}
                      className={`w-full px-4 py-3 border-2 rounded-lg transition-all duration-200 focus:outline-none appearance-none bg-white ${
                        validationErrors.condition 
                          ? 'border-red-300 focus:border-red-500 bg-red-50/50'
                          : focusedField === 'condition'
                          ? 'border-orange-400 bg-orange-50/30 shadow-sm shadow-orange-500/10'
                          : 'border-gray-200 hover:border-gray-300 focus:border-orange-400'
                      }`}
                    >
                      <option value="">Select overall condition</option>
                      <option value="excellent">🌟 Excellent - Like new, minimal signs of use</option>
                      <option value="good">✨ Good - Well maintained, minor cosmetic wear</option>
                      <option value="fair">⚙️ Fair - Some mechanical or cosmetic issues</option>
                      <option value="poor">🔧 Poor - Requires significant repair work</option>
                    </select>
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  {validationErrors.condition && (
                    <p className="text-xs text-red-600 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
                      </svg>
                      <span>{validationErrors.condition}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Vehicle Details Section */}
            <div className="space-y-6 pt-6 border-t border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center text-white text-lg font-bold shadow-sm">
                  🏍️
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Vehicle Details</h2>
                  <p className="text-sm text-gray-600">Technical specifications</p>
                </div>
              </div>
              
              {/* Vehicle Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Make */}
                <div className="space-y-3 md:col-span-1">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                    <span>Make</span>
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="make"
                    value={formData.make}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border-2 rounded-lg transition-all duration-200 focus:outline-none ${
                      validationErrors.make 
                        ? 'border-red-300 focus:border-red-500 bg-red-50/50'
                        : 'border-gray-200 hover:border-gray-300 focus:border-orange-400'
                    }`}
                    placeholder="Honda"
                  />
                  {validationErrors.make && (
                    <p className="text-xs text-red-600">{validationErrors.make}</p>
                  )}
                </div>

                {/* Model */}
                <div className="space-y-3 md:col-span-1">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                    <span>Model</span>
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="model"
                    value={formData.model}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border-2 rounded-lg transition-all duration-200 focus:outline-none ${
                      validationErrors.model 
                        ? 'border-red-300 focus:border-red-500 bg-red-50/50'
                        : 'border-gray-200 hover:border-gray-300 focus:border-orange-400'
                    }`}
                    placeholder="CBR600RR"
                  />
                  {validationErrors.model && (
                    <p className="text-xs text-red-600">{validationErrors.model}</p>
                  )}
                </div>

                {/* Year */}
                <div className="space-y-3 md:col-span-1">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                    <span>Year</span>
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="year"
                    value={formData.year}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border-2 rounded-lg transition-all duration-200 focus:outline-none ${
                      validationErrors.year 
                        ? 'border-red-300 focus:border-red-500 bg-red-50/50'
                        : 'border-gray-200 hover:border-gray-300 focus:border-orange-400'
                    }`}
                    min="1900"
                    max={new Date().getFullYear() + 1}
                    placeholder="2019"
                  />
                  {validationErrors.year && (
                    <p className="text-xs text-red-600">{validationErrors.year}</p>
                  )}
                </div>

                {/* Mileage */}
                <div className="space-y-3 md:col-span-1">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                    <span>Mileage</span>
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      name="mileage"
                      value={formData.mileage}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border-2 rounded-lg transition-all duration-200 focus:outline-none ${
                        validationErrors.mileage 
                          ? 'border-red-300 focus:border-red-500 bg-red-50/50'
                          : 'border-gray-200 hover:border-gray-300 focus:border-orange-400'
                      }`}
                      min="0"
                      placeholder="12,000"
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm font-medium">
                      miles
                    </div>
                  </div>
                  {validationErrors.mileage && (
                    <p className="text-xs text-red-600">{validationErrors.mileage}</p>
                  )}
                </div>
              </div>

              {/* VIN Field */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <span>Vehicle Identification Number (VIN)</span>
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="vin"
                  value={formData.vin}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border-2 rounded-lg font-mono text-sm transition-all duration-200 focus:outline-none ${
                    validationErrors.vin 
                      ? 'border-red-300 focus:border-red-500 bg-red-50/50'
                      : 'border-gray-200 hover:border-gray-300 focus:border-orange-400'
                  }`}
                  maxLength={17}
                  placeholder="1HGBH41JXMN109186"
                />
                {validationErrors.vin && (
                  <p className="text-xs text-red-600">{validationErrors.vin}</p>
                )}
              </div>
            </div>

            {/* Location Section */}
            <div className="space-y-6 pt-6 border-t border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center text-white text-lg font-bold shadow-sm">
                  📍
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Location</h2>
                  <p className="text-sm text-gray-600">Where you&apos;re located</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* City */}
                <div className="space-y-3 md:col-span-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                    <span>City</span>
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border-2 rounded-lg transition-all duration-200 focus:outline-none ${
                      validationErrors.city 
                        ? 'border-red-300 focus:border-red-500 bg-red-50/50'
                        : 'border-gray-200 hover:border-gray-300 focus:border-orange-400'
                    }`}
                    placeholder="San Francisco"
                  />
                  {validationErrors.city && (
                    <p className="text-xs text-red-600">{validationErrors.city}</p>
                  )}
                </div>

                {/* ZIP Code */}
                <div className="space-y-3 md:col-span-1">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                    <span>ZIP Code</span>
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border-2 rounded-lg transition-all duration-200 focus:outline-none ${
                      validationErrors.zipCode 
                        ? 'border-red-300 focus:border-red-500 bg-red-50/50'
                        : 'border-gray-200 hover:border-gray-300 focus:border-orange-400'
                    }`}
                    placeholder="94102"
                  />
                  {validationErrors.zipCode && (
                    <p className="text-xs text-red-600">{validationErrors.zipCode}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Photos Section */}
            <div className="space-y-6 pt-6 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center text-white text-lg font-bold shadow-sm">
                    📷
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Photos</h2>
                    <p className="text-sm text-gray-600">Update your motorcycle images</p>
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  {images.length}/10 photos
                </div>
              </div>
              
              <div className="relative">
                <ImageUpload 
                  onImagesUploaded={setImages}
                  existingImages={images}
                  maxImages={10}
                />
                {validationErrors.images && (
                  <p className="text-xs text-red-600 flex items-center gap-1 mt-2">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
                    </svg>
                    <span>{validationErrors.images}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Message */}
            {message && (
              <div className={`p-4 rounded-lg border ${
                message.includes('error') || message.includes('failed') || message.includes('correct')
                  ? 'bg-red-50 border-red-200 text-red-800' 
                  : 'bg-green-50 border-green-200 text-green-800'
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

            {/* Submit Button */}
            <div className="flex justify-end pt-6 border-t border-gray-100">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-3 px-8 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-sm font-semibold rounded-lg border border-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}