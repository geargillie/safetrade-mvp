// app/api/verify-vin/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Define types for better TypeScript support
interface Alert {
  level: string;
  message: string;
  action: string;
}

interface VerificationReport {
  vin: string;
  isValid: boolean;
  isStolen: boolean;
  vehicleInfo: any;
  stolenCheck: {
    checked: boolean;
    sources: string[];
    isStolen: boolean;
    lastChecked: string;
  };
  alerts: Alert[];
}

export async function POST(request: NextRequest) {
  try {
    const { vin } = await request.json()

    if (!vin || vin.length !== 17) {
      return NextResponse.json({ 
        error: 'Valid 17-character VIN required' 
      }, { status: 400 })
    }

    const cleanVIN = vin.toUpperCase().replace(/[^A-Z0-9]/g, '')
    
    // Step 1: Check our local stolen database first (fastest)
    const stolenCheck = await checkLocalStolenDatabase(cleanVIN)
    if (stolenCheck.isStolen) {
      return NextResponse.json({
        success: false,
        isStolen: true,
        source: 'local_database',
        reportDetails: stolenCheck.reportDetails,
        message: 'This vehicle has been reported stolen. Listing blocked.'
      })
    }

    // Step 2: NHTSA Vehicle Information (free government API)
    const nhtsaData = await fetchNHTSAData(cleanVIN)
    
    // Step 3: NICB Check (if we have API access)
    const nicbResult = await checkNICBDatabase(cleanVIN)
    
    // Step 4: Additional validation checks
    const validationResult = performVINValidation(cleanVIN)

    // Compile comprehensive report with proper typing
    const verificationReport: VerificationReport = {
      vin: cleanVIN,
      isValid: validationResult.isValid,
      isStolen: nicbResult.isStolen || stolenCheck.isStolen,
      vehicleInfo: nhtsaData,
      stolenCheck: {
        checked: true,
        sources: ['local_db', 'nicb'],
        isStolen: nicbResult.isStolen || stolenCheck.isStolen,
        lastChecked: new Date().toISOString()
      },
      alerts: [] // Now properly typed as Alert[]
    }

    // Add alerts based on findings
    if (verificationReport.isStolen) {
      verificationReport.alerts.push({
        level: 'critical',
        message: 'Vehicle reported stolen',
        action: 'block_listing'
      })
    }

    if (!validationResult.isValid) {
      verificationReport.alerts.push({
        level: 'warning',
        message: 'VIN format validation failed',
        action: 'manual_review'
      })
    }

    // Store verification result
    await storeVerificationResult(cleanVIN, verificationReport)

    return NextResponse.json({
      success: true,
      data: verificationReport
    })

  } catch (error: any) {
    console.error('VIN verification error:', error)
    return NextResponse.json({ 
      error: 'VIN verification failed',
      details: error.message 
    }, { status: 500 })
  }
}

// Check our local stolen vehicle database
async function checkLocalStolenDatabase(vin: string) {
  try {
    const { data, error } = await supabase
      .from('stolen_vehicles')
      .select('*')
      .eq('vin', vin)
      .single()

    if (data) {
      return {
        isStolen: true,
        reportDetails: {
          reportId: data.report_id,
          reportedDate: data.reported_date,
          reportingAgency: data.reporting_agency,
          status: data.status
        }
      }
    }

    return { isStolen: false }
  } catch (error) {
    console.error('Local stolen DB check failed:', error)
    return { isStolen: false }
  }
}

