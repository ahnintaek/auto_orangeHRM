import { test, expect } from '@playwright/test';
import 'dotenv/config';
import { adminLogin, getEmployeeName } from './Login';

test('admin 테스트', async ({ page }) => {

    await adminLogin(page)
    const employeeName = await getEmployeeName(page);
    const userName = "Holland"

    await page.getByRole('link', { name: 'Admin' }).click();
    await page.getByRole('button', { name: 'Add' }).click();
    await page.getByText('-- Select --').first().click();
    await page.getByRole('option', { name: 'Admin' }).click();
    await page.getByText('-- Select --').click();
    await page.getByRole('option', { name: 'Enabled' }).click();
    await page.getByRole('textbox', { name: 'Type for hints...' }).fill(employeeName);
    await expect(page.getByRole('option', { name: 'Searching....' })).toBeHidden({ timeout: 10000 });
    const lastName = employeeName.split(' ').pop()!;
    const optionEmployee = page.getByRole('option').filter({ hasText: lastName });
    await expect(optionEmployee).toBeVisible({ timeout: 10000 });
    await optionEmployee.click();
    await page.getByRole('textbox').nth(2).fill(userName);   //User Name
    await page.getByRole('textbox').nth(3).fill(process.env.ADMIN_PW!); // PW fitst
    await page.getByRole('textbox').nth(4).fill(process.env.ADMIN_PW!); // PW second
    await page.getByRole('button', { name: 'Save' }).click();
    await page.waitForURL('**/admin/viewSystemUsers**');
    await expect(page.getByRole('heading', { name: 'System Users' })).toBeVisible();

    await page.locator('span').filter({ hasText: employeeName }).click();
    await page.getByRole('menuitem', { name: 'Logout' }).click();

});