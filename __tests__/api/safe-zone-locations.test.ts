import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock Supabase client
const mockSupabase = {
  from: jest.fn(() => mockSupabase),
  select: jest.fn(() => mockSupabase),
  insert: jest.fn(() => mockSupabase),
  eq: jest.fn(() => mockSupabase),
  order: jest.fn(() => mockSupabase),
  single: jest.fn(() => mockSupabase)
};

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabase)
}));

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';

describe('Safe Zone Locations API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/safe-zone/locations', () => {
    const mockSafeZones = [
      {
        id: '1',
        name: 'Newark Police Station',
        address: '26 Green St, Newark, NJ',
        city: 'Newark',
        zip_code: '07102',
        type: 'police_station',
        features: ['24_7', 'security_cameras', 'police_presence'],
        verified: true
      },
      {
        id: '2',
        name: 'Target - Brick City',
        address: '80 Bergen St, Newark, NJ',
        city: 'Newark',
        zip_code: '07103',
        type: 'parking_lot',
        features: ['security_cameras', 'well_lit', 'busy_area'],
        verified: true
      },
      {
        id: '3',
        name: 'Branch Brook Park',
        address: 'Branch Brook Park Dr, Newark, NJ',
        city: 'Newark',
        zip_code: '07104',
        type: 'public',
        features: ['well_lit', 'busy_area', 'daytime_only'],
        verified: true
      }
    ];

    it('should return safe zones for a city', async () => {
      mockSupabase.select.mockResolvedValueOnce({
        data: mockSafeZones,
        error: null
      });

      const { GET } = await import('../../app/api/safe-zone/locations/route');
      const request = new Request('http://localhost:3001/api/safe-zone/locations?city=Newark');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.safeZones).toHaveLength(3);
      expect(data.count).toBe(3);
      expect(data.groupedByType).toHaveProperty('police_station');
      expect(data.groupedByType).toHaveProperty('parking_lot');
      expect(data.groupedByType).toHaveProperty('public');
    });

    it('should filter by zip code when provided', async () => {
      const filteredZones = mockSafeZones.filter(z => z.zip_code === '07102');
      mockSupabase.select.mockResolvedValueOnce({
        data: filteredZones,
        error: null
      });

      const { GET } = await import('../../app/api/safe-zone/locations/route');
      const request = new Request('http://localhost:3001/api/safe-zone/locations?city=Newark&zipCode=07102');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.safeZones).toHaveLength(1);
      expect(data.safeZones[0].zip_code).toBe('07102');
    });

    it('should filter by type when provided', async () => {
      const policeStations = mockSafeZones.filter(z => z.type === 'police_station');
      mockSupabase.select.mockResolvedValueOnce({
        data: policeStations,
        error: null
      });

      const { GET } = await import('../../app/api/safe-zone/locations/route');
      const request = new Request('http://localhost:3001/api/safe-zone/locations?city=Newark&type=police_station');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.safeZones).toHaveLength(1);
      expect(data.safeZones[0].type).toBe('police_station');
    });

    it('should return 400 when city parameter is missing', async () => {
      const { GET } = await import('../../app/api/safe-zone/locations/route');
      const request = new Request('http://localhost:3001/api/safe-zone/locations');
      const response = await GET(request);

      expect(response.status).toBe(400);
    });

    it('should handle database errors', async () => {
      mockSupabase.select.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database connection failed' }
      });

      const { GET } = await import('../../app/api/safe-zone/locations/route');
      const request = new Request('http://localhost:3001/api/safe-zone/locations?city=Newark');
      const response = await GET(request);

      expect(response.status).toBe(500);
    });

    it('should return type order correctly', async () => {
      mockSupabase.select.mockResolvedValueOnce({
        data: mockSafeZones,
        error: null
      });

      const { GET } = await import('../../app/api/safe-zone/locations/route');
      const request = new Request('http://localhost:3001/api/safe-zone/locations?city=Newark');
      const response = await GET(request);
      const data = await response.json();

      expect(data.typeOrder).toEqual(['police_station', 'parking_lot', 'public']);
    });
  });

  describe('POST /api/safe-zone/locations', () => {
    it('should create a new safe zone', async () => {
      const newSafeZone = {
        id: '4',
        name: 'New Police Station',
        address: '123 Test St, Newark, NJ',
        city: 'Newark',
        zip_code: '07105',
        type: 'police_station',
        features: ['24_7', 'security_cameras'],
        verified: true
      };

      mockSupabase.single.mockResolvedValueOnce({
        data: newSafeZone,
        error: null
      });

      const { POST } = await import('../../app/api/safe-zone/locations/route');
      const request = new Request('http://localhost:3001/api/safe-zone/locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'New Police Station',
          address: '123 Test St, Newark, NJ',
          city: 'Newark',
          zipCode: '07105',
          type: 'police_station',
          features: ['24_7', 'security_cameras']
        })
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.safeZone.name).toBe('New Police Station');
      expect(data.message).toContain('created successfully');
    });

    it('should return 400 for missing required fields', async () => {
      const { POST } = await import('../../app/api/safe-zone/locations/route');
      const request = new Request('http://localhost:3001/api/safe-zone/locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test Location'
          // Missing required fields
        })
      });
      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it('should handle database errors during creation', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Unique constraint violation' }
      });

      const { POST } = await import('../../app/api/safe-zone/locations/route');
      const request = new Request('http://localhost:3001/api/safe-zone/locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test Location',
          address: '123 Test St',
          city: 'Newark',
          type: 'police_station'
        })
      });
      const response = await POST(request);

      expect(response.status).toBe(500);
    });
  });
});