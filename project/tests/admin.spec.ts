import { test, expect } from '../fixtures/authedPage.fixture';
import { env } from '../utils/env';
import { AdminPage } from '../pages/adminPage';
import { STATUS_ENABLED, USER_ROLE_ADMIN } from '../testData/seedData';
import { uniqueId } from '../utils/unique';

test('관리자가 신규 시스템 유저를 등록하고 목록에서 확인한다', async ({
  authedPage: page,
  cleanup,
}) => {
  const adminPage = new AdminPage(page);
  const userName = `Holland_${uniqueId()}`;

  cleanup.add(`user ${userName}`, () => adminPage.deleteUserIfExists(userName));

  const employeeName = await adminPage.getLoggedInUserName();

  await test.step('사용자 등록 폼을 작성하고 저장한다', async () => {
    await adminPage.goto();
    await adminPage.openAddUserForm();
    await adminPage.selectUserRole(USER_ROLE_ADMIN);
    await adminPage.searchEmployee(employeeName);
    await adminPage.selectStatus(STATUS_ENABLED);
    await adminPage.fillCredentials(userName, env.adminPw);
    await adminPage.save();
  });

  await test.step('목록의 해당 행에 사용자명, 역할, 상태, 직원 이름이 표시된다', async () => {
    await adminPage.expectUserListed(userName, {
      role: USER_ROLE_ADMIN,
      status: STATUS_ENABLED,
      employeeName,
    });
  });
});

test.describe('시스템 유저 등록 폼 검증', () => {
  test('필수값을 비우고 저장하면 Username에 Required 오류가 표시된다', async ({
    authedPage: page,
  }) => {
    const adminPage = new AdminPage(page);
    await adminPage.goto();
    await adminPage.openAddUserForm();
    await adminPage.submitForm();

    await expect(adminPage.fieldError('Username')).toHaveText('Required');
  });

  test('이미 있는 사용자명을 입력하면 Already exists 오류가 표시된다', async ({
    authedPage: page,
  }) => {
    const adminPage = new AdminPage(page);
    await adminPage.goto();
    await adminPage.openAddUserForm();
    await adminPage.fillCredentials(env.adminId, env.adminPw);

    await expect(adminPage.fieldError('Username')).toHaveText('Already exists');
  });

  test('비밀번호와 확인 값이 다르면 Passwords do not match 오류가 표시된다', async ({
    authedPage: page,
  }) => {
    const adminPage = new AdminPage(page);
    await adminPage.goto();
    await adminPage.openAddUserForm();
    await adminPage.fillCredentials(`mismatch_${uniqueId()}`, env.adminPw, `${env.adminPw}x`);

    await expect(adminPage.fieldError('Confirm Password')).toHaveText('Passwords do not match');
  });
});