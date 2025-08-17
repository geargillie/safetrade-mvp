// CSS validation and styling consistency tests
const { test, expect } = require('@playwright/test');

// Test CSS property support across browsers
test.describe('CSS Feature Support Tests', () => {
  test('Modern CSS features are supported', async ({ page, browserName }) => {
    await page.goto('/');

    // Test CSS Grid support
    const gridSupport = await page.evaluate(() => {
      return CSS.supports('display', 'grid');
    });
    expect(gridSupport).toBe(true);

    // Test Flexbox support
    const flexSupport = await page.evaluate(() => {
      return CSS.supports('display', 'flex');
    });
    expect(flexSupport).toBe(true);

    // Test CSS Custom Properties support
    const customPropsSupport = await page.evaluate(() => {
      return CSS.supports('color', 'var(--test)');
    });
    expect(customPropsSupport).toBe(true);

    // Test CSS Transforms support
    const transformSupport = await page.evaluate(() => {
      return CSS.supports('transform', 'translateY(-1px)');
    });
    expect(transformSupport).toBe(true);

    // Test CSS Transitions support
    const transitionSupport = await page.evaluate(() => {
      return CSS.supports('transition', 'all 0.2s');
    });
    expect(transitionSupport).toBe(true);

    // Test Border Radius support
    const borderRadiusSupport = await page.evaluate(() => {
      return CSS.supports('border-radius', '12px');
    });
    expect(borderRadiusSupport).toBe(true);

    // Test Box Shadow support
    const boxShadowSupport = await page.evaluate(() => {
      return CSS.supports('box-shadow', '0 4px 6px rgba(0, 0, 0, 0.1)');
    });
    expect(boxShadowSupport).toBe(true);
  });
});

// Test specific styling elements
test.describe('Hero Section Styling Validation', () => {
  test('Hero section has correct styling properties', async ({ page }) => {
    await page.goto('/');

    const heroSection = page.locator('section').first();
    
    // Test hero section computed styles
    const heroStyles = await heroSection.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return {
        position: styles.position,
        display: styles.display,
        alignItems: styles.alignItems,
        justifyContent: styles.justifyContent,
        overflow: styles.overflow,
        height: styles.height,
        minHeight: styles.minHeight
      };
    });

    expect(heroStyles.position).toBe('relative');
    expect(heroStyles.display).toBe('flex');
    expect(heroStyles.alignItems).toBe('center');
    expect(heroStyles.justifyContent).toBe('center');
    expect(heroStyles.overflow).toBe('hidden');

    // Test background elements
    const backgroundElement = heroSection.locator('div').first();
    const bgStyles = await backgroundElement.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return {
        position: styles.position,
        inset: styles.inset || `${styles.top} ${styles.right} ${styles.bottom} ${styles.left}`,
        backgroundImage: styles.backgroundImage
      };
    });

    expect(bgStyles.position).toBe('absolute');
    expect(bgStyles.backgroundImage).toContain('gradient');
  });

  test('Hero content is properly centered', async ({ page }) => {
    await page.goto('/');

    const heroContent = page.locator('section div[class*="max-w"]').first();
    const contentBox = await heroContent.boundingBox();
    const viewportSize = await page.viewportSize();

    // Verify horizontal centering
    const centerX = viewportSize.width / 2;
    const contentCenterX = contentBox.x + contentBox.width / 2;
    const horizontalTolerance = 50; // Allow some tolerance
    
    expect(Math.abs(contentCenterX - centerX)).toBeLessThan(horizontalTolerance);

    // Verify content doesn't overflow viewport
    expect(contentBox.x).toBeGreaterThanOrEqual(0);
    expect(contentBox.x + contentBox.width).toBeLessThanOrEqual(viewportSize.width);
  });
});

