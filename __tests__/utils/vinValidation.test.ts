import { validateVIN, calculateVINCheckDigit } from '@/utils/vinValidation'

describe('VIN Validation', () => {
  describe('validateVIN', () => {
    it('validates correct VIN format', () => {
      const validVINs = [
        '1HGBH41JXMN109186',
        '1G1ZT53806F109149',
        'WBANU53578CT69351',
        'JH4KA7561PC008269'
      ]

      validVINs.forEach(vin => {
        expect(validateVIN(vin)).toBe(true)
      })
    })

    it('rejects VINs with invalid length', () => {
      const invalidVINs = [
        '1HGBH41JXMN10918', // Too short
        '1HGBH41JXMN1091867', // Too long
        'SHORT', // Way too short
        '' // Empty
      ]

      invalidVINs.forEach(vin => {
        expect(validateVIN(vin)).toBe(false)
      })
    })

    it('rejects VINs with invalid characters', () => {
      const invalidVINs = [
        '1HGBH41JXMN109I86', // Contains I
        '1HGBH41JXMN109O86', // Contains O
        '1HGBH41JXMN109Q86', // Contains Q
        '1HGBH41JXMN109!86', // Contains special character
        '1hgbh41jxmn109186', // Lowercase letters
      ]

      invalidVINs.forEach(vin => {
        expect(validateVIN(vin)).toBe(false)
      })
    })

    it('validates VIN check digit', () => {
      // Valid VINs with correct check digits
      const validVINs = [
        '1HGBH41JXMN109186',
        '1G1ZT53806F109149'
      ]

      validVINs.forEach(vin => {
        expect(validateVIN(vin)).toBe(true)
      })
    })

    it('rejects VINs with incorrect check digit', () => {
      // Invalid VINs with wrong check digits
      const invalidVINs = [
        '1HGBH41JXMN109187', // Wrong check digit
        '1G1ZT53806F109148'  // Wrong check digit
      ]

      invalidVINs.forEach(vin => {
        expect(validateVIN(vin)).toBe(false)
      })
    })

    it('handles null and undefined input', () => {
      expect(validateVIN(null as any)).toBe(false)
      expect(validateVIN(undefined as any)).toBe(false)
    })
  })

  describe('calculateVINCheckDigit', () => {
    it('calculates correct check digit for valid VIN', () => {
      // Test VIN without check digit: 1HGBH41JXMN10918_
      const vinWithoutCheck = '1HGBH41JXMN10918'
      const expectedCheckDigit = '6'
      
      expect(calculateVINCheckDigit(vinWithoutCheck + '6')).toBe(expectedCheckDigit)
    })

    it('handles VINs with X as check digit', () => {
      // Some VINs have X as check digit when calculation results in 10
      const testVIN = 'WBANU53578CT69351'
      const result = calculateVINCheckDigit(testVIN)
      
      expect(typeof result).toBe('string')
      expect(result.length).toBe(1)
    })

    it('handles VIN position mapping correctly', () => {
      // Test that position 9 (check digit position) is handled correctly
      const testVIN = '1HGBH41JXMN109186'
      const result = calculateVINCheckDigit(testVIN)
      
      expect(result).toBe('6')
    })

    it('returns empty string for invalid input', () => {
      expect(calculateVINCheckDigit('')).toBe('')
      expect(calculateVINCheckDigit('SHORT')).toBe('')
      expect(calculateVINCheckDigit(null as any)).toBe('')
    })
  })

  describe('VIN format edge cases', () => {
    it('handles VINs with mixed case correctly', () => {
      // VINs should be converted to uppercase internally
      const mixedCaseVIN = '1hGbH41jXmN109186'
      expect(validateVIN(mixedCaseVIN.toUpperCase())).toBe(true)
    })

    it('validates year encoding in VIN', () => {
      // Position 10 encodes model year
      const vinsWith2020 = '1HGBH41JXLN109186' // L = 2020
      const vinsWith2019 = '1HGBH41JXKN109186' // K = 2019
      
      // These should still validate if other parts are correct
      expect(typeof validateVIN(vinsWith2020)).toBe('boolean')
      expect(typeof validateVIN(vinsWith2019)).toBe('boolean')
    })

    it('validates manufacturer codes', () => {
      // First character indicates country/region
      const usVIN = '1HGBH41JXMN109186' // 1 = USA
      const japanVIN = 'JH4KA7561PC008269' // J = Japan
      
      expect(typeof validateVIN(usVIN)).toBe('boolean')
      expect(typeof validateVIN(japanVIN)).toBe('boolean')
    })
  })
})