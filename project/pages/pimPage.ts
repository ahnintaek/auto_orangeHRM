import { Page, expect } from '@playwright/test';
import { BasePage } from './basePage';
import { EmployeeInfo } from "../models/employee";

interface PersonalDetails {
  driverLicenseNumber: string;
  licenseExpiryDate: string;   // yyyy-dd-mm
  nationality: string;
  maritalStatus: string;
  dateOfBirth: string;         // yyyy-dd-mm
  gender: 'Male' | 'Female';
}

const ContactField = {
  Street1: 'Street 1',
  Street2: 'Street 2',
  City: 'City',
  StateOrProvince: 'State/Province',
  ZipCode: 'Zip/Postal Code',
  Country: 'Country',
  Home: 'Home',
  Mobile: 'Mobile',
  Work: /^Work$/,
  WorkEmail: 'Work Email',
  OtherEmail: 'Other Email',
} as const;

interface ContactDetails {
  street1: string;
  street2: string;
  city: string;
  stateOrProvince: string;
  zipCode: string;
  country: string;
  homePhone: string;
  mobilePhone: string;
  workPhone: string;
  workEmail: string;
  otherEmail: string;
}

interface JobDetails {
  jobTitle: string;
  jobCategory: string;
  joinedDate: string;         // yyyy-dd-mm
};

export class PimPage extends BasePage {
  async goto() {
    await this.gotoModule('PIM');
  }

  async openAddEmployeeForm() {
    await this.addBtn();
  }

  async uploadProfilePicture(filePath: string) {
    const fileChooserPromise = this.page.waitForEvent('filechooser');
    await this.page.locator('form').getByRole('img', { name: 'profile picture' }).click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(filePath);
  }

  async fillBasicInfo(employee: EmployeeInfo) {
    await this.page.getByRole('textbox', { name: 'First Name' }).fill(employee.firstName);
    await this.page.getByRole('textbox', { name: 'Middle Name' }).fill(employee.middleName);
    await this.page.getByRole('textbox', { name: 'Last Name' }).fill(employee.lastName);
    await this.getFieldInput('Employee Id').fill(employee.employeeId);
  }

  async getEmployeeNumber(): Promise<string> {    
    return this.getFieldInput('Employee Id').inputValue()
  }

  async enableLoginDetails() {
    await this.page.locator('.oxd-switch-input').click();
  }

  async fillLoginCredentials(username: string, password: string) {
    await this.getFieldInput('Username').fill(username);
    await this.getFieldInput(/^Password$/).fill(password);
    await this.getFieldInput('Confirm Password').fill(password);
  }

  async selectEnabledStatus() {
    await this.page.getByText('Enabled').click();
  }

  async saveNewEmployee() {
    await this.page.getByRole('button', { name: 'Save' }).click();
  }

  override async save() {
    await super.save();
    await expect(
      this.page.getByText('Successfully Updated')
    ).toBeVisible({ timeout: 30000 });
  }

  async fillPersonalDetails(details: PersonalDetails) {
    await this.waitForPageLoad();
    await expect(this.page.getByRole('heading', { name: 'Personal Details' })).toBeVisible({ timeout: 30000 });
  
    const driverNum = this.getFieldInput("Driver's License Number");
    await driverNum.scrollIntoViewIfNeeded();
    await this.fillAndVerify(driverNum, details.driverLicenseNumber);
  
    await this.fillAndVerify(this.getDateInput("License Expiry Date"), details.licenseExpiryDate);
  
    await this.selectDropdown('Nationality', details.nationality);
    await this.selectDropdown('Marital Status', details.maritalStatus);
  
    await this.fillAndVerify(this.getDateInput("Date of Birth"), details.dateOfBirth);
  
    await this.page.getByText(details.gender, { exact: true }).click();
  }

  async goToContactDetails() {
    const contactDetailsResponse = this.page.waitForResponse(
      resp => resp.url().includes('contact-details') && resp.status() === 200   // 하이픈, 실제 API
    );
    await this.page.getByRole('link', { name: 'Contact Details' }).click();
    await contactDetailsResponse;
    await this.waitForPageLoad();
    await expect(this.page.getByRole('heading', { name: 'Contact Details' })).toBeVisible({ timeout: 30000 });
  }

  async fillContactDetails(details: ContactDetails) {
    await this.fillFields([
      [ContactField.Street1, details.street1],
      [ContactField.Street2, details.street2],
      [ContactField.City, details.city],
      [ContactField.StateOrProvince, details.stateOrProvince],
      [ContactField.ZipCode, details.zipCode],
      [ContactField.Home, details.homePhone],
      [ContactField.Mobile, details.mobilePhone],
      [ContactField.Work, details.workPhone],
      [ContactField.WorkEmail, details.workEmail],
      [ContactField.OtherEmail, details.otherEmail],
    ]);
    await this.selectDropdown(ContactField.Country, details.country);
  }

  async goToJobDetails(employeeNum: string) {
    const row = this.page.locator('.oxd-table-row').filter({
      has: this.page.locator(`div:text-is("${employeeNum}")`),
    });
    await expect(row).toHaveCount(1);
    await row.locator('button:has(.bi-pencil-fill)').click();
    await this.waitForPageLoad();
    
    const jobDetailsResponse = this.page.waitForResponse(
      resp => resp.url().includes('job-details') && resp.status() === 200   // 하이픈, 실제 API
    );
    await this.page.getByRole('link', { name: 'Job' }).click();
    await jobDetailsResponse;
    await this.waitForPageLoad();
    await expect(this.page.getByRole('heading', { name: 'Job Details' })).toBeVisible({ timeout: 30000 });
  }

  async fillJobDetails(details: JobDetails) {
    await this.fillAndVerify(this.getDateInput("Joined Date"), details.joinedDate);
    await this.selectDropdown("Job Title", details.jobTitle);
    await this.selectDropdown("Job Category", details.jobCategory);
    await this.page.getByRole('button', { name: 'Save' }).click();
  await this.waitForPageLoad();
  }

  async searchEmployee(employeeNum:string) {
    await this.waitForPageLoad();
    await this.getFieldInput(/^Employee Id$/).fill(employeeNum)
  }

  async deleteEmployee(employeeNum: string) {
    await this.waitForPageLoad();
    const row = this.page.locator('.oxd-table-row').filter({
      has: this.page.locator(`div:text-is("${employeeNum}")`)
    });
  
    await expect(row).toHaveCount(1);
  
    await row.locator('button:has(.bi-trash)').click();
    await this.page.getByRole('button', { name: 'Yes, Delete' }).click();
    await expect(this.page.getByText('Succesfully Deleted'))
  }
}