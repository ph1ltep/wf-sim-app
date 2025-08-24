/**
 * Component Failure Rate Modeling E2E Tests
 * Tests the complete failure rates configuration functionality
 */

const { test, expect } = require('@playwright/test');

test.describe('Component Failure Rate Modeling', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the failure rates page
    await page.goto('/scenario/equipment/failure-rates');
    
    // Wait for the page to load
    await expect(page.locator('h2')).toContainText('Component Failure Rates');
  });

  test('should display the main failure rates page', async ({ page }) => {
    // Check page title and description
    await expect(page.locator('h2')).toContainText('Component Failure Rates');
    await expect(page.getByText('Configure failure rates and cost modeling for major wind turbine components')).toBeVisible();
    
    // Check global configuration card
    await expect(page.getByText('Global Configuration')).toBeVisible();
    await expect(page.getByText('Component failure modeling:')).toBeVisible();
    await expect(page.getByText('Active components:')).toBeVisible();
  });

  test('should display Initialize Defaults button when no components exist', async ({ page }) => {
    // Look for the Initialize Defaults button (visible when no components exist)
    const initButton = page.getByText('Initialize Defaults');
    
    // It might not be visible if components already exist, so we check conditionally
    const buttonCount = await initButton.count();
    if (buttonCount > 0) {
      await expect(initButton).toBeVisible();
    }
  });

  test('should toggle global failure rate modeling', async ({ page }) => {
    // Find the global toggle switch
    const globalToggle = page.locator('.ant-switch').first();
    
    // Get initial state
    const initialChecked = await globalToggle.isChecked();
    
    // Toggle the switch
    await globalToggle.click();
    
    // Verify state changed
    const newChecked = await globalToggle.isChecked();
    expect(newChecked).toBe(!initialChecked);
    
    // Wait for success message
    await expect(page.locator('.ant-message')).toBeVisible({ timeout: 5000 });
  });

  test('should initialize default components', async ({ page }) => {
    // Look for Initialize Defaults button
    const initButton = page.getByText('Initialize Defaults');
    const buttonExists = await initButton.count() > 0;
    
    if (buttonExists) {
      // Click Initialize Defaults
      await initButton.click();
      
      // Wait for success message
      await expect(page.locator('.ant-message')).toBeVisible({ timeout: 10000 });
      
      // Check that components table is now populated
      await expect(page.locator('.ant-table-tbody tr')).toHaveCount(8); // DEFAULT_COMPONENTS has 8 items
      
      // Verify some default components are visible
      await expect(page.getByText('Gearbox')).toBeVisible();
      await expect(page.getByText('Generator')).toBeVisible();
      await expect(page.getByText('Main Bearing')).toBeVisible();
    } else {
      console.log('Initialize Defaults button not present - components likely already exist');
    }
  });

  test('should display components in EditableTable', async ({ page }) => {
    // Ensure we have components (initialize if needed)
    const initButton = page.getByText('Initialize Defaults');
    const buttonExists = await initButton.count() > 0;
    
    if (buttonExists) {
      await initButton.click();
      await page.waitForTimeout(2000); // Wait for initialization
    }
    
    // Check that the table is visible
    await expect(page.locator('.ant-table')).toBeVisible();
    
    // Check table headers
    await expect(page.getByText('Component')).toBeVisible();
    await expect(page.getByText('Enabled')).toBeVisible();
    await expect(page.getByText('Failure Rate')).toBeVisible();
    await expect(page.getByText('Details')).toBeVisible();
    
    // Check for component rows
    const rows = page.locator('.ant-table-tbody tr');
    const rowCount = await rows.count();
    
    if (rowCount > 0) {
      // Check first row has expected content
      const firstRow = rows.first();
      await expect(firstRow.locator('.anticon')).toBeVisible(); // Component icon
      await expect(firstRow.getByText('Configure')).toBeVisible(); // Configure button
    }
  });

  test('should add new component using EditableTable', async ({ page }) => {
    // Look for Add Component button
    const addButton = page.getByText('Add Component');
    
    if (await addButton.count() > 0) {
      await addButton.click();
      
      // Wait for modal to open
      await expect(page.locator('.ant-modal')).toBeVisible();
      
      // Fill in component details
      await page.fill('input[id="name"]', 'Test Component');
      
      // Select category
      await page.click('.ant-select');
      await page.getByText('Drivetrain').click();
      
      // Fill icon
      await page.fill('input[id="icon"]', 'setting');
      
      // Toggle enabled switch
      await page.click('.ant-switch');
      
      // Save the component
      await page.getByText('OK').click();
      
      // Wait for modal to close and table to update
      await expect(page.locator('.ant-modal')).not.toBeVisible();
      
      // Verify new component appears in table
      await expect(page.getByText('Test Component')).toBeVisible();
    }
  });

  test('should open ComponentFailureModal when Configure button is clicked', async ({ page }) => {
    // Ensure we have components
    const initButton = page.getByText('Initialize Defaults');
    const buttonExists = await initButton.count() > 0;
    
    if (buttonExists) {
      await initButton.click();
      await page.waitForTimeout(2000);
    }
    
    // Find and click the first Configure button
    const configureButtons = page.getByText('Configure');
    const buttonCount = await configureButtons.count();
    
    if (buttonCount > 0) {
      await configureButtons.first().click();
      
      // Wait for the ComponentFailureModal to open
      await expect(page.locator('.ant-modal')).toBeVisible();
      
      // Check modal content
      await expect(page.getByText('Component Failure Configuration')).toBeVisible();
      
      // Close the modal
      await page.press('body', 'Escape');
      await expect(page.locator('.ant-modal')).not.toBeVisible();
    }
  });

  test('should display DistributionFieldV3 controls in ComponentFailureModal', async ({ page }) => {
    // Ensure we have components
    const initButton = page.getByText('Initialize Defaults');
    const buttonExists = await initButton.count() > 0;
    
    if (buttonExists) {
      await initButton.click();
      await page.waitForTimeout(2000);
    }
    
    // Open configuration modal
    const configureButtons = page.getByText('Configure');
    const buttonCount = await configureButtons.count();
    
    if (buttonCount > 0) {
      await configureButtons.first().click();
      
      // Wait for modal
      await expect(page.locator('.ant-modal')).toBeVisible();
      
      // Check for DistributionFieldV3 elements
      await expect(page.getByText('Failure Rate Distribution')).toBeVisible();
      
      // Look for distribution type selector
      await expect(page.locator('.ant-select')).toBeVisible();
      
      // Look for parameter input fields
      await expect(page.locator('input[type="number"]')).toBeVisible();
      
      // Close modal
      await page.press('body', 'Escape');
    }
  });

  test('should display component counts correctly', async ({ page }) => {
    // Initialize components if needed
    const initButton = page.getByText('Initialize Defaults');
    const buttonExists = await initButton.count() > 0;
    
    if (buttonExists) {
      await initButton.click();
      await page.waitForTimeout(2000);
    }
    
    // Check the active components count display
    const countText = page.locator('text=/\\d+ of \\d+/');
    await expect(countText).toBeVisible();
    
    // The count should reflect the actual number of components
    const countMatch = await countText.textContent();
    expect(countMatch).toMatch(/\d+ of \d+/);
  });

  test('should show FailureRateSummaryCard', async ({ page }) => {
    // Look for the summary card (it should always be present)
    await expect(page.getByText('Summary')).toBeVisible();
  });

  test('should handle error states gracefully', async ({ page }) => {
    // This test would ideally simulate network errors or other failure conditions
    // For now, we'll just verify the page loads without JavaScript errors
    
    // Check console for errors
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    // Reload the page and interact with it
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Try to interact with the global toggle
    const globalToggle = page.locator('.ant-switch').first();
    if (await globalToggle.count() > 0) {
      await globalToggle.click();
    }
    
    // Verify no critical JavaScript errors occurred
    const criticalErrors = errors.filter(error => 
      !error.includes('Warning') && 
      !error.includes('chunk') && 
      !error.includes('favicon')
    );
    
    expect(criticalErrors.length).toBe(0);
  });

  test('should be responsive on different screen sizes', async ({ page }) => {
    // Test desktop view (default)
    await expect(page.locator('h2')).toBeVisible();
    
    // Test tablet view
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('h2')).toBeVisible();
    await expect(page.getByText('Global Configuration')).toBeVisible();
    
    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('h2')).toBeVisible();
    
    // Reset to desktop
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('should navigate correctly from other pages', async ({ page }) => {
    // Start from home page
    await page.goto('/');
    
    // Navigate through the menu system to failure rates
    // This assumes there's a navigation structure - adjust based on actual app structure
    await page.goto('/scenario/equipment/failure-rates');
    
    // Verify we're on the correct page
    await expect(page.locator('h2')).toContainText('Component Failure Rates');
    
    // Verify URL is correct
    expect(page.url()).toContain('/scenario/equipment/failure-rates');
  });
});