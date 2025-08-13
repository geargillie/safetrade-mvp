// utils/vinValidation.ts

export interface VINInfo {
  isValid: boolean
  make?: string
  model?: string
  year?: number
  errors: string[]
  formatted?: string
}

export function validateVIN(vin: string): VINInfo {
  const errors: string[] = []
  
  if (!vin) {
    return { isValid: false, errors: ['VIN is required'] }
  }

  // Clean and format VIN
  const cleanVIN = vin.toUpperCase().replace(/[^A-Z0-9]/g, '')
  
  // Check length
  if (cleanVIN.length !== 17) {
    errors.push('VIN must be exactly 17 characters')
  }

  // Check for invalid characters (I, O, Q not allowed in VIN)
  if (/[IOQ]/.test(cleanVIN)) {
    errors.push('VIN cannot contain letters I, O, or Q')
  }

  // VIN checksum validation
  if (cleanVIN.length === 17) {
    const isValidChecksum = validateVINChecksum(cleanVIN)
    if (!isValidChecksum) {
      errors.push('Invalid VIN checksum - this may not be a real VIN')
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    formatted: cleanVIN,
    year: cleanVIN.length === 17 ? decodeVINYear(cleanVIN) : undefined,
    make: cleanVIN.length === 17 ? decodeVINMake(cleanVIN) : undefined
  }
}

function validateVINChecksum(vin: string): boolean {
  const weights = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2]
  const values: { [key: string]: number } = {
    '0': 0, '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
    'A': 1, 'B': 2, 'C': 3, 'D': 4, 'E': 5, 'F': 6, 'G': 7, 'H': 8,
    'J': 1, 'K': 2, 'L': 3, 'M': 4, 'N': 5, 'P': 7, 'R': 9,
    'S': 2, 'T': 3, 'U': 4, 'V': 5, 'W': 6, 'X': 7, 'Y': 8, 'Z': 9
  }

  let sum = 0
  for (let i = 0; i < 17; i++) {
    if (i === 8) continue // Skip check digit position
    const char = vin.charAt(i)
    const value = values[char]
    if (value === undefined) return false
    sum += value * weights[i]
  }

  const checkDigit = sum % 11
  const expectedCheck = checkDigit === 10 ? 'X' : checkDigit.toString()
  
  return vin.charAt(8) === expectedCheck
}

function decodeVINYear(vin: string): number | undefined {
  const yearChar = vin.charAt(9)
  const yearCodes: { [key: string]: number[] } = {
    'A': [1980, 2010], 'B': [1981, 2011], 'C': [1982, 2012], 'D': [1983, 2013],
    'E': [1984, 2014], 'F': [1985, 2015], 'G': [1986, 2016], 'H': [1987, 2017],
    'J': [1988, 2018], 'K': [1989, 2019], 'L': [1990, 2020], 'M': [1991, 2021],
    'N': [1992, 2022], 'P': [1993, 2023], 'R': [1994, 2024], 'S': [1995, 2025],
    'T': [1996, 2026], 'V': [1997, 2027], 'W': [1998, 2028], 'X': [1999, 2029],
    'Y': [2000, 2030], '1': [2001, 2031], '2': [2002, 2032], '3': [2003, 2033],
    '4': [2004, 2034], '5': [2005, 2035], '6': [2006, 2036], '7': [2007, 2037],
    '8': [2008, 2038], '9': [2009, 2039]
  }

  const years = yearCodes[yearChar]
  if (!years) return undefined
  
  // Return the more recent year (2010+ for codes A-H)
  const currentYear = new Date().getFullYear()
  return years[1] <= currentYear ? years[1] : years[0]
}

function decodeVINMake(vin: string): string | undefined {
  const wmi = vin.substring(0, 3) // World Manufacturer Identifier
  
  const manufacturers: { [key: string]: string } = {
    // Common motorcycle manufacturers
    'JH2': 'Honda',
    'JH3': 'Honda', 
    'JYA': 'Yamaha',
    'JYM': 'Yamaha',
    '1HD': 'Harley-Davidson',
    '5HD': 'Harley-Davidson',
    'MEX': 'Harley-Davidson',
    'JS1': 'Suzuki',
    'JS2': 'Suzuki',
    'JKA': 'Kawasaki',
    'JKB': 'Kawasaki',
    'ZDM': 'Ducati',
    'ZD3': 'Ducati',
    // Add more as needed
  }

  return manufacturers[wmi] || 'Unknown'
}

// Free VIN lookup using NHTSA API
export async function lookupVIN(vin: string): Promise<{
  success: boolean
  data?: any
  error?: string
}> {
  try {
    const response = await fetch(
      `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVin/${vin}?format=json`
    )
    
    if (!response.ok) {
      throw new Error('NHTSA API request failed')
    }
    
    const data = await response.json()
    
    if (data.Results) {
      // Extract useful information
      const results = data.Results
      const vehicleInfo = {
        make: results.find((r: any) => r.Variable === 'Make')?.Value,
        model: results.find((r: any) => r.Variable === 'Model')?.Value,
        year: results.find((r: any) => r.Variable === 'Model Year')?.Value,
        vehicleType: results.find((r: any) => r.Variable === 'Vehicle Type')?.Value,
        engineSize: results.find((r: any) => r.Variable === 'Engine Number of Cylinders')?.Value
      }
      
      return { success: true, data: vehicleInfo }
    }
    
    return { success: false, error: 'No vehicle data found' }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export const motorcycleMakes = [
  'Harley-Davidson', 'Honda', 'Yamaha', 'Suzuki', 'Kawasaki', 'Ducati',
  'BMW', 'KTM', 'Triumph', 'Indian', 'Victory', 'Polaris', 'Can-Am',
  'Aprilia', 'Moto Guzzi', 'MV Agusta', 'Benelli', 'Royal Enfield',
  'Zero', 'Other'
]

export const vehicleConditions = [
  'New', 'Excellent', 'Very Good', 'Good', 'Fair', 'Poor', 'Salvage'
]
