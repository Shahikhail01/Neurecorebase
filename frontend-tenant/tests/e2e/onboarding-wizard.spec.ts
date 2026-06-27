/**
 * Onboarding wizard E2E test — exercises every clickable button across all 6 steps.
 *
 * Strategy: Use Playwright route mocking to intercept API calls so this test
 * can run against the live Vercel deploy WITHOUT mutating production state.
 *
 * Run:
 *   PLAYWRIGHT_BASE_URL=https://hq.neurecore.com \
 *     npx playwright test tests/e2e/onboarding-wizard.spec.ts --reporter=list
 */
import { test, expect, Page } from '@playwright/test';

const TIER_LIST = [
  { id: 'tier_starter', name: 'Starter', slug: 'starter', monthlyPrice: 0, maxUsers: 10, maxAgents: 5, maxDepartments: 1, maxStorageGB: 10, maxApiCalls: 1000, isDefault: true },
  { id: 'tier_pro',     name: 'Pro',     slug: 'pro',     monthlyPrice: 49, maxUsers: 50, maxAgents: 25, maxDepartments: 10, maxStorageGB: 100, maxApiCalls: 10000, isDefault: false },
];

const TEMPLATE_LIST = [
  { id: 'tpl_1', name: 'Operations Starter', slug: 'ops-starter', description: 'Small ops team', structure: [{ name: 'Ops' }] },
];

async function installRouteMocks(page: Page) {
  await page.route('**/api/v1/auth/me', (r) =>
    r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ status: 'success', data: { id: 'u1', email: 'demo@neurecore.ai', role: 'OWNER', tenantId: 't1' } }) }));
  await page.route('**/api/v1/onboarding/state', (r) =>
    r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ status: 'success', data: { step: 'company', company: {}, tierId: null } }) }));
  await page.route('**/api/v1/tiers**', (r) =>
    r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ status: 'success', data: TIER_LIST }) }));
  await page.route('**/api/v1/department-templates**', (r) =>
    r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ status: 'success', data: { items: TEMPLATE_LIST } }) }));
  await page.route('**/api/v1/onboarding/state**', (r) =>
    r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ status: 'success', data: { step: 'plan' } }) }));
  await page.route('**/api/v1/onboarding/select-tier', (r) =>
    r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ status: 'success', data: { tier: TIER_LIST[0] } }) }));
  await page.route('**/api/v1/onboarding/select-template', (r) =>
    r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ status: 'success', data: { departmentsCreated: 3, agentsCreated: 5 } }) }));
  await page.route('**/api/v1/onboarding/invite', (r) =>
    r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ status: 'success', data: { tokens: ['tok1', 'tok2'] } }) }));
  await page.route('**/api/v1/onboarding/complete', (r) =>
    r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ status: 'success', data: { completedAt: new Date().toISOString() } }) }));
}

async function navigateToWizard(page: Page) {
  // Inject a fake JWT into localStorage so useTenantAuth hydrates as logged-in
  await page.addInitScript(() => {
    const fakeToken = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1MSIsImVtYWlsIjoiZGVtb0BuZXVyZWNvcmUuYWkiLCJyb2xlIjoiT1dORVIiLCJ0ZW5hbnRJZCI6InQxIn0.fake';
    window.localStorage.setItem(
      'neurecore-auth',
      JSON.stringify({
        state: {
          user: { id: 'u1', email: 'demo@neurecore.ai', role: 'OWNER', tenantId: 't1' },
          accessToken: fakeToken,
          refreshToken: 'r1',
        },
        version: 0,
      })
    );
  });
  await page.goto('/onboarding/setup');
}

