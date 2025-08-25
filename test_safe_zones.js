// Comprehensive Safe Zone Feature Test Suite
const axios = require('axios');
const fs = require('fs');

const BASE_URL = 'http://localhost:3002';
let testResults = [];

function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${type.toUpperCase()}: ${message}`;
  console.log(logMessage);
  testResults.push({ timestamp, type, message });
}

async function runTest(testName, testFn) {
  try {
    log(`Starting test: ${testName}`, 'test');
    await testFn();
    log(`✅ PASSED: ${testName}`, 'success');
  } catch (error) {
    log(`❌ FAILED: ${testName} - ${error.message}`, 'error');
  }
}

async function testSafeZoneAPIs() {
  log('🧪 Testing Safe Zone API Endpoints', 'test');

  // Test 1: Basic safe zones list
  await runTest('GET /api/safe-zones', async () => {
    const response = await axios.get(`${BASE_URL}/api/safe-zones`);
    if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
    if (!response.data.data) throw new Error('No data property in response');
    if (!Array.isArray(response.data.data)) throw new Error('Data is not an array');
    if (response.data.data.length === 0) throw new Error('No safe zones returned');
    log(`Found ${response.data.data.length} safe zones`);
  });

  // Test 2: Safe zone filtering by type
  await runTest('GET /api/safe-zones?zoneType=library', async () => {
    const response = await axios.get(`${BASE_URL}/api/safe-zones?zoneType=library`);
    if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
    const libraries = response.data.data.filter(zone => zone.zone_type === 'library');
    if (libraries.length !== response.data.data.length) throw new Error('Filtering not working correctly');
    log(`Found ${libraries.length} libraries`);
  });

  // Test 3: Safe zone filtering by verified status
  await runTest('GET /api/safe-zones?verifiedOnly=true', async () => {
    const response = await axios.get(`${BASE_URL}/api/safe-zones?verifiedOnly=true`);
    if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
    const verified = response.data.data.filter(zone => zone.is_verified === true);
    if (verified.length !== response.data.data.length) throw new Error('Verified filtering not working');
    log(`Found ${verified.length} verified zones`);
  });

  // Test 4: Safe zone search
  await runTest('GET /api/safe-zones?search=Los', async () => {
    const response = await axios.get(`${BASE_URL}/api/safe-zones?search=Los`);
    if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
    if (response.data.data.length === 0) throw new Error('Search returned no results');
    log(`Search found ${response.data.data.length} results`);
  });

  // Test 5: Individual safe zone retrieval
  await runTest('GET /api/safe-zones/[id]', async () => {
    // First get a safe zone ID
    const listResponse = await axios.get(`${BASE_URL}/api/safe-zones`);
    const firstZone = listResponse.data.data[0];
    
    const response = await axios.get(`${BASE_URL}/api/safe-zones/${firstZone.id}`);
    if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
    if (!response.data.data) throw new Error('No data in individual zone response');
    if (response.data.data.id !== firstZone.id) throw new Error('Wrong zone returned');
    log(`Retrieved zone: ${response.data.data.name}`);
  });

  // Test 6: Nearby safe zones
  await runTest('GET /api/safe-zones/nearby', async () => {
    const response = await axios.get(`${BASE_URL}/api/safe-zones/nearby?latitude=34.0522&longitude=-118.2437&radiusKm=50`);
    if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
    if (!Array.isArray(response.data.data)) throw new Error('Nearby zones not returned as array');
    log(`Found ${response.data.data.length} nearby zones`);
  });

  // Test 7: Invalid UUID handling
  await runTest('GET /api/safe-zones/invalid-uuid (error handling)', async () => {
    try {
      await axios.get(`${BASE_URL}/api/safe-zones/invalid-uuid`);
      throw new Error('Should have thrown error for invalid UUID');
    } catch (error) {
      if (error.response?.status === 400) {
        log('Properly handled invalid UUID');
      } else {
        throw error;
      }
    }
  });
}

async function testSafeZonePages() {
  log('🌐 Testing Safe Zone Page Functionality', 'test');

  // Test 1: Safe zones main page
  await runTest('GET /safe-zones page', async () => {
    const response = await axios.get(`${BASE_URL}/safe-zones`);
    if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
    // Check if page is loading (showing loading spinner) or has actual content
    if (response.data.includes('Loading...')) {
      throw new Error('Page is stuck in loading state');
    }
    // Just check that we get a valid HTML response, not specific content
    if (!response.data.includes('<html') || !response.data.includes('</html>')) {
      throw new Error('Page does not return valid HTML');
    }
    log('Safe zones page loads successfully');
  });

  // Test 2: Individual safe zone page
  await runTest('GET /safe-zones/[id] page', async () => {
    // Get a safe zone ID first
    const apiResponse = await axios.get(`${BASE_URL}/api/safe-zones`);
    const firstZone = apiResponse.data.data[0];
    
    const response = await axios.get(`${BASE_URL}/safe-zones/${firstZone.id}`);
    if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
    log('Individual safe zone page loads successfully');
  });
}

async function testSafeZoneComponents() {
  log('🔧 Testing Safe Zone Components', 'test');

  // Test SafeZoneListingCard component by checking if it handles data correctly
  await runTest('SafeZoneListingCard data handling', async () => {
    const response = await axios.get(`${BASE_URL}/api/safe-zones`);
    const zones = response.data.data;
    
    // Check if all required fields are present for the component
    for (const zone of zones) {
      if (!zone.id) throw new Error('Missing zone.id');
      if (!zone.name) throw new Error('Missing zone.name');
      if (!zone.address) throw new Error('Missing zone.address');
      if (zone.zone_type === undefined) throw new Error('Missing zone.zone_type');
      if (zone.is_verified === undefined) throw new Error('Missing zone.is_verified');
    }
    log('All zones have required fields for components');
  });
}

async function runAllTests() {
  log('🚀 Starting Comprehensive Safe Zone Tests', 'start');
  
  try {
    // Test server connectivity
    await axios.get(`${BASE_URL}`);
    log('✅ Server is running and accessible');
  } catch (error) {
    log('❌ Server is not accessible - tests cannot continue', 'error');
    return;
  }

  await testSafeZoneAPIs();
  await testSafeZonePages();
  await testSafeZoneComponents();

  // Generate summary
  const passed = testResults.filter(r => r.type === 'success').length;
  const failed = testResults.filter(r => r.type === 'error').length;
  
  log('📊 TEST SUMMARY', 'summary');
  log(`✅ Passed: ${passed}`, 'summary');
  log(`❌ Failed: ${failed}`, 'summary');
  
  if (failed === 0) {
    log('🎉 ALL TESTS PASSED - Safe Zone feature is working correctly!', 'success');
  } else {
    log('⚠️  Some tests failed - check the logs above for details', 'warning');
  }

  // Save detailed results
  fs.writeFileSync('/Users/sharma/safetrade-mvp/safe_zone_test_results.json', JSON.stringify(testResults, null, 2));
  log('📝 Detailed results saved to safe_zone_test_results.json', 'info');
}

if (require.main === module) {
  runAllTests().catch(error => {
    console.error('Test runner failed:', error);
    process.exit(1);
  });
}

module.exports = { runAllTests, testSafeZoneAPIs, testSafeZonePages, testSafeZoneComponents };