// Test button styling consistency
test.describe('Button Styling Validation', () => {
  test('Buttons have consistent styling', async ({ page }) => {
    await page.goto('/');

    const browseButton = page.locator('a[href="/listings"]');
    const createButton = page.locator('button').first();

    // Test Browse button styles
    const browseStyles = await browseButton.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return {
        display: styles.display,
        alignItems: styles.alignItems,
        justifyContent: styles.justifyContent,
        gap: styles.gap,
        padding: styles.padding,
        backgroundColor: styles.backgroundColor,
        color: styles.color,
        fontSize: styles.fontSize,
        fontWeight: styles.fontWeight,
        borderRadius: styles.borderRadius,
        boxShadow: styles.boxShadow,
        transition: styles.transition
      };
    });

    expect(browseStyles.display).toBe('inline-flex');
    expect(browseStyles.alignItems).toBe('center');
    expect(browseStyles.justifyContent).toBe('center');
    expect(browseStyles.gap).toContain('8px'); // gap-2
    expect(browseStyles.backgroundColor).toBe('rgb(0, 0, 0)'); // bg-black
    expect(browseStyles.color).toBe('rgb(255, 255, 255)'); // text-white
    expect(browseStyles.borderRadius).toContain('12px'); // rounded-xl

    // Test Create button styles
    const createStyles = await createButton.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return {
        display: styles.display,
        alignItems: styles.alignItems,
        justifyContent: styles.justifyContent,
        backgroundColor: styles.backgroundColor,
        color: styles.color,
        borderWidth: styles.borderWidth,
        borderColor: styles.borderColor
      };
    });

    expect(createStyles.display).toBe('inline-flex');
    expect(createStyles.backgroundColor).toBe('rgb(255, 255, 255)'); // bg-white
    expect(createStyles.color).toBe('rgb(0, 0, 0)'); // text-black
    expect(createStyles.borderWidth).toBe('2px'); // border-2

    // Test button icons
    const browseIcon = browseButton.locator('svg');
    const createIcon = createButton.locator('svg');
    
    await expect(browseIcon).toBeVisible();
    await expect(createIcon).toBeVisible();

    const iconStyles = await browseIcon.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return {
        width: styles.width,
        height: styles.height,
        flexShrink: styles.flexShrink
      };
    });

    expect(iconStyles.width).toBe('20px'); // w-5
    expect(iconStyles.height).toBe('20px'); // h-5
    expect(iconStyles.flexShrink).toBe('0'); // flex-shrink-0
  });

  test('Button hover states work correctly', async ({ page }) => {
    await page.goto('/');

    const browseButton = page.locator('a[href="/listings"]');
    
    // Get initial styles
    const initialStyles = await browseButton.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return {
        backgroundColor: styles.backgroundColor,
        boxShadow: styles.boxShadow
      };
    });

    // Hover and check styles change
    await browseButton.hover();
    await page.waitForTimeout(300); // Wait for transition

    const hoverStyles = await browseButton.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return {
        backgroundColor: styles.backgroundColor,
        boxShadow: styles.boxShadow
      };
    });

    // Background should change on hover (black to gray-800)
    expect(hoverStyles.backgroundColor).not.toBe(initialStyles.backgroundColor);
  });
});

// Test trust badge styling
test.describe('Trust Badge Styling Validation', () => {
  test('Trust badges have correct styling', async ({ page }) => {
    await page.goto('/');

    const badges = page.locator('div').filter({ hasText: /ID Verified|VIN Reports|Secure Escrow/ });
    
    // Test first badge styling
    const badgeStyles = await badges.first().evaluate(el => {
      const styles = window.getComputedStyle(el);
      return {
        display: styles.display,
        alignItems: styles.alignItems,
        gap: styles.gap,
        padding: styles.padding,
        backgroundImage: styles.backgroundImage,
        borderWidth: styles.borderWidth,
        borderRadius: styles.borderRadius,
        fontSize: styles.fontSize,
        fontWeight: styles.fontWeight
      };
    });

    expect(badgeStyles.display).toBe('inline-flex');
    expect(badgeStyles.alignItems).toBe('center');
    expect(badgeStyles.gap).toContain('6px'); // gap-1.5
    expect(badgeStyles.backgroundImage).toContain('gradient');
    expect(badgeStyles.borderRadius).toContain('9999px'); // rounded-full
    expect(badgeStyles.fontSize).toContain('12px'); // text-xs

    // Test badge icons
    const badgeIcon = badges.first().locator('div div').first();
    const iconStyles = await badgeIcon.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return {
        width: styles.width,
        height: styles.height,
        borderRadius: styles.borderRadius,
        display: styles.display,
        alignItems: styles.alignItems,
        justifyContent: styles.justifyContent
      };
    });

    expect(iconStyles.width).toBe('16px'); // w-4
    expect(iconStyles.height).toBe('16px'); // h-4
    expect(iconStyles.borderRadius).toContain('9999px'); // rounded-full
    expect(iconStyles.display).toBe('flex');

    // Test animated dots
    const animatedDot = badges.first().locator('div').last();
    const dotStyles = await animatedDot.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return {
        width: styles.width,
        height: styles.height,
        borderRadius: styles.borderRadius,
        animationName: styles.animationName
      };
    });

    expect(dotStyles.width).toBe('4px'); // w-1
    expect(dotStyles.height).toBe('4px'); // h-1
    expect(dotStyles.animationName).toContain('pulse');
  });
});

