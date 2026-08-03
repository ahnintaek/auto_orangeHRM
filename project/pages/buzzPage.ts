import { Page, expect, Locator } from '@playwright/test';
import { BasePage } from './basePage';

export class BuzzPage extends BasePage {

    private getPost(message: string): Locator {
        return this.page.locator('.orangehrm-buzz').filter({
            has: this.page.locator('.orangehrm-buzz-post-body-text', {
                hasText: message,
            }),
        });
    }

    private getCommentButton(post: Locator): Locator {
        return post.locator('button', { has: this.page.locator('.bi-chat-text-fill') });
    }

    private getCommentArea(post: Locator): Locator {
        return post.locator('.orangehrm-buzz-comment');
    }

    private getComment(post: Locator, comment: string): Locator {
        return post
        .locator('.orangehrm-post-comment')
        .filter({ hasText: comment });
    }

    private async ensureCommentAreaOpen(post: Locator) {
        const commentArea = this.getCommentArea(post);
        if (!(await commentArea.isVisible())) {
            await this.getCommentButton(post).click();
            await expect(commentArea).toBeVisible();
        }
    }

    private getCommentInput(post: Locator): Locator {
        return post.locator('.orangehrm-buzz-comment-add .oxd-input');
    }
    
    private getEditCommentInput(post: Locator): Locator {
        return post.locator('.orangehrm-post-comment .oxd-input');
    }

    async goto() {
        await this.gotoModule('Buzz');
    }

    async addPost(message: string) {
        const messageInput = this.page.locator('textarea[placeholder="What\'s on your mind?"]');
        await messageInput.fill(message);
        await this.page.getByRole('button', { name: 'Post', exact: true }).click();
        const loader = this.page.locator('.oxd-loading-spinner-container');
        await loader.waitFor({ state: 'visible', timeout: 3000 }).catch(() => {});
        await loader.waitFor({ state: 'hidden', timeout: 10000 });
        await expect(this.getPost(message)).toHaveCount(1);
    }

    async likePost(message: string) {
        const post = this.getPost(message);
        await expect(post).toHaveCount(1);
        const likeButton = post.locator('.orangehrm-heart-icon');
        await likeButton.click();
        await expect(post.locator('.orangehrm-like-animation')).toBeVisible();
    }

    async deletePost(message: string) {
        const post = this.getPost(message);
        await expect(post).toHaveCount(1);
        await post.locator('.oxd-icon.bi-three-dots').click();
        await this.page.getByRole('listitem').filter({ hasText: /^Delete Post$/ }).click();
        await this.page.getByRole('button', { name: 'Yes, Delete' }).click();
        await expect(post).toHaveCount(0);
    }

    async commentOnPost(message: string, comment: string) {
        const post = this.getPost(message);
        await expect(post).toHaveCount(1);
        await this.ensureCommentAreaOpen(post);
        const commentInput = this.getCommentInput(post);
        await expect(commentInput).toBeVisible();
        await commentInput.fill(comment);
        await commentInput.press('Enter');
        await expect(this.getComment(post, comment)).toHaveCount(1);
    }

    async likeComment(message: string, comment: string) {
        const post = this.getPost(message);
        await expect(post).toHaveCount(1);
        await this.ensureCommentAreaOpen(post);
        const commentItem = this.getComment(post, comment);
        await expect(commentItem).toHaveCount(1);
        await commentItem.getByText('Like', { exact: true }).click();
    }

    async editComment(message: string, comment: string, newComment: string) {
        const post = this.getPost(message);
        await expect(post).toHaveCount(1);
        await this.ensureCommentAreaOpen(post);
        const commentItem = this.getComment(post, comment);
        await expect(commentItem).toHaveCount(1);
        await commentItem.getByText('Edit', { exact: true }).click();
        const editInput = this.getEditCommentInput(commentItem);
        if(!(await editInput.isVisible())) {
            await commentItem.getByText('Edit', { exact: true }).click();
        }
        // await expect(editInput).toBeVisible();
        await post.locator('.orangehrm-post-comment .oxd-input').fill(newComment);
        await post.locator('.orangehrm-post-comment .oxd-input').press('Enter');
        await expect(editInput).toBeHidden();
        await expect(this.getComment(post, newComment)).toHaveCount(1);
    }

    async deleteComment(message: string, comment: string) {
        const post = this.getPost(message);
        await expect(post).toHaveCount(1);
        await this.ensureCommentAreaOpen(post);
        const commentItem = this.getComment(post, comment);
        await expect(commentItem).toHaveCount(1);
        await commentItem.getByText('Delete', { exact: true }).click();
        await this.page.getByRole('button', { name: 'Yes, Delete' }).click();
        const loader = this.page.locator('.oxd-loading-spinner-container');
        await loader.waitFor({ state: 'visible', timeout: 3000 }).catch(() => {});
        await loader.waitFor({ state: 'hidden', timeout: 10000 });
        await expect(commentItem).toHaveCount(0);
    }
}