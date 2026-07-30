import { test, expect } from '@playwright/test';
import 'dotenv/config';
import { LoginPage } from '../pages/loginPage';
import { PimPage } from '../pages/pimPage';
import { EmployeeInfo } from "../models/employee";
import { PROFILE_IMAGE_PATH } from '../testData/filePaths';
import { SEED_JOB_TITLE, SEED_JOB_CATEGORY } from '../testData/seedData';

test('신규 직원을 등록하고 검색 후 삭제한다', async ({ page }) => {
  const loginPage = new LoginPage(page);
  const pimPage = new PimPage(page);

  const now = new Date();
  const timestamp = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
  const uniqueSuffix = `${now.getMinutes().toString().padStart(2, '0')}${now.getSeconds().toString().padStart(2, '0')}`;

  await loginPage.loginAsAdmin();

  await pimPage.goto();
  await pimPage.openAddEmployeeForm();
  await pimPage.uploadProfilePicture(PROFILE_IMAGE_PATH);
  const employee: EmployeeInfo = {
    firstName: 'ahn',
    middleName: 'in',
    lastName: 'taek',
    employeeId: `T-${uniqueSuffix}`,
  };

await pimPage.fillBasicInfo(employee);

  const employeeNum = await pimPage.getEmployeeNumber();
  console.log('Employee Number:', employeeNum);

  await pimPage.enableLoginDetails();
  await pimPage.fillLoginCredentials(`user_taek_${uniqueSuffix}`, process.env.ADMIN_PW!);
  await pimPage.selectEnabledStatus();
  await pimPage.saveNewEmployee();

  await test.step('Personal Detail 저장', async () => {
    await pimPage.fillPersonalDetails({
      driverLicenseNumber: '10001',
      licenseExpiryDate: timestamp,
      nationality: 'South Korean',
      maritalStatus: 'Single',
      dateOfBirth: timestamp,
      gender: 'Male',
    });
    await pimPage.save();
  });

  await test.step('Contact Detail 저장', async () => {
    await pimPage.goToContactDetails();
    await pimPage.fillContactDetails({
      street1: '100-1',
      street2: 'Teheran-ro',
      city: 'Gangnam',
      stateOrProvince: 'Seoul',
      zipCode: '123-45',
      country: 'Korea, Republic of',
      homePhone: '02-000-0000',
      mobilePhone: '010-0000-0000',
      workPhone: '02-0000-0000',
      workEmail: `orange_${uniqueSuffix}@orange.com`,
      otherEmail: `apple_${uniqueSuffix}@orange.com`,
    });
    await pimPage.save();
  });

  await pimPage.goto();
  await pimPage.searchEmployee(employeeNum);

  await test.step('Job Detail 저장', async () => {
    await pimPage.goToJobDetails(employeeNum);
    await pimPage.fillJobDetails({
      jobTitle: SEED_JOB_TITLE,
      jobCategory: SEED_JOB_CATEGORY,
      joinedDate: timestamp,
    });
    await pimPage.save();
  });

  await pimPage.goto();
  await pimPage.searchEmployeeDetails(SEED_JOB_TITLE);
  await pimPage.deleteEmployee(employeeNum);
});