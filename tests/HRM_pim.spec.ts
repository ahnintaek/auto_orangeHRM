import { test, expect } from '@playwright/test';
import path from 'path';
import 'dotenv/config';
import { adminLogin, getEmployeeName } from './Login';
import { time } from 'console';
import { TIMEOUT } from 'dns';

test('pim 테스트', async ({ page }) => {

    await adminLogin(page)
    const employeeName = await getEmployeeName(page);
    const firstName = "ahn"
    const middleName = "in"
    const lastName = "taek"
    const uploadFilePath = path.join(__dirname, '..', 'profileimg.png');
    const now = new Date();
    const timestamp = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
    
    await page.getByRole('link', { name: 'PIM' }).click();
    await page.getByRole('button', { name: 'Add' }).click();
    const fileChooserPromise1 = page.waitForEvent('filechooser');
    await page.locator('form').getByRole('img', { name: 'profile picture' }).click();
    const fileChooser1 = await fileChooserPromise1;
    await fileChooser1.setFiles(uploadFilePath); 

    await page.getByRole('textbox', { name: 'First Name' }).fill(firstName);
    await page.getByRole('textbox', { name: 'Middle Name' }).fill(middleName);
    await page.getByRole('textbox', { name: 'Last Name' }).fill(lastName);
    const employeeNum = await page.getByRole('textbox').nth(4).inputValue();
    console.log('Employee Number:', employeeNum);

    await page.locator('.oxd-switch-input').click();
    await page.getByRole('textbox').nth(5).fill(`user_${lastName}_${now.getMinutes().toString().padStart(2,'0')}${now.getSeconds().toString().padStart(2,'0')}`);
    await page.locator('input[type="password"]').first().fill(process.env.ADMIN_PW!);
    await page.locator('input[type="password"]').nth(1).fill(process.env.ADMIN_PW!);
    await page.getByText('Enabled').click();
    await page.getByRole('button', { name: 'Save' }).click();
    
    await test.step('Personal Detail', async () => {
        await page.waitForLoadState('domcontentloaded');
        await expect(page.getByRole('heading', { name: 'Personal Details' })).toBeVisible({timeout: 30000,});

        const driverLicenseRow = page.locator('.oxd-grid-item').filter({ hasText: "Driver's License Number" });
        const driverNum = driverLicenseRow.locator('input');
        await driverNum.scrollIntoViewIfNeeded();
        await driverNum.click();
        await driverNum.fill('10001');

        await page.getByRole('textbox', { name: 'yyyy-dd-mm' }).first().fill(timestamp);
        await page.getByText('-- Select --').first().click();
        await page.getByRole('option', { name: 'South Korean' }).click();
        await page.getByText('-- Select --').first().click();
        await page.getByRole('option', { name: 'Single' }).click();
        await page.getByRole('textbox', { name: 'yyyy-dd-mm' }).nth(1).fill(timestamp);
        await page.getByText('Male', { exact: true }).click();
        await page.locator('form').filter({ hasText: 'Employee Full NameEmployee' }).getByRole('button').click();
        await expect(page.getByText('Successfully Updated')).toBeVisible({timeout: 30000,});

    });

    await test.step('Contact Detail', async() => {
        await page.getByRole('link', { name: 'Contact Details' }).click();
        await page.waitForLoadState('domcontentloaded');
        await expect(page.getByRole('heading', { name: 'Contact Details' })).toBeVisible({timeout: 30000,});
        const getAddressInput = (label: string) =>
            page.locator('.oxd-grid-item').filter({ hasText: label }).locator('input');
        await getAddressInput('Street 1').fill('1');
        await getAddressInput('Street 2').fill('100');
        await getAddressInput('City').fill('gang-il');
        await getAddressInput('State/Province').fill('Seoul');
        await getAddressInput('Zip/Postal Code').fill('123-45');

        await page.getByText('-- Select --').click();
        await page.getByRole('option', { name: 'Korea, Republic of' }).click();
        await page.locator('.oxd-input-group').filter({ hasText: 'Home' }).locator('input').fill('02-000-0000');
        await page.locator('.oxd-input-group').filter({ hasText: 'Mobile' }).locator('input').fill('010-0000-0000');
        await page.locator('.oxd-input-group').filter({ hasText: /^Work$/ }).locator('input').fill('02-0000-0000');
        await page.locator('.oxd-input-group').filter({ hasText: 'Work Email' }).locator('input').fill(`orange_${now.getMinutes().toString().padStart(2,'0')}${now.getSeconds().toString().padStart(2,'0')}@orange.com`);
        await page.locator('.oxd-input-group').filter({ hasText: 'Other Email' }).locator('input').fill(`apple_${now.getMinutes().toString().padStart(2,'0')}${now.getSeconds().toString().padStart(2,'0')}@orange.com`);
        await page.getByRole('button', { name: 'Save' }).click();
        await expect(page.getByText('Successfully Updated')).toBeVisible({timeout: 30000,});
    })

});