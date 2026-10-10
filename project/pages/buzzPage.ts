import { expect, Locator } from '@playwright/test';
import { BasePage } from './basePage';

const exactText = (text: string) =>
  new RegExp(`^\\s*${text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`);

type CommentAction = 'Like' | 'Edit' | 'Delete';

export class BuzzPage extends BasePage {

  getPost(message: string): Locator {
    return this.page.locator('.orangehrm-buzz').filter({
      has: this.page.locator('.orangehrm-buzz-post-body-text', { hasText: exactText(message) }),
    });
  }

  likeStat(message: string): Locator {
    return this.getPost(message).locator('.orangehrm-buzz-stats-active', { hasText: /Likes?$/ });
  }

  commentStat(message: string): Locator {
    return this.getPost(message).locator('.orangehrm-buzz-stats-active', { hasText: /Comments?$/ });
  }

  getComment(post: Locator, comment: string): Locator {
    return post.locator('.orangehrm-post-comment').filter({
      has: this.page.locator('.orangehrm-post-comment-text', { hasText: exactText(comment) }),
    });
  }

  commentLikeStat(message: string, comment: string): Locator {
    return this.getPost(message)
      .locator('.orangehrm-comment-wrapper')
      .filter({
        has: this.page.locator('.orangehrm-post-comment-text', { hasText: exactText(comment) }),
      })
      .locator('.orangehrm-post-comment-stats-text');
  }

  private getEditingComment(post: Locator): Locator {
    return post.locator('.orangehrm-post-comment').filter({
      has: this.page.locator('form input.oxd-input'),
    });
  }

  private commentAction(item: Locator, name: CommentAction): Locator {
    return item.locator('.orangehrm-post-comment-action', { hasText: new RegExp(`^${name}$`) });
  }

  private getCommentButton(post: Locator): Locator {
    return post.locator('button', { has: this.page.locator('.bi-chat-text-fill') });
  }

  private getCommentArea(post: Locator): Locator {
    return post.locator('.orangehrm-buzz-comment');
  }

  private getCommentInput(post: Locator): Locator {
    return post.getByPlaceholder('Write your comment...');
  }

  private async getUniquePost(message: string): Promise<Locator> {
    const post = this.getPost(message);
    await expect(post).toHaveCount(1);
    return post;
  }

  private async ensureCommentAreaOpen(post: Locator) {
    const area = this.getCommentArea(post);
    if (!(await area.isVisible())) {
      await this.getCommentButton(post).click();
      await expect(area).toBeVisible();
    }
  }

  async goto() {
    await this.gotoModule('Buzz');
  }

  async addPost(message: string) {
    await this.page.getByPlaceholder("What's on your mind?").fill(message);
    const [response] = await Promise.all([
      this.page.waitForResponse(
        (res) =>
          res.request().method() === 'POST' &&
          new URL(res.url()).pathname.endsWith('/api/v2/buzz/posts'),
      ),
      this.page.getByRole('button', { name: 'Post', exact: true }).click(),
    ]);
    expect(response.ok(), `게시글 등록 API 실패: ${response.status()}`).toBeTruthy();
 
    await expect(this.getPost(message)).toHaveCount(1);
  }

  async likePost(message: string) {
    const post = await this.getUniquePost(message);
    await post.locator('.orangehrm-heart-icon').click();
  }

  async commentOnPost(message: string, comment: string) {
    const post = await this.getUniquePost(message);
    await this.ensureCommentAreaOpen(post);
    const input = this.getCommentInput(post);
    await expect(input).toBeVisible();
    await input.fill(comment);
    await input.press('Enter');
    await expect(this.getComment(post, comment)).toHaveCount(1);
  }

  async likeComment(message: string, comment: string) {
    const post = await this.getUniquePost(message);
    await this.ensureCommentAreaOpen(post);
    const item = this.getComment(post, comment);
    await expect(item).toHaveCount(1);
    await this.commentAction(item, 'Like').click();
  }

  private async openEditMode(post: Locator, comment: string): Promise<Locator> {
    const editInput = this.getEditingComment(post).locator('input.oxd-input');
    await expect(async () => {
      if (!(await editInput.isVisible())) {
        await this.commentAction(this.getComment(post, comment), 'Edit').click({ timeout: 2000 });
      }
      await expect(editInput).toBeVisible({ timeout: 2000 });
    }).toPass({ timeout: 15000 });
    return editInput;
  }

  async editComment(message: string, comment: string, newComment: string) {
    const post = await this.getUniquePost(message);
    await this.ensureCommentAreaOpen(post);
    await expect(this.getComment(post, comment)).toHaveCount(1);

    const editInput = await this.openEditMode(post, comment);
    await editInput.fill(newComment);
    await editInput.press('Enter');

    await expect(this.getEditingComment(post)).toHaveCount(0);
    await expect(this.getComment(post, newComment)).toHaveCount(1);
    await expect(this.getComment(post, comment)).toHaveCount(0);
  }

  async cancelEditComment(message: string, comment: string) {
    const post = await this.getUniquePost(message);
    await this.ensureCommentAreaOpen(post);
    await expect(this.getComment(post, comment)).toHaveCount(1);

    await this.openEditMode(post, comment);
    await this.page.keyboard.press('Escape');

    await expect(this.getEditingComment(post)).toHaveCount(0);
    await expect(this.getComment(post, comment)).toHaveCount(1);
  }

  async deleteComment(message: string, comment: string) {
    const post = await this.getUniquePost(message);
    await this.ensureCommentAreaOpen(post);
    const item = this.getComment(post, comment);
    await expect(item).toHaveCount(1);
    await this.commentAction(item, 'Delete').click();
    await this.page.getByRole('button', { name: 'Yes, Delete' }).click();
    await expect(this.getComment(post, comment)).toHaveCount(0);
  }

  async deletePost(message: string) {
    const post = await this.getUniquePost(message);
    await post.locator('.oxd-icon.bi-three-dots').click();
    await this.page.getByRole('listitem').filter({ hasText: /^Delete Post$/ }).click();
    await this.page.getByRole('button', { name: 'Yes, Delete' }).click();
    await expect(this.getPost(message)).toHaveCount(0);
  }

  async deletePostIfExists(message: string) {
    const appeared = await this.getPost(message)
      .first()
      .waitFor({ state: 'attached', timeout: 5000 })
      .then(() => true, () => false);
    if (!appeared) return;
    await this.deletePost(message);
  }
}