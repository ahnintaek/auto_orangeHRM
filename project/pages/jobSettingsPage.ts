import { Page, expect } from '@playwright/test';
import { BasePage } from './basePage';

interface JobDetails {
  jobName: string;
  jobDescription: string;
  jobNote: string;
}

export class JobSettingsPage extends BasePage {
  async goto() {
    await this.gotoModule('Admin');
  }

  async gotoJobTitles() {
    await this.page.getByRole('listitem').filter({ hasText: 'Job' }).click();
    await this.page.getByRole('menuitem', { name: 'Job Titles' }).click();
    await this.waitForPageLoad();
  }

  async addJobDetails(jobDetails: JobDetails) {
    // gotoJobTitles()는 이미 호출된 상태라고 가정 (호출부에서 순서 관리)
    await this.addBtn();
    await this.fillAndVerify(this.getFieldInput('Job Title'), jobDetails.jobName);
    await this.page.getByRole('button', { name: 'Save' }).click();
    await this.waitForPageLoad();
  }

  async modifyJobDetails(jobDetails: JobDetails) {
    const row = this.page.locator('.oxd-table-row').filter({
      has: this.page.locator(`div:text-is("${jobDetails.jobName}")`),
    });
    await expect(row).toHaveCount(1);

    await row.locator('button:has(.bi-pencil)').click();
    await this.waitForPageLoad();
    await this.fillAndVerify(this.getFieldInput('Job Description'), jobDetails.jobDescription);
    await this.fillAndVerify(this.getFieldInput('Note'), jobDetails.jobNote);
    await this.page.getByRole('button', { name: 'Save' }).click();
    await this.waitForPageLoad();
  }

  async gotoJobCategories() {
    await this.page.getByRole('listitem').filter({ hasText: 'Job' }).click();
    await this.page.getByRole('menuitem', { name: 'Job Categories' }).click();
    await this.waitForPageLoad();
  }

  async addJobCategory(categoryName: string) {
    // gotoJobCategories()는 이미 호출된 상태라고 가정
    await this.addBtn();
    await this.fillAndVerify(this.getFieldInput('Name'), categoryName);
    await this.page.getByRole('button', { name: 'Save' }).click();
    await this.waitForPageLoad();
  }
}