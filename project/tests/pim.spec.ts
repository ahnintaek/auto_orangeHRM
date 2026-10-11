import { test, expect } from '../fixtures/authedPage.fixture';
import { env } from '../utils/env';
import { PimPage } from '../pages/pimPage';
import { EmployeeInfo } from '../models/employee';
import { PROFILE_IMAGE_PATH } from '../testData/filePaths';
import { SEED_JOB_TITLE, SEED_JOB_CATEGORY } from '../testData/seedData';
import { uniqueId } from '../utils/unique';

const BIRTH_DATE = '1990-01-01';
const LICENSE_EXPIRY_DATE = '2030-12-12';
const JOINED_DATE = '2024-05-05';

test.describe('PIM', () => {
  let pimPage: PimPage;
  let employeeId = '';
  let employeeCreated = false;

  test.afterEach(async () => {
    if (!employeeCreated) return;
    try {
      await pimPage.deleteEmployeeIfExists(employeeId);
    } catch (e) {
      console.warn(`[cleanup 실패] employee ${employeeId}:`, e);
      test.info().annotations.push({ type: 'cleanup-failed', description: employeeId });
    }
  });

  test('신규 직원을 등록하고 검색 후 삭제한다', async ({ authedPage: page }) => {
    pimPage = new PimPage(page);

    const suffix = uniqueId().slice(-8);
    employeeId = `T-${suffix}`;
    const username = `user_taek_${suffix}`;

    const employee: EmployeeInfo = {
      firstName: 'ahn',
      middleName: 'in',
      lastName: 'taek',
      employeeId,
    };

    await test.step('직원을 등록한다', async () => {
      await pimPage.goto();
      await pimPage.openAddEmployeeForm();
      await pimPage.uploadProfilePicture(PROFILE_IMAGE_PATH);
      await pimPage.fillBasicInfo(employee);
      expect(await pimPage.getEmployeeNumber()).toBe(employeeId);

      await pimPage.enableLoginDetails();
      await pimPage.fillLoginCredentials(username, env.adminPw);
      await pimPage.selectEnabledStatus();

      employeeCreated = true;
      await pimPage.saveNewEmployee();
    });

    await test.step('Personal Detail 저장', async () => {
      await pimPage.fillPersonalDetails({
        driverLicenseNumber: '10001',
        licenseExpiryDate: LICENSE_EXPIRY_DATE,
        nationality: 'South Korean',
        maritalStatus: 'Single',
        dateOfBirth: BIRTH_DATE,
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
        workEmail: `orange_${suffix}@orange.com`,
        otherEmail: `apple_${suffix}@orange.com`,
      });
      await pimPage.save();
    });

    await test.step('Job Detail 저장', async () => {
      await pimPage.goto();
      await pimPage.searchEmployee(employeeId);
      await pimPage.goToJobDetails(employeeId);
      await pimPage.fillJobDetails({
        jobTitle: SEED_JOB_TITLE,
        jobCategory: SEED_JOB_CATEGORY,
        joinedDate: JOINED_DATE,
      });
      await pimPage.save();
    });

    await test.step('Job Title로 검색해 직원을 삭제한다', async () => {
      await pimPage.goto();
      await pimPage.searchEmployeeDetails(SEED_JOB_TITLE);
      await pimPage.deleteEmployee(employeeId);
      employeeCreated = false;
    });
  });
});