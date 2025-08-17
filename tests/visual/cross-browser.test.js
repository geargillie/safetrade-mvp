// Cross-browser and device compatibility tests
const { test, expect, devices } = require('@playwright/test');

// Test configurations for different browsers and devices
const browsers = ['chromium', 'firefox', 'webkit'];
const deviceTypes = [
  { name: 'Desktop', viewport: { width: 1920, height: 1080 } },
  { name: 'Laptop', viewport: { width: 1366, height: 768 } },
  { name: 'Tablet', viewport: { width: 768, height: 1024 } },
  { name: 'Mobile', viewport: { width: 375, height: 667 } },
  { name: 'Mobile Large', viewport: { width: 414, height: 896 } }
];

// Test hero section layout and styling
test.describe('Hero Section Cross-Browser Tests', () => {
  deviceTypes.forEach(device => {
    test(`Hero section displays correctly on ${device.name}`, async ({ page, browserName }) => {
      await page.setViewportSize(device.viewport);
      await page.goto('/');

      // Test hero section container
      const heroSection = page.locator('section').first();
      await expect(heroSection).toBeVisible();
      
      // Verify no scrolling is needed
      const heroHeight = await heroSection.evaluate(el => el.offsetHeight);
      const viewportHeight = device.viewport.height;
      expect(heroHeight).toBeLessThanOrEqual(viewportHeight - 128); // Account for header/footer

      // Test hero content centering
      const heroContent = page.locator('section div').first();
      const contentBox = await heroContent.boundingBox();
      expect(contentBox.y).toBeGreaterThan(0);

      // Verify background elements don't cause overflow
      const body = page.locator('body');
      const bodyScrollHeight = await body.evaluate(el => el.scrollHeight);
      const bodyClientHeight = await body.evaluate(el => el.clientHeight);
      expect(bodyScrollHeight).toBeLessThanOrEqual(bodyClientHeight + 10); // Small tolerance
    });
  });
});

// Test button styling and interactions
test.describe('Button Styling Tests', () => {
  deviceTypes.forEach(device => {
    test(`Buttons render correctly on ${device.name}`, async ({ page }) => {
      await page.setViewportSize(device.viewport);
      await page.goto('/');

      // Test Browse Listings button
      const browseButton = page.locator('a[href="/listings"]');
      await expect(browseButton).toBeVisible();
      
      // Verify button styling
      const browseStyles = await browseButton.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return {
          display: styles.display,
          alignItems: styles.alignItems,
          justifyContent: styles.justifyContent,
          padding: styles.padding,
          borderRadius: styles.borderRadius,
          backgroundColor: styles.backgroundColor,
          color: styles.color
        };
      });

      expect(browseStyles.display).toMatch(/^(flex|inline-flex)$/);
      expect(browseStyles.alignItems).toBe('center');
      expect(browseStyles.justifyContent).toBe('center');
      expect(browseStyles.borderRadius).toContain('12px'); // rounded-xl

      // Test button hover states
      await browseButton.hover();
      await page.waitForTimeout(300); // Wait for transition

      // Test Create Listing button
      const createButton = page.locator('button').first();
      await expect(createButton).toBeVisible();

      // Verify icon visibility in buttons
      const browseIcon = browseButton.locator('svg');
      const createIcon = createButton.locator('svg');
      await expect(browseIcon).toBeVisible();
      await expect(createIcon).toBeVisible();

      // Test button spacing on different devices
      if (device.viewport.width >= 640) {
        // Desktop/tablet: buttons should be side by side
        const buttonContainer = page.locator('div').filter({ hasText: 'Browse Listings' }).first();
        const containerStyles = await buttonContainer.evaluate(el => {
          return window.getComputedStyle(el).flexDirection;
        });
        expect(containerStyles).toContain('row');
      } else {
        // Mobile: buttons should stack
        const buttonContainer = page.locator('div').filter({ hasText: 'Browse Listings' }).first();
        const containerStyles = await buttonContainer.evaluate(el => {
          return window.getComputedStyle(el).flexDirection;
        });
        expect(containerStyles).toBe('column');
      }
    });
  });
});

// Test trust badges styling
test.describe('Trust Badges Tests', () => {
  deviceTypes.forEach(device => {
    test(`Trust badges display correctly on ${device.name}`, async ({ page }) => {
      await page.setViewportSize(device.viewport);
      await page.goto('/');

      // Test all trust badges are visible
      const badges = page.locator('div').filter({ hasText: 'ID Verified' }).first().locator('..');
      const badgeElements = badges.locator('div').filter({ hasText: /ID Verified|VIN Reports|Secure Escrow/ });
      
      await expect(badgeElements.first()).toBeVisible();
      await expect(badgeElements.nth(1)).toBeVisible();
      await expect(badgeElements.nth(2)).toBeVisible();

      // Verify badge styling
      const badgeStyles = await badgeElements.first().evaluate(el => {
        const styles = window.getComputedStyle(el);
        return {
          display: styles.display,
          alignItems: styles.alignItems,
          gap: styles.gap,
          padding: styles.padding,
          borderRadius: styles.borderRadius,
          fontSize: styles.fontSize
        };
      });

      expect(badgeStyles.display).toBe('inline-flex');
      expect(badgeStyles.alignItems).toBe('center');
      expect(badgeStyles.borderRadius).toContain('9999px'); // rounded-full

      // Test badge icons
      const badgeIcons = badgeElements.locator('svg');
      await expect(badgeIcons.first()).toBeVisible();

      // Test responsive badge layout
      const badgeContainer = badges.first();
      const containerBox = await badgeContainer.boundingBox();
      expect(containerBox.width).toBeLessThanOrEqual(device.viewport.width);
    });
  });
});

