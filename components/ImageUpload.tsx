// components/ImageUpload.tsx
'use client'

import { useState, useRef } from 'react'

interface ImageUploadProps {
  onImagesUploaded: (imageUrls: string[]) => void
  maxImages?: number
  existingImages?: string[]
}

export default function ImageUpload({ 
  onImagesUploaded, 
  maxImages = 8, 
  existingImages = [] 
}: ImageUploadProps) {
  const [images, setImages] = useState<string[]>(existingImages)
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const uploadToCloudinary = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', 'safetrade_motorcycles') // We'll create this in Cloudinary
    formData.append('folder', 'motorcycle_listings')
    
    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData
        }
      )
      
      if (!response.ok) {
        throw new Error('Upload failed')
      }
      
      const data = await response.json()
      return data.secure_url
    } catch (error) {
      console.error('Cloudinary upload error:', error)
      throw error
    }
  }

  const handleFileSelect = async (files: FileList) => {
    if (files.length + images.length > maxImages) {
      alert(`Maximum ${maxImages} images allowed`)
      return
    }

    setUploading(true)
    const newImageUrls: string[] = []

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
          alert(`${file.name} is not an image file`)
          continue
        }
        
        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
          alert(`${file.name} is too large. Maximum size is 5MB`)
          continue
        }
        
        try {
          const imageUrl = await uploadToCloudinary(file)
          newImageUrls.push(imageUrl)
        } catch (error) {
          console.error(`Failed to upload ${file.name}:`, error)
          alert(`Failed to upload ${file.name}`)
        }
      }
      
      const updatedImages = [...images, ...newImageUrls]
      setImages(updatedImages)
      onImagesUploaded(updatedImages)
      
    } catch (error) {
      console.error('Upload error:', error)
      alert('Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    
    if (e.dataTransfer.files) {
      handleFileSelect(e.dataTransfer.files)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
  }

  const removeImage = (index: number) => {
    const updatedImages = images.filter((_, i) => i !== index)
    setImages(updatedImages)
    onImagesUploaded(updatedImages)
  }

  const moveImage = (fromIndex: number, toIndex: number) => {
    const updatedImages = [...images]
    const [movedImage] = updatedImages.splice(fromIndex, 1)
    updatedImages.splice(toIndex, 0, movedImage)
    setImages(updatedImages)
    onImagesUploaded(updatedImages)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">
          Motorcycle Photos ({images.length}/{maxImages})
        </h3>
        {images.length > 0 && (
          <p className="text-sm text-gray-500">
            Drag photos to reorder • First photo will be the main image
          </p>
        )}
      </div>

      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
          className="hidden"
        />
        
        {uploading ? (
          <div className="flex flex-col items-center">
            <svg className="animate-spin h-8 w-8 text-blue-600 mb-2" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-blue-600">Uploading images...</p>
          </div>
        ) : (
          <div className="cursor-pointer">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" stroke="currentColor" fill="none" viewBox="0 0 48 48">
              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p className="text-lg font-medium text-gray-900 mb-2">
              Add motorcycle photos
            </p>
            <p className="text-sm text-gray-500 mb-2">
              Drag and drop images here, or click to select
            </p>
            <p className="text-xs text-gray-400">
              JPEG, PNG, WebP • Max 5MB per image • Up to {maxImages} images
            </p>
          </div>
        )}
      </div>

      {/* Image Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((imageUrl, index) => (
            <div
              key={index}
              className="relative group aspect-square bg-gray-100 rounded-lg overflow-hidden"
              draggable
              onDragStart={(e) => e.dataTransfer.setData('text/plain', index.toString())}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault()
                const fromIndex = parseInt(e.dataTransfer.getData('text/plain'))
                moveImage(fromIndex, index)
              }}
            >
              <img
                src={imageUrl}
                alt={`Motorcycle ${index + 1}`}
                className="w-full h-full object-cover"
              />
              
              {/* Main Image Badge */}
              {index === 0 && (
                <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                  Main Photo
                </div>
              )}
              
              {/* Remove Button */}
              <button
                onClick={() => removeImage(index)}
                className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              
              {/* Drag Handle */}
              <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white rounded p-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-move">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Tips */}
      {images.length === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">📸 Photo Tips for Better Sales:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Take photos in good lighting (outdoor daylight works best)</li>
            <li>• Include front, back, both sides, engine, and dashboard views</li>
            <li>• Show any modifications, damage, or wear clearly</li>
            <li>• Clean your motorcycle before photographing</li>
            <li>• Avoid cluttered backgrounds</li>
          </ul>
        </div>
      )}
    </div>
  )
}
