import { POST } from '@/app/api/verify-vin/route'
import { NextRequest } from 'next/server'

describe('/api/verify-vin', () => {
  it('validates VIN format', async () => {
    const requestData = {
      vin: '1HGBH41JXMN109186', // Valid VIN format
    }

    const request = new NextRequest('http://localhost/api/verify-vin', {
      method: 'POST',
      body: JSON.stringify(requestData),
      headers: { 'Content-Type': 'application/json' }
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.isValid).toBe(true)
    expect(data.isStolen).toBe(false)
  })

  it('rejects invalid VIN format', async () => {
    const requestData = {
      vin: 'INVALID123', // Invalid VIN format
    }

    const request = new NextRequest('http://localhost/api/verify-vin', {
      method: 'POST',
      body: JSON.stringify(requestData),
      headers: { 'Content-Type': 'application/json' }
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.isValid).toBe(false)
    expect(data.warnings).toContain('Invalid VIN format')
  })

  it('handles missing VIN', async () => {
    const requestData = {}

    const request = new NextRequest('http://localhost/api/verify-vin', {
      method: 'POST',
      body: JSON.stringify(requestData),
      headers: { 'Content-Type': 'application/json' }
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('VIN is required')
  })

  it('provides vehicle information for valid VIN', async () => {
    const requestData = {
      vin: '1HGBH41JXMN109186', // Honda VIN
    }

    const request = new NextRequest('http://localhost/api/verify-vin', {
      method: 'POST',
      body: JSON.stringify(requestData),
      headers: { 'Content-Type': 'application/json' }
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.vehicleInfo).toBeDefined()
    expect(data.vehicleInfo.make).toBeDefined()
    expect(data.vehicleInfo.model).toBeDefined()
    expect(data.vehicleInfo.year).toBeDefined()
  })

  it('performs stolen vehicle check', async () => {
    const requestData = {
      vin: '1HGBH41JXMN109186',
    }

    const request = new NextRequest('http://localhost/api/verify-vin', {
      method: 'POST',
      body: JSON.stringify(requestData),
      headers: { 'Content-Type': 'application/json' }
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.stolenCheck).toBeDefined()
    expect(data.stolenCheck.details).toBeDefined()
    expect(data.stolenCheck.lastChecked).toBeDefined()
    expect(typeof data.isStolen).toBe('boolean')
  })

  it('handles malformed request body', async () => {
    const request = new NextRequest('http://localhost/api/verify-vin', {
      method: 'POST',
      body: 'invalid json',
      headers: { 'Content-Type': 'application/json' }
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBeDefined()
  })
})