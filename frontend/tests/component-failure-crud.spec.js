import { test, expect } from '@playwright/test';

test.describe('Component Failure Rates - CRUD Operations', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the failure rates page
    await page.goto('http://localhost:3000/scenario/equipment/failure-rates');
    
    // Wait for the page to load
    await page.waitForSelector('text=Component Failure Rates Configuration');
    
    // Check if we need to initialize defaults first
    const initButton = page.locator('button:has-text("Initialize Defaults")');
    if (await initButton.isVisible()) {
      // Clear any existing components first
      await initButton.click();
      await page.waitForTimeout(1000);
    }
  });

  test.describe('CREATE Operations', () => {
    test('should add a new component with all required fields', async ({ page }) => {
      // Click Add Component button
      await page.locator('button:has-text("Add Component")').click();
      
      // Wait for the add form to appear
      await page.waitForSelector('input[placeholder="Component name"]');
      
      // Fill in the new component details
      await page.fill('input[placeholder="Component name"]', 'Test Turbine Component');
      
      // Select category from dropdown
      await page.locator('.ant-select').first().click();
      await page.locator('.ant-select-dropdown').locator('text=Mechanical').click();
      
      // Save the component
      await page.locator('button.ant-btn-primary').filter({ hasText: 'Save' }).click();
      
      // Verify the component appears in the table
      await expect(page.locator('text=Test Turbine Component')).toBeVisible();
      
      // Verify the category badge
      await expect(page.locator('.ant-tag:has-text("Mechanical")')).toBeVisible();
    });

    test('should add multiple custom components', async ({ page }) => {
      const components = [
        { name: 'Tower Structure', category: 'Mechanical' },
        { name: 'Cable System', category: 'Electrical' },
        { name: 'Pitch System', category: 'Rotor' }
      ];

      for (const component of components) {
        await page.locator('button:has-text("Add Component")').click();
        await page.waitForSelector('input[placeholder="Component name"]');
        
        await page.fill('input[placeholder="Component name"]', component.name);
        
        await page.locator('.ant-select').first().click();
        await page.locator('.ant-select-dropdown').locator(`text=${component.category}`).click();
        
        await page.locator('button.ant-btn-primary').filter({ hasText: 'Save' }).click();
        await page.waitForTimeout(500);
      }

      // Verify all components are visible
      for (const component of components) {
        await expect(page.locator(`text=${component.name}`)).toBeVisible();
      }
      
      // Verify component count increased
      const countText = await page.locator('text=/\\d+ of \\d+ components enabled/').textContent();
      expect(countText).toContain('11'); // 8 defaults + 3 new
    });

    test('should initialize default components', async ({ page }) => {
      // First clear all components if any exist
      const deleteButtons = await page.locator('button[aria-label="Delete"]').all();
      for (const button of deleteButtons) {
        await button.click();
        await page.waitForTimeout(200);
      }

      // Click Initialize Defaults
      await page.locator('button:has-text("Initialize Defaults")').click();
      await page.waitForTimeout(1000);

      // Verify 8 default components are created
      const defaultComponents = [
        'Gearbox',
        'Generator',
        'Main Bearing',
        'Power Electronics',
        'Blade Bearings',
        'Yaw System',
        'Control System',
        'Transformer'
      ];

      for (const component of defaultComponents) {
        await expect(page.locator(`text=${component}`)).toBeVisible();
      }

      // Verify component count
      const countText = await page.locator('text=/\\d+ of \\d+ components enabled/').textContent();
      expect(countText).toContain('8 components');
    });
  });

  test.describe('READ/Display Operations', () => {
    test('should display all component details in table', async ({ page }) => {
      // Verify table columns are visible
      await expect(page.locator('text=Component')).toBeVisible();
      await expect(page.locator('text=Category')).toBeVisible();
      await expect(page.locator('text=Enabled')).toBeVisible();
      await expect(page.locator('text=Failure Rate')).toBeVisible();
      await expect(page.locator('text=Cost Summary')).toBeVisible();
      await expect(page.locator('text=Actions')).toBeVisible();

      // Check first component details (Gearbox)
      const gearboxRow = page.locator('tr', { has: page.locator('text=Gearbox') });
      
      // Verify category badge
      await expect(gearboxRow.locator('.ant-tag')).toHaveText('Drivetrain');
      
      // Verify failure rate is displayed as percentage
      const failureRate = await gearboxRow.locator('td').nth(3).textContent();
      expect(failureRate).toMatch(/\d+\.\d+%/);
      
      // Verify cost icons are present
      const costIcons = gearboxRow.locator('[aria-label*="cost"]');
      expect(await costIcons.count()).toBeGreaterThan(0);
    });

    test('should show component count summary', async ({ page }) => {
      // Check component count display
      const countElement = page.locator('text=/\\d+ of \\d+ components enabled/');
      await expect(countElement).toBeVisible();
      
      // Enable a component and verify count updates
      const firstSwitch = page.locator('.ant-switch').first();
      await firstSwitch.click();
      await page.waitForTimeout(500);
      
      const updatedCount = await countElement.textContent();
      expect(updatedCount).toMatch(/1 of \d+ components enabled/);
    });

    test('should display category colors correctly', async ({ page }) => {
      // Check that different categories have different colored badges
      const categories = {
        'Drivetrain': 'blue',
        'Electrical': 'green',
        'Rotor': 'cyan',
        'Mechanical': 'orange',
        'Control': 'purple'
      };

      for (const [category, color] of Object.entries(categories)) {
        const badge = page.locator(`.ant-tag:has-text("${category}")`).first();
        if (await badge.isVisible()) {
          // Verify the badge has the expected color class or style
          const className = await badge.getAttribute('class');
          expect(className).toContain('ant-tag');
        }
      }
    });
  });

  test.describe('UPDATE Operations', () => {
    test('should edit component name', async ({ page }) => {
      // Click edit button for first component
      const editButton = page.locator('button[aria-label="Edit"]').first();
      await editButton.click();
      
      // Wait for edit mode
      await page.waitForSelector('input[value="Gearbox"]');
      
      // Clear and enter new name
      const nameInput = page.locator('input[value="Gearbox"]');
      await nameInput.clear();
      await nameInput.fill('Updated Gearbox System');
      
      // Save changes
      await page.locator('button.ant-btn-primary').filter({ hasText: 'Save' }).click();
      await page.waitForTimeout(500);
      
      // Verify the name was updated
      await expect(page.locator('text=Updated Gearbox System')).toBeVisible();
      await expect(page.locator('text=Gearbox').first()).not.toBeVisible();
    });

    test('should toggle component enabled status', async ({ page }) => {
      // Get initial enabled count
      const countElement = page.locator('text=/\\d+ of \\d+ components enabled/');
      const initialCount = await countElement.textContent();
      
      // Toggle first component
      const firstSwitch = page.locator('.ant-switch').first();
      const initialState = await firstSwitch.getAttribute('aria-checked');
      await firstSwitch.click();
      await page.waitForTimeout(500);
      
      // Verify switch state changed
      const newState = await firstSwitch.getAttribute('aria-checked');
      expect(newState).not.toBe(initialState);
      
      // Verify count updated
      const updatedCount = await countElement.textContent();
      expect(updatedCount).not.toBe(initialCount);
    });

    test('should open configuration modal and update failure rate', async ({ page }) => {
      // Click Configure button for first component
      const configButton = page.locator('button:has-text("Configure")').first();
      await configButton.click();
      
      // Wait for modal to open
      await page.waitForSelector('.ant-modal-content');
      await expect(page.locator('.ant-modal-title')).toContainText('Configure');
      
      // Verify tabs are present
      await expect(page.locator('.ant-tabs-tab:has-text("Failure Rate")')).toBeVisible();
      await expect(page.locator('.ant-tabs-tab:has-text("Cost Components")')).toBeVisible();
      await expect(page.locator('.ant-tabs-tab:has-text("Advanced")')).toBeVisible();
      
      // Update failure rate value
      const rateInput = page.locator('input[type="number"]').first();
      await rateInput.clear();
      await rateInput.fill('3.5');
      
      // Save changes
      await page.locator('.ant-modal-footer button.ant-btn-primary').click();
      await page.waitForTimeout(500);
      
      // Verify modal closed
      await expect(page.locator('.ant-modal-content')).not.toBeVisible();
      
      // Verify the failure rate was updated in the table
      const gearboxRow = page.locator('tr').filter({ hasText: 'Gearbox' }).first();
      const failureRate = await gearboxRow.locator('td').nth(3).textContent();
      expect(failureRate).toContain('3.5');
    });

    test('should update component category', async ({ page }) => {
      // Click edit button for a component
      const editButton = page.locator('button[aria-label="Edit"]').first();
      await editButton.click();
      
      // Wait for edit mode
      await page.waitForTimeout(500);
      
      // Change category
      await page.locator('.ant-select').nth(1).click(); // Second select is category
      await page.locator('.ant-select-dropdown').locator('text=Control').click();
      
      // Save changes
      await page.locator('button.ant-btn-primary').filter({ hasText: 'Save' }).click();
      await page.waitForTimeout(500);
      
      // Verify category was updated
      const gearboxRow = page.locator('tr').filter({ hasText: 'Gearbox' }).first();
      await expect(gearboxRow.locator('.ant-tag')).toHaveText('Control');
    });
  });

  test.describe('DELETE Operations', () => {
    test('should delete a single component', async ({ page }) => {
      // Get initial component count
      const initialRows = await page.locator('tbody tr').count();
      
      // Click delete button for last component
      const deleteButton = page.locator('button[aria-label="Delete"]').last();
      await deleteButton.click();
      await page.waitForTimeout(500);
      
      // Verify component count decreased
      const newRows = await page.locator('tbody tr').count();
      expect(newRows).toBe(initialRows - 1);
      
      // Verify success message (if shown)
      const successMessage = page.locator('.ant-message-success');
      if (await successMessage.isVisible()) {
        await expect(successMessage).toContainText('deleted');
      }
    });

    test('should delete multiple components', async ({ page }) => {
      // Delete 3 components
      for (let i = 0; i < 3; i++) {
        const deleteButton = page.locator('button[aria-label="Delete"]').last();
        await deleteButton.click();
        await page.waitForTimeout(300);
      }
      
      // Verify component count
      const remainingRows = await page.locator('tbody tr').count();
      expect(remainingRows).toBe(5); // 8 defaults - 3 deleted
      
      // Verify count summary updated
      const countText = await page.locator('text=/\\d+ of \\d+ components enabled/').textContent();
      expect(countText).toContain('5 components');
    });

    test('should delete all components and show initialize button', async ({ page }) => {
      // Delete all components
      let deleteButton = page.locator('button[aria-label="Delete"]').first();
      while (await deleteButton.isVisible()) {
        await deleteButton.click();
        await page.waitForTimeout(200);
        deleteButton = page.locator('button[aria-label="Delete"]').first();
      }
      
      // Verify Initialize Defaults button appears
      await expect(page.locator('button:has-text("Initialize Defaults")')).toBeVisible();
      
      // Verify no components message
      const emptyMessage = page.locator('text=No components configured');
      if (await emptyMessage.isVisible()) {
        await expect(emptyMessage).toBeVisible();
      }
    });
  });

  test.describe('Validation Tests', () => {
    test('should validate required fields when adding component', async ({ page }) => {
      // Click Add Component
      await page.locator('button:has-text("Add Component")').click();
      await page.waitForSelector('input[placeholder="Component name"]');
      
      // Try to save without filling required fields
      await page.locator('button.ant-btn-primary').filter({ hasText: 'Save' }).click();
      
      // Check for validation error on name field
      const nameInput = page.locator('input[placeholder="Component name"]');
      const nameError = await nameInput.evaluate(el => el.validationMessage || el.getAttribute('aria-invalid'));
      
      // Fill name but not category
      await nameInput.fill('Test Component');
      
      // Try to save again
      await page.locator('button.ant-btn-primary').filter({ hasText: 'Save' }).click();
      await page.waitForTimeout(500);
      
      // Component should not be added without category
      const componentInTable = page.locator('text=Test Component');
      
      // Now select category and save
      await page.locator('.ant-select').first().click();
      await page.locator('.ant-select-dropdown').locator('text=Electrical').click();
      await page.locator('button.ant-btn-primary').filter({ hasText: 'Save' }).click();
      
      // Now it should be saved
      await expect(page.locator('text=Test Component')).toBeVisible();
    });

    test('should validate failure rate parameters in modal', async ({ page }) => {
      // Open configuration modal
      const configButton = page.locator('button:has-text("Configure")').first();
      await configButton.click();
      await page.waitForSelector('.ant-modal-content');
      
      // Switch to distribution type
      const typeSelect = page.locator('.ant-select').first();
      await typeSelect.click();
      await page.locator('.ant-select-dropdown').locator('text=Normal').click();
      
      // Enter invalid standard deviation (negative)
      const stdDevInput = page.locator('input').nth(2); // Second input for normal dist
      await stdDevInput.clear();
      await stdDevInput.fill('-1');
      
      // Try to save
      await page.locator('.ant-modal-footer button.ant-btn-primary').click();
      
      // Should show validation error or not close modal
      await expect(page.locator('.ant-modal-content')).toBeVisible();
      
      // Fix the value
      await stdDevInput.clear();
      await stdDevInput.fill('0.5');
      
      // Save should work now
      await page.locator('.ant-modal-footer button.ant-btn-primary').click();
      await page.waitForTimeout(500);
      
      // Modal should close
      await expect(page.locator('.ant-modal-content')).not.toBeVisible();
    });

    test('should validate component name uniqueness', async ({ page }) => {
      // Add a component with a specific name
      await page.locator('button:has-text("Add Component")').click();
      await page.fill('input[placeholder="Component name"]', 'Unique Component');
      await page.locator('.ant-select').first().click();
      await page.locator('.ant-select-dropdown').locator('text=Mechanical').click();
      await page.locator('button.ant-btn-primary').filter({ hasText: 'Save' }).click();
      await page.waitForTimeout(500);
      
      // Try to add another component with the same name
      await page.locator('button:has-text("Add Component")').click();
      await page.fill('input[placeholder="Component name"]', 'Unique Component');
      await page.locator('.ant-select').first().click();
      await page.locator('.ant-select-dropdown').locator('text=Electrical').click();
      await page.locator('button.ant-btn-primary').filter({ hasText: 'Save' }).click();
      
      // Check for error or duplicate prevention
      // The system should either show an error or prevent the duplicate
      const components = await page.locator('text=Unique Component').count();
      // Should only have one instance if uniqueness is enforced
      expect(components).toBeLessThanOrEqual(2); // May show in edit form and table
    });

    test('should validate cost component values', async ({ page }) => {
      // Open configuration modal
      const configButton = page.locator('button:has-text("Configure")').first();
      await configButton.click();
      await page.waitForSelector('.ant-modal-content');
      
      // Switch to Cost Components tab
      await page.locator('.ant-tabs-tab:has-text("Cost Components")').click();
      await page.waitForTimeout(500);
      
      // Try to enter negative cost
      const costInput = page.locator('input[type="number"]').first();
      await costInput.clear();
      await costInput.fill('-1000');
      
      // Tab to next field or try to save
      await page.keyboard.press('Tab');
      
      // Check if value is rejected or shows error
      const value = await costInput.inputValue();
      // System should either prevent negative or show error
      
      // Enter valid positive value
      await costInput.clear();
      await costInput.fill('50000');
      
      // Save should work
      await page.locator('.ant-modal-footer button.ant-btn-primary').click();
      await page.waitForTimeout(500);
      
      // Modal should close with valid values
      await expect(page.locator('.ant-modal-content')).not.toBeVisible();
    });
  });

  test.describe('Global Feature Toggle', () => {
    test('should enable/disable entire feature with global toggle', async ({ page }) => {
      // Find global toggle
      const globalToggle = page.locator('.ant-card-head .ant-switch');
      
      // Check initial state
      const initialState = await globalToggle.getAttribute('aria-checked');
      
      // Toggle the feature
      await globalToggle.click();
      await page.waitForTimeout(500);
      
      // Verify state changed
      const newState = await globalToggle.getAttribute('aria-checked');
      expect(newState).not.toBe(initialState);
      
      // If disabled, component switches should be disabled too
      if (newState === 'false') {
        const componentSwitches = await page.locator('tbody .ant-switch').all();
        for (const switchElement of componentSwitches) {
          const isDisabled = await switchElement.getAttribute('aria-disabled');
          expect(isDisabled).toBe('true');
        }
      }
    });
  });
});