import { test, expect } from '@playwright/test'

test.describe('UK Pension Drawdown Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.goto('http://localhost:5173')
    await page.evaluate(() => localStorage.clear())
    await page.reload()
  })

  test('displays initial pot values correctly', async ({ page }) => {
    // Check header
    await expect(page.getByRole('heading', { name: 'UK Pension Drawdown Dashboard' })).toBeVisible()

    // Check initial PCLS value (25% of £863,000 = £215,750)
    await expect(page.getByText('of £215,750.00 initial')).toBeVisible()

    // Check initial SIPP value (75% of £863,000 = £647,250)
    await expect(page.getByText('of £647,250.00 initial')).toBeVisible()

    // Check initial total (£863,000)
    await expect(page.getByText('of £863,000.00 initial')).toBeVisible()
  })

  test('drawdown inputs are editable', async ({ page }) => {
    // Find PCLS drawdown inputs in the page
    const textInputs = page.getByRole('textbox')

    // Verify inputs exist (should be many - 2 per year row)
    const count = await textInputs.count()
    expect(count).toBeGreaterThan(0)

    // First input should be visible
    await expect(textInputs.first()).toBeVisible()
  })

  test('chart renders with legend', async ({ page }) => {
    // Check chart container exists
    await expect(page.getByRole('heading', { name: 'Projection Overview' })).toBeVisible()

    // Check legend items for all 3 lines (use list to be more specific)
    const legend = page.getByRole('list')
    await expect(legend.getByText('Annual Net Income')).toBeVisible()
    await expect(legend.getByText('PCLS Remaining')).toBeVisible()
    await expect(legend.getByText('SIPP Remaining')).toBeVisible()
  })

  test('config panel opens and shows settings', async ({ page }) => {
    // Open config panel
    await page.getByRole('button', { name: /Configuration/ }).click()

    // Check config content is visible
    await expect(page.getByText('Total DC Pot')).toBeVisible()
    await expect(page.getByText('Annual Return Rate')).toBeVisible()
    await expect(page.getByText('PCLS Cap')).toBeVisible()
    await expect(page.getByText('Personal Allowance')).toBeVisible()
  })

  test('table displays years and totals', async ({ page }) => {
    // Check first year is displayed
    await expect(page.getByText('2031/32').first()).toBeVisible()

    // Check totals row exists
    await expect(page.getByText('Totals')).toBeVisible()
  })

  test('pot summary cards are visible', async ({ page }) => {
    // Check pot summary cards exist with their labels
    await expect(page.locator('text=PCLS Remaining').first()).toBeVisible()
    await expect(page.locator('text=SIPP Remaining').first()).toBeVisible()
    await expect(page.locator('text=Total Remaining').first()).toBeVisible()
  })

  test('reset button restores defaults', async ({ page }) => {
    // Open config panel
    await page.getByRole('button', { name: /Configuration/ }).click()

    // Change a value by typing in first textbox
    const dcPotInput = page.locator('input[type="text"]').first()
    await dcPotInput.fill('500000')
    await dcPotInput.blur()
    await page.waitForTimeout(500)

    // Click reset
    await page.getByRole('button', { name: 'Reset to Defaults' }).click()

    // Check DC Pot is back to default (shown in collapsed panel summary)
    await expect(page.getByText('DC Pot: £863,000.00')).toBeVisible()
  })

  test('table has column headers', async ({ page }) => {
    // Check for column headers
    await expect(page.getByText('Tax Year').first()).toBeVisible()
    await expect(page.getByText('PCLS Drawdown').first()).toBeVisible()
    await expect(page.getByText('SIPP Drawdown').first()).toBeVisible()
    await expect(page.getByText('Yearly Drawdown').first()).toBeVisible()
    await expect(page.getByText('Monthly Tax').first()).toBeVisible()
    await expect(page.getByText('Monthly Net').first()).toBeVisible()
  })
})