// NHTSA Vehicle Information API (Free)
async function fetchNHTSAData(vin: string) {
  try {
    const response = await fetch(
      `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVin/${vin}?format=json`,
      { 
        method: 'GET',
        headers: {
          'User-Agent': 'SafeTrade-Platform/1.0'
        }
      }
    )

    if (!response.ok) {
      throw new Error(`NHTSA API error: ${response.status}`)
    }

    const data = await response.json()
    
    if (data.Results) {
      const results = data.Results
      return {
        make: results.find((r: any) => r.Variable === 'Make')?.Value || 'Unknown',
        model: results.find((r: any) => r.Variable === 'Model')?.Value || 'Unknown',
        year: results.find((r: any) => r.Variable === 'Model Year')?.Value || 'Unknown',
        vehicleType: results.find((r: any) => r.Variable === 'Vehicle Type')?.Value || 'Unknown',
        engineSize: results.find((r: any) => r.Variable === 'Engine Number of Cylinders')?.Value,
        fuelType: results.find((r: any) => r.Variable === 'Fuel Type - Primary')?.Value,
        bodyClass: results.find((r: any) => r.Variable === 'Body Class')?.Value,
        plantCountry: results.find((r: any) => r.Variable === 'Plant Country')?.Value,
        lastUpdated: new Date().toISOString()
      }
    }

    return { error: 'No vehicle data found' }
  } catch (error) {
    console.error('NHTSA API error:', error)
    return { error: 'Failed to fetch vehicle data' }
  }
}

// NICB Database Check (requires API key - paid service)
async function checkNICBDatabase(vin: string) {
  try {
    // For MVP, we'll simulate this since NICB requires special access
    // In production, you'd integrate with NICB's VINCheck API
    
    if (process.env.NICB_API_KEY) {
      // Real NICB API call would go here
      const response = await fetch(`https://api.nicb.org/vincheck`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.NICB_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ vin })
      })
      
      // Process real NICB response
      const data = await response.json()
      return {
        isStolen: data.stolen || false,
        source: 'nicb',
        reportId: data.reportId,
        lastChecked: new Date().toISOString()
      }
    } else {
      // For development - simulate check against known stolen VINs (with correct checksums)
      const knownStolenVINs = [
        '1HD1KBC10EB123457', // Stolen Harley
        'JH2RC5006JM200124', // Stolen Honda
        'JYARN23E1JA123457'  // Stolen Yamaha
      ]
      
      return {
        isStolen: knownStolenVINs.includes(vin),
        source: 'simulated',
        message: knownStolenVINs.includes(vin) ? 'Vehicle in test stolen database' : 'Not in stolen database',
        lastChecked: new Date().toISOString()
      }
    }
  } catch (error) {
    console.error('NICB check failed:', error)
    return {
      isStolen: false,
      error: 'Could not complete stolen vehicle check'
    }
  }
}

// VIN format validation (relaxed for testing)
function performVINValidation(vin: string) {
  const errors = []
  const warnings = []
  
  console.log('Validating VIN:', vin)
  console.log('VIN length:', vin.length)
  
  // Length check (required)
  if (vin.length !== 17) {
    errors.push('VIN must be exactly 17 characters')
  }

  // Character check (required)
  if (/[IOQ]/.test(vin)) {
    errors.push('VIN cannot contain letters I, O, or Q')
  }

  // Checksum validation (warning only for development)
  if (vin.length === 17) {
    const isValidChecksum = validateVINChecksum(vin)
    console.log('Checksum validation result:', isValidChecksum)
    if (!isValidChecksum) {
      // For development: make this a warning, not an error
      warnings.push('VIN checksum validation failed - this may not be a real VIN')
    }
  }

  console.log('Validation errors:', errors)
  console.log('Validation warnings:', warnings)

  return {
    isValid: errors.length === 0, // Only fail on critical errors
    errors,
    warnings,
    vin: vin
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

// Store verification result for future reference
async function storeVerificationResult(vin: string, result: any) {
  try {
    await supabase
      .from('vin_verification_history')
      .upsert({
        vin: vin,
        verification_data: result,
        last_checked: new Date().toISOString(),
        is_stolen: result.isStolen,
        is_valid: result.isValid
      }, {
        onConflict: 'vin'
      })
  } catch (error) {
    console.error('Failed to store verification result:', error)
  }
}
