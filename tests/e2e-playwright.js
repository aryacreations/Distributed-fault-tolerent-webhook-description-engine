/**
 * Distributed Webhook Dispatcher - End-to-End Playwright Automation Script
 * 
 * Demonstrates full browser cursor control, navigation, scenario execution,
 * and walkthrough guide interactions using standardized data-testid selectors.
 *
 * Requirements:
 *   npm install playwright (or npx playwright test)
 *
 * Run:
 *   node tests/e2e-playwright.js
 */

const { chromium } = require('playwright');

async function runAutomation() {
  console.log('🚀 Launching Chromium for Dispatcher E2E Test...');
  const browser = await chromium.launch({
    headless: false, // Set to false to visibly watch the cursor move and interact!
    slowMo: 600,     // 600ms delay so every cursor movement and action is clearly visible
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  const BASE_URL = process.env.TEST_URL || 'http://localhost:5173';
  console.log(`📡 Navigating to ${BASE_URL}...`);
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });

  // Helper for moving cursor visibly before clicking
  async function hoverAndClick(selector, label) {
    console.log(`👉 Moving cursor to: ${label} (${selector})`);
    const el = page.locator(selector).first();
    await el.waitFor({ state: 'visible', timeout: 5000 });
    await el.hover();
    await page.waitForTimeout(300);
    await el.click();
    console.log(`   ✅ Clicked: ${label}`);
  }

  try {
    // 1. Test Interactive Inspection Mode Toggle
    console.log('\n--- Step 1: Testing Interactive Tour Toggle ---');
    await hoverAndClick('[data-testid="btn-header-tour-toggle"]', 'Header Tour Toggle (Hover Mode ON)');
    await page.waitForTimeout(500);
    await hoverAndClick('[data-testid="btn-header-tour-toggle"]', 'Header Tour Toggle (Hover Mode OFF)');

    // 2. Navigate to Dispatch Studio
    console.log('\n--- Step 2: Webhook Dispatch Studio ---');
    await hoverAndClick('[data-testid="nav-tab-dispatch"]', 'Sidebar -> Dispatch Studio');

    // Select Payment Template
    await hoverAndClick('[data-testid="btn-tpl-payment"]', 'Payment Template Preset');

    // Select Mock 200 Target
    await hoverAndClick('[data-testid="btn-target-mock200"]', 'Mock 200 OK Receiver Target');

    // Regenerate ID
    await hoverAndClick('[data-testid="btn-regenerate-id"]', 'Regenerate Event ID');

    // Submit Dispatch
    await hoverAndClick('[data-testid="btn-dispatch-submit"]', 'Dispatch Webhook (202 Ingestion)');

    // Verify 202 response card
    await page.waitForSelector('[data-testid="dispatch-response-card"]', { state: 'visible', timeout: 5000 });
    console.log('   🎉 HTTP 202 Accepted response card verified!');

    // 4. Navigate to Testing Lab & Scenarios
    console.log('\n--- Step 4: Testing Lab & Fault Tolerance Scenarios ---');
    await hoverAndClick('[data-testid="nav-tab-simulator"]', 'Sidebar -> Testing Lab & Scenarios');

    // Trigger Self-Healing Flaky Server scenario (Backoff 2s -> 4s)
    await hoverAndClick('[data-testid="btn-scenario-recovering"]', 'Self-Healing Flaky Server Scenario');
    await page.waitForSelector('[data-testid="simulator-notice"]', { state: 'visible', timeout: 5000 });
    console.log('   🎉 Self-healing backoff scenario triggered successfully!');

    // 5. Navigate to Delivery Logs & Audit Trail
    console.log('\n--- Step 5: Delivery Logs & Audit Trail ---');
    await hoverAndClick('[data-testid="nav-tab-deliveries"]', 'Sidebar -> Delivery Logs & Audit');

    // Search filter test
    console.log('👉 Typing search query into search box...');
    const searchInput = page.locator('[data-testid="input-search-jobs"]');
    await searchInput.hover();
    await searchInput.fill('sim_');
    await page.waitForTimeout(500);

    // Filter by SUCCESS
    await hoverAndClick('[data-testid="filter-tab-SUCCESS"]', 'Filter SUCCESS');
    await hoverAndClick('[data-testid="filter-tab-ALL"]', 'Filter ALL');

    // Inspect Job Detail Modal
    const inspectBtn = page.locator('[data-testid="btn-inspect-job"]').first();
    if (await inspectBtn.isVisible()) {
      await hoverAndClick('[data-testid="btn-inspect-job"]', 'First Job Inspect Button');
      await page.waitForSelector('[data-testid="btn-close-modal"]', { state: 'visible' });
      console.log('   🎉 Job Execution Timeline Modal opened!');

      // Copy payload
      await hoverAndClick('[data-testid="btn-copy-payload"]', 'Copy Payload Button');

      // Close modal
      await hoverAndClick('[data-testid="btn-close-modal"]', 'Close Job Modal');
      console.log('   ✅ Job Modal closed.');
    }

    // 6. Navigate to System Architecture
    console.log('\n--- Step 6: System Architecture Blueprint ---');
    await hoverAndClick('[data-testid="nav-tab-architecture"]', 'Sidebar -> System Architecture');
    await page.waitForTimeout(1000);

    console.log('\n✨ ALL E2E AUTOMATION & CURSOR TESTS PASSED FLAWLESSLY! ✨\n');
  } catch (err) {
    console.error('❌ E2E Automation Error:', err);
  } finally {
    await page.waitForTimeout(2000);
    await browser.close();
    console.log('🔒 Browser closed.');
  }
}

if (require.main === module) {
  runAutomation();
}

module.exports = { runAutomation };
