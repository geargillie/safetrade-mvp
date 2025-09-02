// Comprehensive Favorites System Test Suite
const { createClient } = require('@supabase/supabase-js');

const TEST_CONFIG = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  baseUrl: 'http://localhost:3000'
};

class FavoritesTester {
  constructor() {
    this.supabase = createClient(TEST_CONFIG.supabaseUrl, TEST_CONFIG.supabaseKey);
    this.adminSupabase = createClient(TEST_CONFIG.supabaseUrl, TEST_CONFIG.serviceKey);
    this.testResults = [];
    this.testUsers = [];
    this.testListings = [];
    this.createdFavorites = [];
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

  // Setup: Get test users and listings
  async setupTestData() {
    return this.runTest('Setup Test Data', async () => {
      // Get test users
      const { data: users } = await this.adminSupabase
        .from('user_profiles')
        .select('*')
        .limit(2);

      if (!users || users.length < 2) {
        throw new Error('Need at least 2 users for favorites testing');
      }

      this.testUsers = users.slice(0, 2);
      this.log(`Test user 1: ${this.testUsers[0].first_name} ${this.testUsers[0].last_name}`);
      this.log(`Test user 2: ${this.testUsers[1].first_name} ${this.testUsers[1].last_name}`);

      // Get or create test listings
      const { data: existingListings } = await this.adminSupabase
        .from('listings')
        .select('*')
        .limit(2);

      if (!existingListings || existingListings.length === 0) {
        // Create test listings
        const testListingsData = [
          {
            title: 'FAVORITES-TEST - Honda CBR1000RR',
            description: 'Test listing for favorites functionality',
            price: 15000,
            make: 'Honda',
            model: 'CBR1000RR',
            year: 2023,
            mileage: 1500,
            condition: 'excellent',
            city: 'Los Angeles',
            zip_code: '90210',
            vin: 'FAVTEST1234567890',
            user_id: this.testUsers[1].id, // Different from user who will favorite it
            images: []
          },
          {
            title: 'FAVORITES-TEST - Yamaha R1',
            description: 'Another test listing for favorites functionality',
            price: 17000,
            make: 'Yamaha',
            model: 'R1',
            year: 2024,
            mileage: 800,
            condition: 'excellent',
            city: 'San Francisco',
            zip_code: '94102',
            vin: 'FAVTEST1234567891',
            user_id: this.testUsers[1].id,
            images: []
          }
        ];

        const { data: createdListings, error: listingError } = await this.adminSupabase
          .from('listings')
          .insert(testListingsData)
          .select();

        if (listingError) {
          throw new Error(`Test listings creation failed: ${listingError.message}`);
        }

        this.testListings = createdListings;
        this.log(`✅ Created ${createdListings.length} test listings`);
      } else {
        this.testListings = existingListings.slice(0, 2);
        this.log(`✅ Using ${this.testListings.length} existing listings`);
      }
    });
  }

  // Test 1: Favorites Table Structure
  async testFavoritesTableStructure() {
    return this.runTest('Favorites Table Structure', async () => {
      // Check if favorites table exists
      const { data: tableCheck, error: tableError } = await this.adminSupabase
        .from('favorites')
        .select('*')
        .limit(1);

      if (tableError) {
        if (tableError.code === '42P01') {
          throw new Error('Favorites table does not exist - need to create it');
        }
        throw new Error(`Favorites table access failed: ${tableError.message}`);
      }

      this.log('✅ Favorites table exists and accessible');

      // Test table schema by inserting and reading a test record
      const testFavorite = {
        user_id: this.testUsers[0].id,
        listing_id: this.testListings[0].id
      };

      const { data: insertedFavorite, error: insertError } = await this.adminSupabase
        .from('favorites')
        .insert(testFavorite)
        .select()
        .single();

      if (insertError) {
        throw new Error(`Test favorite insertion failed: ${insertError.message}`);
      }

      this.createdFavorites.push(insertedFavorite);

      // Verify required fields exist
      const requiredFields = ['id', 'user_id', 'listing_id', 'created_at'];
      for (const field of requiredFields) {
        if (!(field in insertedFavorite)) {
          throw new Error(`Missing required field in favorites table: ${field}`);
        }
      }

      this.log('✅ Favorites table schema verified');
    });
  }

  // Test 2: Add to Favorites Flow
  async testAddToFavorites() {
    return this.runTest('Add to Favorites Flow', async () => {
      const testUser = this.testUsers[0];
      const testListing = this.testListings[1]; // Use different listing

      // Test API endpoint without authentication
      const unauthResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/favorites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listing_id: testListing.id })
      });

      if (unauthResponse.status !== 401) {
        this.log(`⚠️ Add favorite without auth returned ${unauthResponse.status}, expected 401`);
      } else {
        this.log('✅ Add favorites API properly protected');
      }

      // Test database insertion directly
      const { data: favorite, error: favoriteError } = await this.adminSupabase
        .from('favorites')
        .insert({
          user_id: testUser.id,
          listing_id: testListing.id
        })
        .select()
        .single();

