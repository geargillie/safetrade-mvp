// Master Test Runner - Comprehensive Application Testing
const { AuthFlowTester } = require('./auth-flow-comprehensive');
const { ListingsCRUDTester } = require('./listings-crud-comprehensive');
const { MessagingTester } = require('./messaging-comprehensive');
const { SafeZonesTester } = require('./safe-zones-comprehensive');
const { FavoritesTester } = require('./favorites-comprehensive');

class MasterTestRunner {
  constructor() {
    this.testSuites = [
      { name: 'Authentication Flows', tester: AuthFlowTester },
      { name: 'Listings CRUD', tester: ListingsCRUDTester },
      { name: 'Messaging System', tester: MessagingTester },
      { name: 'Safe Zones', tester: SafeZonesTester },
      { name: 'Favorites System', tester: FavoritesTester }
    ];
    this.overallResults = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async checkPrerequisites() {
    this.log('\n🔍 CHECKING TEST PREREQUISITES');
    console.log('=' .repeat(60));
    
    const requiredEnvVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY'
    ];

    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        throw new Error(`Missing required environment variable: ${envVar}`);
      }
      this.log(`✅ ${envVar} configured`);
    }

    // Test database connectivity
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('count')
        .limit(1);

      if (error) {
        throw new Error(`Database connectivity test failed: ${error.message}`);
      }

      this.log('✅ Database connection verified');
    } catch (dbError) {
      throw new Error(`Database connection failed: ${dbError.message}`);
    }

    // Test development server availability
    try {
      const response = await fetch('http://localhost:3000', {
        method: 'HEAD',
        timeout: 5000
      });
      
      if (!response.ok) {
        throw new Error(`Development server not accessible: ${response.status}`);
      }
      
      this.log('✅ Development server accessible');
    } catch (serverError) {
      if (serverError.message.includes('ECONNREFUSED')) {
        throw new Error('Development server is not running. Please start with: npm run dev');
      }
      throw new Error(`Server check failed: ${serverError.message}`);
    }

    this.log('✅ All prerequisites met');
  }

  async runTestSuite(suiteName, TesterClass) {
    this.log(`\n🎯 RUNNING TEST SUITE: ${suiteName}`);
    console.log('=' .repeat(60));
    
    try {
      const tester = new TesterClass();
      const results = await tester.runAllTests();
      
      this.overallResults.push({
        suite: suiteName,
        ...results,
        status: results.failed === 0 ? 'PASSED' : 'FAILED'
      });

      return results;
    } catch (error) {
      this.log(`🚨 Test suite ${suiteName} crashed: ${error.message}`, 'error');
      
      this.overallResults.push({
        suite: suiteName,
        passed: 0,
        failed: 1,
        total: 1,
        status: 'CRASHED',
        error: error.message
      });

      return { passed: 0, failed: 1, total: 1 };
    }
  }

  generateSummaryReport() {
    console.log('\n📊 COMPREHENSIVE TEST RESULTS SUMMARY');
    console.log('=' .repeat(70));
    
    let totalPassed = 0;
    let totalFailed = 0;
    let totalTests = 0;

    this.overallResults.forEach(result => {
      const status = result.status === 'PASSED' ? '✅' : '❌';
      console.log(`${status} ${result.suite.padEnd(20)} | ${result.passed}P ${result.failed}F ${result.total}T`);
      
      totalPassed += result.passed;
      totalFailed += result.failed;
      totalTests += result.total;
    });

    console.log('-' .repeat(70));
    console.log(`   ${'TOTALS'.padEnd(20)} | ${totalPassed}P ${totalFailed}F ${totalTests}T`);
    console.log('=' .repeat(70));

    const passRate = totalTests > 0 ? Math.round((totalPassed / totalTests) * 100) : 0;
    console.log(`\n📈 Overall Pass Rate: ${passRate}% (${totalPassed}/${totalTests})`);

    if (totalFailed > 0) {
      console.log('\n🚨 CRITICAL ISSUES FOUND:');
      this.overallResults
        .filter(r => r.status !== 'PASSED')
        .forEach(r => {
          console.log(`   - ${r.suite}: ${r.failed} failures`);
          if (r.error) {
            console.log(`     Error: ${r.error}`);
          }
        });
      
      console.log('\n🔧 RECOMMENDED ACTIONS:');
      console.log('   1. Review failed test logs above');
      console.log('   2. Fix identified issues');
      console.log('   3. Re-run tests to verify fixes');
      console.log('   4. Check application functionality manually');
    } else {
      console.log('\n🎉 ALL TESTS PASSED - APPLICATION IS READY');
      console.log('✅ Authentication flows working');
      console.log('✅ Listings CRUD operations working');  
      console.log('✅ Messaging system functional');
      console.log('✅ Safe zones features working');
      console.log('✅ Favorites system operational');
    }

    return {
      totalPassed,
      totalFailed,
      totalTests,
      passRate,
      suiteResults: this.overallResults
    };
  }

  async runAllTests() {
    try {
      console.log('🚀 STARTING COMPREHENSIVE APPLICATION TESTING');
      console.log('=' .repeat(70));
      console.log('Testing all application flows and functionality...');
      
      // Check prerequisites first
      await this.checkPrerequisites();

      // Run all test suites
      for (const suite of this.testSuites) {
        await this.runTestSuite(suite.name, suite.tester);
        
        // Brief pause between suites
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Generate comprehensive report
      const finalResults = this.generateSummaryReport();
      
      return finalResults;
      
    } catch (error) {
      console.error('\n🚨 MASTER TEST RUNNER FAILED');
      console.error('Error:', error.message);
      throw error;
    }
  }
}

