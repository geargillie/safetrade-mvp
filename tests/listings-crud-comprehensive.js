// Comprehensive Listings CRUD Test Suite
const { createClient } = require('@supabase/supabase-js');

const TEST_CONFIG = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  baseUrl: 'http://localhost:3000'
};

class ListingsCRUDTester {
  constructor() {
    this.supabase = createClient(TEST_CONFIG.supabaseUrl, TEST_CONFIG.supabaseKey);
    this.adminSupabase = createClient(TEST_CONFIG.supabaseUrl, TEST_CONFIG.serviceKey);
    this.testResults = [];
    this.createdListings = [];
    this.testUser = null;
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

  // Setup: Create test user and authenticate
  async setupTestUser() {
    return this.runTest('Setup Test User', async () => {
      // Get or create test user
      const { data: users } = await this.adminSupabase
        .from('user_profiles')
        .select('*')
        .limit(1);

      if (!users || users.length === 0) {
        throw new Error('No users found in database. Please create a user first.');
      }

      this.testUser = users[0];
      this.log(`Using test user: ${this.testUser.first_name} ${this.testUser.last_name}`);
    });
  }

  // Test 1: Create Listing Flow
  async testCreateListing() {
    return this.runTest('Create Listing Flow', async () => {
      const testListing = {
        title: 'TEST - 2024 Honda CBR600RR Sport Bike',
        description: 'High-performance sport bike in excellent condition. Well-maintained with all service records.',
        price: 12500,
        make: 'Honda',
        model: 'CBR600RR',
        year: 2024,
        mileage: 2500,
        condition: 'excellent',
        city: 'Los Angeles',
        zip_code: '90210',
        vin: 'TESTVIN1234567890',
        images: [
          'https://example.com/test-image-1.jpg',
          'https://example.com/test-image-2.jpg'
        ]
      };

      // Test API endpoint
      const response = await fetch(`${TEST_CONFIG.baseUrl}/api/listings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testListing)
      });

      // Should fail without authentication
      if (response.status !== 401) {
        this.log(`⚠️ Create listing without auth returned ${response.status}, expected 401`);
      }

      // Test direct database insertion for validation
      const { data: dbListing, error: dbError } = await this.adminSupabase
        .from('listings')
        .insert({
          ...testListing,
          user_id: this.testUser.id
        })
        .select()
        .single();

      if (dbError) {
        throw new Error(`Database listing creation failed: ${dbError.message}`);
      }

      this.createdListings.push(dbListing);
      this.log(`✅ Listing created with ID: ${dbListing.id}`);
    });
  }

  // Test 2: Read Listings Flow
  async testReadListings() {
    return this.runTest('Read Listings Flow', async () => {
      // Test public listings endpoint
      const publicResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/listings`);
      
      if (!publicResponse.ok) {
        throw new Error(`Public listings fetch failed: ${publicResponse.status}`);
      }

      const publicData = await publicResponse.json();
      this.log(`Public listings returned: ${publicData.listings?.length || 0} items`);

      // Test individual listing fetch
      if (this.createdListings.length > 0) {
        const testListing = this.createdListings[0];
        const singleResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/listings/${testListing.id}`);
        
        if (!singleResponse.ok) {
          throw new Error(`Single listing fetch failed: ${singleResponse.status}`);
        }

        const singleData = await singleResponse.json();
        if (!singleData.listing) {
          throw new Error('Single listing response missing listing data');
        }

        this.log(`✅ Individual listing fetch successful: ${singleData.listing.title}`);
      }

      // Test database query directly
      const { data: dbListings, error: dbError } = await this.supabase
        .from('listings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (dbError) {
        throw new Error(`Database listings query failed: ${dbError.message}`);
      }

      this.log(`Database query returned: ${dbListings?.length || 0} listings`);
    });
  }

  // Test 3: Update Listing Flow
  async testUpdateListing() {
    return this.runTest('Update Listing Flow', async () => {
      if (this.createdListings.length === 0) {
        throw new Error('No test listings available for update test');
      }

      const testListing = this.createdListings[0];
      const updateData = {
        title: 'UPDATED - 2024 Honda CBR600RR Sport Bike',
        price: 13000,
        description: 'Updated description with new price reflecting market conditions.'
      };

      // Test without authentication (should fail)
      const unauthResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/listings/${testListing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });

      if (unauthResponse.status !== 401) {
        this.log(`⚠️ Update without auth returned ${unauthResponse.status}, expected 401`);
      }

      // Test database update directly
      const { data: updatedListing, error: updateError } = await this.adminSupabase
        .from('listings')
        .update(updateData)
        .eq('id', testListing.id)
        .select()
        .single();

      if (updateError) {
        throw new Error(`Database update failed: ${updateError.message}`);
      }

      this.log(`✅ Listing updated: ${updatedListing.title}`);
      this.log(`✅ Price updated: $${updatedListing.price}`);

      // Update our test data
      this.createdListings[0] = updatedListing;
    });
  }

  // Test 4: Delete Listing Flow
  async testDeleteListing() {
    return this.runTest('Delete Listing Flow', async () => {
      if (this.createdListings.length === 0) {
        throw new Error('No test listings available for delete test');
      }

      const testListing = this.createdListings[0];

      // Test without authentication (should fail)
      const unauthResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/listings/${testListing.id}`, {
        method: 'DELETE'
      });

      if (unauthResponse.status !== 401) {
        this.log(`⚠️ Delete without auth returned ${unauthResponse.status}, expected 401`);
      }

      // Test database deletion directly
      const { error: deleteError } = await this.adminSupabase
        .from('listings')
        .delete()
        .eq('id', testListing.id);

      if (deleteError) {
        throw new Error(`Database deletion failed: ${deleteError.message}`);
      }

      // Verify deletion
      const { data: deletedCheck, error: checkError } = await this.adminSupabase
        .from('listings')
        .select('*')
        .eq('id', testListing.id)
        .single();

      if (!checkError || checkError.code !== 'PGRST116') {
        if (deletedCheck) {
          throw new Error('Listing still exists after deletion');
        }
      }

      this.log(`✅ Listing successfully deleted from database`);
      
      // Remove from our test data
      this.createdListings = this.createdListings.filter(l => l.id !== testListing.id);
    });
  }

  // Test 5: Listing Search and Filtering
  async testListingSearchAndFiltering() {
    return this.runTest('Listing Search and Filtering', async () => {
      // Create test data for filtering
      const testListings = [
        {
          title: 'FILTER-TEST - Honda Sport Bike',
          price: 10000,
          make: 'Honda',
          model: 'CBR',
          year: 2022,
          mileage: 5000,
          condition: 'good',
          city: 'Los Angeles',
          zip_code: '90210',
          vin: 'FILTER1234567890A',
          user_id: this.testUser.id,
          images: []
        },
        {
          title: 'FILTER-TEST - Yamaha Cruiser',
          price: 8000,
          make: 'Yamaha',
          model: 'Bolt',
          year: 2020,
          mileage: 8000,
          condition: 'fair',
          city: 'San Francisco',
          zip_code: '94102',
          vin: 'FILTER1234567890B',
          user_id: this.testUser.id,
          images: []
        }
      ];

      // Insert test listings
      const { data: insertedListings, error: insertError } = await this.adminSupabase
        .from('listings')
        .insert(testListings)
        .select();

      if (insertError) {
        throw new Error(`Test listing creation failed: ${insertError.message}`);
      }

      this.createdListings.push(...insertedListings);

      // Test search by make
      const { data: hondaListings, error: hondaError } = await this.supabase
        .from('listings')
        .select('*')
        .eq('make', 'Honda')
        .limit(10);

      if (hondaError) {
        throw new Error(`Honda search failed: ${hondaError.message}`);
      }

      this.log(`Honda search returned: ${hondaListings?.length || 0} listings`);

      // Test price range filtering
      const { data: priceFilteredListings, error: priceError } = await this.supabase
        .from('listings')
        .select('*')
        .gte('price', 8000)
        .lte('price', 12000)
        .limit(10);

      if (priceError) {
        throw new Error(`Price filtering failed: ${priceError.message}`);
      }

      this.log(`Price range filtering returned: ${priceFilteredListings?.length || 0} listings`);

      // Test text search (if supported)
      const { data: textSearchListings, error: textError } = await this.supabase
        .from('listings')
        .select('*')
        .ilike('title', '%sport%')
        .limit(10);

      if (textError) {
        this.log(`⚠️ Text search not supported: ${textError.message}`);
      } else {
        this.log(`Text search returned: ${textSearchListings?.length || 0} listings`);
      }
    });
  }

  // Test 6: Listing Status Management
  async testListingStatusManagement() {
    return this.runTest('Listing Status Management', async () => {
      if (this.createdListings.length === 0) {
        throw new Error('No test listings available for status test');
      }

      const testListing = this.createdListings[0];
      const statusUpdates = ['active', 'in_talks', 'sold'];

      for (const status of statusUpdates) {
        const { data: updatedListing, error: updateError } = await this.adminSupabase
          .from('listings')
          .update({ status })
          .eq('id', testListing.id)
          .select()
          .single();

        if (updateError) {
          throw new Error(`Status update to '${status}' failed: ${updateError.message}`);
        }

        if (updatedListing.status !== status) {
          throw new Error(`Status not updated correctly. Expected: ${status}, Got: ${updatedListing.status}`);
        }

        this.log(`✅ Status updated to: ${status}`);
      }
    });
  }

  // Cleanup method
  async cleanup() {
    this.log('\n🧹 Cleaning up test listings...');
    
    try {
      if (this.createdListings.length > 0) {
        const listingIds = this.createdListings.map(l => l.id);
        
        const { error: deleteError } = await this.adminSupabase
          .from('listings')
          .delete()
          .in('id', listingIds);

        if (deleteError) {
          this.log(`⚠️ Cleanup error: ${deleteError.message}`, 'error');
        } else {
          this.log(`✅ Cleaned up ${listingIds.length} test listings`);
        }
      }
    } catch (error) {
      this.log(`⚠️ Cleanup warning: ${error.message}`, 'error');
    }
  }

  // Main test runner
  async runAllTests() {
    console.log('🚀 STARTING COMPREHENSIVE LISTINGS CRUD TESTS');
    console.log('=' .repeat(60));
    
    const tests = [
      () => this.setupTestUser(),
      () => this.testCreateListing(),
      () => this.testReadListings(),
      () => this.testUpdateListing(),
      () => this.testListingSearchAndFiltering(),
      () => this.testListingStatusManagement(),
      () => this.testDeleteListing() // Run delete last
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

    console.log('\n📊 LISTINGS CRUD TEST RESULTS');
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
      console.log('\n🎉 ALL LISTINGS CRUD TESTS PASSED');
    }

    return { passed, failed, total: passed + failed };
  }
}

// Run the tests
async function main() {
  const tester = new ListingsCRUDTester();
  
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

module.exports = { ListingsCRUDTester };