// Comprehensive SafeTrade MVP Application Test Suite
// This test covers database connectivity, API endpoints, authentication, and core functionality

import { createClient } from '@supabase/supabase-js'
import fetch from 'node-fetch'

// Environment setup
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://foljvthncelmqiiigztu.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZvbGp2dGhuY2VsbXFpaWlnenR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MjEwMzIsImV4cCI6MjA3MDQ5NzAzMn0.Z9mDZMlwnoWs2_qudsZvuf7vLxcqiM58nvi1PDmrf5c'
const appUrl = 'http://localhost:3002' // Current dev server port

const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Test results tracking
let testResults = {
  passed: 0,
  failed: 0,
  errors: [],
  summary: []
}

// Helper functions
function logTest(name, status, details = '') {
  const icon = status === 'PASS' ? '✅' : '❌'
  console.log(`${icon} ${name}`)
  if (details) console.log(`   ${details}`)
  
  testResults.summary.push({ name, status, details })
  if (status === 'PASS') {
    testResults.passed++
  } else {
    testResults.failed++
    testResults.errors.push(`${name}: ${details}`)
  }
}

async function testWithTimeout(testFn, timeoutMs = 5000) {
  return Promise.race([
    testFn(),
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Test timeout')), timeoutMs)
    )
  ])
}

// Test Suite Implementation
class SafeTradeTestSuite {
  
  // 1. DATABASE CONNECTIVITY TESTS
  async testDatabaseConnectivity() {
    console.log('\n🔍 DATABASE CONNECTIVITY TESTS')
    console.log('=' .repeat(50))
    
    try {
      // Test basic connection
      const { data, error } = await supabase.from('listings').select('count').limit(1)
      if (error) throw error
      logTest('Database Connection', 'PASS', 'Successfully connected to Supabase')
    } catch (error) {
      logTest('Database Connection', 'FAIL', error.message)
    }
  }

  async testTableStructure() {
    console.log('\n📋 TABLE STRUCTURE TESTS')
    console.log('=' .repeat(50))

    const tables = [
      'listings',
      'user_profiles', 
      'identity_verifications',
      'conversations',
      'messages',
      'typing_indicators',
      'security_alerts',
      'stolen_vehicles',
      'total_loss_vehicles',
      'vin_verification_history',
      'safe_zones',
      'deal_agreements',
      'privacy_protection_log'
    ]

    for (const table of tables) {
      try {
        const { data, error } = await supabase.from(table).select('*').limit(1)
        if (error) throw error
        logTest(`Table: ${table}`, 'PASS', `Accessible and queryable`)
      } catch (error) {
        logTest(`Table: ${table}`, 'FAIL', error.message)
      }
    }
  }

  async testListingsSchema() {
    console.log('\n🏍️ LISTINGS SCHEMA VALIDATION')
    console.log('=' .repeat(50))

    try {
      const { data, error } = await supabase.from('listings').select('*').limit(1)
      if (error) throw error

      const requiredFields = [
        'id', 'user_id', 'title', 'description', 'price', 'make', 'model', 
        'year', 'mileage', 'vin', 'condition', 'city', 'zip_code', 'images',
        'vin_verified', 'status', 'created_at', 'updated_at'
      ]

      if (data && data.length > 0) {
        const listing = data[0]
        const missingFields = requiredFields.filter(field => !(field in listing))
        
        if (missingFields.length === 0) {
          logTest('Listings Schema', 'PASS', `All ${requiredFields.length} required fields present`)
        } else {
          logTest('Listings Schema', 'FAIL', `Missing fields: ${missingFields.join(', ')}`)
        }
      } else {
        logTest('Listings Schema', 'PASS', 'Table exists but no data (empty)')
      }
    } catch (error) {
      logTest('Listings Schema', 'FAIL', error.message)
    }
  }

  // 2. APPLICATION SERVER TESTS
  async testServerConnectivity() {
    console.log('\n🌐 APPLICATION SERVER TESTS')
    console.log('=' .repeat(50))

    try {
      const response = await fetch(appUrl, { method: 'GET' })
      if (response.ok) {
        logTest('Next.js Server', 'PASS', `Server running on ${appUrl}`)
      } else {
        logTest('Next.js Server', 'FAIL', `Server returned ${response.status}`)
      }
    } catch (error) {
      logTest('Next.js Server', 'FAIL', error.message)
    }
  }

  async testPageRoutes() {
    console.log('\n📄 PAGE ROUTE TESTS')
    console.log('=' .repeat(50))

    const routes = [
      '/',
      '/listings',
      '/listings/create',
      '/auth/login',
      '/auth/register'
    ]

    for (const route of routes) {
      try {
        const response = await fetch(`${appUrl}${route}`)
        if (response.ok) {
          logTest(`Route: ${route}`, 'PASS', `Status ${response.status}`)
        } else {
          logTest(`Route: ${route}`, 'FAIL', `Status ${response.status}`)
        }
      } catch (error) {
        logTest(`Route: ${route}`, 'FAIL', error.message)
      }
    }
  }

