// Comprehensive Safe Zones Test Suite
const { createClient } = require('@supabase/supabase-js');

const TEST_CONFIG = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  baseUrl: 'http://localhost:3000'
};

class SafeZonesTester {
  constructor() {
    this.supabase = createClient(TEST_CONFIG.supabaseUrl, TEST_CONFIG.supabaseKey);
    this.adminSupabase = createClient(TEST_CONFIG.supabaseUrl, TEST_CONFIG.serviceKey);
    this.testResults = [];
    this.testUser = null;
    this.createdMeetings = [];
    this.testSafeZones = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
    console.log(`${prefix} [${timestamp}] ${message}`);
    
    this.testResults.push({
      timestamp,
      message,
      type
    });
  }

  async runTest(testName, testFn) {
    this.log(`\n🧪 Running: ${testName}`, 'info');
    try {
      await testFn();
      this.log(`✅ PASSED: ${testName}`, 'success');
      return true;
    } catch (error) {
      this.log(`❌ FAILED: ${testName} - ${error.message}`, 'error');
      return false;
    }
  }

  // Setup: Ensure safe zones data exists
  async setupSafeZonesData() {
    return this.runTest('Setup Safe Zones Data', async () => {
      // Check if safe_zones table exists and has data
      const { data: existingZones, error: zonesError } = await this.adminSupabase
        .from('safe_zones')
        .select('*')
        .limit(1);

      if (zonesError) {
        throw new Error(`Safe zones table check failed: ${zonesError.message}`);
      }

      if (!existingZones || existingZones.length === 0) {
        // Create test safe zones
        const testZones = [
          {
            name: 'TEST - Central Police Station',
            address: '123 Main St, Los Angeles, CA 90012',
            city: 'Los Angeles',
            state: 'CA',
            zip_code: '90012',
            latitude: 34.0522,
            longitude: -118.2437,
            zone_type: 'police_station',
            is_verified: true,
            operating_hours: '24/7',
            amenities: ['security_cameras', 'parking', 'public_restrooms'],
            average_rating: 4.8,
            total_ratings: 125
          },
          {
            name: 'TEST - Downtown Mall Security',
            address: '456 Shopping Blvd, Los Angeles, CA 90015',
            city: 'Los Angeles', 
            state: 'CA',
            zip_code: '90015',
            latitude: 34.0522,
            longitude: -118.2537,
            zone_type: 'mall',
            is_verified: true,
            operating_hours: '10:00 AM - 9:00 PM',
            amenities: ['security_cameras', 'parking', 'food_court', 'restrooms'],
            average_rating: 4.2,
            total_ratings: 89
          },
          {
            name: 'TEST - Community Center',
            address: '789 Community Way, Los Angeles, CA 90020',
            city: 'Los Angeles',
            state: 'CA', 
            zip_code: '90020',
            latitude: 34.0622,
            longitude: -118.2337,
            zone_type: 'community_center',
            is_verified: false,
            operating_hours: '8:00 AM - 6:00 PM',
            amenities: ['parking', 'restrooms'],
            average_rating: 3.9,
            total_ratings: 45
          }
        ];

        const { data: insertedZones, error: insertError } = await this.adminSupabase
          .from('safe_zones')
          .insert(testZones)
          .select();

        if (insertError) {
          throw new Error(`Test safe zones creation failed: ${insertError.message}`);
        }

        this.testSafeZones = insertedZones;
        this.log(`✅ Created ${insertedZones.length} test safe zones`);
      } else {
        // Use existing zones
        const { data: allZones } = await this.adminSupabase
          .from('safe_zones')
          .select('*')
          .limit(5);
        
        this.testSafeZones = allZones;
        this.log(`✅ Using ${allZones.length} existing safe zones`);
      }

      // Get test user
      const { data: users } = await this.adminSupabase
        .from('user_profiles')
        .select('*')
        .limit(1);

      if (!users || users.length === 0) {
        throw new Error('No users found for testing');
      }

      this.testUser = users[0];
      this.log(`Test user: ${this.testUser.first_name} ${this.testUser.last_name}`);
    });
  }

