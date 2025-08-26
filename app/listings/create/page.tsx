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
      {/* Navigation breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-3">
          <div className="flex items-center gap-2 text-sm">
            <Link href="/listings" className="text-gray-500 hover:text-gray-700 transition-colors">
              Browse listings
            </Link>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-gray-900 font-medium">Create listing</span>
          </div>
        </div>
      </div>
      
      {/* Clean Hero Section */}
      <section className="bg-white border-b border-gray-200 page-section">
        <div className="max-w-4xl mx-auto px-6 text-center" style={{paddingTop: 'var(--space-4xl)', paddingBottom: 'var(--space-4xl)'}}>
          <h1 className="text-headline">
            Create New Listing
          </h1>
          <p className="text-body max-w-2xl mx-auto element-group">
            Sell your motorcycle safely with verified buyers and secure transactions
          </p>
          
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
        <div className="grid grid-cols-1 lg:grid-cols-12" style={{gap: 'var(--space-2xl)'}}>
          
          {/* Clean Sidebar - Step Navigation */}
          <div className="lg:col-span-3">
            <div className="sticky w-full" style={{top: 'var(--space-xl)'}}>
              
              {/* Simple Steps Navigation */}
              <div className="bg-white rounded-lg border border-gray-200" style={{padding: 'var(--space-xl)'}}>
                <h3 className="text-sm font-semibold text-gray-900 small-gap">Steps</h3>
                <div style={{display: 'flex', flexDirection: 'column', gap: 'var(--space-md)'}}>
                  {steps.map((step) => {
                    const isActive = currentStep === step.id
                    const isCompleted = completedSteps.includes(step.id)
                    const isAccessible = step.id <= currentStep || completedSteps.includes(step.id)
                    
                    return (
                      <div
                        key={step.id}
                        onClick={() => isAccessible && setCurrentStep(step.id)}
                        style={{gap: 'var(--space-md)', padding: 'var(--space-md)'}}
                        className={`flex items-center rounded-md transition-colors cursor-pointer ${
                          isActive 
                            ? 'bg-blue-50 border border-blue-200' 
                            : isCompleted
                            ? 'bg-gray-50 hover:bg-gray-100'
                            : isAccessible
                            ? 'hover:bg-gray-50'
                            : 'opacity-50 cursor-not-allowed'
                        }`}
                      >
                        <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                          isActive
                            ? 'bg-blue-600 text-white'
                            : isCompleted
                            ? 'bg-gray-600 text-white'
                            : 'bg-gray-200 text-gray-600'
                        }`}>
                          {isCompleted ? (
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <span>{step.id}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-gray-900">
                            {step.title}
                          </h4>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {step.description}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
          
          {/* Main Form Content */}
          <div className="lg:col-span-9">

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
                        className="btn btn-primary btn-lg"
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
                  <div className="p-8 space-y-6">
                    <div className="mb-8">
                      <h2 className="text-2xl font-semibold text-gray-900 mb-2">Vehicle Details</h2>
                      <p className="text-gray-600">Technical specifications and identification</p>
                    </div>
                    
                    <div className="space-y-6">
                      {/* Vehicle Info Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {/* Make */}
                        <div className="space-y-3 md:col-span-1">
                          <label className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                            <span>Make</span>
                            <span className="text-red-500">*</span>
                          </label>
                          <div className="relative group">
                            <input
                              type="text"
                              name="make"
                              value={formData.make}
                              onChange={handleInputChange}
                              onFocus={() => setFocusedField('make')}
                              onBlur={() => setFocusedField(null)}
                              className={`w-full px-4 py-3 border-2 rounded-lg transition-all duration-200 focus:outline-none ${
                                validationErrors.make 
                                  ? 'border-red-300 focus:border-red-500 bg-red-50/50'
                                  : focusedField === 'make'
                                  ? 'border-orange-400 bg-orange-50/30 shadow-sm shadow-orange-500/10'
                                  : 'border-gray-200 hover:border-gray-300 focus:border-orange-400'
                              }`}
                              placeholder="Honda"
                            />
                          </div>
                          {validationErrors.make && (
                            <p className="text-xs text-red-600 flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
                              </svg>
                              <span>{validationErrors.make}</span>
                            </p>
                          )}
                        </div>

                        {/* Model */}
                        <div className="space-y-3 md:col-span-1">
                          <label className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                            <span>Model</span>
                            <span className="text-red-500">*</span>
                          </label>
                          <div className="relative group">
                            <input
                              type="text"
                              name="model"
                              value={formData.model}
                              onChange={handleInputChange}
                              onFocus={() => setFocusedField('model')}
                              onBlur={() => setFocusedField(null)}
                              className={`w-full px-4 py-3 border-2 rounded-lg transition-all duration-200 focus:outline-none ${
                                validationErrors.model 
                                  ? 'border-red-300 focus:border-red-500 bg-red-50/50'
                                  : focusedField === 'model'
                                  ? 'border-orange-400 bg-orange-50/30 shadow-sm shadow-orange-500/10'
                                  : 'border-gray-200 hover:border-gray-300 focus:border-orange-400'
                              }`}
                              placeholder="CBR600RR"
                            />
                          </div>
                          {validationErrors.model && (
                            <p className="text-xs text-red-600 flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
                              </svg>
                              <span>{validationErrors.model}</span>
                            </p>
                          )}
                        </div>

                        {/* Year */}
                        <div className="space-y-3 md:col-span-1">
                          <label className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                            <span>Year</span>
                            <span className="text-red-500">*</span>
                          </label>
                          <div className="relative group">
                            <input
                              type="number"
                              name="year"
                              value={formData.year}
                              onChange={handleInputChange}
                              onFocus={() => setFocusedField('year')}
                              onBlur={() => setFocusedField(null)}
                              className={`w-full px-4 py-3 border-2 rounded-lg transition-all duration-200 focus:outline-none ${
                                validationErrors.year 
                                  ? 'border-red-300 focus:border-red-500 bg-red-50/50'
                                  : focusedField === 'year'
                                  ? 'border-orange-400 bg-orange-50/30 shadow-sm shadow-orange-500/10'
                                  : 'border-gray-200 hover:border-gray-300 focus:border-orange-400'
                              }`}
                              min="1900"
                              max={new Date().getFullYear() + 1}
                              placeholder="2019"
                            />
                          </div>
                          {validationErrors.year && (
                            <p className="text-xs text-red-600 flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
                              </svg>
                              <span>{validationErrors.year}</span>
                            </p>
                          )}
                        </div>

                        {/* Mileage */}
                        <div className="space-y-3 md:col-span-1">
                          <label className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                            <span>Mileage</span>
                            <span className="text-red-500">*</span>
                          </label>
                          <div className="relative group">
                            <input
                              type="number"
                              name="mileage"
                              value={formData.mileage}
                              onChange={handleInputChange}
                              onFocus={() => setFocusedField('mileage')}
                              onBlur={() => setFocusedField(null)}
                              className={`w-full px-4 py-3 border-2 rounded-lg transition-all duration-200 focus:outline-none ${
                                validationErrors.mileage 
                                  ? 'border-red-300 focus:border-red-500 bg-red-50/50'
                                  : focusedField === 'mileage'
                                  ? 'border-orange-400 bg-orange-50/30 shadow-sm shadow-orange-500/10'
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
                            <p className="text-xs text-red-600 flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
                              </svg>
                              <span>{validationErrors.mileage}</span>
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Enhanced VIN Section */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <label className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                            <span>Vehicle Identification Number (VIN)</span>
                            <span className="text-red-500">*</span>
                          </label>
                          <div className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 border border-blue-200 rounded-lg text-xs font-medium text-blue-700">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                            <span>Auto-Verified</span>
                          </div>
                        </div>
                        
                        <div className="relative group">
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
                            onFocus={() => setFocusedField('vin')}
                            onBlur={() => setFocusedField(null)}
                            className={`w-full px-4 py-3 border-2 rounded-xl font-mono text-sm transition-all duration-200 focus:outline-none ${
                              formData.vin.length === 17
                                ? vinVerification.result?.success && vinVerification.result.data?.isValid
                                  ? 'border-emerald-300 focus:border-emerald-500 bg-emerald-50/50'
                                  : vinVerification.result && (!vinVerification.result.success || vinVerification.result.data?.isValid === false)
                                  ? 'border-red-300 focus:border-red-500 bg-red-50/50'
                                  : 'border-gray-200 hover:border-gray-300 focus:border-indigo-500'
                                : validationErrors.vin
                                ? 'border-red-300 focus:border-red-500 bg-red-50/50'
                                : focusedField === 'vin'
                                ? 'border-indigo-500 bg-indigo-50/50 shadow-lg shadow-indigo-500/10'
                                : 'border-gray-200 hover:border-gray-300 focus:border-indigo-500'
                            }`}
                            maxLength={17}
                            placeholder="1HGBH41JXMN109186"
                          />
                          
                          {/* VIN Status Indicator */}
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            {vinVerification.loading ? (
                              <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                            ) : formData.vin.length === 17 && vinVerification.result?.success && vinVerification.result.data?.isValid ? (
                              <div className="w-6 h-6 bg-emerald-100 border border-emerald-200 rounded-full flex items-center justify-center">
                                <svg className="w-3 h-3 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                            ) : formData.vin.length === 17 && vinVerification.result && (!vinVerification.result.success || vinVerification.result.data?.isValid === false) ? (
                              <div className="w-6 h-6 bg-red-100 border border-red-200 rounded-full flex items-center justify-center">
                                <svg className="w-3 h-3 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </div>
                            ) : focusedField === 'vin' ? (
                              <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                            ) : null}
                          </div>
                        </div>
                        
                        {/* VIN Feedback */}
                        <div className="space-y-2">
                          {vinVerification.loading && (
                            <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                              <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                              <span className="text-sm text-blue-800 font-medium">Verifying VIN and checking theft records...</span>
                            </div>
                          )}
                          
                          {vinVerification.result && (
                            <div className={`p-4 rounded-xl border ${
                              vinVerification.result?.success && vinVerification.result.data?.isValid
                                ? 'bg-emerald-50 border-emerald-200'
                                : 'bg-red-50 border-red-200'
                            }`}>
                              {vinVerification.result?.success && vinVerification.result.data?.isValid ? (
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 bg-emerald-100 border border-emerald-200 rounded-full flex items-center justify-center">
                                      <svg className="w-3 h-3 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                      </svg>
                                    </div>
                                    <span className="text-sm font-semibold text-emerald-800">VIN Verified Successfully</span>
                                  </div>
                                  <div className="grid grid-cols-2 gap-4 text-xs text-emerald-700">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium">Theft Status:</span>
                                      <span className={vinVerification.result.data?.isStolen ? 'text-red-600 font-bold' : 'text-emerald-600 font-semibold'}>
                                        {vinVerification.result.data?.isStolen ? '⚠️ STOLEN VEHICLE' : '✅ Clean'}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium">Total Loss:</span>
                                      <span className={vinVerification.result.data?.isTotalLoss ? 'text-red-600 font-bold' : 'text-emerald-600 font-semibold'}>
                                        {vinVerification.result.data?.isTotalLoss ? '⚠️ Yes' : '✅ No'}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <div className="w-5 h-5 bg-red-100 border border-red-200 rounded-full flex items-center justify-center">
                                    <svg className="w-3 h-3 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
                                    </svg>
                                  </div>
                                  <span className="text-sm font-semibold text-red-800">Please verify VIN number</span>
                                </div>
                              )}
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
                          
                          {validationErrors.vin && (
                            <p className="text-xs text-red-600 flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
                              </svg>
                              <span>{validationErrors.vin}</span>
                            </p>
                          )}
                        </div>
                        
                        <p className="text-xs text-gray-500">17-character code usually found on the frame or registration documents</p>
                      </div>
                    </div>
                    
                    {/* Step Navigation */}
                    <div className="flex justify-between pt-6 border-t border-gray-100">
                      <button
                        type="button"
                        onClick={() => setCurrentStep(1)}
                        className="btn btn-secondary btn-md"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        <span>Back</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (validateStep(2)) {
                            setCompletedSteps(prev => [...prev.filter(s => s !== 2), 2])
                            setCurrentStep(3)
                          }
                        }}
                        className="btn btn-primary btn-lg"
                      >
                        <span>Continue</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 3: Location & Photos */}
                {currentStep === 3 && (
                  <div className="p-8 space-y-6">
                    <div className="mb-8">
                      <h2 className="text-2xl font-semibold text-gray-900 mb-2">Location & Photos</h2>
                      <p className="text-gray-600">Where you&apos;re located and showcase your motorcycle</p>
                    </div>
                    
                    <div className="space-y-6">
                      {/* Location Section */}
                      <div className="space-y-6">
                        <div className="flex items-center gap-3 mb-4">
                          <h3 className="text-lg font-semibold text-gray-900">Location</h3>
                          <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-gray-100 border border-gray-200 rounded-lg text-xs font-medium text-gray-700">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            <span>Private</span>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          {/* City */}
                          <div className="space-y-3 md:col-span-2">
                            <label className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                              <span>City</span>
                              <span className="text-red-500">*</span>
                            </label>
                            <div className="relative group">
                              <input
                                type="text"
                                name="city"
                                value={formData.city}
                                onChange={handleInputChange}
                                onFocus={() => setFocusedField('city')}
                                onBlur={() => setFocusedField(null)}
                                className={`w-full px-4 py-3 border-2 rounded-lg transition-all duration-200 focus:outline-none ${
                                  validationErrors.city 
                                    ? 'border-red-300 focus:border-red-500 bg-red-50/50'
                                    : focusedField === 'city'
                                    ? 'border-orange-400 bg-orange-50/30 shadow-sm shadow-orange-500/10'
                                    : 'border-gray-200 hover:border-gray-300 focus:border-orange-400'
                                }`}
                                placeholder="San Francisco"
                              />
                            </div>
                            {validationErrors.city && (
                              <p className="text-xs text-red-600 flex items-center gap-1">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
                                </svg>
                                <span>{validationErrors.city}</span>
                              </p>
                            )}
                            <p className="text-xs text-gray-500">Your general location for buyers</p>
                          </div>

                          {/* ZIP Code */}
                          <div className="space-y-3 md:col-span-1">
                            <label className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                              <span>ZIP Code</span>
                              <span className="text-red-500">*</span>
                            </label>
                            <div className="relative group">
                              <input
                                type="text"
                                name="zipCode"
                                value={formData.zipCode}
                                onChange={handleInputChange}
                                onFocus={() => setFocusedField('zipCode')}
                                onBlur={() => setFocusedField(null)}
                                className={`w-full px-4 py-3 border-2 rounded-lg transition-all duration-200 focus:outline-none ${
                                  validationErrors.zipCode 
                                    ? 'border-red-300 focus:border-red-500 bg-red-50/50'
                                    : focusedField === 'zipCode'
                                    ? 'border-orange-400 bg-orange-50/30 shadow-sm shadow-orange-500/10'
                                    : 'border-gray-200 hover:border-gray-300 focus:border-orange-400'
                                }`}
                                placeholder="94102"
                              />
                            </div>
                            {validationErrors.zipCode && (
                              <p className="text-xs text-red-600 flex items-center gap-1">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
                                </svg>
                                <span>{validationErrors.zipCode}</span>
                              </p>
                            )}
                            <p className="text-xs text-gray-500">For local search and shipping</p>
                          </div>
                        </div>
                      </div>

                      {/* Photos Section */}
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <h3 className="text-lg font-semibold text-gray-900">Photos</h3>
                            <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-indigo-50 border border-indigo-200 rounded-lg text-xs font-medium text-indigo-700">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <span>Required</span>
                            </div>
                          </div>
                          <div className="text-sm text-gray-600">
                            {images.length}/10 photos
                          </div>
                        </div>
                        
                        {/* Enhanced Image Upload */}
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
                        
                        {/* Photo Tips */}
                        <div className="p-4 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border border-blue-200 rounded-xl">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 bg-blue-100 border border-blue-200 rounded-lg flex items-center justify-center flex-shrink-0">
                              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <div>
                              <h4 className="text-sm font-semibold text-blue-900 mb-2">Photo Tips for Better Results</h4>
                              <ul className="space-y-1 text-xs text-blue-800">
                                <li className="flex items-start gap-2">
                                  <div className="w-1 h-1 bg-blue-500 rounded-full mt-1.5 flex-shrink-0" />
                                  <span>Take photos in good lighting, preferably outdoors</span>
                                </li>
                                <li className="flex items-start gap-2">
                                  <div className="w-1 h-1 bg-blue-500 rounded-full mt-1.5 flex-shrink-0" />
                                  <span>Show multiple angles: front, back, sides, and close-ups</span>
                                </li>
                                <li className="flex items-start gap-2">
                                  <div className="w-1 h-1 bg-blue-500 rounded-full mt-1.5 flex-shrink-0" />
                                  <span>Include interior shots and any damage or wear</span>
                                </li>
                                <li className="flex items-start gap-2">
                                  <div className="w-1 h-1 bg-blue-500 rounded-full mt-1.5 flex-shrink-0" />
                                  <span>Clean your motorcycle before photographing</span>
                                </li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Step Navigation */}
                    <div className="flex justify-between pt-6 border-t border-gray-100">
                      <button
                        type="button"
                        onClick={() => setCurrentStep(2)}
                        className="btn btn-secondary btn-md"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        <span>Back</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (validateStep(3)) {
                            setCompletedSteps(prev => [...prev.filter(s => s !== 3), 3])
                            setCurrentStep(4)
                          }
                        }}
                        className="btn btn-primary btn-lg"
                      >
                        <span>Review & Publish</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 4: Review & Publish */}
                {currentStep === 4 && (
                  <div className="p-8 space-y-6">
                    <div className="mb-8">
                      <h2 className="text-2xl font-semibold text-gray-900 mb-2">Review & Publish</h2>
                      <p className="text-gray-600">Final review before your listing goes live</p>
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
                    
                    {/* Final Publish Button */}
                    <div className="flex justify-between pt-6 border-t border-gray-100">
                      <button
                        type="button"
                        onClick={() => setCurrentStep(3)}
                        className="btn btn-secondary btn-md"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        <span>Back</span>
                      </button>
                      
                      <button
                        type="submit"
                        disabled={loading}
                        className={`btn btn-success btn-xl ${loading ? 'btn-loading' : ''}`}
                      >
                        {loading ? (
                          <span>Publishing...</span>
                        ) : (
                          <>
                            <span>Publish Listing</span>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}