// components/CreateListingForm.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { MapPin, Shield, Star, ExternalLink } from 'lucide-react';
import ImageUpload from '@/components/ImageUpload';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SafeZone, SafeZoneType } from '@/types/safe-zones';

export interface ListingFormData {
  title: string;
  description: string;
  price: string;
  make: string;
  model: string;
  year: string;
  mileage: string;
  vin: string;
  condition: string;
  city: string;
  zipCode: string;
  recommendedSafeZone?: string;
}

export interface ValidationErrors {
  [key: string]: string;
}

interface CreateListingFormProps {
  formData: ListingFormData;
  setFormData: React.Dispatch<React.SetStateAction<ListingFormData>>;
  images: string[];
  setImages: React.Dispatch<React.SetStateAction<string[]>>;
  validationErrors: ValidationErrors;
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
}

export default function CreateListingForm({
  formData,
  setFormData,
  images,
  setImages,
  validationErrors,
  onSubmit,
  loading
}: CreateListingFormProps) {
  const [nearbySafeZones, setNearbySafeZones] = useState<SafeZone[]>([]);
  const [loadingSafeZones, setLoadingSafeZones] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Fetch nearby safe zones when location changes
  useEffect(() => {
    if (formData.city && formData.zipCode) {
      fetchNearbySafeZones();
    }
  }, [formData.city, formData.zipCode]);

  const fetchNearbySafeZones = async () => {
    setLoadingSafeZones(true);
    try {
      const params = new URLSearchParams({
        city: formData.city,
        zipCode: formData.zipCode,
        limit: '3'
      });
      
      const response = await fetch(`/api/safe-zones/nearby?${params}`);
      if (response.ok) {
        const data = await response.json();
        setNearbySafeZones(data.safeZones || []);
      }
    } catch (error) {
      console.error('Error fetching nearby safe zones:', error);
    } finally {
      setLoadingSafeZones(false);
    }
  };

  const getTypeLabel = (type: SafeZoneType): string => {
    const labels: Record<SafeZoneType, string> = {
      [SafeZoneType.POLICE_STATION]: 'Police Station',
      [SafeZoneType.FIRE_STATION]: 'Fire Station',
      [SafeZoneType.HOSPITAL]: 'Hospital',
      [SafeZoneType.LIBRARY]: 'Library',
      [SafeZoneType.COMMUNITY_CENTER]: 'Community Center',
      [SafeZoneType.GOVERNMENT_BUILDING]: 'Government Building',
      [SafeZoneType.MALL]: 'Shopping Center',
      [SafeZoneType.BANK]: 'Bank',
      [SafeZoneType.RETAIL_STORE]: 'Retail Store',
      [SafeZoneType.OTHER]: 'Other'
    };
    return labels[type] || type;
  };

  return (
    <div className="form-page">
      <form onSubmit={onSubmit} className="space-y-8">
        {/* Basic Information Section */}
        <div className="form-section">
          <div className="section-header">
            <h3 className="section-title">Basic Information</h3>
            <p className="body-text">Tell us about your motorcycle</p>
          </div>

          <div className="space-y-6">
            {/* Title */}
            <div className="form-field">
              <label htmlFor="title" className="form-label">
                Listing Title <span className="text-error">*</span>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className={`input ${validationErrors.title ? 'border-error' : ''}`}
                placeholder="2020 Honda CB650R - Great Condition"
              />
              {validationErrors.title && (
                <p className="form-error">{validationErrors.title}</p>
              )}
              <p className="form-help">
                Create an eye-catching title that includes year, make, and model
              </p>
            </div>

            {/* Description */}
            <div className="form-field">
              <label htmlFor="description" className="form-label">
                Description <span className="text-error">*</span>
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                value={formData.description}
                onChange={handleInputChange}
                className={`input ${validationErrors.description ? 'border-error' : ''}`}
                placeholder="Describe your motorcycle's condition, history, modifications, and any other relevant details..."
                style={{ minHeight: '120px', resize: 'vertical', fontFamily: 'inherit', lineHeight: '1.5' }}
              />
              {validationErrors.description && (
                <p className="form-error">{validationErrors.description}</p>
              )}
              <p className="form-help">
                Include details about maintenance, modifications, and reason for selling
              </p>
            </div>
          </div>
        </div>

        {/* Motorcycle Details Section */}
        <div className="form-section">
          <div className="section-header">
            <h3 className="section-title">Motorcycle Details</h3>
            <p className="body-text">Provide specific details about your bike</p>
          </div>

          <div className="space-y-6">
            {/* Price and Condition Row */}
            <div className="form-grid">
              {/* Price Field */}
              <div className="form-field">
                <label className="form-label">
                  Price (USD) <span className="text-error">*</span>
                </label>
                <div className="price-input-container">
                  <span className="currency-symbol">$</span>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    className={`input price-input ${validationErrors.price ? 'border-error' : ''}`}
                    min="0"
                    step="100"
                    placeholder="15000"
                  />
                </div>
                {validationErrors.price && (
                  <p className="form-error">{validationErrors.price}</p>
                )}
              </div>

              {/* Condition Field */}
              <div className="form-field">
                <label className="form-label">
                  Condition <span className="text-error">*</span>
                </label>
                <select
                  name="condition"
                  value={formData.condition}
                  onChange={handleInputChange}
                  className={`input ${validationErrors.condition ? 'border-error' : ''}`}
                  style={{ appearance: 'none', backgroundImage: 'url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iOCIgdmlld0JveD0iMCAwIDEyIDgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0xIDFMNiA2TDExIDEiIHN0cm9rZT0iIzczNzM3MyIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPC9zdmc+")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
                >
                  <option value="">Select condition</option>
                  <option value="excellent">Excellent</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="poor">Poor</option>
                </select>
                {validationErrors.condition && (
                  <p className="form-error">{validationErrors.condition}</p>
                )}
              </div>
            </div>

            {/* Make, Model, Year Grid */}
            <div className="form-grid grid-cols-3">
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
                  placeholder="2020"
                />
                {validationErrors.year && (
                  <p className="form-error">{validationErrors.year}</p>
                )}
              </div>
            </div>

            {/* Mileage and VIN Grid */}
            <div className="form-grid">
              <div className="form-field">
                <label className="form-label">Mileage</label>
                <input
                  type="number"
                  name="mileage"
                  value={formData.mileage}
                  onChange={handleInputChange}
                  className="input"
                  min="0"
                  placeholder="25000"
                />
                <p className="form-help">Miles on the odometer</p>
              </div>

              <div className="form-field">
                <label className="form-label">VIN</label>
                <input
                  type="text"
                  name="vin"
                  value={formData.vin}
                  onChange={handleInputChange}
                  className="input"
                  placeholder="17-digit VIN number"
                  maxLength={17}
                />
                <p className="form-help">17-digit vehicle identification number</p>
              </div>
            </div>
          </div>
        </div>

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

        {/* Safe Zone Recommendations Section */}
        {(formData.city && formData.zipCode) && (
          <div className="form-section">
            <div className="section-header">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-5 h-5 text-brand-primary" />
                <h3 className="section-title">Recommended Safe Zones</h3>
              </div>
              <p className="body-text">
                Safe, monitored locations near you for secure transactions
              </p>
            </div>

          {loadingSafeZones ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
              <span className="ml-3 text-sm text-gray-600">Finding nearby safe zones...</span>
            </div>
          ) : nearbySafeZones.length > 0 ? (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium text-blue-900 mb-1">Why use Safe Zones?</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Monitored locations with security cameras</li>
                      <li>• Well-lit, public spaces with high foot traffic</li>
                      <li>• Emergency services nearby for added safety</li>
                      <li>• Build trust with potential buyers</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                {nearbySafeZones.map((safeZone) => (
                  <div 
                    key={safeZone.id}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                      formData.recommendedSafeZone === safeZone.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setFormData(prev => ({
                      ...prev,
                      recommendedSafeZone: prev.recommendedSafeZone === safeZone.id ? '' : safeZone.id
                    }))}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-medium text-gray-900">{safeZone.name}</h4>
                          {safeZone.isVerified && (
                            <Badge className="bg-orange-100 text-orange-800 border-orange-200 text-xs">
                              <Shield className="w-3 h-3 mr-1" />
                              Verified
                            </Badge>
                          )}
                          <Badge variant="secondary" className="text-xs">
                            {getTypeLabel(safeZone.zoneType)}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            <span className="truncate">{safeZone.address}</span>
                          </div>
                          {(safeZone.averageRating || 0) > 0 && (
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 text-yellow-500" />
                              <span>{safeZone.averageRating.toFixed(1)} ({safeZone.totalReviews || 0} reviews)</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="recommendedSafeZone"
                              value={safeZone.id}
                              checked={formData.recommendedSafeZone === safeZone.id}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                recommendedSafeZone: e.target.checked ? safeZone.id : ''
                              }))}
                              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">
                              {formData.recommendedSafeZone === safeZone.id 
                                ? 'Selected as recommended safe zone' 
                                : 'Select this safe zone'
                              }
                            </span>
                          </div>
                          
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            asChild
                          >
                            <a 
                              href={`/safe-zones/${safeZone.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                            >
                              View Details
                              <ExternalLink className="w-3 h-3 ml-1" />
                            </a>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-center">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  asChild
                >
                  <a href="/safe-zones" target="_blank" rel="noopener noreferrer">
                    <MapPin className="w-4 h-4 mr-2" />
                    Browse All Safe Zones
                    <ExternalLink className="w-3 h-3 ml-2" />
                  </a>
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">No Safe Zones Found Nearby</h4>
              <p className="text-gray-600 mb-4">
                We couldn't find any safe zones in your area. You can still browse all available locations.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                asChild
              >
                <a href="/safe-zones" target="_blank" rel="noopener noreferrer">
                  <MapPin className="w-4 h-4 mr-2" />
                  Browse All Safe Zones
                  <ExternalLink className="w-3 h-3 ml-2" />
                </a>
              </Button>
            </div>
          )}

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 text-yellow-600 mt-0.5">💡</div>
              <div className="text-sm text-yellow-800">
                <strong>Pro Tip:</strong> Selecting a recommended safe zone helps build trust with potential buyers 
                and makes your listing more appealing. Buyers prefer sellers who prioritize safety!
              </div>
            </div>
          </div>
        </div>
      )}

        {/* Images Section */}
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

        {/* Submit Actions */}
        <div className="form-actions">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="btn-back"
          >
            Cancel
          </button>
          
          <button
            type="submit"
            disabled={loading}
            className={`btn-publish ${loading ? 'opacity-50 cursor-not-allowed transform-none shadow-none' : ''}`}
          >
            {loading ? 'Creating Listing...' : 'Create Listing'}
          </button>
        </div>
      </form>
    </div>
  );
}