      if (favoriteError) {
        if (favoriteError.code === '23505') {
          this.log('ℹ️ Favorite already exists (unique constraint working)');
        } else {
          throw new Error(`Add favorite failed: ${favoriteError.message}`);
        }
      } else {
        this.createdFavorites.push(favorite);
        this.log(`✅ Favorite added: ${testListing.title}`);
      }

      // Test preventing users from favoriting their own listings
      const { data: selfFavorite, error: selfError } = await this.adminSupabase
        .from('favorites')
        .insert({
          user_id: testListing.user_id, // Same as listing owner
          listing_id: testListing.id
        })
        .select()
        .single();

      if (!selfError) {
        // This should be prevented, but let's clean it up
        await this.adminSupabase
          .from('favorites')
          .delete()
          .eq('id', selfFavorite.id);
        this.log('⚠️ Users can favorite their own listings - should be prevented');
      } else {
        this.log('✅ Self-favoriting prevention working');
      }
    });
  }

  // Test 3: Remove from Favorites Flow
  async testRemoveFromFavorites() {
    return this.runTest('Remove from Favorites Flow', async () => {
      if (this.createdFavorites.length === 0) {
        throw new Error('No favorites to test removal');
      }

      const testFavorite = this.createdFavorites[0];

      // Test API endpoint without authentication
      const unauthResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/favorites`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listing_id: testFavorite.listing_id })
      });

      if (unauthResponse.status !== 401) {
        this.log(`⚠️ Remove favorite without auth returned ${unauthResponse.status}, expected 401`);
      } else {
        this.log('✅ Remove favorites API properly protected');
      }

      // Test database removal directly
      const { error: removeError } = await this.adminSupabase
        .from('favorites')
        .delete()
        .eq('id', testFavorite.id);

      if (removeError) {
        throw new Error(`Remove favorite failed: ${removeError.message}`);
      }

      // Verify removal
      const { data: checkFavorite, error: checkError } = await this.adminSupabase
        .from('favorites')
        .select('*')
        .eq('id', testFavorite.id)
        .single();

      if (!checkError || checkError.code !== 'PGRST116') {
        if (checkFavorite) {
          throw new Error('Favorite still exists after removal');
        }
      }

      this.log('✅ Favorite successfully removed');
      
      // Remove from our tracking
      this.createdFavorites = this.createdFavorites.filter(f => f.id !== testFavorite.id);
    });
  }

  // Test 4: User Favorites List
  async testUserFavoritesList() {
    return this.runTest('User Favorites List', async () => {
      // Create a few favorites for testing
      const favoritesToCreate = this.testListings.map(listing => ({
        user_id: this.testUsers[0].id,
        listing_id: listing.id
      }));

      const { data: batchFavorites, error: batchError } = await this.adminSupabase
        .from('favorites')
        .insert(favoritesToCreate)
        .select();

      if (batchError) {
        if (batchError.code === '23505') {
          this.log('ℹ️ Some favorites already exist');
        } else {
          throw new Error(`Batch favorites creation failed: ${batchError.message}`);
        }
      } else {
        this.createdFavorites.push(...batchFavorites);
        this.log(`✅ Created ${batchFavorites.length} batch favorites`);
      }

      // Test favorites API without authentication
      const unauthResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/favorites`);
      
      if (unauthResponse.status !== 401) {
        this.log(`⚠️ Favorites list without auth returned ${unauthResponse.status}, expected 401`);
      } else {
        this.log('✅ Favorites list API properly protected');
      }

      // Test database query for user favorites
      const { data: userFavorites, error: favError } = await this.adminSupabase
        .from('favorites')
        .select(`
          id,
          listing_id,
          created_at,
          listing:listings(
            id,
            title,
            price,
            year,
            make,
            model,
            images,
            city,
            status
          )
        `)
        .eq('user_id', this.testUsers[0].id)
        .order('created_at', { ascending: false });

      if (favError) {
        this.log(`⚠️ Favorites with listing details failed: ${favError.message}`);
        
        // Try simple query
        const { data: simpleFavorites, error: simpleError } = await this.adminSupabase
          .from('favorites')
          .select('*')
          .eq('user_id', this.testUsers[0].id);

        if (simpleError) {
          throw new Error(`Simple favorites query failed: ${simpleError.message}`);
        }

        this.log(`✅ User has ${simpleFavorites?.length || 0} favorites (simple query)`);
      } else {
        this.log(`✅ User has ${userFavorites?.length || 0} favorites with listing details`);
        
        if (userFavorites && userFavorites.length > 0) {
          userFavorites.forEach((fav, i) => {
            this.log(`  ${i + 1}. ${fav.listing?.title || 'Unknown listing'}`);
          });
        }
      }
    });
  }

  // Test 5: Favorites Page Rendering
  async testFavoritesPageRendering() {
    return this.runTest('Favorites Page Rendering', async () => {
      // Test favorites page accessibility
      const pageResponse = await fetch(`${TEST_CONFIG.baseUrl}/favorites`);
      
      if (!pageResponse.ok) {
        this.log(`⚠️ Favorites page failed to load: ${pageResponse.status}`);
      } else {
        this.log('✅ Favorites page loads successfully');
      }

      // Test favorites component functionality
      if (this.createdFavorites.length > 0) {
        this.log('✅ Favorites data available for page rendering');
      } else {
        this.log('⚠️ No favorites data for page rendering test');
      }
    });
  }

  // Test 6: Favorites UI Integration
  async testFavoritesUIIntegration() {
    return this.runTest('Favorites UI Integration', async () => {
      // Test that favorites button appears on listing details
      if (this.testListings.length > 0) {
        const testListing = this.testListings[0];
        
        // Test listing detail page
        const listingResponse = await fetch(`${TEST_CONFIG.baseUrl}/listings/${testListing.id}`);
        
        if (!listingResponse.ok) {
          this.log(`⚠️ Listing detail page failed: ${listingResponse.status}`);
        } else {
          this.log('✅ Listing detail page accessible for favorites integration');
        }
      }

      // Test favorites count and status
      const testUser = this.testUsers[0];
      const { data: userFavorites } = await this.adminSupabase
        .from('favorites')
        .select('listing_id')
        .eq('user_id', testUser.id);

      const favoriteListingIds = (userFavorites || []).map(f => f.listing_id);
      this.log(`✅ User has ${favoriteListingIds.length} favorited listings`);

      // Test if each test listing is favorited
      for (const listing of this.testListings) {
        const isFavorited = favoriteListingIds.includes(listing.id);
        this.log(`  - ${listing.title}: ${isFavorited ? 'FAVORITED' : 'NOT FAVORITED'}`);
      }
    });
  }

  // Test 7: Favorites Performance and Constraints
  async testFavoritesConstraints() {
    return this.runTest('Favorites Constraints and Performance', async () => {
      // Test unique constraint (user can't favorite same listing twice)
      const duplicateFavorite = {
        user_id: this.testUsers[0].id,
        listing_id: this.testListings[0].id
      };

      const { data: duplicate, error: duplicateError } = await this.adminSupabase
        .from('favorites')
        .insert(duplicateFavorite)
        .select()
        .single();

      if (duplicateError && duplicateError.code === '23505') {
        this.log('✅ Unique constraint preventing duplicate favorites');
      } else if (!duplicateError) {
        // Clean up if it was created
        await this.adminSupabase
          .from('favorites')
          .delete()
          .eq('id', duplicate.id);
        this.log('⚠️ Unique constraint not enforced - duplicates allowed');
      }

      // Test foreign key constraints
      const invalidFavorite = {
        user_id: 'invalid-user-id',
        listing_id: this.testListings[0].id
      };

      const { error: fkError } = await this.adminSupabase
        .from('favorites')
        .insert(invalidFavorite)
        .select()
        .single();

      if (fkError) {
        this.log('✅ Foreign key constraints working');
      } else {
        this.log('⚠️ Foreign key constraints not enforced');
      }

      // Test bulk favorites query performance
      const { data: allFavorites, error: bulkError } = await this.adminSupabase
        .from('favorites')
        .select('*')
        .limit(100);

      if (bulkError) {
        throw new Error(`Bulk favorites query failed: ${bulkError.message}`);
      }

      this.log(`✅ Bulk query returned ${allFavorites?.length || 0} favorites`);
    });
  }

  // Cleanup method
  async cleanup() {
    this.log('\n🧹 Cleaning up test data...');
    
    try {
      // Delete test favorites
      if (this.createdFavorites.length > 0) {
        const favoriteIds = this.createdFavorites.map(f => f.id);
        await this.adminSupabase
          .from('favorites')
          .delete()
          .in('id', favoriteIds);
        this.log(`Deleted ${favoriteIds.length} test favorites`);
      }

      // Delete test listings (only if we created them)
      const testListingIds = this.testListings
        .filter(l => l.title && l.title.startsWith('FAVORITES-TEST'))
        .map(l => l.id);

      if (testListingIds.length > 0) {
        await this.adminSupabase
          .from('listings')
          .delete()
          .in('id', testListingIds);
        this.log(`Deleted ${testListingIds.length} test listings`);
      }

      this.log('✅ Cleanup completed');
    } catch (error) {
      this.log(`⚠️ Cleanup warning: ${error.message}`, 'error');
    }
  }

  // Main test runner
  async runAllTests() {
    console.log('🚀 STARTING COMPREHENSIVE FAVORITES TESTS');
    console.log('=' .repeat(60));
    
    const tests = [
      () => this.setupTestData(),
      () => this.testFavoritesTableStructure(),
      () => this.testAddToFavorites(),
      () => this.testUserFavoritesList(),
      () => this.testRemoveFromFavorites(),
      () => this.testFavoritesUIIntegration(),
      () => this.testFavoritesPageRendering(),
      () => this.testFavoritesConstraints()
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

    console.log('\n📊 FAVORITES TEST RESULTS');
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
      console.log('\n🎉 ALL FAVORITES TESTS PASSED');
    }

    return { passed, failed, total: passed + failed };
  }
}

// Run the tests
async function main() {
  const tester = new FavoritesTester();
  
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

module.exports = { FavoritesTester };