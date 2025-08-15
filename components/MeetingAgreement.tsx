'use client'

import React, { useState } from 'react'
import { getMeetingLocationSuggestions, maskLocation } from '@/lib/locationUtils'

interface MeetingAgreementProps {
  listingId: string  // For future use
  conversationId: string  // For future use
  listingTitle: string
  listingPrice: number
  listingCity: string
  listingZipCode?: string
  isSellerView: boolean
  onSelectMeetingLocation: (location: string, datetime: string, agreedPrice?: number) => void
  onCancel: () => void
}

export default function MeetingAgreement({
  listingId: _listingId, // eslint-disable-line @typescript-eslint/no-unused-vars
  conversationId: _conversationId, // eslint-disable-line @typescript-eslint/no-unused-vars
  listingTitle,
  listingPrice,
  listingCity,
  listingZipCode,
  isSellerView,
  onSelectMeetingLocation,
  onCancel
}: MeetingAgreementProps) {
  const [selectedLocation, setSelectedLocation] = useState('')
  const [customLocation, setCustomLocation] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [agreedPrice, setAgreedPrice] = useState(listingPrice)
  const [priceNegotiated, setPriceNegotiated] = useState(false)
  const [step, setStep] = useState<'agreement' | 'price' | 'location' | 'confirm'>('agreement')

  const meetingSuggestions = getMeetingLocationSuggestions(listingCity, listingZipCode)
  const { vicinity } = maskLocation(listingCity, listingZipCode)

  const handleProceedToPrice = () => {
    setStep('price')
  }

  const handleProceedToLocation = () => {
    setStep('location')
  }

  const handleLocationSelect = () => {
    setStep('confirm')
  }

  const handleConfirmMeeting = () => {
    const finalLocation = selectedLocation === 'custom' ? customLocation : selectedLocation
    const datetime = `${selectedDate} at ${selectedTime}`
    onSelectMeetingLocation(finalLocation, datetime, agreedPrice)
  }

  const getTomorrowDate = () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow.toISOString().split('T')[0]
  }

  if (step === 'agreement') {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-md mx-auto">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            🤝
          </div>
          <h3 className="text-lg font-bold text-blue-900 mb-2">
            {isSellerView ? 'Purchase Interest' : 'Ready to Buy?'}
          </h3>
          <div className="text-sm text-blue-800 space-y-1">
            <p className="font-medium">{listingTitle}</p>
            <p className="text-xl font-bold text-green-600">${listingPrice.toLocaleString()}</p>
            <p>📍 Located in {vicinity}</p>
          </div>
        </div>

        {isSellerView ? (
          <div className="space-y-4">
            <div className="bg-green-100 rounded-lg p-4">
              <p className="text-sm text-green-800">
                The buyer is interested in purchasing your motorcycle. 
                Would you like to arrange a safe meeting location?
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleProceedToPrice}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 font-medium"
              >
                Arrange Meeting
              </button>
              <button
                onClick={onCancel}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
              >
                Not Ready
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-yellow-100 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <strong>Ready to purchase?</strong> Let the seller know you&apos;re serious 
                about buying and want to arrange a safe meeting.
              </p>
            </div>
            <div className="text-xs text-gray-600 space-y-1">
              <p>✅ Inspect the motorcycle in person</p>
              <p>✅ Verify documents and title</p>
              <p>✅ Meet in a safe, public location</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleProceedToPrice}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 font-medium"
              >
                Yes, I Want to Buy
              </button>
              <button
                onClick={onCancel}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  if (step === 'price') {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6 max-w-lg mx-auto">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            💰
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Agree on Final Price</h3>
          <p className="text-sm text-gray-600">Negotiate and confirm the purchase price</p>
        </div>

        <div className="space-y-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-blue-900">Listed Price:</span>
              <span className="text-lg font-bold text-blue-900">${listingPrice.toLocaleString()}</span>
            </div>
            <div className="text-sm text-blue-800">
              {listingTitle}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {isSellerView ? 'Your asking price:' : 'Your offer:'}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
              <input
                type="number"
                value={agreedPrice}
                onChange={(e) => {
                  setAgreedPrice(Number(e.target.value))
                  setPriceNegotiated(Number(e.target.value) !== listingPrice)
                }}
                className="w-full pl-8 pr-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg font-semibold"
                min="1"
                step="100"
              />
            </div>
          </div>

          {priceNegotiated && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-center text-sm text-yellow-800">
                <span className="mr-2">💡</span>
                <div>
                  <div className="font-medium">Price Change Detected</div>
                  <div className="text-xs mt-1">
                    {agreedPrice > listingPrice 
                      ? `+$${(agreedPrice - listingPrice).toLocaleString()} above asking price`
                      : `-$${(listingPrice - agreedPrice).toLocaleString()} below asking price`
                    }
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">💬 Price Negotiation Tips:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Be respectful and reasonable in your offer</li>
              <li>• Consider the motorcycle&apos;s condition and market value</li>
              <li>• Factor in any needed repairs or maintenance</li>
              <li>• Remember both parties should feel good about the deal</li>
            </ul>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={handleProceedToLocation}
              disabled={!agreedPrice || agreedPrice < 1}
              className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              Agree on ${agreedPrice?.toLocaleString()}
            </button>
            <button
              onClick={() => setStep('agreement')}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
            >
              Back
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (step === 'location') {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6 max-w-lg mx-auto">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            📍
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Choose Safe Meeting Location</h3>
          <p className="text-sm text-gray-600">Select a public, secure location near {vicinity}</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Recommended Safe Locations:
            </label>
            <div className="space-y-2">
              {meetingSuggestions.slice(0, 5).map((suggestion, index) => (
                <label key={index} className="flex items-center">
                  <input
                    type="radio"
                    name="location"
                    value={suggestion}
                    checked={selectedLocation === suggestion}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    className="mr-3"
                  />
                  <span className="text-sm">{suggestion}</span>
                </label>
              ))}
              <label className="flex items-center">
                <input
                  type="radio"
                  name="location"
                  value="custom"
                  checked={selectedLocation === 'custom'}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="mr-3"
                />
                <span className="text-sm">Other public location</span>
              </label>
            </div>
          </div>

          {selectedLocation === 'custom' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Specify Location:
              </label>
              <input
                type="text"
                value={customLocation}
                onChange={(e) => setCustomLocation(e.target.value)}
                placeholder="e.g., Walmart parking lot on Main St"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date:
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={getTomorrowDate()}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Time:
              </label>
              <select
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select time</option>
                <option value="10:00 AM">10:00 AM</option>
                <option value="11:00 AM">11:00 AM</option>
                <option value="12:00 PM">12:00 PM</option>
                <option value="1:00 PM">1:00 PM</option>
                <option value="2:00 PM">2:00 PM</option>
                <option value="3:00 PM">3:00 PM</option>
                <option value="4:00 PM">4:00 PM</option>
                <option value="5:00 PM">5:00 PM</option>
              </select>
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={handleLocationSelect}
              disabled={!selectedLocation || !selectedDate || !selectedTime || 
                       (selectedLocation === 'custom' && !customLocation.trim())}
              className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
            </button>
            <button
              onClick={() => setStep('price')}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
            >
              Back
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (step === 'confirm') {
    const finalLocation = selectedLocation === 'custom' ? customLocation : selectedLocation
    
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 max-w-md mx-auto">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            ✅
          </div>
          <h3 className="text-lg font-bold text-green-900 mb-2">Confirm Meeting Details</h3>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-lg p-4 border border-green-200">
            <div className="space-y-2 text-sm">
              <div><strong>Vehicle:</strong> {listingTitle}</div>
              <div className="flex items-center justify-between">
                <span><strong>Agreed Price:</strong></span>
                <span className="text-lg font-bold text-green-600">${agreedPrice.toLocaleString()}</span>
              </div>
              {priceNegotiated && (
                <div className="text-xs text-gray-600">
                  (Listed at ${listingPrice.toLocaleString()})
                </div>
              )}
              <div><strong>Location:</strong> {finalLocation}</div>
              <div><strong>Date & Time:</strong> {selectedDate} at {selectedTime}</div>
            </div>
          </div>

          <div className="bg-yellow-100 rounded-lg p-3">
            <p className="text-xs text-yellow-800">
              <strong>Safety Reminder:</strong> Meet during daylight hours, 
              bring a friend if possible, and trust your instincts.
            </p>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={handleConfirmMeeting}
              className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 font-medium"
            >
              Confirm Meeting
            </button>
            <button
              onClick={() => setStep('location')}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
            >
              Edit Details
            </button>
          </div>
        </div>
      </div>
    )
  }

  return null
}