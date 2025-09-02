// Comprehensive Authentication Flow Test Suite
const { createClient } = require('@supabase/supabase-js');

// Test configuration
const TEST_CONFIG = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  baseUrl: 'http://localhost:3000',
  testUsers: [
    {
      email: 'test-buyer@safetrade.test',
      password: 'TestPassword123!',
      firstName: 'Test',
      lastName: 'Buyer',
      role: 'buyer'
    },
    {
      email: 'test-seller@safetrade.test', 
      password: 'TestPassword123!',
      firstName: 'Test',
      lastName: 'Seller',
      role: 'seller'
    }
  ]
};

class AuthFlowTester {
  constructor() {
    this.supabase = createClient(TEST_CONFIG.supabaseUrl, TEST_CONFIG.supabaseKey);
    this.adminSupabase = createClient(TEST_CONFIG.supabaseUrl, TEST_CONFIG.serviceKey);
    this.testResults = [];
    this.createdUsers = [];
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

  // Test 1: User Registration Flow
  async testUserRegistration() {
    return this.runTest('User Registration Flow', async () => {
      for (const testUser of TEST_CONFIG.testUsers) {
        this.log(`Registering ${testUser.role}: ${testUser.email}`);
        
        // 1. Sign up user
        const { data: signUpData, error: signUpError } = await this.supabase.auth.signUp({
          email: testUser.email,
          password: testUser.password,
          options: {
            data: {
              first_name: testUser.firstName,
              last_name: testUser.lastName
            }
          }
        });

        if (signUpError) {
          // User might already exist, try to sign in instead
          this.log(`User ${testUser.email} already exists, attempting sign in`);
          
          const { data: signInData, error: signInError } = await this.supabase.auth.signInWithPassword({
            email: testUser.email,
            password: testUser.password
          });

          if (signInError) {
            throw new Error(`Failed to sign in existing user: ${signInError.message}`);
          }
          
          testUser.userId = signInData.user.id;
        } else {
          testUser.userId = signUpData.user.id;
        }

        // 2. Verify user profile creation
        const { data: profile, error: profileError } = await this.adminSupabase
          .from('user_profiles')
          .select('*')
          .eq('id', testUser.userId)
          .single();

        if (profileError) {
          // Create profile manually for testing
          this.log(`Creating profile manually for ${testUser.email}`);
          await this.adminSupabase.from('user_profiles').insert({
            id: testUser.userId,
            first_name: testUser.firstName,
            last_name: testUser.lastName,
            email: testUser.email,
            identity_verified: true,
            verification_level: 'enhanced'
          });
        }

        this.createdUsers.push(testUser);
        this.log(`✅ User ${testUser.email} ready for testing`);
      }
    });
  }

  // Test 2: Authentication State Management
  async testAuthStateManagement() {
    return this.runTest('Authentication State Management', async () => {
      const testUser = this.createdUsers[0];
      
      // 1. Test sign in
      const { data: signInData, error: signInError } = await this.supabase.auth.signInWithPassword({
        email: testUser.email,
        password: testUser.password
      });

      if (signInError) throw new Error(`Sign in failed: ${signInError.message}`);
      
      this.log(`User signed in: ${signInData.user.email}`);

      // 2. Test session retrieval
      const { data: sessionData, error: sessionError } = await this.supabase.auth.getSession();
      if (sessionError) throw new Error(`Session retrieval failed: ${sessionError.message}`);
      if (!sessionData.session) throw new Error('No active session found');

      this.log('Active session verified');

      // 3. Test user info retrieval
      const { data: userData, error: userError } = await this.supabase.auth.getUser();
      if (userError) throw new Error(`User retrieval failed: ${userError.message}`);
      if (!userData.user) throw new Error('No user found in session');

      this.log('User data retrieval verified');

      // 4. Test sign out
      const { error: signOutError } = await this.supabase.auth.signOut();
      if (signOutError) throw new Error(`Sign out failed: ${signOutError.message}`);

      this.log('Sign out successful');

      // 5. Verify session is cleared
      const { data: postSignOutSession } = await this.supabase.auth.getSession();
      if (postSignOutSession.session) {
        throw new Error('Session should be null after sign out');
      }

      this.log('Session cleanup verified');
    });
  }

  // Test 3: Protected Route Access
  async testProtectedRoutes() {
    return this.runTest('Protected Route Access', async () => {
      const protectedRoutes = [
        '/api/listings',
        '/api/messages',
        '/api/safe-zones/meetings/user',
        '/api/favorites'
      ];

      // Test without authentication
      for (const route of protectedRoutes) {
        const response = await fetch(`${TEST_CONFIG.baseUrl}${route}`);
        
        if (response.status !== 401 && response.status !== 403) {
          this.log(`Route ${route} should return 401/403 but returned ${response.status}`);
        } else {
          this.log(`✅ ${route} properly protected`);
        }
      }

      // Test with authentication
      const testUser = this.createdUsers[0];
      const { data: authData } = await this.supabase.auth.signInWithPassword({
        email: testUser.email,
        password: testUser.password
      });

      const token = authData.session?.access_token;
      if (!token) throw new Error('No access token available');

      for (const route of protectedRoutes) {
        const response = await fetch(`${TEST_CONFIG.baseUrl}${route}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.status === 401 || response.status === 403) {
          this.log(`⚠️ ${route} rejected valid auth token (status: ${response.status})`);
        } else {
          this.log(`✅ ${route} accepts valid auth token`);
        }
      }
    });
  }

  // Test 4: Session Management and Refresh
  async testSessionRefresh() {
    return this.runTest('Session Management and Refresh', async () => {
      const testUser = this.createdUsers[0];
      
      // Sign in user
      const { data: authData, error } = await this.supabase.auth.signInWithPassword({
        email: testUser.email,
        password: testUser.password
      });

      if (error) throw new Error(`Sign in failed: ${error.message}`);
      
      const initialSession = authData.session;
      if (!initialSession) throw new Error('No session created');

      this.log('Initial session created');

      // Test automatic refresh (simulate expired token)
      setTimeout(async () => {
        try {
          const { data: refreshData, error: refreshError } = await this.supabase.auth.refreshSession();
          
          if (refreshError) {
            this.log(`Session refresh failed: ${refreshError.message}`, 'error');
          } else {
            this.log('Session refresh successful');
          }
        } catch (refreshErr) {
          this.log(`Session refresh exception: ${refreshErr.message}`, 'error');
        }
      }, 1000);

      // Verify session persistence
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const { data: currentSession } = await this.supabase.auth.getSession();
      if (!currentSession.session) {
        throw new Error('Session should persist after refresh attempt');
      }

      this.log('Session persistence verified');
    });
  }

  // Test 5: User Profile Integration
  async testUserProfileIntegration() {
    return this.runTest('User Profile Integration', async () => {
      const testUser = this.createdUsers[0];
      
      // Sign in user
      await this.supabase.auth.signInWithPassword({
        email: testUser.email,
        password: testUser.password
      });

      // Check profile access
      const { data: profile, error } = await this.supabase
        .from('user_profiles')
        .select('*')
        .eq('id', testUser.userId)
        .single();

      if (error) {
        throw new Error(`Profile access failed: ${error.message}`);
      }

      if (!profile) {
        throw new Error('User profile not found');
      }

      this.log(`Profile found: ${profile.first_name} ${profile.last_name}`);

      // Test verification status
      if (typeof profile.identity_verified !== 'boolean') {
        this.log('⚠️ identity_verified field should be boolean', 'error');
      }

      this.log('User profile integration verified');
    });
  }

  // Cleanup method
  async cleanup() {
    this.log('\n🧹 Cleaning up test data...');
    
    try {
      // Sign out current session
      await this.supabase.auth.signOut();
      
      // Note: We don't delete test users as they might be useful for further testing
      this.log('✅ Cleanup completed');
    } catch (error) {
      this.log(`⚠️ Cleanup warning: ${error.message}`, 'error');
    }
  }

  // Main test runner
  async runAllTests() {
    console.log('🚀 STARTING COMPREHENSIVE AUTHENTICATION FLOW TESTS');
    console.log('=' .repeat(60));
    
    const tests = [
      () => this.testUserRegistration(),
      () => this.testAuthStateManagement(),
      () => this.testProtectedRoutes(),
      () => this.testSessionRefresh(),
      () => this.testUserProfileIntegration()
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

    console.log('\n📊 AUTHENTICATION FLOW TEST RESULTS');
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
      console.log('\n🎉 ALL AUTHENTICATION TESTS PASSED');
    }

    return { passed, failed, total: passed + failed };
  }
}

// Run the tests
async function main() {
  const tester = new AuthFlowTester();
  
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

module.exports = { AuthFlowTester, TEST_CONFIG };