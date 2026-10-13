import { test, expect } from "../fixtures/authedPage.fixture";
import { env } from "../utils/env";
import { AdminPage } from "../pages/adminPage";
import { STATUS_ENABLED, USER_ROLE_ADMIN } from "../testData/seedData";
import { uniqueId } from "../utils/unique";

test("관리자가 신규 시스템 유저를 등록하고 목록에서 확인한다", async ({
  authedPage: page,
  cleanup,
}) => {
  const adminPage = new AdminPage(page);
  const userName = `Holland_${uniqueId()}`;

  const employeeName = await adminPage.getLoggedInUserName();

  await adminPage.goto();
  await adminPage.openAddUserForm();
  await adminPage.selectUserRole(USER_ROLE_ADMIN);
  await adminPage.searchEmployee(employeeName);
  await adminPage.selectStatus(STATUS_ENABLED);
  await adminPage.fillCredentials(userName, env.adminPw);
  await adminPage.save();
  cleanup.add(`user ${userName}`, () => adminPage.deleteUserByName(userName));

  await adminPage.assertUserListVisible();
  await expect(page.getByText(userName)).toBeVisible();
});