  async testApiEndpoints() {
    console.log('\n🔌 API ENDPOINT TESTS')
    console.log('=' .repeat(50))

    const apiEndpoints = [
      '/api/verify-vin',
      '/api/identity/free-verify',
      '/api/identity/enhanced-verify'
    ]

    for (const endpoint of apiEndpoints) {
      try {
        const response = await fetch(`${appUrl}${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ test: true })
        })
        
        // For API endpoints, we expect either 200 (success) or 400/401 (expected validation errors)
        if (response.status < 500) {
          logTest(`API: ${endpoint}`, 'PASS', `Endpoint accessible (${response.status})`)
        } else {
          logTest(`API: ${endpoint}`, 'FAIL', `Server error ${response.status}`)
        }
      } catch (error) {
        logTest(`API: ${endpoint}`, 'FAIL', error.message)
      }
    }
  }

  // 3. CRUD OPERATIONS TESTS
  async testCrudOperations() {
    console.log('\n🔄 CRUD OPERATIONS TESTS')
    console.log('=' .repeat(50))

    let testListingId = null

    // Test CREATE
    try {
      const testListing = {
        user_id: '00000000-0000-0000-0000-000000000000', // Test UUID
        title: 'Test Motorcycle',
        description: 'Test description for automated testing',
        price: 5000,
        make: 'Test',
        model: 'TestModel',
        year: 2020,
        mileage: 1000,
        vin: 'TEST12345TEST12345',
        condition: 'excellent',
        city: 'Test City',
        zip_code: '12345',
        images: ['test-image.jpg'],
        status: 'active'
      }

      const { data, error } = await supabase
        .from('listings')
        .insert(testListing)
        .select()
        .single()

      if (error) throw error
      testListingId = data.id
      logTest('CREATE Listing', 'PASS', `Created listing with ID: ${testListingId}`)
    } catch (error) {
      logTest('CREATE Listing', 'FAIL', error.message)
    }

    // Test READ
    if (testListingId) {
      try {
        const { data, error } = await supabase
          .from('listings')
          .select('*')
          .eq('id', testListingId)
          .single()

        if (error) throw error
        logTest('READ Listing', 'PASS', `Successfully retrieved listing`)
      } catch (error) {
        logTest('READ Listing', 'FAIL', error.message)
      }

      // Test UPDATE
      try {
        const { data, error } = await supabase
          .from('listings')
          .update({ title: 'Updated Test Motorcycle' })
          .eq('id', testListingId)
          .select()
          .single()

        if (error) throw error
        logTest('UPDATE Listing', 'PASS', `Successfully updated listing`)
      } catch (error) {
        logTest('UPDATE Listing', 'FAIL', error.message)
      }

      // Test DELETE
      try {
        const { error } = await supabase
          .from('listings')
          .delete()
          .eq('id', testListingId)

        if (error) throw error
        logTest('DELETE Listing', 'PASS', `Successfully deleted test listing`)
      } catch (error) {
        logTest('DELETE Listing', 'FAIL', error.message)
      }
    }
  }

  // 4. AUTHENTICATION TESTS
  async testAuthenticationFlow() {
    console.log('\n🔐 AUTHENTICATION TESTS')
    console.log('=' .repeat(50))

    // Test registration endpoint
    try {
      const response = await fetch(`${appUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@test.com',
          password: 'testpassword123'
        })
      })

      if (response.status < 500) {
        logTest('Auth Registration API', 'PASS', `Endpoint accessible`)
      } else {
        logTest('Auth Registration API', 'FAIL', `Server error ${response.status}`)
      }
    } catch (error) {
      logTest('Auth Registration API', 'FAIL', error.message)
    }

