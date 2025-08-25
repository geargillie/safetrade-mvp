const puppeteer = require('puppeteer');

async function debugSafeZonesPage() {
  let browser;
  try {
    console.log('🔍 Launching browser...');
    browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Listen for console logs
    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      console.log(`[BROWSER ${type.toUpperCase()}]: ${text}`);
    });
    
    // Listen for errors
    page.on('pageerror', error => {
      console.log(`[BROWSER ERROR]: ${error.message}`);
    });
    
    console.log('🔍 Navigating to safe zones page...');
    await page.goto('http://localhost:3002/safe-zones', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    console.log('🔍 Waiting 10 seconds for page to load...');
    await page.waitForTimeout(10000);
    
    // Check if still loading
    const isLoading = await page.evaluate(() => {
      return document.body.innerHTML.includes('Loading...');
    });
    
    console.log('🔍 Is page still loading?', isLoading);
    
    // Get page content for debugging
    const title = await page.title();
    console.log('🔍 Page title:', title);
    
    // Check for specific elements
    const hasErrorMessage = await page.evaluate(() => {
      return document.body.innerHTML.includes('Failed to load safe zones');
    });
    
    console.log('🔍 Has error message?', hasErrorMessage);
    
    // Take a screenshot for debugging
    // await page.screenshot({ path: 'safe-zones-debug.png', fullPage: true });
    // console.log('🔍 Screenshot saved as safe-zones-debug.png');
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Check if puppeteer is available
const canUsePuppeteer = (() => {
  try {
    require.resolve('puppeteer');
    return true;
  } catch (e) {
    return false;
  }
})();

if (canUsePuppeteer) {
  debugSafeZonesPage();
} else {
  console.log('❌ Puppeteer not available - installing...');
  console.log('Run: npm install puppeteer');
  process.exit(1);
}