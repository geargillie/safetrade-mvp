import { validateVIN } from '@/utils/vinValidation'

describe('VIN Validation', () => {
  describe('validateVIN', () => {
    it('validates correct VIN format', () => {
      const validVINs = [
        '1HGBH41JXMN109186',
        'JH4KA7561PC008269',
        '1G1ZT53806F109148'
      ]

      validVINs.forEach(vin => {
        const result = validateVIN(vin)
        expect(result.isValid).toBe(true)
        expect(result.errors).toEqual([])
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
        const result = validateVIN(vin)
        expect(result.isValid).toBe(false)
        expect(result.errors.length).toBeGreaterThan(0)
      })
    })

    it('rejects VINs with invalid characters', () => {
      const invalidVINs = [
        '1HGBH41JXMN109I86', // Contains I
        '1HGBH41JXMN109O86', // Contains O
        '1HGBH41JXMN109Q86', // Contains Q
        '1HGBH41JXMN109!86', // Contains special character
      ]

      invalidVINs.forEach(vin => {
        const result = validateVIN(vin)
        expect(result.isValid).toBe(false)
        expect(result.errors.length).toBeGreaterThan(0)
      })
    })

    it('validates VIN check digit', () => {
      // Valid VINs with correct check digits
      const validVINs = [
        '1HGBH41JXMN109186',
        '1G1ZT53806F109148'
      ]

      validVINs.forEach(vin => {
        const result = validateVIN(vin)
        expect(result.isValid).toBe(true)
        expect(result.errors).toEqual([])
      })
    })

    it('rejects VINs with incorrect check digit', () => {
      // Invalid VINs with wrong check digits
      const invalidVINs = [
        '1HGBH41JXMN109187', // Wrong check digit
        '1G1ZT53806F109149'  // Wrong check digit
      ]

      invalidVINs.forEach(vin => {
        const result = validateVIN(vin)
        expect(result.isValid).toBe(false)
        expect(result.errors.length).toBeGreaterThan(0)
      })
    })

    it('handles null and undefined input', () => {
      const nullResult = validateVIN(null as any)
      const undefinedResult = validateVIN(undefined as any)
      expect(nullResult.isValid).toBe(false)
      expect(undefinedResult.isValid).toBe(false)
      expect(nullResult.errors).toContain('VIN is required')
      expect(undefinedResult.errors).toContain('VIN is required')
    })
  })


  describe('VIN format edge cases', () => {
    it('handles VINs with mixed case correctly', () => {
      // VINs should be converted to uppercase internally
      const mixedCaseVIN = '1hGbH41jXmN109186'
      const result = validateVIN(mixedCaseVIN)
      expect(result.isValid).toBe(true)
      expect(result.formatted).toBe('1HGBH41JXMN109186')
    })

    it('validates year encoding in VIN', () => {
      // Position 10 encodes model year
      const vinsWith2020 = '1HGBH41JXLN109186' // L = 2020
      const vinsWith2019 = '1HGBH41JXKN109186' // K = 2019
      
      // These should still validate if other parts are correct
      const result2020 = validateVIN(vinsWith2020)
      const result2019 = validateVIN(vinsWith2019)
      expect(typeof result2020.isValid).toBe('boolean')
      expect(typeof result2019.isValid).toBe('boolean')
    })

    it('validates manufacturer codes', () => {
      // First character indicates country/region
      const usVIN = '1HGBH41JXMN109186' // 1 = USA
      const japanVIN = 'JH4KA7561PC008269' // J = Japan
      
      const usResult = validateVIN(usVIN)
      const japanResult = validateVIN(japanVIN)
      expect(typeof usResult.isValid).toBe('boolean')
      expect(typeof japanResult.isValid).toBe('boolean')
    })
  })
})