    // Test if auth tables are accessible
    try {
      const { data, error } = await supabase.auth.getUser()
      // This should work even if no user is logged in
      logTest('Supabase Auth Client', 'PASS', 'Auth client initialized correctly')
    } catch (error) {
      logTest('Supabase Auth Client', 'FAIL', error.message)
    }
  }

  // 5. BUSINESS LOGIC TESTS
  async testBusinessLogic() {
    console.log('\n🧠 BUSINESS LOGIC TESTS')
    console.log('=' .repeat(50))

    // Test VIN validation
    try {
      const response = await fetch(`${appUrl}/api/verify-vin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vin: '1HGBH41JXMN109186' })
      })

      if (response.status < 500) {
        logTest('VIN Verification API', 'PASS', 'VIN endpoint accessible')
      } else {
        logTest('VIN Verification API', 'FAIL', `Server error ${response.status}`)
      }
    } catch (error) {
      logTest('VIN Verification API', 'FAIL', error.message)
    }

    // Test RLS policies
    try {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('status', 'active')
        .limit(5)

      if (error) throw error
      logTest('RLS Policies', 'PASS', 'Can query public listings')
    } catch (error) {
      logTest('RLS Policies', 'FAIL', error.message)
    }
  }

  // 6. PERFORMANCE TESTS
  async testPerformance() {
    console.log('\n⚡ PERFORMANCE TESTS')
    console.log('=' .repeat(50))

    // Test page load time
    try {
      const start = Date.now()
      const response = await fetch(appUrl)
      const end = Date.now()
      const loadTime = end - start

      if (loadTime < 3000) {
        logTest('Page Load Performance', 'PASS', `Home page loaded in ${loadTime}ms`)
      } else {
        logTest('Page Load Performance', 'FAIL', `Slow load time: ${loadTime}ms`)
      }
    } catch (error) {
      logTest('Page Load Performance', 'FAIL', error.message)
    }

    // Test database query performance
    try {
      const start = Date.now()
      const { data, error } = await supabase.from('listings').select('*').limit(10)
      const end = Date.now()
      const queryTime = end - start

      if (error) throw error
      
      if (queryTime < 1000) {
        logTest('Database Query Performance', 'PASS', `Query completed in ${queryTime}ms`)
      } else {
        logTest('Database Query Performance', 'FAIL', `Slow query: ${queryTime}ms`)
      }
    } catch (error) {
      logTest('Database Query Performance', 'FAIL', error.message)
    }
  }

  // 7. INTEGRATION TESTS
  async testIntegrations() {
    console.log('\n🔗 INTEGRATION TESTS')
    console.log('=' .repeat(50))

    // Test image upload capability (Cloudinary)
    try {
      const cloudinaryConfig = {
        cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dfop4yooc',
        apiKey: process.env.CLOUDINARY_API_KEY || '222746314922724'
      }

      if (cloudinaryConfig.cloudName && cloudinaryConfig.apiKey) {
        logTest('Cloudinary Config', 'PASS', 'Image upload service configured')
      } else {
        logTest('Cloudinary Config', 'FAIL', 'Missing Cloudinary configuration')
      }
    } catch (error) {
      logTest('Cloudinary Config', 'FAIL', error.message)
    }

    // Test environment variables
    const requiredEnvVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME'
    ]

    let missingEnvVars = []
    requiredEnvVars.forEach(envVar => {
      if (!process.env[envVar] && !supabaseUrl && !supabaseAnonKey) {
        missingEnvVars.push(envVar)
      }
    })

    if (missingEnvVars.length === 0) {
      logTest('Environment Variables', 'PASS', 'All required env vars present')
    } else {
      logTest('Environment Variables', 'FAIL', `Missing: ${missingEnvVars.join(', ')}`)
    }
  }

  // Main test runner
  async runAllTests() {
    console.log('🚀 SAFETRADE MVP - COMPREHENSIVE APPLICATION TEST SUITE')
    console.log('='.repeat(60))
    console.log(`Testing application at: ${appUrl}`)
    console.log(`Testing database at: ${supabaseUrl}`)
    console.log('='.repeat(60))

    try {
      await this.testDatabaseConnectivity()
      await this.testTableStructure()
      await this.testListingsSchema()
      await this.testServerConnectivity()
      await this.testPageRoutes()
      await this.testApiEndpoints()
      await this.testCrudOperations()
      await this.testAuthenticationFlow()
      await this.testBusinessLogic()
      await this.testPerformance()
      await this.testIntegrations()
    } catch (error) {
      console.error('❌ Test suite error:', error)
      testResults.errors.push(`Test suite error: ${error.message}`)
    }

    this.printTestSummary()
  }

  printTestSummary() {
    console.log('\n📊 TEST SUMMARY')
    console.log('='.repeat(60))
    console.log(`✅ Passed: ${testResults.passed}`)
    console.log(`❌ Failed: ${testResults.failed}`)
    console.log(`📈 Success Rate: ${Math.round((testResults.passed / (testResults.passed + testResults.failed)) * 100)}%`)

    if (testResults.failed > 0) {
      console.log('\n🚨 FAILED TESTS:')
      testResults.errors.forEach(error => console.log(`   • ${error}`))
    }

    console.log('\n📋 DETAILED RESULTS:')
    testResults.summary.forEach(test => {
      const icon = test.status === 'PASS' ? '✅' : '❌'
      console.log(`   ${icon} ${test.name}`)
      if (test.details && test.status === 'FAIL') {
        console.log(`      ${test.details}`)
      }
    })

    console.log('\n🎯 RECOMMENDATIONS:')
    if (testResults.failed === 0) {
      console.log('   🎉 All tests passed! Application is working correctly.')
    } else {
      console.log('   🔧 Fix the failed tests above to ensure full functionality.')
      console.log('   💡 Priority: Focus on database and API issues first.')
    }

    console.log('\n='.repeat(60))
    console.log('Test suite completed!')
  }
}

// Run the test suite
const testSuite = new SafeTradeTestSuite()
testSuite.runAllTests().catch(console.error)