// Test responsive design breakpoints
test.describe('Responsive Design Validation', () => {
  const breakpoints = [
    { name: 'Mobile', width: 375 },
    { name: 'Mobile Large', width: 414 },
    { name: 'Tablet', width: 768 },
    { name: 'Desktop Small', width: 1024 },
    { name: 'Desktop', width: 1366 },
    { name: 'Desktop Large', width: 1920 }
  ];

  breakpoints.forEach(bp => {
    test(`Layout works correctly at ${bp.name} (${bp.width}px)`, async ({ page }) => {
      await page.setViewportSize({ width: bp.width, height: 1000 });
      await page.goto('/');

      // Test button layout responsiveness
      const buttonContainer = page.locator('div').filter({ hasText: 'Browse Listings' }).first();
      const containerStyles = await buttonContainer.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return {
          flexDirection: styles.flexDirection,
          maxWidth: styles.maxWidth
        };
      });

      if (bp.width >= 640) { // sm breakpoint
        expect(containerStyles.flexDirection).toContain('row');
      } else {
        expect(containerStyles.flexDirection).toBe('column');
      }

      // Test trust badge responsiveness
      const badgeContainer = page.locator('div').filter({ hasText: 'ID Verified' }).first().locator('..');
      const badgeBox = await badgeContainer.boundingBox();
      expect(badgeBox.width).toBeLessThanOrEqual(bp.width);

      // Test header responsiveness
      const header = page.locator('nav');
      const headerBox = await header.boundingBox();
      expect(headerBox.width).toBeLessThanOrEqual(bp.width);

      // Test footer responsiveness
      const footer = page.locator('footer');
      const footerBox = await footer.boundingBox();
      expect(footerBox.width).toBeLessThanOrEqual(bp.width);

      // Verify no horizontal overflow
      const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth);
      expect(bodyScrollWidth).toBeLessThanOrEqual(bp.width + 20); // Small tolerance for scrollbars
    });
  });
});

// Test typography consistency
test.describe('Typography Validation', () => {
  test('Typography scales correctly', async ({ page }) => {
    await page.goto('/');

    // Test main heading typography
    const mainHeading = page.locator('h1');
    const headingStyles = await mainHeading.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return {
        fontSize: styles.fontSize,
        fontWeight: styles.fontWeight,
        lineHeight: styles.lineHeight,
        letterSpacing: styles.letterSpacing,
        color: styles.color
      };
    });

    expect(headingStyles.fontWeight).toBe('700'); // font-bold
    expect(headingStyles.color).toBe('rgb(0, 0, 0)'); // text-black

    // Test paragraph typography
    const paragraph = page.locator('p').first();
    const paragraphStyles = await paragraph.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return {
        fontSize: styles.fontSize,
        lineHeight: styles.lineHeight,
        color: styles.color
      };
    });

    expect(paragraphStyles.color).toMatch(/rgb\(107,\s*114,\s*128\)|rgb\(75,\s*85,\s*99\)/); // text-gray-600/500

    // Test button typography
    const button = page.locator('a[href="/listings"]');
    const buttonStyles = await button.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return {
        fontSize: styles.fontSize,
        fontWeight: styles.fontWeight
      };
    });

    expect(buttonStyles.fontWeight).toBe('600'); // font-semibold
  });
});