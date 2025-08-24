// components/CreateListingForm.tsx
'use client';

import React from 'react';
import ImageUpload from '@/components/ImageUpload';

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
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      {/* Basic Information Section */}
      <div className="space-y-6">
        <div className="border-b border-gray-100 pb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Basic Information</h3>
          <p className="text-sm text-gray-600">Tell us about your motorcycle</p>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <label htmlFor="title" className="text-sm font-medium text-gray-900">
            Listing Title *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border border-gray-300 rounded-md transition-colors focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${
              validationErrors.title ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
            }`}
            placeholder="2020 Honda CB650R - Great Condition"
          />
          {validationErrors.title && (
            <p className="text-sm text-red-600">{validationErrors.title}</p>
          )}
          <p className="text-xs text-gray-500">
            Create an eye-catching title that includes year, make, and model
          </p>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label htmlFor="description" className="text-sm font-medium text-gray-900">
            Description *
          </label>
          <textarea
            id="description"
            name="description"
            rows={4}
            value={formData.description}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border border-gray-300 rounded-md transition-colors focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${
              validationErrors.description ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
            }`}
            placeholder="Describe your motorcycle's condition, history, modifications, and any other relevant details..."
          />
          {validationErrors.description && (
            <p className="text-sm text-red-600">{validationErrors.description}</p>
          )}
          <p className="text-xs text-gray-500">
            Include details about maintenance, modifications, and reason for selling
          </p>
        </div>
      </div>

      {/* Motorcycle Details Section */}
      <div className="space-y-6">
        <div className="border-b border-gray-100 pb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Motorcycle Details</h3>
          <p className="text-sm text-gray-600">Provide specific details about your bike</p>
        </div>

        {/* Price and Condition Row */}
        <div className="flex flex-wrap gap-6 items-start">
          {/* Price Field */}
          <div className="space-y-2 w-full sm:w-48">
            <label className="text-sm font-medium text-gray-900">
              Price (USD) *
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</div>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                className={`w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md transition-colors focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${
                  validationErrors.price ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
                }`}
                min="0"
                step="100"
                placeholder="15000"
              />
            </div>
          </div>

          {/* Condition Field */}
          <div className="space-y-2 w-full sm:w-40">
            <label className="text-sm font-medium text-gray-900">
              Condition *
            </label>
            <select
              name="condition"
              value={formData.condition}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md transition-colors focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 appearance-none bg-white ${
                validationErrors.condition ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
              }`}
            >
              <option value="">Select condition</option>
              <option value="excellent">Excellent</option>
              <option value="good">Good</option>
              <option value="fair">Fair</option>
              <option value="poor">Poor</option>
            </select>
          </div>
        </div>

        {/* Validation Errors for Price and Condition */}
        <div className="flex flex-wrap gap-6">
          <div className="w-full sm:w-48">
            {validationErrors.price && (
              <p className="text-sm text-red-600">{validationErrors.price}</p>
            )}
          </div>
          <div className="w-full sm:w-40">
            {validationErrors.condition && (
              <p className="text-sm text-red-600">{validationErrors.condition}</p>
            )}
          </div>
        </div>

        {/* Make, Model, Year Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-900">Make *</label>
            <select
              name="make"
              value={formData.make}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md transition-colors focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 appearance-none bg-white ${
                validationErrors.make ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
              }`}
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
              <p className="text-sm text-red-600">{validationErrors.make}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-900">Model *</label>
            <input
              type="text"
              name="model"
              value={formData.model}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md transition-colors focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${
                validationErrors.model ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
              }`}
              placeholder="CB650R"
            />
            {validationErrors.model && (
              <p className="text-sm text-red-600">{validationErrors.model}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-900">Year *</label>
            <input
              type="number"
              name="year"
              value={formData.year}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md transition-colors focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${
                validationErrors.year ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
              }`}
              min="1900"
              max={new Date().getFullYear() + 1}
              placeholder="2020"
            />
            {validationErrors.year && (
              <p className="text-sm text-red-600">{validationErrors.year}</p>
            )}
          </div>
        </div>

        {/* Mileage and VIN Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-900">Mileage</label>
            <input
              type="number"
              name="mileage"
              value={formData.mileage}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md transition-colors focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              min="0"
              placeholder="25000"
            />
            <p className="text-xs text-gray-500">Miles on the odometer</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-900">VIN</label>
            <input
              type="text"
              name="vin"
              value={formData.vin}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md transition-colors focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="17-digit VIN number"
              maxLength={17}
            />
            <p className="text-xs text-gray-500">17-digit vehicle identification number</p>
          </div>
        </div>
      </div>

      {/* Location Section */}
      <div className="space-y-6">
        <div className="border-b border-gray-100 pb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Location</h3>
          <p className="text-sm text-gray-600">Where is your motorcycle located?</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-900">City *</label>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md transition-colors focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${
                validationErrors.city ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
              }`}
              placeholder="Los Angeles"
            />
            {validationErrors.city && (
              <p className="text-sm text-red-600">{validationErrors.city}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-900">Zip Code *</label>
            <input
              type="text"
              name="zipCode"
              value={formData.zipCode}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md transition-colors focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${
                validationErrors.zipCode ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
              }`}
              placeholder="90210"
              maxLength={5}
            />
            {validationErrors.zipCode && (
              <p className="text-sm text-red-600">{validationErrors.zipCode}</p>
            )}
          </div>
        </div>
      </div>

      {/* Images Section */}
      <div className="space-y-6">
        <div className="border-b border-gray-100 pb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Photos</h3>
          <p className="text-sm text-gray-600">Add high-quality photos of your motorcycle</p>
        </div>

        <ImageUpload 
          onImagesUploaded={setImages}
          existingImages={images}
          maxImages={8}
        />
        
        <p className="text-xs text-gray-500">
          Add at least 3-5 photos showing different angles. High-quality photos get more interest!
        </p>
      </div>

      {/* Submit Button */}
      <div className="flex justify-between items-center pt-6 border-t border-gray-100">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="px-6 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
        >
          Cancel
        </button>
        
        <button
          type="submit"
          disabled={loading}
          className={`px-8 py-3 rounded-lg text-white font-semibold transition-all duration-200 ${
            loading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg transform hover:scale-[1.02]'
          }`}
        >
          {loading ? 'Creating Listing...' : 'Create Listing'}
        </button>
      </div>
    </form>
  );
}