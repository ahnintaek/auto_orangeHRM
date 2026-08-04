import { test } from '@playwright/test';
import 'dotenv/config';
import { LoginPage } from '../pages/loginPage';
import { BuzzPage } from '../pages/buzzPage';

test('Buzz Post 등록, 수정, 삭제 테스트', async ({ page }) => {
      const loginPage = new LoginPage(page);
      const buzzPage = new BuzzPage(page);
    
      const now = new Date();
      const timestamp = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
      const uniqueSuffix = `${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}${now.getSeconds().toString().padStart(2, '0')}`;

      const postText = `Post Test, Date : ${timestamp} ${uniqueSuffix}`;
      const commentText = `Comment Test : ${uniqueSuffix}`;
      const editComment = `Edit Comment : ${uniqueSuffix}`;
    
      await loginPage.loginAsAdmin();
    
      await buzzPage.goto();

      await buzzPage.addPost(postText);
      await buzzPage.likePost(postText);

      await buzzPage.commentOnPost(postText, commentText);
      await buzzPage.likeComment(postText, commentText);
      await buzzPage.editComment(postText, commentText, editComment);
      await buzzPage.deleteComment(postText, editComment);

      await buzzPage.deletePost(postText);
});