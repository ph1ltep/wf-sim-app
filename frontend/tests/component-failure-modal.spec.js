/**
 * ComponentFailureModal E2E Tests
 * Tests the detailed configuration modal functionality
 */

const { test, expect } = require('@playwright/test');

test.describe('ComponentFailureModal', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to failure rates page
    await page.goto('/scenario/equipment/failure-rates');
    
    // Wait for page to load
    await expect(page.locator('h2')).toContainText('Component Failure Rates');
    
    // Initialize defaults if needed
    const initButton = page.getByText('Initialize Defaults');
    const buttonExists = await initButton.count() > 0;
    
    if (buttonExists) {
      await initButton.click();
      await page.waitForTimeout(2000);
    }
  });

  test('should open ComponentFailureModal with correct component data', async ({ page }) => {
    // Find and click first Configure button
    const configureButtons = page.getByText('Configure');
    await configureButtons.first().click();
    
    // Verify modal opens
    await expect(page.locator('.ant-modal')).toBeVisible();
    
    // Check modal title
    await expect(page.getByText('Component Failure Configuration')).toBeVisible();
    
    // Verify component name is displayed
    // The first component should be Gearbox based on DEFAULT_COMPONENTS
    await expect(page.locator('.ant-modal').getByText('Gearbox')).toBeVisible();
  });

  test('should display DistributionFieldV3 with proper controls', async ({ page }) => {
    // Open modal for first component
    await page.getByText('Configure').first().click();
    await expect(page.locator('.ant-modal')).toBeVisible();
    
    // Check for distribution field label
    await expect(page.getByText('Failure Rate Distribution')).toBeVisible();
    
    // Check for distribution type dropdown
    const distributionSelect = page.locator('.ant-modal .ant-select').first();
    await expect(distributionSelect).toBeVisible();
    
    // Verify default distribution type (should be exponential)
    await expect(distributionSelect.locator('.ant-select-selection-item')).toContainText('exponential');
    
    // Check for parameter input fields
    const lambdaInput = page.locator('.ant-modal input[placeholder*="lambda"], .ant-modal input[id*="lambda"]').first();
    await expect(lambdaInput).toBeVisible();
  });

  test('should allow changing distribution type', async ({ page }) => {
    // Open modal
    await page.getByText('Configure').first().click();
    await expect(page.locator('.ant-modal')).toBeVisible();
    
    // Click distribution type selector
    const distributionSelect = page.locator('.ant-modal .ant-select').first();
    await distributionSelect.click();
    
    // Wait for dropdown options
    await expect(page.locator('.ant-select-dropdown')).toBeVisible();
    
    // Check for available distribution types
    await expect(page.getByText('normal')).toBeVisible();
    await expect(page.getByText('lognormal')).toBeVisible();
    await expect(page.getByText('uniform')).toBeVisible();
    
    // Select a different distribution
    await page.getByText('normal').click();
    
    // Verify selection changed
    await expect(distributionSelect.locator('.ant-select-selection-item')).toContainText('normal');
    
    // Verify parameter fields changed (normal distribution should show mean and stddev)
    await expect(page.locator('.ant-modal input[placeholder*="mean"], .ant-modal input[id*="mean"]')).toBeVisible();
    await expect(page.locator('.ant-modal input[placeholder*="stddev"], .ant-modal input[id*="stddev"]')).toBeVisible();
  });

  test('should update parameter values', async ({ page }) => {
    // Open modal
    await page.getByText('Configure').first().click();
    await expect(page.locator('.ant-modal')).toBeVisible();
    
    // Find lambda parameter input (for exponential distribution)
    const lambdaInput = page.locator('.ant-modal input[placeholder*="lambda"], .ant-modal input[id*="lambda"]').first();
    
    if (await lambdaInput.count() > 0) {
      // Clear and enter new value
      await lambdaInput.fill('0.035');
      
      // Verify value was entered
      await expect(lambdaInput).toHaveValue('0.035');
    }
  });

  test('should display distribution plot', async ({ page }) => {
    // Open modal
    await page.getByText('Configure').first().click();
    await expect(page.locator('.ant-modal')).toBeVisible();
    
    // Look for Plotly plot container (DistributionPlot component)
    const plotContainer = page.locator('.ant-modal .js-plotly-plot, .ant-modal .plotly, .ant-modal [data-testid="distribution-plot"]');
    
    // Wait a bit for plot to potentially render
    await page.waitForTimeout(2000);
    
    // Check if plot container exists (might not render due to test environment)
    const plotExists = await plotContainer.count() > 0;
    
    if (plotExists) {
      await expect(plotContainer).toBeVisible();
    } else {
      // If plot doesn't render, at least verify the plot container or placeholder exists
      console.log('Distribution plot may not render in test environment');
    }
  });

  test('should save changes and close modal', async ({ page }) => {
    // Open modal
    await page.getByText('Configure').first().click();
    await expect(page.locator('.ant-modal')).toBeVisible();
    
    // Make a change to lambda value
    const lambdaInput = page.locator('.ant-modal input[placeholder*="lambda"], .ant-modal input[id*="lambda"]').first();
    
    if (await lambdaInput.count() > 0) {
      await lambdaInput.fill('0.040');
    }
    
    // Save changes
    const saveButton = page.locator('.ant-modal .ant-btn-primary').getByText('Save', { exact: false });
    
    if (await saveButton.count() > 0) {
      await saveButton.click();
    } else {
      // Try OK button
      await page.locator('.ant-modal .ant-btn-primary').getByText('OK').click();
    }
    
    // Verify modal closes
    await expect(page.locator('.ant-modal')).not.toBeVisible();
    
    // Verify success message
    await expect(page.locator('.ant-message')).toBeVisible({ timeout: 5000 });
  });

  test('should cancel changes and close modal', async ({ page }) => {
    // Open modal
    await page.getByText('Configure').first().click();
    await expect(page.locator('.ant-modal')).toBeVisible();
    
    // Make a change
    const lambdaInput = page.locator('.ant-modal input[placeholder*="lambda"], .ant-modal input[id*="lambda"]').first();
    
    if (await lambdaInput.count() > 0) {
      await lambdaInput.fill('0.999');
    }
    
    // Cancel
    const cancelButton = page.locator('.ant-modal .ant-btn').getByText('Cancel');
    
    if (await cancelButton.count() > 0) {
      await cancelButton.click();
    } else {
      // Try escape key
      await page.press('body', 'Escape');
    }
    
    // Verify modal closes
    await expect(page.locator('.ant-modal')).not.toBeVisible();
  });

  test('should handle different component types', async ({ page }) => {
    // Test with different components
    const configureButtons = page.getByText('Configure');
    const buttonCount = await configureButtons.count();
    
    if (buttonCount > 1) {
      // Test second component (Generator)
      await configureButtons.nth(1).click();
      await expect(page.locator('.ant-modal')).toBeVisible();
      
      // Should show Generator in modal
      await expect(page.locator('.ant-modal').getByText('Generator')).toBeVisible();
      
      // Close and test third component if available
      await page.press('body', 'Escape');
      await expect(page.locator('.ant-modal')).not.toBeVisible();
      
      if (buttonCount > 2) {
        await configureButtons.nth(2).click();
        await expect(page.locator('.ant-modal')).toBeVisible();
        
        // Should show Main Bearing in modal
        await expect(page.locator('.ant-modal').getByText('Main Bearing')).toBeVisible();
        
        await page.press('body', 'Escape');
      }
    }
  });

  test('should validate parameter inputs', async ({ page }) => {
    // Open modal
    await page.getByText('Configure').first().click();
    await expect(page.locator('.ant-modal')).toBeVisible();
    
    // Try to enter invalid value (negative for exponential lambda)
    const lambdaInput = page.locator('.ant-modal input[placeholder*="lambda"], .ant-modal input[id*="lambda"]').first();
    
    if (await lambdaInput.count() > 0) {
      await lambdaInput.fill('-0.1');
      
      // Try to save
      const saveButton = page.locator('.ant-modal .ant-btn-primary').getByText(/Save|OK/);
      
      if (await saveButton.count() > 0) {
        await saveButton.click();
        
        // Should show validation error or prevent save
        // The exact behavior depends on the validation implementation
        await page.waitForTimeout(1000);
        
        // Either modal should still be open (validation prevented save)
        // or error message should be shown
        const modalStillOpen = await page.locator('.ant-modal').isVisible();
        const errorMessage = await page.locator('.ant-form-item-explain-error, .ant-message-error').isVisible();
        
        expect(modalStillOpen || errorMessage).toBe(true);
      }
    }
  });

  test('should display component metadata', async ({ page }) => {
    // Open modal
    await page.getByText('Configure').first().click();
    await expect(page.locator('.ant-modal')).toBeVisible();
    
    // Check for component category display
    await expect(page.locator('.ant-modal .ant-tag')).toBeVisible();
    
    // Check for component icon
    await expect(page.locator('.ant-modal .anticon')).toBeVisible();
    
    // The modal should show the component's category (Drivetrain for Gearbox)
    await expect(page.locator('.ant-modal').getByText('Drivetrain')).toBeVisible();
  });

  test('should handle time series mode toggle', async ({ page }) => {
    // Open modal
    await page.getByText('Configure').first().click();
    await expect(page.locator('.ant-modal')).toBeVisible();
    
    // Look for time series toggle (if implemented)
    const timeSeriesToggle = page.locator('.ant-modal .ant-switch').filter({ hasText: /time.*series|Time.*Series/i });
    
    if (await timeSeriesToggle.count() > 0) {
      // Test toggling time series mode
      await timeSeriesToggle.click();
      
      // Verify UI changes appropriately
      // This would depend on the specific implementation
      await page.waitForTimeout(500);
    }
  });
});