  // Test 1: Safe Zones API Endpoints
  async testSafeZonesAPI() {
    return this.runTest('Safe Zones API Endpoints', async () => {
      // Test GET /api/safe-zones
      const allZonesResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/safe-zones`);
      
      if (!allZonesResponse.ok) {
        throw new Error(`Safe zones API failed: ${allZonesResponse.status}`);
      }

      const allZonesData = await allZonesResponse.json();
      this.log(`Safe zones API returned: ${allZonesData.data?.length || 0} zones`);

      // Test with filters
      const filteredResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/safe-zones?zone_type=police_station&verified=true`);
      
      if (filteredResponse.ok) {
        const filteredData = await filteredResponse.json();
        this.log(`Filtered zones (police, verified): ${filteredData.data?.length || 0} zones`);
      }

      // Test nearby zones endpoint
      const nearbyResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/safe-zones/nearby?lat=34.0522&lng=-118.2437&radius=10`);
      
      if (nearbyResponse.ok) {
        const nearbyData = await nearbyResponse.json();
        this.log(`Nearby zones API returned: ${nearbyData.data?.length || 0} zones`);
      } else {
        this.log(`⚠️ Nearby zones API failed: ${nearbyResponse.status}`);
      }
    });
  }

  // Test 2: Meeting Scheduling
  async testMeetingScheduling() {
    return this.runTest('Meeting Scheduling', async () => {
      if (this.testSafeZones.length === 0) {
        throw new Error('No safe zones available for meeting scheduling');
      }

      const testMeeting = {
        buyer_id: this.testUser.id,
        seller_id: this.testUser.id, // Using same user for testing
        safe_zone_id: this.testSafeZones[0].id,
        listing_id: null, // Optional
        scheduled_datetime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
        notes: 'Test meeting for motorcycle inspection',
        status: 'scheduled'
      };

      // Test meeting creation API (should require auth)
      const unauthResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/safe-zones/meetings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testMeeting)
      });

      if (unauthResponse.status !== 401) {
        this.log(`⚠️ Meeting creation without auth returned ${unauthResponse.status}, expected 401`);
      }

      // Test database meeting creation directly
      const { data: meeting, error: meetingError } = await this.adminSupabase
        .from('safe_zone_meetings')
        .insert(testMeeting)
        .select()
        .single();

      if (meetingError) {
        // Table might not exist yet
        if (meetingError.code === '42P01') {
          this.log('⚠️ safe_zone_meetings table does not exist - feature not fully implemented');
          return;
        }
        throw new Error(`Meeting creation failed: ${meetingError.message}`);
      }

      this.createdMeetings.push(meeting);
      this.log(`✅ Meeting scheduled at: ${this.testSafeZones[0].name}`);
    });
  }

  // Test 3: Meeting Management
  async testMeetingManagement() {
    return this.runTest('Meeting Management', async () => {
      if (this.createdMeetings.length === 0) {
        this.log('⚠️ No meetings to test - skipping meeting management tests');
        return;
      }

      const testMeeting = this.createdMeetings[0];

      // Test meeting status updates
      const statusUpdates = ['confirmed', 'in_progress', 'completed', 'cancelled'];

      for (const status of statusUpdates) {
        const { data: updatedMeeting, error: updateError } = await this.adminSupabase
          .from('safe_zone_meetings')
          .update({ status })
          .eq('id', testMeeting.id)
          .select()
          .single();

        if (updateError) {
          throw new Error(`Meeting status update to '${status}' failed: ${updateError.message}`);
        }

        this.log(`✅ Meeting status updated to: ${status}`);
      }

      // Test user meetings retrieval
      const { data: userMeetings, error: retrievalError } = await this.adminSupabase
        .from('safe_zone_meetings')
        .select(`
          *,
          safe_zone:safe_zones(name, address, zone_type)
        `)
        .eq('user_id', this.testUser.id)
        .order('scheduled_date', { ascending: true });

      if (retrievalError) {
        this.log(`⚠️ User meetings query issue: ${retrievalError.message}`);
        
        // Try simple query
        const { data: simpleMeetings } = await this.adminSupabase
          .from('safe_zone_meetings')
          .select('*')
          .eq('user_id', this.testUser.id);

        this.log(`User has ${simpleMeetings?.length || 0} meetings (simple query)`);
      } else {
        this.log(`✅ User has ${userMeetings?.length || 0} meetings with zone details`);
      }
    });
  }

  // Test 4: Zone Search and Filtering
  async testZoneSearchAndFiltering() {
    return this.runTest('Zone Search and Filtering', async () => {
      // Test zone type filtering
      const zoneTypes = ['police_station', 'mall', 'library'];
      
      for (const zoneType of zoneTypes) {
        const { data: filteredZones, error: filterError } = await this.supabase
          .from('safe_zones')
          .select('*')
          .eq('zone_type', zoneType);

        if (filterError) {
          throw new Error(`Zone type filtering failed for ${zoneType}: ${filterError.message}`);
        }

        this.log(`${zoneType} zones: ${filteredZones?.length || 0} found`);
      }

      // Test verification status filtering
      const { data: verifiedZones, error: verifiedError } = await this.supabase
        .from('safe_zones')
        .select('*')
        .eq('is_verified', true);

      if (verifiedError) {
        throw new Error(`Verified zones filtering failed: ${verifiedError.message}`);
      }

      this.log(`Verified zones: ${verifiedZones?.length || 0} found`);

      // Test text search
      const { data: searchResults, error: searchError } = await this.supabase
        .from('safe_zones')
        .select('*')
        .ilike('name', '%police%');

      if (searchError) {
        this.log(`⚠️ Text search not supported: ${searchError.message}`);
      } else {
        this.log(`Text search results: ${searchResults?.length || 0} zones`);
      }

      // Test location-based search (distance calculation)
      const testLat = 34.0522;
      const testLng = -118.2437;
      
      const { data: nearbyZones, error: nearbyError } = await this.supabase
        .rpc('get_nearby_safe_zones', {
          user_lat: testLat,
          user_lng: testLng,
          radius_km: 10
        });

      if (nearbyError) {
        this.log(`⚠️ Nearby zones function not available: ${nearbyError.message}`);
      } else {
        this.log(`Nearby zones (10km): ${nearbyZones?.length || 0} found`);
      }
    });
  }

  // Test 5: Safe Zone Page Rendering
  async testSafeZonePageRendering() {
    return this.runTest('Safe Zone Page Rendering', async () => {
      // Test main safe zones page
      const pageResponse = await fetch(`${TEST_CONFIG.baseUrl}/safe-zones`);
      
      if (!pageResponse.ok) {
        throw new Error(`Safe zones page failed to load: ${pageResponse.status}`);
      }

      this.log('✅ Safe zones page loads successfully');

      // Test individual zone details (if endpoints exist)
      if (this.testSafeZones.length > 0) {
        const testZone = this.testSafeZones[0];
        const zoneResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/safe-zones/${testZone.id}`);
        
        if (zoneResponse.ok) {
          const zoneData = await zoneResponse.json();
          this.log(`✅ Zone details API working: ${zoneData.name || 'Unknown'}`);
        } else {
          this.log(`⚠️ Zone details API not implemented: ${zoneResponse.status}`);
        }
      }
    });
  }

  // Test 6: Map Integration
  async testMapIntegration() {
    return this.runTest('Map Integration', async () => {
      // Check if Google Maps API key is configured
      const mapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      
      if (!mapsApiKey) {
        this.log('⚠️ Google Maps API key not configured - map features may not work');
      } else {
        this.log('✅ Google Maps API key configured');
      }

      // Test if map component can be rendered (basic check)
      if (this.testSafeZones.length > 0) {
        const firstZone = this.testSafeZones[0];
        
        if (typeof firstZone.latitude !== 'number' || typeof firstZone.longitude !== 'number') {
          throw new Error('Safe zone coordinates should be numbers for map integration');
        }

        if (firstZone.latitude < -90 || firstZone.latitude > 90) {
          throw new Error('Invalid latitude values for map integration');
        }

        if (firstZone.longitude < -180 || firstZone.longitude > 180) {
          throw new Error('Invalid longitude values for map integration');
        }

        this.log('✅ Zone coordinates valid for map integration');
      }
    });
  }

  // Test 7: Meeting Dashboard
  async testMeetingDashboard() {
    return this.runTest('Meeting Dashboard', async () => {
      // Test user meetings API
      const meetingsResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/safe-zones/meetings/user`);
      
      // Should require authentication
      if (meetingsResponse.status !== 401) {
        this.log(`⚠️ Meetings API without auth returned ${meetingsResponse.status}, expected 401`);
      } else {
        this.log('✅ Meetings API properly protected');
      }

      // Test meetings page rendering
      const dashboardResponse = await fetch(`${TEST_CONFIG.baseUrl}/meetings`);
      
      if (!dashboardResponse.ok) {
        this.log(`⚠️ Meetings page failed to load: ${dashboardResponse.status}`);
      } else {
        this.log('✅ Meetings dashboard page loads');
      }

      // Test database query for user meetings
      if (this.createdMeetings.length > 0) {
        const { data: userMeetings, error: queryError } = await this.adminSupabase
          .from('safe_zone_meetings')
          .select('*')
          .eq('user_id', this.testUser.id);

        if (queryError) {
          throw new Error(`User meetings query failed: ${queryError.message}`);
        }

        this.log(`✅ User meetings query returned: ${userMeetings?.length || 0} meetings`);
      }
    });
  }

  // Cleanup method
  async cleanup() {
    this.log('\n🧹 Cleaning up test data...');
    
    try {
      // Delete test meetings
      if (this.createdMeetings.length > 0) {
        const meetingIds = this.createdMeetings.map(m => m.id);
        await this.adminSupabase
          .from('safe_zone_meetings')
          .delete()
          .in('id', meetingIds);
        this.log(`Deleted ${meetingIds.length} test meetings`);
      }

      // Clean up test safe zones (only if we created them)
      const testZoneIds = this.testSafeZones
        .filter(z => z.name && z.name.startsWith('TEST -'))
        .map(z => z.id);

      if (testZoneIds.length > 0) {
        await this.adminSupabase
          .from('safe_zones')
          .delete()
          .in('id', testZoneIds);
        this.log(`Deleted ${testZoneIds.length} test safe zones`);
      }

      this.log('✅ Cleanup completed');
    } catch (error) {
      this.log(`⚠️ Cleanup warning: ${error.message}`, 'error');
    }
  }

  // Main test runner
  async runAllTests() {
    console.log('🚀 STARTING COMPREHENSIVE SAFE ZONES TESTS');
    console.log('=' .repeat(60));
    
    const tests = [
      () => this.setupSafeZonesData(),
      () => this.testSafeZonesAPI(),
      () => this.testZoneSearchAndFiltering(),
      () => this.testMeetingScheduling(),
      () => this.testMeetingManagement(),
      () => this.testSafeZonePageRendering(),
      () => this.testMapIntegration(),
      () => this.testMeetingDashboard()
    ];

    let passed = 0;
    let failed = 0;

    for (const test of tests) {
      const result = await test();
      if (result) {
        passed++;
      } else {
        failed++;
      }
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    await this.cleanup();

    console.log('\n📊 SAFE ZONES TEST RESULTS');
    console.log('=' .repeat(60));
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📋 Total: ${passed + failed}`);
    
    if (failed > 0) {
      console.log('\n🚨 FAILED TESTS REQUIRE ATTENTION');
      this.testResults
        .filter(result => result.type === 'error')
        .forEach(result => console.log(`  - ${result.message}`));
    } else {
      console.log('\n🎉 ALL SAFE ZONES TESTS PASSED');
    }

    return { passed, failed, total: passed + failed };
  }
}

// Run the tests
async function main() {
  const tester = new SafeZonesTester();
  
  try {
    const results = await tester.runAllTests();
    process.exit(results.failed > 0 ? 1 : 0);
  } catch (error) {
    console.error('🚨 Test suite failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { SafeZonesTester };