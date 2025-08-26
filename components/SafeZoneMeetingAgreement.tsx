'use client'

import React, { useState, useEffect } from 'react'

interface SafeZone {
  id: string
  name: string
  address: string
  city: string
  type: string
  features: string[]
}

interface SafeZoneMeetingAgreementProps {
  listingId: string
  conversationId: string
  listingTitle: string
  listingPrice: number
  listingCity: string
  listingZipCode?: string
  buyerId: string
  sellerId: string
  currentUserId: string
  isSellerView: boolean
  onAgreementComplete: (agreementData: {
    agreedPrice: number
    safeZoneId?: string
    customLocation?: string
    datetime: string
    privacyRevealed: boolean
  }) => void
  onCancel: () => void
}

interface DealAgreement {
  id: string
  buyer_agreed: boolean
  seller_agreed: boolean
  agreed_price: number
  privacy_revealed: boolean
  deal_status: string
  safe_zone?: SafeZone
  custom_meeting_location?: string
  meeting_datetime?: string
}

export default function SafeZoneMeetingAgreement({
  listingId,
  conversationId,
  listingTitle,
  listingPrice,
  listingCity,
  listingZipCode,
  buyerId,
  sellerId,
  currentUserId,
  isSellerView,
  onAgreementComplete,
  onCancel
}: SafeZoneMeetingAgreementProps) {
  const [step, setStep] = useState<'agreement' | 'price' | 'waiting' | 'location' | 'confirm' | 'complete'>('agreement')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Agreement state
  const [agreedPrice, setAgreedPrice] = useState(listingPrice)
  const [priceNegotiated, setPriceNegotiated] = useState(false)
  const [dealAgreement, setDealAgreement] = useState<DealAgreement | null>(null)
  
  // Safe zone state
  const [safeZones, setSafeZones] = useState<SafeZone[]>([])
  const [selectedSafeZoneId, setSelectedSafeZoneId] = useState<string>('')
  const [customLocation, setCustomLocation] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')

  const userRole = currentUserId === buyerId ? 'buyer' : 'seller'

  // Load existing deal agreement and safe zones
  useEffect(() => {
    const loadDealAgreementInternal = async () => {
      try {
        const response = await fetch(
          `/api/safe-zone/deal-agreement?conversationId=${conversationId}&userId=${currentUserId}`
        )
        const data = await response.json()
        
        if (data.dealAgreement) {
          setDealAgreement(data.dealAgreement)
          setAgreedPrice(data.dealAgreement.agreed_price || listingPrice)
          
          // Determine current step based on agreement state
          if (data.privacyRevealed && data.dealAgreement.buyer_agreed && data.dealAgreement.seller_agreed) {
            setStep('location')
          } else if (data.dealAgreement[`${userRole}_agreed`]) {
            setStep('waiting')
          }
        }
      } catch (err) {
        console.error('Error loading deal agreement:', err)
      }
    }

    const loadSafeZonesInternal = async () => {
      try {
        const params = new URLSearchParams({ city: listingCity })
        if (listingZipCode) params.append('zipCode', listingZipCode)
        
        const response = await fetch(`/api/safe-zone/locations?${params}`)
        const data = await response.json()
        
        if (data.success) {
          setSafeZones(data.safeZones || [])
        }
      } catch (err) {
        console.error('Error loading safe zones:', err)
      }
    }

    loadDealAgreementInternal()
    loadSafeZonesInternal()
  }, [conversationId, currentUserId, listingPrice, userRole, listingCity, listingZipCode])


  const handleInitialAgreement = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/safe-zone/deal-agreement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          listingId,
          buyerId,
          sellerId,
          agreedPrice,
          originalPrice: listingPrice,
          userRole
        })
      })

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to create agreement')
      }

      setDealAgreement(data.dealAgreement)
      
      if (data.bothPartiesAgreed) {
        setStep('location')
      } else {
        setStep('waiting')
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const handleLocationSelection = async () => {
    if (!selectedDate || !selectedTime || (!selectedSafeZoneId && !customLocation.trim())) {
      setError('Please fill in all meeting details')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const meetingDatetime = new Date(`${selectedDate}T${selectedTime}`).toISOString()
      
      const response = await fetch('/api/safe-zone/deal-agreement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          listingId,
          buyerId,
          sellerId,
          userRole,
          safeZoneId: selectedSafeZoneId || undefined,
          customMeetingLocation: selectedSafeZoneId ? undefined : customLocation,
          meetingDatetime
        })
      })

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to finalize meeting')
      }

      setStep('complete')
      
      // Notify parent component
      onAgreementComplete({
        agreedPrice,
        safeZoneId: selectedSafeZoneId || undefined,
        customLocation: selectedSafeZoneId ? undefined : customLocation,
        datetime: `${selectedDate} at ${selectedTime}`,
        privacyRevealed: true
      })

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const getTomorrowDate = () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow.toISOString().split('T')[0]
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'police_station': return '🚔'
      case 'mall': return '🏬'
      case 'parking_lot': return '🅿️'
      case 'public': return '🏛️'
      default: return '📍'
    }
  }

  const getTypeName = (type: string) => {
    switch (type) {
      case 'police_station': return 'Police Station'
      case 'mall': return 'Shopping Mall'
      case 'parking_lot': return 'Parking Lot'
      case 'public': return 'Public Place'
      default: return 'Location'
    }
  }

  if (loading && !dealAgreement) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (step === 'agreement') {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6 max-w-md mx-auto">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            🛡️
          </div>
          <h3 className="text-lg font-bold text-blue-900 mb-2">
            Safe Zone Transaction
          </h3>
          <div className="text-sm text-blue-800 space-y-1">
            <p className="font-medium">{listingTitle}</p>
            <p className="text-xl font-bold text-green-600">${listingPrice.toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-blue-100 rounded-lg p-4 mb-6">
          <h4 className="font-medium text-blue-900 mb-2">🔒 Privacy Protection</h4>
          <div className="text-sm text-blue-800 space-y-1">
            <p>• Names and contact details are hidden until both parties agree</p>
            <p>• Meeting location revealed only after deal confirmation</p>
            <p>• All communications are encrypted and secure</p>
          </div>
        </div>

        {isSellerView ? (
          <div className="space-y-4">
            <div className="bg-green-100 rounded-lg p-4">
              <p className="text-sm text-green-800">
                The buyer wants to purchase your motorcycle using SafeTrade&apos;s secure process.
              </p>
            </div>
            <button
              onClick={() => setStep('price')}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 font-medium"
            >
              Review & Accept
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-yellow-100 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <strong>Ready to buy?</strong> Initiate SafeTrade&apos;s secure transaction process.
              </p>
            </div>
            <button
              onClick={() => setStep('price')}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 font-medium"
            >
              Start Secure Purchase
            </button>
          </div>
        )}

        <div className="flex justify-center mt-4">
          <button
            onClick={onCancel}
            className="text-sm text-gray-600 hover:text-gray-800 underline"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  if (step === 'price') {
    return (
      <div className="card max-w-lg mx-auto">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            💰
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Confirm Purchase Price</h3>
          <p className="text-sm text-gray-600">Set your final offer for this motorcycle</p>
        </div>

        <div className="space-y-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-blue-900">Listed Price:</span>
              <span className="text-lg font-bold text-blue-900">${listingPrice.toLocaleString()}</span>
            </div>
            <div className="text-sm text-blue-800">{listingTitle}</div>
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
                  <div className="font-medium">Price Negotiation</div>
                  <div className="text-xs mt-1">
                    {agreedPrice > listingPrice 
                      ? `+$${(agreedPrice - listingPrice).toLocaleString()} above asking`
                      : `-$${(listingPrice - agreedPrice).toLocaleString()} below asking`
                    }
                  </div>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="flex space-x-3">
            <button
              onClick={handleInitialAgreement}
              disabled={loading || !agreedPrice || agreedPrice < 1}
              className="flex-1 bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 font-medium"
            >
              {loading ? 'Processing...' : `Agree on $${agreedPrice?.toLocaleString()}`}
            </button>
            <button
              onClick={() => setStep('agreement')}
              className="flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded-md hover:bg-gray-400"
            >
              Back
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (step === 'waiting') {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md mx-auto">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            ⏳
          </div>
          <h3 className="text-lg font-bold text-yellow-900 mb-2">Waiting for Agreement</h3>
          <p className="text-sm text-yellow-800">
            Your agreement has been sent. Waiting for the other party to confirm.
          </p>
        </div>

        <div className="bg-white rounded-lg p-4 border border-yellow-200 mb-4">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Your Status:</span>
              <span className="text-green-600 font-medium">✅ Agreed</span>
            </div>
            <div className="flex justify-between">
              <span>{isSellerView ? 'Buyer' : 'Seller'} Status:</span>
              <span className="text-yellow-600 font-medium">⏳ Pending</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Agreed Price:</span>
              <span className="font-bold text-green-600">${agreedPrice.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="bg-blue-100 rounded-lg p-3">
          <p className="text-sm text-blue-800">
            <strong>🔒 Privacy Protected:</strong> Contact details and meeting location will be revealed once both parties confirm the agreement.
          </p>
        </div>
      </div>
    )
  }

  if (step === 'location') {
    return (
      <div className="card max-w-2xl mx-auto">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            📍
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Choose Safe Meeting Location</h3>
          <p className="text-sm text-gray-600">
            Both parties agreed! Select a secure location for your transaction.
          </p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-green-900">🤝 Deal Confirmed:</span>
            <span className="text-lg font-bold text-green-600">${agreedPrice.toLocaleString()}</span>
          </div>
          <p className="text-sm text-green-800">
            Contact information is now available to both parties.
          </p>
        </div>

        <div className="space-y-6">
          {/* Safe Zone Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              🛡️ Recommended Safe Zones:
            </label>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {safeZones.map((zone) => (
                <label key={zone.id} className="flex items-start p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    name="location"
                    value={zone.id}
                    checked={selectedSafeZoneId === zone.id}
                    onChange={(e) => {
                      setSelectedSafeZoneId(e.target.value)
                      setCustomLocation('')
                    }}
                    className="mt-1 mr-3"
                  />
                  <div className="flex-1">
                    <div className="flex items-center mb-1">
                      <span className="mr-2">{getTypeIcon(zone.type)}</span>
                      <span className="font-medium text-gray-900">{zone.name}</span>
                      <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {getTypeName(zone.type)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{zone.address}</p>
                    <div className="flex flex-wrap gap-1">
                      {zone.features.map((feature, idx) => (
                        <span key={idx} className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                          {feature.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                </label>
              ))}
              
              {/* Custom location option */}
              <label className="flex items-start p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  name="location"
                  value="custom"
                  checked={!!customLocation}
                  onChange={() => {
                    setSelectedSafeZoneId('')
                    setCustomLocation('custom')
                  }}
                  className="mt-1 mr-3"
                />
                <div className="flex-1">
                  <div className="flex items-center mb-1">
                    <span className="mr-2">📍</span>
                    <span className="font-medium text-gray-900">Other Public Location</span>
                  </div>
                  <p className="text-sm text-gray-600">Specify your own safe meeting place</p>
                </div>
              </label>
            </div>
          </div>

          {customLocation && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Specify Location:
              </label>
              <input
                type="text"
                value={customLocation === 'custom' ? '' : customLocation}
                onChange={(e) => setCustomLocation(e.target.value)}
                placeholder="e.g., Walmart parking lot on Main St"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* Date and Time Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date:</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={getTomorrowDate()}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time:</label>
              <select
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select time</option>
                {['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'].map(time => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="flex space-x-3">
            <button
              onClick={handleLocationSelection}
              disabled={loading || (!selectedSafeZoneId && !customLocation.trim()) || !selectedDate || !selectedTime}
              className="flex-1 bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 font-medium"
            >
              {loading ? 'Finalizing...' : 'Confirm Meeting'}
            </button>
            <button
              onClick={onCancel}
              className="flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded-md hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (step === 'complete') {
    const selectedZone = safeZones.find(z => z.id === selectedSafeZoneId)
    const finalLocation = selectedZone ? selectedZone.name : customLocation
    
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 max-w-md mx-auto">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            ✅
          </div>
          <h3 className="text-lg font-bold text-green-900 mb-2">Meeting Confirmed!</h3>
          <p className="text-sm text-green-800">
            Safe transaction details have been shared with both parties.
          </p>
        </div>

        <div className="bg-white rounded-lg p-4 border border-green-200 space-y-3">
          <div><strong>Vehicle:</strong> {listingTitle}</div>
          <div className="flex justify-between items-center">
            <strong>Final Price:</strong>
            <span className="text-lg font-bold text-green-600">${agreedPrice.toLocaleString()}</span>
          </div>
          <div><strong>Location:</strong> {finalLocation}</div>
          <div><strong>Date & Time:</strong> {selectedDate} at {selectedTime}</div>
        </div>

        <div className="bg-blue-100 rounded-lg p-3 mt-4">
          <p className="text-sm text-blue-800">
            <strong>🔒 Privacy Unlocked:</strong> Contact details are now available to both parties for coordination.
          </p>
        </div>
      </div>
    )
  }

  return null
}