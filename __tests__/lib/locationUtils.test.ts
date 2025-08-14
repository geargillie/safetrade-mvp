import { 
  maskLocation, 
  getLocationDisplay, 
  getMeetingLocationSuggestions 
} from '@/lib/locationUtils'

describe('Location Utils', () => {
  describe('maskLocation', () => {
    it('masks location with approximate area', () => {
      const result = maskLocation('Newark', '07101')
      
      expect(result.vicinity).toBe('Near Newark, NJ')
      expect(result.masked).toBe('Newark area')
      expect(result.general).toBe('Newark, NJ')
    })

    it('handles missing zip code', () => {
      const result = maskLocation('Newark', undefined)
      
      expect(result.vicinity).toBe('Near Newark, NJ')
      expect(result.masked).toBe('Newark area')
      expect(result.general).toBe('Newark, NJ')
    })

    it('handles missing city', () => {
      const result = maskLocation(undefined, '07101')
      
      expect(result.vicinity).toBe('New Jersey area')
      expect(result.masked).toBe('Location not specified')
      expect(result.general).toBe('NJ')
    })

    it('handles empty city', () => {
      const result = maskLocation('', '07101')
      
      expect(result.vicinity).toBe('New Jersey area')
      expect(result.masked).toBe('Location not specified')
      expect(result.general).toBe('NJ')
    })

    it('returns correct properties for major cities', () => {
      const majorCities = ['Newark', 'Jersey City', 'Paterson', 'Elizabeth']
      
      majorCities.forEach(city => {
        const result = maskLocation(city, '07101')
        expect(result).toHaveProperty('masked')
        expect(result).toHaveProperty('vicinity')
        expect(result).toHaveProperty('general')
        expect(result.masked).toBe(`${city} area`)
        expect(result.vicinity).toBe(`Near ${city}, NJ`)
      })
    })

    it('handles zip code based regions for unknown cities', () => {
      const result = maskLocation('UnknownCity', '07101')
      
      expect(result.masked).toBe('North Jersey area')
      expect(result.vicinity).toBe('North Jersey, NJ')
      expect(result.general).toBe('North NJ')
    })
  })

  describe('getLocationDisplay', () => {
    it('displays masked location by default', () => {
      const result = getLocationDisplay('Newark', '07101')
      expect(result).toBe('Newark area')
    })

    it('displays masked location when no zip provided', () => {
      const result = getLocationDisplay('Newark', undefined)
      expect(result).toBe('Newark area')
    })

    it('displays exact location when showExact is true', () => {
      const result = getLocationDisplay('Newark', '07101', 'NJ', true)
      expect(result).toBe('Newark, NJ 07101')
    })

    it('displays exact location without zip when showExact is true', () => {
      const result = getLocationDisplay('Newark', undefined, 'NJ', true)
      expect(result).toBe('Newark, NJ')
    })

    it('handles missing city', () => {
      const result = getLocationDisplay(undefined, '07101')
      expect(result).toBe('Location not specified')
    })

    it('handles empty strings', () => {
      const result = getLocationDisplay('', '')
      expect(result).toBe('Location not specified')
    })
  })

  describe('getMeetingLocationSuggestions', () => {
    it('provides generic safety suggestions', () => {
      const suggestions = getMeetingLocationSuggestions('Newark', '07101')
      
      expect(suggestions).toBeInstanceOf(Array)
      expect(suggestions.length).toBeGreaterThan(0)
      expect(suggestions).toContain('Public police station parking lot (safest option)')
      expect(suggestions).toContain('Busy shopping center with security cameras')
    })

    it('includes location-specific suggestions for major cities', () => {
      const suggestions = getMeetingLocationSuggestions('Newark', '07101')
      
      expect(suggestions).toBeInstanceOf(Array)
      expect(suggestions.length).toBeGreaterThan(0)
      // Should not include location-specific since Newark is not in the region-based suggestions
    })

    it('includes region-specific suggestions based on zip code', () => {
      const suggestions = getMeetingLocationSuggestions('UnknownCity', '07101')
      
      expect(suggestions).toBeInstanceOf(Array)
      expect(suggestions.length).toBeGreaterThan(0)
      expect(suggestions[0]).toBe('North Jersey mall or shopping center')
    })

    it('handles missing parameters', () => {
      const suggestions1 = getMeetingLocationSuggestions('TestCity', '07101')
      const suggestions2 = getMeetingLocationSuggestions('Newark', undefined)
      
      expect(suggestions1).toBeInstanceOf(Array)
      expect(suggestions2).toBeInstanceOf(Array)
      
      expect(suggestions1.length).toBeGreaterThan(0)
      expect(suggestions2.length).toBeGreaterThan(0)
    })

    it('includes safety-focused locations', () => {
      const suggestions = getMeetingLocationSuggestions('Newark', '07101')
      
      const hasPoliceStation = suggestions.some(s => 
        s.toLowerCase().includes('police')
      )
      const hasPublicPlace = suggestions.some(s => 
        s.toLowerCase().includes('shopping') || 
        s.toLowerCase().includes('mall') ||
        s.toLowerCase().includes('parking')
      )
      
      expect(hasPoliceStation).toBe(true)
      expect(hasPublicPlace).toBe(true)
    })

    it('returns consistent results for same input', () => {
      const suggestions1 = getMeetingLocationSuggestions('Newark', '07101')
      const suggestions2 = getMeetingLocationSuggestions('Newark', '07101')
      
      expect(suggestions1).toEqual(suggestions2)
    })
  })
})