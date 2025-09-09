// app/listings/create/page.tsx - Notion-Inspired Create Listing Page
'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import Layout from '@/components/Layout'
import ImageUpload from '@/components/ImageUpload'

export default function CreateListing() {
  const router = useRouter()
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  
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

  // Enhanced progress tracking
  const [currentStep, setCurrentStep] = useState(1)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  // const [isSaving, setIsSaving] = useState(false)
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  const steps = [
    { id: 1, title: 'Basic Information', description: 'Title, description, and price', icon: '📝' },
    { id: 2, title: 'Vehicle Details', description: 'Make, model, year, and VIN', icon: '🏍️' },
    { id: 3, title: 'Location & Photos', description: 'Where you are and images', icon: '📍' },
    { id: 4, title: 'Review & Publish', description: 'Final review before publishing', icon: '✨' }
  ]

  // Enhanced validation
  const validateStep = (stepId: number) => {
    const errors: Record<string, string> = {}
    
    switch (stepId) {
      case 1:
        if (!formData.title.trim()) errors.title = 'Title is required'
        if (!formData.description.trim()) errors.description = 'Description is required'
        if (!formData.price || parseFloat(formData.price) <= 0) errors.price = 'Valid price is required'
        if (!formData.condition) errors.condition = 'Condition is required'
        break
      case 2:
        if (!formData.make.trim()) errors.make = 'Make is required'
        if (!formData.model.trim()) errors.model = 'Model is required'
        if (!formData.year || parseInt(formData.year) < 1900) errors.year = 'Valid year is required'
        if (!formData.mileage || parseInt(formData.mileage) < 0) errors.mileage = 'Valid mileage is required'
        if (!formData.vin || formData.vin.length !== 17) errors.vin = 'Valid 17-character VIN is required'
        break
      case 3:
        if (!formData.city.trim()) errors.city = 'City is required'
        if (!formData.zipCode.trim()) errors.zipCode = 'ZIP code is required'
        if (images.length === 0) errors.images = 'At least one photo is required'
        break
    }
    
    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Progress calculation
  const calculateProgress = () => {
    const totalFields = 11 // Total required fields
    const filledFields = [
      formData.title, formData.description, formData.price, formData.condition,
      formData.make, formData.model, formData.year, formData.mileage, formData.vin,
      formData.city, formData.zipCode
    ].filter(field => field && field.toString().trim()).length + (images.length > 0 ? 1 : 0)
    
    return Math.round((filledFields / totalFields) * 100)
  }

  useEffect(() => {
    getUser()
  }, [])

  const getUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/auth/login')
      return
    }

    setUser(user)
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
        
        if (result.success && result.data?.vehicleInfo) {
          const vehicleInfo = result.data.vehicleInfo
          setFormData(prev => ({
            ...prev,
            make: vehicleInfo.make !== 'Unknown' ? vehicleInfo.make || prev.make : prev.make,
            model: vehicleInfo.model !== 'Unknown' ? vehicleInfo.model || prev.model : prev.model,
            year: vehicleInfo.year !== 'Unknown' ? vehicleInfo.year || prev.year : prev.year,
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

    try {
      if (!user) {
        throw new Error('User not authenticated')
      }

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

      const { data, error } = await supabase
        .from('listings')
        .insert(listingData)
        .select()
        .single()

      if (error) {
        throw error
      }

      if (!data) {
        throw new Error('No data returned from listing creation')
      }

      router.push(`/listings/${data.id}`)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to create listing')
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return <div className="text-center py-8">Loading...</div>
  }


  // Main create listing form with consistent design
  return (
    <Layout showNavigation={true}>
      {/* Compact Hero Section */}
      <section className="bg-white border-b border-gray-200 page-section">
        <div className="max-w-4xl mx-auto px-6 text-center" style={{paddingTop: 'var(--space-xl)', paddingBottom: 'var(--space-lg)'}}>
          <h1 className="text-headline">
            Create New Listing
          </h1>
          <p className="text-body max-w-2xl mx-auto element-group">
            Sell your motorcycle safely with verified buyers and secure transactions
          </p>
          
          {/* New Design System Indicator */}
          <div className="flex items-center justify-center gap-3 mt-4 mb-2">
            <div className="flex items-center gap-2 px-3 py-1 bg-gray-50 rounded-full text-xs text-gray-600">
              <div className="w-2 h-2 bg-black rounded-full"></div>
              <span>Design System v3.0</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-orange-50 rounded-full text-xs text-orange-600">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <span>Orange Palette</span>
            </div>
          </div>
          
          {/* Simple Progress */}
          <div className="flex items-center justify-center element-group" style={{gap: 'var(--space-sm)'}}>
            <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-600 rounded-full transition-all duration-500"
                style={{ width: `${calculateProgress()}%` }}
              />
            </div>
            <span className="text-sm text-gray-600">{calculateProgress()}% complete</span>
          </div>
        </div>
      </section>

      {/* Clean Main Content */}
      <div className="max-w-4xl mx-auto px-6 page-section">
        
        {/* Horizontal Progress Steps */}
        <div className="bg-white rounded-lg border border-gray-200 mb-8" style={{padding: 'var(--space-xl)'}}>
          <div className="horizontal-progress">
            {/* Progress Line Background */}
            <div className="progress-line-bg"></div>
            
            {/* Progress Line Active - calculated width based on progress */}
            <div 
              className="progress-line-active"
              style={{
                width: `${Math.max(0, (completedSteps.length + (currentStep > Math.max(...completedSteps, 0) ? 0.5 : 0)) / steps.length * 80)}%`
              }}
            ></div>
            
            {steps.map((step, index) => {
              const isActive = currentStep === step.id
              const isCompleted = completedSteps.includes(step.id)
              const isAccessible = step.id <= currentStep || completedSteps.includes(step.id)
              
              return (
                <div key={step.id} className="flex flex-col items-center relative flex-1">
                  {/* Step Circle */}
                  <div
                    onClick={() => isAccessible && setCurrentStep(step.id)}
                    className={`step-circle ${
                      isActive
                        ? 'active'
                        : isCompleted
                        ? 'completed'
                        : isAccessible
                        ? 'inactive'
                        : 'inaccessible'
                    }`}
                  >
                    {isCompleted ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <span>{step.id}</span>
                    )}
                  </div>
                  
                  {/* Step Info */}
                  <div className="step-info">
                    <h4 className={`step-title ${
                      isActive || isCompleted ? 'active' : 'inactive'
                    }`}>
                      {step.title}
                    </h4>
                    <p className="step-description hidden sm:block">
                      {step.description}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
        
        {/* Main Form Content */}
        <div className="w-full">

            {/* Clean Notion-Style Form */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <form ref={formRef} onSubmit={handleSubmit} className="divide-y divide-gray-100">
                
                {/* Step 1: Basic Information */}
                {currentStep === 1 && (
                  <div style={{padding: 'var(--space-2xl)'}}>
                    <div className="form-section-header element-group">
                      <h2 className="text-title">Basic Information</h2>
                      <p className="text-body">Tell us about your motorcycle</p>
                    </div>
                    
                    <div style={{display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)'}}>
                      {/* Title Field */}
                      <div className="form-field">
                        <label className="text-label">
                          Motorcycle Title *
                        </label>
                        <input
                          type="text"
                          name="title"
                          value={formData.title}
                          onChange={handleInputChange}
                          className={`form-input field-title ${
                            validationErrors.title ? 'error' : ''
                          }`}
                          placeholder="e.g., 2019 Honda CBR600RR Sport Bike"
                        />
                        {validationErrors.title && (
                          <p className="text-error">{validationErrors.title}</p>
                        )}
                        <p className="text-caption">Include year, make, model, and key selling points</p>
                      </div>

                      {/* Description Field */}
                      <div className="form-field">
                        <label className="text-label">
                          Description *
                        </label>
                        <textarea
                          name="description"
                          value={formData.description}
                          onChange={handleInputChange}
                          className={`form-textarea field-description ${
                            validationErrors.description ? 'error' : ''
                          }`}
                          placeholder="Describe the condition, maintenance history, and any important details..."
                        />
                        {validationErrors.description && (
                          <p className="text-error">{validationErrors.description}</p>
                        )}
                        <p className="text-caption">Be detailed and honest - buyers appreciate transparency</p>
                      </div>

                      {/* Price and Condition Row */}
                      <div className="form-grid-2">
                        {/* Price Field */}
                        <div className="form-field">
                          <label className="text-label">
                            Price (USD) *
                          </label>
                          <div className="relative">
                            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">$</div>
                            <input
                              type="number"
                              name="price"
                              value={formData.price}
                              onChange={handleInputChange}
                              className={`form-input field-price pl-8 ${
                                validationErrors.price ? 'error' : ''
                              }`}
                              min="0"
                              step="100"
                              placeholder="15000"
                            />
                          </div>
                          {validationErrors.price && (
                            <p className="text-error">{validationErrors.price}</p>
                          )}
                        </div>

                        {/* Condition Field */}
                        <div className="form-field">
                          <label className="text-label">
                            Condition *
                          </label>
                          <select
                            name="condition"
                            value={formData.condition}
                            onChange={handleInputChange}
                            className={`form-select field-condition ${
                              validationErrors.condition ? 'error' : ''
                            }`}
                          >
                            <option value="">Select condition</option>
                            <option value="excellent">Excellent</option>
                            <option value="good">Good</option>
                            <option value="fair">Fair</option>
                            <option value="poor">Poor</option>
                          </select>
                          {validationErrors.condition && (
                            <p className="text-error">{validationErrors.condition}</p>
                          )}
                        </div>
                      </div>
                      
                      {/* Helper text */}
                      <div className="text-caption space-y-1">
                        <p>• Research similar motorcycles for competitive pricing</p>
                        <p>• Honest condition assessment builds buyer trust</p>
                      </div>
                    </div>
                    
                    {/* Step Navigation */}
                    <div className="flex justify-end pt-6 border-t border-gray-100">
                      <button
                        type="button"
                        onClick={() => {
                          if (validateStep(1)) {
                            setCompletedSteps(prev => [...prev.filter(s => s !== 1), 1])
                            setCurrentStep(2)
                          }
                        }}
                        className="btn btn-black btn-lg"
                      >
                        <span>Continue</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 2: Vehicle Details */}
                {currentStep === 2 && (
                  <div className="form-section">
                    <div className="section-header">
                      <h3 className="section-title">Vehicle Details</h3>
                      <p className="body-text">Technical specifications and identification</p>
                    </div>
                    
                    <div className="space-y-6">
                      {/* Vehicle Info Grid */}
                      <div className="form-grid grid-cols-3">
                        {/* Make */}
                        <div className="form-field">
                          <label className="form-label">Make <span className="text-error">*</span></label>
                          <select
                            name="make"
                            value={formData.make}
                            onChange={handleInputChange}
                            className={`input ${validationErrors.make ? 'border-error' : ''}`}
                            style={{ appearance: 'none', backgroundImage: 'url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iOCIgdmlld0JveD0iMCAwIDEyIDgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0xIDFMNiA2TDExIDEiIHN0cm9rZT0iIzczNzM3MyIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPC9zdmc+")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
                          >
                            <option value="">Select make</option>
                            <option value="Honda">Honda</option>
                            <option value="Yamaha">Yamaha</option>
                            <option value="Kawasaki">Kawasaki</option>
                            <option value="Suzuki">Suzuki</option>
                            <option value="Ducati">Ducati</option>
                            <option value="BMW">BMW</option>
                            <option value="Triumph">Triumph</option>
                            <option value="Harley-Davidson">Harley-Davidson</option>
                            <option value="KTM">KTM</option>
                            <option value="Other">Other</option>
                          </select>
                          {validationErrors.make && (
                            <p className="form-error">{validationErrors.make}</p>
                          )}
                        </div>

                        {/* Model */}
                        <div className="form-field">
                          <label className="form-label">Model <span className="text-error">*</span></label>
                          <input
                            type="text"
                            name="model"
                            value={formData.model}
                            onChange={handleInputChange}
                            className={`input ${validationErrors.model ? 'border-error' : ''}`}
                            placeholder="CB650R"
                          />
                          {validationErrors.model && (
                            <p className="form-error">{validationErrors.model}</p>
                          )}
                        </div>

                        {/* Year */}
                        <div className="form-field">
                          <label className="form-label">Year <span className="text-error">*</span></label>
                          <input
                            type="number"
                            name="year"
                            value={formData.year}
                            onChange={handleInputChange}
                            className={`input ${validationErrors.year ? 'border-error' : ''}`}
                            min="1900"
                            max={new Date().getFullYear() + 1}
                            placeholder="2019"
                          />
                          {validationErrors.year && (
                            <p className="form-error">{validationErrors.year}</p>
                          )}
                        </div>

                        {/* Mileage */}
                        <div className="form-field">
                          <label className="form-label">Mileage <span className="text-error">*</span></label>
                          <input
                            type="number"
                            name="mileage"
                            value={formData.mileage}
                            onChange={handleInputChange}
                            className={`input ${validationErrors.mileage ? 'border-error' : ''}`}
                            min="0"
                            placeholder="12000"
                          />
                          {validationErrors.mileage && (
                            <p className="form-error">{validationErrors.mileage}</p>
                          )}
                          <p className="form-help">Miles on the odometer</p>
                        </div>
                      </div>

                      {/* VIN Section */}
                      <div className="form-field">
                        <label className="form-label">VIN <span className="text-error">*</span></label>
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
                          className={`input ${validationErrors.vin ? 'border-error' : ''}`}
                          maxLength={17}
                          placeholder="1HGBH41JXMN109186"
                        />
                        {validationErrors.vin && (
                          <p className="form-error">{validationErrors.vin}</p>
                        )}
                        <p className="form-help">17-character vehicle identification number</p>

                        {/* VIN Verification Status */}
                        {vinVerification.loading && (
                          <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                            <span className="text-sm text-blue-800 font-medium">Verifying VIN...</span>
                          </div>
                        )}
                        
                        {vinVerification.result?.success && vinVerification.result.data?.isValid && (
                          <div className="flex items-center gap-2 p-3 bg-green-50 border border-orange-200 rounded-lg">
                            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-sm text-orange-800 font-medium">VIN verified successfully</span>
                          </div>
                        )}

                        {vinVerification.error && (
                          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
                            </svg>
                            <span className="text-sm text-red-800">{vinVerification.error}</span>
                          </div>
                        )}
                      </div>

                    </div>
                    
                    {/* Form Actions */}
                    <div className="form-actions">
                      <button
                        type="button"
                        onClick={() => setCurrentStep(1)}
                        className="btn btn-secondary btn-md"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (validateStep(2)) {
                            setCompletedSteps(prev => [...prev.filter(s => s !== 2), 2])
                            setCurrentStep(3)
                          }
                        }}
                        className="btn btn-black btn-md"
                      >
                        Continue
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 3: Location & Photos */}
                {currentStep === 3 && (
                  <div className="space-y-8">
                    {/* Location Section */}
                    <div className="form-section">
                      <div className="section-header">
                        <h3 className="section-title">Location</h3>
                        <p className="body-text">Where is your motorcycle located?</p>
                      </div>
                    
                      <div className="form-grid">
                        <div className="form-field">
                          <label className="form-label">City <span className="text-error">*</span></label>
                          <input
                            type="text"
                            name="city"
                            value={formData.city}
                            onChange={handleInputChange}
                            className={`input ${validationErrors.city ? 'border-error' : ''}`}
                            placeholder="Los Angeles"
                          />
                          {validationErrors.city && (
                            <p className="form-error">{validationErrors.city}</p>
                          )}
                        </div>

                        <div className="form-field">
                          <label className="form-label">Zip Code <span className="text-error">*</span></label>
                          <input
                            type="text"
                            name="zipCode"
                            value={formData.zipCode}
                            onChange={handleInputChange}
                            className={`input ${validationErrors.zipCode ? 'border-error' : ''}`}
                            placeholder="90210"
                            maxLength={5}
                          />
                          {validationErrors.zipCode && (
                            <p className="form-error">{validationErrors.zipCode}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Photos Section */}
                    <div className="form-section">
                      <div className="section-header">
                        <h3 className="section-title">Photos</h3>
                        <p className="body-text">Add high-quality photos of your motorcycle</p>
                      </div>

                      <div className="image-upload-section">
                        <ImageUpload 
                          onImagesUploaded={setImages}
                          existingImages={images}
                          maxImages={8}
                        />
                        
                        <p className="form-help">
                          Add at least 3-5 photos showing different angles. High-quality photos get more interest!
                        </p>
                      </div>
                    </div>

                    {/* Form Actions */}
                    <div className="form-actions">
                      <button
                        type="button"
                        onClick={() => setCurrentStep(2)}
                        className="btn btn-secondary btn-md"
                      >
                        Back
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => {
                          if (validateStep(3)) {
                            setCompletedSteps(prev => [...prev.filter(s => s !== 3), 3])
                            setCurrentStep(4)
                          }
                        }}
                        className="btn btn-black btn-md"
                      >
                        Continue to Review
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 4: Review & Publish */}
                {currentStep === 4 && (
                  <div className="form-section">
                    <div className="section-header">
                      <h3 className="section-title">Review & Publish</h3>
                      <p className="body-text">Final review before your listing goes live</p>
                    </div>
                    
                    {/* Listing Preview */}
                    <div className="space-y-6">
                      {/* Preview Card */}
                      <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Listing Preview</h3>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {/* Left Column - Image Preview */}
                          <div>
                            {images.length > 0 ? (
                              <div className="aspect-video rounded-xl overflow-hidden bg-gray-100 border border-gray-200 relative">
                                <Image 
                                  src={images[0]} 
                                  alt="Preview" 
                                  fill
                                  className="object-cover"
                                  sizes="(max-width: 768px) 100vw, 50vw"
                                />
                                {images.length > 1 && (
                                  <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/70 text-white text-xs rounded">
                                    +{images.length - 1} more
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="aspect-video rounded-xl bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center">
                                <div className="text-center">
                                  <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  <p className="text-gray-500 text-sm">No photos uploaded</p>
                                </div>
                              </div>
                            )}
                          </div>
                          
                          {/* Right Column - Details */}
                          <div className="space-y-4">
                            <div>
                              <h4 className="text-xl font-bold text-gray-900 mb-2">
                                {formData.title || 'Listing Title'}
                              </h4>
                              <div className="flex items-center gap-2 mb-3">
                                <span className="text-2xl font-bold text-emerald-600">
                                  ${formData.price ? parseFloat(formData.price).toLocaleString() : '0'}
                                </span>
                                <div className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 border border-gray-200 rounded-lg text-xs font-medium text-gray-700">
                                  <span>{formData.condition || 'Condition'}</span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                              <div className="space-y-1">
                                <span className="text-gray-500 text-xs font-medium">Make & Model</span>
                                <p className="font-medium text-gray-900">
                                  {formData.make || 'Make'} {formData.model || 'Model'}
                                </p>
                              </div>
                              <div className="space-y-1">
                                <span className="text-gray-500 text-xs font-medium">Year</span>
                                <p className="font-medium text-gray-900">{formData.year || 'Year'}</p>
                              </div>
                              <div className="space-y-1">
                                <span className="text-gray-500 text-xs font-medium">Mileage</span>
                                <p className="font-medium text-gray-900">
                                  {formData.mileage ? parseInt(formData.mileage).toLocaleString() : '0'} miles
                                </p>
                              </div>
                              <div className="space-y-1">
                                <span className="text-gray-500 text-xs font-medium">Location</span>
                                <p className="font-medium text-gray-900">
                                  {formData.city || 'City'}, {formData.zipCode || 'ZIP'}
                                </p>
                              </div>
                            </div>
                            
                            {formData.description && (
                              <div className="space-y-1">
                                <span className="text-gray-500 text-xs font-medium">Description</span>
                                <p className="text-gray-900 text-sm leading-relaxed line-clamp-3">
                                  {formData.description}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Verification Status */}
                      {vinVerification.result?.success && (
                        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-emerald-100 border border-emerald-200 rounded-lg flex items-center justify-center">
                              <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                              </svg>
                            </div>
                            <div>
                              <h4 className="text-sm font-semibold text-emerald-900">VIN Verified & Theft Check Complete</h4>
                              <p className="text-xs text-emerald-700 mt-0.5">
                                Your listing will be marked as verified and get priority placement
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Final Message */}
                    {message && (
                      <div className={`p-4 rounded-xl border animate-in slide-in-from-top-2 duration-300 ${
                        message.includes('error') || message.includes('failed')
                          ? 'bg-red-50 border-red-200 text-red-800' 
                          : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      }`}>
                        <div className="flex items-center gap-2">
                          {message.includes('error') || message.includes('failed') ? (
                            <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                          <span className="text-sm font-medium">{message}</span>
                        </div>
                      </div>
                    )}
                    
                    {/* Form Actions */}
                    <div className="form-actions">
                      <button
                        type="button"
                        onClick={() => setCurrentStep(3)}
                        className="btn btn-secondary btn-md"
                      >
                        Back
                      </button>
                      
                      <button
                        type="submit"
                        disabled={loading}
                        className={`btn btn-success btn-lg ${loading ? 'opacity-50 cursor-not-allowed transform-none shadow-none' : ''}`}
                      >
                        {loading ? 'Publishing Listing...' : 'Publish Listing'}
                      </button>
                    </div>
                  </div>
                )}
              </form>
          </div>
        </div>
      </div>
    </Layout>
  )
}