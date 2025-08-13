// lib/locationUtils.ts

/**
 * Masks a location for privacy while still providing useful geographic context
 * IMPORTANT: This protects seller privacy by never exposing exact addresses
 * We only work with city and ZIP code data - no street addresses are collected
 */
export function maskLocation(city: string, zipCode?: string, state: string = 'NJ'): {
  masked: string
  vicinity: string
  general: string
} {
  if (!city) {
    return {
      masked: 'Location not specified',
      vicinity: 'New Jersey area',
      general: 'NJ'
    }
  }

  // Get zip code prefix for general area (for future use)
  // const zipPrefix = zipCode ? zipCode.substring(0, 3) + 'XX' : null
  
  // For major cities, show the city name
  const majorCities = [
    'Newark', 'Jersey City', 'Paterson', 'Elizabeth', 'Edison', 'Woodbridge',
    'Lakewood', 'Toms River', 'Hamilton', 'Trenton', 'Clifton', 'Camden',
    'Brick', 'Cherry Hill', 'Passaic', 'Union City', 'Middletown', 'Gloucester',
    'Vineland', 'Bayonne', 'New Brunswick', 'Hoboken', 'Plainfield', 'Westfield',
    'Paramus', 'Hackensack', 'Princeton', 'Atlantic City'
  ]

  const isMajorCity = majorCities.some(major => 
    city.toLowerCase().includes(major.toLowerCase()) || 
    major.toLowerCase().includes(city.toLowerCase())
  )

  let masked: string
  let vicinity: string
  let general: string

  if (isMajorCity) {
    // For major cities, show the city name but not exact area
    masked = `${city} area`
    vicinity = `Near ${city}, ${state}`
    general = `${city}, ${state}`
  } else {
    // For smaller towns, show only county or general region
    const countyMap: { [key: string]: string } = {
      // North Jersey
      'Hoboken': 'Hudson County',
      'Jersey City': 'Hudson County', 
      'Bayonne': 'Hudson County',
      'Union City': 'Hudson County',
      'Weehawken': 'Hudson County',
      
      // Central Jersey
      'New Brunswick': 'Middlesex County',
      'Edison': 'Middlesex County',
      'Woodbridge': 'Middlesex County',
      'Princeton': 'Mercer County',
      'Trenton': 'Mercer County',
      
      // South Jersey
      'Camden': 'Camden County',
      'Cherry Hill': 'Camden County',
      'Atlantic City': 'Atlantic County',
      'Vineland': 'Cumberland County',
      
      // North/Northwest
      'Paterson': 'Passaic County',
      'Clifton': 'Passaic County',
      'Passaic': 'Passaic County',
      'Hackensack': 'Bergen County',
      'Paramus': 'Bergen County',
      
      // Central/Shore
      'Toms River': 'Ocean County',
      'Lakewood': 'Ocean County',
      'Brick': 'Ocean County',
      'Middletown': 'Monmouth County'
    }

    const county = countyMap[city] || 'New Jersey'
    
    if (county !== 'New Jersey') {
      masked = county
      vicinity = `${county}, ${state}`
      general = county
    } else {
      // Fallback based on zip code regions
      if (zipCode) {
        const zipNum = parseInt(zipCode.substring(0, 2))
        if (zipNum >= 7 && zipNum <= 8) {
          masked = 'North Jersey area'
          vicinity = 'North Jersey, NJ'
          general = 'North NJ'
        } else if (zipNum >= 8 && zipNum <= 9) {
          masked = 'Central Jersey area'
          vicinity = 'Central Jersey, NJ'  
          general = 'Central NJ'
        } else {
          masked = 'South Jersey area'
          vicinity = 'South Jersey, NJ'
          general = 'South NJ'
        }
      } else {
        masked = 'New Jersey area'
        vicinity = 'New Jersey'
        general = 'NJ'
      }
    }
  }

  return {
    masked,
    vicinity, 
    general
  }
}

/**
 * Get appropriate location display based on context
 */
export function getLocationDisplay(
  city: string, 
  zipCode?: string, 
  state: string = 'NJ',
  showExact: boolean = false
): string {
  if (showExact) {
    return zipCode ? `${city}, ${state} ${zipCode}` : `${city}, ${state}`
  }
  
  const { masked } = maskLocation(city, zipCode, state)
  return masked
}

/**
 * Get meeting location suggestions based on the listing location
 * These suggestions prioritize public, safe locations that protect both buyer and seller privacy
 */
export function getMeetingLocationSuggestions(city: string, zipCode?: string): string[] {
  const { general } = maskLocation(city, zipCode)
  
  const suggestions = [
    'Public police station parking lot (safest option)',
    'Busy shopping center with security cameras',
    'Well-lit public parking area during daytime',
    'Bank or credit union parking lot (with surveillance)',
    'Popular restaurant or coffee shop',
    'Public library parking area',
  ]

  // Add location-specific suggestions
  if (general.includes('North')) {
    suggestions.unshift('North Jersey mall or shopping center')
  } else if (general.includes('Central')) {
    suggestions.unshift('Central Jersey retail area')
  } else if (general.includes('South')) {
    suggestions.unshift('South Jersey shopping plaza')
  }

  return suggestions
}

/**
 * Get privacy tips for sellers
 */
export function getSellerPrivacyTips(): string[] {
  return [
    'Never meet buyers at your home address',
    'Choose busy public locations for all meetings',
    'Don\'t share your exact address until meeting',
    'Meet during daylight hours when possible',
    'Bring a friend or let someone know your plans',
    'Trust your instincts - cancel if something feels wrong',
  ]
}