test.describe('Onboarding wizard — full UI flow with mocked API', () => {
  test('Step 1: Company — Continue disabled until name, then advances', async ({ page }) => {
    await installRouteMocks(page);
    await navigateToWizard(page);
    await expect(page.getByRole('heading', { name: /Tell us about your company/i })).toBeVisible({ timeout: 10_000 });
    const cont = page.getByRole('button', { name: /^Continue/ });
    await expect(cont).toBeDisabled();
    await page.fill('input#company-name', 'Test Co');
    await expect(cont).toBeEnabled();
    await cont.click();
    await expect(page.getByRole('heading', { name: /Choose your plan/i })).toBeVisible({ timeout: 5000 });
  });

  test('Step 2: Plan — Continue disabled until tier, then advances', async ({ page }) => {
    await installRouteMocks(page);
    await navigateToWizard(page);
    await page.fill('input#company-name', 'Test Co');
    await page.getByRole('button', { name: /^Continue/ }).click();
    await expect(page.getByRole('heading', { name: /Choose your plan/i })).toBeVisible();
    await expect(page.getByText(/users/i).first()).toBeVisible({ timeout: 10_000 });
    const cont = page.locator('button:has-text("Continue")').last();
    await expect(cont).toBeDisabled();
    await page.locator('button[aria-pressed]').first().click();
    await expect(cont).toBeEnabled();
    await cont.click();
    await expect(page.getByRole('heading', { name: /Pick a starting template/i })).toBeVisible({ timeout: 10_000 });
  });

  test('Step 2: Plan — Back returns to Company, preserves name', async ({ page }) => {
    await installRouteMocks(page);
    await navigateToWizard(page);
    await page.fill('input#company-name', 'MyCo');
    await page.getByRole('button', { name: /^Continue/ }).click();
    await expect(page.getByRole('heading', { name: /Choose your plan/i })).toBeVisible();
    await page.locator('button:has-text("Back")').first().click();
    await expect(page.getByRole('heading', { name: /Tell us about your company/i })).toBeVisible();
    await expect(page.locator('input#company-name')).toHaveValue('MyCo');
  });

  test('Step 3: Template — click card, auto-advance to Review with deployment summary', async ({ page }) => {
    await installRouteMocks(page);
    await navigateToWizard(page);
    await page.fill('input#company-name', 'Test Co');
    await page.getByRole('button', { name: /^Continue/ }).click();
    await page.locator('button[aria-pressed]').first().click();
    await page.locator('button:has-text("Continue")').last().click();
    await expect(page.getByRole('heading', { name: /Pick a starting template/i })).toBeVisible({ timeout: 10_000 });
    await page.locator('button[aria-pressed]').first().click();
    await expect(page.getByRole('heading', { name: /Review your setup/i })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/departments created/i)).toBeVisible();
  });

  test('Step 4: Review — Looks good advances to Team', async ({ page }) => {
    await installRouteMocks(page);
    await navigateToWizard(page);
    await page.fill('input#company-name', 'Test Co');
    await page.getByRole('button', { name: /^Continue/ }).click();
    await page.locator('button[aria-pressed]').first().click();
    await page.locator('button:has-text("Continue")').last().click();
    await page.locator('button[aria-pressed]').first().click();
    await expect(page.getByRole('heading', { name: /Review your setup/i })).toBeVisible();
    await page.locator('button:has-text("Looks good")').click();
    await expect(page.getByRole('heading', { name: /Invite your team/i })).toBeVisible();
  });

  test('Step 5: Team — Send Invites with empty emails STUCK-BUG regression test (must advance to Complete)', async ({ page }) => {
    await installRouteMocks(page);
    await navigateToWizard(page);
    await page.fill('input#company-name', 'Test Co');
    await page.getByRole('button', { name: /^Continue/ }).click();
    await page.locator('button[aria-pressed]').first().click();
    await page.locator('button:has-text("Continue")').last().click();
    await page.locator('button[aria-pressed]').first().click();
    await page.locator('button:has-text("Looks good")').click();
    await expect(page.getByRole('heading', { name: /Invite your team/i })).toBeVisible();
    await page.locator('button:has-text("Send invites")').click();
    // Should advance to Complete (previously stuck)
    await expect(page.getByRole('heading', { name: /You are all set/i })).toBeVisible({ timeout: 5000 });
  });

  test('Step 5: Team — Skip for now DIRECTION-BUG regression test (must go to Complete, not Review)', async ({ page }) => {
    await installRouteMocks(page);
    await navigateToWizard(page);
    await page.fill('input#company-name', 'Test Co');
    await page.getByRole('button', { name: /^Continue/ }).click();
    await page.locator('button[aria-pressed]').first().click();
    await page.locator('button:has-text("Continue")').last().click();
    await page.locator('button[aria-pressed]').first().click();
    await page.locator('button:has-text("Looks good")').click();
    await expect(page.getByRole('heading', { name: /Invite your team/i })).toBeVisible();
    await page.locator('button:has-text("Skip for now")').click();
    await expect(page.getByRole('heading', { name: /You are all set/i })).toBeVisible({ timeout: 5000 });
  });

  test('Step 5: Team — invalid email shows inline error, does not advance', async ({ page }) => {
    await installRouteMocks(page);
    await navigateToWizard(page);
    await page.fill('input#company-name', 'Test Co');
    await page.getByRole('button', { name: /^Continue/ }).click();
    await page.locator('button[aria-pressed]').first().click();
    await page.locator('button:has-text("Continue")').last().click();
    await page.locator('button[aria-pressed]').first().click();
    await page.locator('button:has-text("Looks good")').click();
    await expect(page.getByRole('heading', { name: /Invite your team/i })).toBeVisible();
    await page.fill('input[type="email"]', 'not-an-email');
    await page.locator('button:has-text("Send invites")').click();
    await expect(page.getByText(/Invalid email/i)).toBeVisible({ timeout: 3000 });
    await expect(page.getByRole('heading', { name: /Invite your team/i })).toBeVisible();
  });

  test('Step 5: Team — valid email sends invites and advances to Complete with token links', async ({ page }) => {
    await installRouteMocks(page);
    await navigateToWizard(page);
    await page.fill('input#company-name', 'Test Co');
    await page.getByRole('button', { name: /^Continue/ }).click();
    await page.locator('button[aria-pressed]').first().click();
    await page.locator('button:has-text("Continue")').last().click();
    await page.locator('button[aria-pressed]').first().click();
    await page.locator('button:has-text("Looks good")').click();
    await expect(page.getByRole('heading', { name: /Invite your team/i })).toBeVisible();
    await page.fill('input[type="email"]', 'alice@example.com');
    await page.locator('button:has-text("Send invites")').click();
    await expect(page.getByRole('heading', { name: /You are all set/i })).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/invite\/tok1/)).toBeVisible();
    await expect(page.getByText(/alice@example.com/)).toBeVisible();
  });

  test('Step 6: Complete — Open command center button is clickable', async ({ page }) => {
    await installRouteMocks(page);
    await navigateToWizard(page);
    await page.fill('input#company-name', 'Test Co');
    await page.getByRole('button', { name: /^Continue/ }).click();
    await page.locator('button[aria-pressed]').first().click();
    await page.locator('button:has-text("Continue")').last().click();
    await page.locator('button[aria-pressed]').first().click();
    await page.locator('button:has-text("Looks good")').click();
    await page.locator('button:has-text("Skip for now")').click();
    await expect(page.getByRole('heading', { name: /You are all set/i })).toBeVisible({ timeout: 5000 });
    const finishBtn = page.locator('button:has-text("Open command center")');
    await expect(finishBtn).toBeEnabled();
  });
});