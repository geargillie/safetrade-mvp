import { 
  maskLocation, 
  getLocationDisplay, 
  getMeetingLocationSuggestions 
} from '@/lib/locationUtils'

describe('Location Utils', () => {
  describe('maskLocation', () => {
    it('masks location with approximate area', () => {
      const result = maskLocation('Newark', '07101')
      
      expect(result.vicinity).toBe('Newark area, NJ')
      expect(result.maskedZip).toBe('071**')
      expect(result.radius).toBe('~5 mile radius')
    })

    it('handles missing zip code', () => {
      const result = maskLocation('Newark', undefined)
      
      expect(result.vicinity).toBe('Newark area, NJ')
      expect(result.maskedZip).toBe('Unknown')
      expect(result.radius).toBe('~5 mile radius')
    })

    it('handles missing city', () => {
      const result = maskLocation(undefined, '07101')
      
      expect(result.vicinity).toBe('Northern NJ')
      expect(result.maskedZip).toBe('071**')
      expect(result.radius).toBe('~10 mile radius')
    })

    it('handles empty city', () => {
      const result = maskLocation('', '07101')
      
      expect(result.vicinity).toBe('Northern NJ')
      expect(result.maskedZip).toBe('071**')
      expect(result.radius).toBe('~10 mile radius')
    })

    it('masks zip code correctly', () => {
      const testCases = [
        { zip: '07101', expected: '071**' },
        { zip: '08901', expected: '089**' },
        { zip: '12345', expected: '123**' },
        { zip: '1234', expected: '1234' }, // Too short
        { zip: '123', expected: '123' }  // Too short
      ]

      testCases.forEach(({ zip, expected }) => {
        const result = maskLocation('TestCity', zip)
        expect(result.maskedZip).toBe(expected)
      })
    })

    it('provides appropriate radius based on data availability', () => {
      const withBoth = maskLocation('Newark', '07101')
      expect(withBoth.radius).toBe('~5 mile radius')

      const withoutZip = maskLocation('Newark', undefined)
      expect(withoutZip.radius).toBe('~5 mile radius')

      const withoutCity = maskLocation(undefined, '07101')
      expect(withoutCity.radius).toBe('~10 mile radius')
    })
  })

  describe('getLocationDisplay', () => {
    it('displays full location when both city and zip provided', () => {
      const result = getLocationDisplay('Newark', '07101')
      expect(result).toBe('Newark, NJ 07101')
    })

    it('displays city only when zip not provided', () => {
      const result = getLocationDisplay('Newark', undefined)
      expect(result).toBe('Newark, NJ')
    })

    it('displays zip only when city not provided', () => {
      const result = getLocationDisplay(undefined, '07101')
      expect(result).toBe('NJ 07101')
    })

    it('displays fallback when neither provided', () => {
      const result = getLocationDisplay(undefined, undefined)
      expect(result).toBe('New Jersey')
    })

    it('handles empty strings', () => {
      const result = getLocationDisplay('', '')
      expect(result).toBe('New Jersey')
    })

    it('trims whitespace', () => {
      const result = getLocationDisplay('  Newark  ', '  07101  ')
      expect(result).toBe('Newark, NJ 07101')
    })
  })

  describe('getMeetingLocationSuggestions', () => {
    it('provides suggestions for Newark', () => {
      const suggestions = getMeetingLocationSuggestions('Newark', '07101')
      
      expect(suggestions).toBeInstanceOf(Array)
      expect(suggestions.length).toBeGreaterThan(0)
      expect(suggestions).toContain('Newark Police Department - 480 Clinton Ave, Newark, NJ')
      expect(suggestions).toContain('Walmart Supercenter - 395 Chancellor Ave, Newark, NJ')
    })

    it('provides suggestions for Jersey City', () => {
      const suggestions = getMeetingLocationSuggestions('Jersey City', '07302')
      
      expect(suggestions).toBeInstanceOf(Array)
      expect(suggestions.length).toBeGreaterThan(0)
      expect(suggestions.some(s => s.includes('Jersey City'))).toBe(true)
    })

    it('provides suggestions for Trenton', () => {
      const suggestions = getMeetingLocationSuggestions('Trenton', '08608')
      
      expect(suggestions).toBeInstanceOf(Array)
      expect(suggestions.length).toBeGreaterThan(0)
      expect(suggestions.some(s => s.includes('Trenton'))).toBe(true)
    })

    it('provides generic suggestions for unknown cities', () => {
      const suggestions = getMeetingLocationSuggestions('UnknownCity', '99999')
      
      expect(suggestions).toBeInstanceOf(Array)
      expect(suggestions.length).toBeGreaterThan(0)
      expect(suggestions).toContain('Local Police Station')
      expect(suggestions).toContain('Walmart or Target parking lot')
      expect(suggestions).toContain('Shopping mall parking area')
    })

    it('handles missing parameters', () => {
      const suggestions1 = getMeetingLocationSuggestions(undefined, '07101')
      const suggestions2 = getMeetingLocationSuggestions('Newark', undefined)
      const suggestions3 = getMeetingLocationSuggestions(undefined, undefined)
      
      expect(suggestions1).toBeInstanceOf(Array)
      expect(suggestions2).toBeInstanceOf(Array)
      expect(suggestions3).toBeInstanceOf(Array)
      
      expect(suggestions1.length).toBeGreaterThan(0)
      expect(suggestions2.length).toBeGreaterThan(0)
      expect(suggestions3.length).toBeGreaterThan(0)
    })

    it('includes safety-focused locations', () => {
      const suggestions = getMeetingLocationSuggestions('Newark', '07101')
      
      const hasPoliceStation = suggestions.some(s => 
        s.toLowerCase().includes('police') || s.toLowerCase().includes('station')
      )
      const hasPublicPlace = suggestions.some(s => 
        s.toLowerCase().includes('walmart') || 
        s.toLowerCase().includes('target') || 
        s.toLowerCase().includes('mall')
      )
      
      expect(hasPoliceStation).toBe(true)
      expect(hasPublicPlace).toBe(true)
    })

    it('returns consistent results for same input', () => {
      const suggestions1 = getMeetingLocationSuggestions('Newark', '07101')
      const suggestions2 = getMeetingLocationSuggestions('Newark', '07101')
      
      expect(suggestions1).toEqual(suggestions2)
    })

    it('includes address information when available', () => {
      const suggestions = getMeetingLocationSuggestions('Newark', '07101')
      
      const hasAddresses = suggestions.some(s => s.includes(' - '))
      expect(hasAddresses).toBe(true)
    })
  })
})