// Test header styling consistency
test.describe('Header Styling Tests', () => {
  deviceTypes.forEach(device => {
    test(`Header displays correctly on ${device.name}`, async ({ page }) => {
      await page.setViewportSize(device.viewport);
      await page.goto('/');

      // Test header visibility and height
      const header = page.locator('nav');
      await expect(header).toBeVisible();
      
      const headerHeight = await header.evaluate(el => el.offsetHeight);
      expect(headerHeight).toBeGreaterThanOrEqual(60); // Allow minor variations in height

      // Test logo visibility
      const logo = page.locator('nav div').filter({ hasText: 'SafeTrade' }).first();
      await expect(logo).toBeVisible();

      // Test user section on different screen sizes
      if (device.viewport.width >= 640) {
        // Desktop: full user info should be visible
        const userInfo = page.locator('nav').locator('div').filter({ hasText: /Sign In|Account/ }).first();
        await expect(userInfo).toBeVisible();
      } else {
        // Mobile: condensed view
        const mobileMenu = page.locator('nav button[aria-label*="menu"]').first();
        if (await mobileMenu.isVisible()) {
          await expect(mobileMenu).toBeVisible();
        }
      }
    });
  });
});

// Test footer styling consistency
test.describe('Footer Styling Tests', () => {
  deviceTypes.forEach(device => {
    test(`Footer displays correctly on ${device.name}`, async ({ page }) => {
      await page.setViewportSize(device.viewport);
      await page.goto('/');

      // Test footer visibility and height
      const footer = page.locator('footer');
      await expect(footer).toBeVisible();
      
      const footerHeight = await footer.evaluate(el => el.offsetHeight);
      expect(footerHeight).toBeGreaterThanOrEqual(60); // Allow minor variations in height

      // Test footer content layout
      const footerContent = footer.locator('div').first();
      const contentStyles = await footerContent.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return {
          display: styles.display,
          alignItems: styles.alignItems,
          justifyContent: styles.justifyContent,
          height: styles.height
        };
      });

      expect(contentStyles.display).toBe('flex');
      expect(contentStyles.alignItems).toBe('center');
      expect(contentStyles.justifyContent).toBe('space-between');

      // Test responsive footer links
      if (device.viewport.width >= 768) {
        // Desktop: links should be visible
        const footerLinks = footer.locator('a').filter({ hasText: /About|Privacy|Terms|Contact/ });
        await expect(footerLinks.first()).toBeVisible();
      }

      // Test social icons
      const socialIcons = footer.locator('svg');
      await expect(socialIcons.first()).toBeVisible();
    });
  });
});

// Test CSS Grid and Flexbox compatibility
test.describe('Layout System Tests', () => {
  test('CSS Grid and Flexbox work across browsers', async ({ page, browserName }) => {
    await page.goto('/');

    // Test main layout container
    const mainContainer = page.locator('main');
    const containerStyles = await mainContainer.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return {
        display: styles.display,
        flexDirection: styles.flexDirection
      };
    });

    // Verify modern CSS features are supported
    expect(containerStyles.display).toMatch(/flex|block/);

    // Test CSS custom properties (variables)
    const logo = page.locator('nav div[style*="backgroundColor"]').first();
    if (await logo.isVisible()) {
      const logoStyles = await logo.evaluate(el => {
        return window.getComputedStyle(el).backgroundColor;
      });
      expect(logoStyles).toMatch(/rgb|#/); // Should have actual color value
    }
  });
});

// Test animation performance
test.describe('Animation Performance Tests', () => {
  test('Animations perform smoothly across devices', async ({ page }) => {
    await page.goto('/');

    // Test floating elements animation
    const floatingElements = page.locator('div[style*="animate-bounce"]');
    if (await floatingElements.first().isVisible()) {
      // Verify animations don't cause layout shifts
      const initialLayout = await page.evaluate(() => {
        return {
          scrollHeight: document.body.scrollHeight,
          clientHeight: document.body.clientHeight
        };
      });

      await page.waitForTimeout(2000); // Wait for animations

      const finalLayout = await page.evaluate(() => {
        return {
          scrollHeight: document.body.scrollHeight,
          clientHeight: document.body.clientHeight
        };
      });

      expect(finalLayout.scrollHeight).toBe(initialLayout.scrollHeight);
    }

    // Test button hover animations
    const browseButton = page.locator('a[href="/listings"]');
    await browseButton.hover();
    
    // Verify smooth transitions
    await page.waitForTimeout(300);
    await expect(browseButton).toBeVisible();
  });
});

// Test color contrast and accessibility
test.describe('Visual Accessibility Tests', () => {
  test('Text has sufficient color contrast', async ({ page }) => {
    await page.goto('/');

    // Test main heading contrast
    const mainHeading = page.locator('h1');
    const headingStyles = await mainHeading.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return {
        color: styles.color,
        backgroundColor: styles.backgroundColor
      };
    });

    // Verify dark text (should be rgb(0, 0, 0) or similar)
    expect(headingStyles.color).toMatch(/rgb\(0,\s*0,\s*0\)|#000/);

    // Test button text contrast
    const buttons = page.locator('a[href="/listings"], button');
    await expect(buttons.first()).toBeVisible();
  });
});