// Additional utility: Application Health Check
async function performHealthCheck() {
  console.log('\n🏥 PERFORMING APPLICATION HEALTH CHECK');
  console.log('=' .repeat(60));
  
  const healthChecks = [
    {
      name: 'Database Connection',
      check: async () => {
        const { createClient } = require('@supabase/supabase-js');
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        );
        
        const { data, error } = await supabase
          .from('user_profiles')
          .select('count')
          .limit(1);
          
        if (error) throw new Error(error.message);
        return 'Connected';
      }
    },
    {
      name: 'Server Availability',
      check: async () => {
        const response = await fetch('http://localhost:3000');
        if (!response.ok) throw new Error(`Server returned ${response.status}`);
        return `Running (${response.status})`;
      }
    },
    {
      name: 'API Endpoints',
      check: async () => {
        const endpoints = ['/api/listings', '/api/safe-zones'];
        const results = [];
        
        for (const endpoint of endpoints) {
          try {
            const response = await fetch(`http://localhost:3000${endpoint}`);
            results.push(`${endpoint}:${response.status}`);
          } catch (error) {
            results.push(`${endpoint}:ERROR`);
          }
        }
        
        return results.join(', ');
      }
    }
  ];

  for (const healthCheck of healthChecks) {
    try {
      const result = await healthCheck.check();
      console.log(`✅ ${healthCheck.name}: ${result}`);
    } catch (error) {
      console.log(`❌ ${healthCheck.name}: ${error.message}`);
    }
  }
}

// Main execution
async function main() {
  try {
    // Perform health check first
    await performHealthCheck();
    
    // Run comprehensive tests
    const runner = new MasterTestRunner();
    const results = await runner.runAllTests();
    
    // Exit with appropriate code
    const exitCode = results.totalFailed > 0 ? 1 : 0;
    
    console.log(`\n🏁 Testing complete. Exit code: ${exitCode}`);
    process.exit(exitCode);
    
  } catch (error) {
    console.error('\n💥 CRITICAL FAILURE');
    console.error('The application testing failed to complete.');
    console.error('Error:', error.message);
    console.error('\nPlease fix the issue and run tests again.');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { MasterTestRunner, performHealthCheck };