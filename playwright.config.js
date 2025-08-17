// Playwright configuration for cross-browser testing
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  // Test directory
  testDir: './tests',
  
  // Timeout settings
  timeout: 30000,
  expect: {
    timeout: 5000
  },
  
  // Test execution settings
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  
  // Reporter configuration
  reporter: [
    ['html', { outputFolder: 'test-results/html' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }]
  ],
  
  // Global test settings
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },

  // Browser projects for cross-browser testing
  projects: [
    // Desktop browsers
    {
      name: 'chromium-desktop',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 }
      }
    },
    {
      name: 'firefox-desktop',
      use: { 
        ...devices['Desktop Firefox'],
        viewport: { width: 1920, height: 1080 }
      }
    },
    {
      name: 'webkit-desktop',
      use: { 
        ...devices['Desktop Safari'],
        viewport: { width: 1920, height: 1080 }
      }
    },
    
    // Laptop screens
    {
      name: 'chromium-laptop',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1366, height: 768 }
      }
    },
    
    // Tablet devices
    {
      name: 'tablet-portrait',
      use: { 
        ...devices['iPad'],
        viewport: { width: 768, height: 1024 }
      }
    },
    {
      name: 'tablet-landscape',
      use: { 
        ...devices['iPad'],
        viewport: { width: 1024, height: 768 }
      }
    },
    
    // Mobile devices
    {
      name: 'mobile-chrome',
      use: { 
        ...devices['Pixel 5']
      }
    },
    {
      name: 'mobile-safari',
      use: { 
        ...devices['iPhone 12']
      }
    },
    {
      name: 'mobile-samsung',
      use: { 
        ...devices['Galaxy S21']
      }
    },
    
    // Edge cases
    {
      name: 'small-mobile',
      use: { 
        ...devices['iPhone SE'],
        viewport: { width: 375, height: 667 }
      }
    },
    {
      name: 'large-mobile',
      use: { 
        ...devices['iPhone 12 Pro Max'],
        viewport: { width: 428, height: 926 }
      }
    },
    {
      name: 'ultra-wide',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 3440, height: 1440 }
      }
    }
  ],

  // Development server
  webServer: {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: !process.env.CI
  }
});