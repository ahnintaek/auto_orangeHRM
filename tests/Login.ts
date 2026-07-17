import { test, expect, Page } from '@playwright/test';
import 'dotenv/config';

export async function adminLogin(page:Page) {
    await page.goto('https://opensource-demo.orangehrmlive.com/web/index.php/');
    await page.getByRole('textbox', { name: 'Username' }).fill(process.env.ADMIN_ID!);
    await page.getByRole('textbox', { name: 'Password' }).fill(process.env.ADMIN_PW!);
    await page.getByRole('button', { name: 'Login' }).click();
}

export async function getEmployeeName(page: Page): Promise<string> {
    return (
        await page.locator('.oxd-userdropdown-name').innerText()
    ).trim();
}