# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: buzz.spec.ts >> Buzz Post 등록, 수정, 삭제 테스트
- Location: project/tests/buzz.spec.ts:6:5

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: locator('.orangehrm-buzz').filter({ has: locator('.orangehrm-buzz-post-body-text').filter({ hasText: 'Post Test, Date : 2026-08-04 082246' }) }).locator('.orangehrm-post-comment')
Expected substring: "Edit Comment : 082246"
Received string:    "ahn  intaekComment Test : 082246Read More2026-08-04 08:22 AM1LikeEditDelete"
Timeout: 10000ms

Call log:
  - Expect "toContainText" with timeout 10000ms
  - waiting for locator('.orangehrm-buzz').filter({ has: locator('.orangehrm-buzz-post-body-text').filter({ hasText: 'Post Test, Date : 2026-08-04 082246' }) }).locator('.orangehrm-post-comment')
    24 × locator resolved to <div data-v-2d912105="" class="orangehrm-post-comment">…</div>
       - unexpected value "ahn  intaekComment Test : 082246Read More2026-08-04 08:22 AM1LikeEditDelete"

```

```yaml
- paragraph: ahn intaek
- text: "Comment Test : 082246"
- paragraph: 2026-08-04 08:22 AM
- text: 
- paragraph: "1"
- paragraph: Like
- paragraph: Edit
- paragraph: Delete
```

# Test source

```ts
  7   |         return this.page.locator('.orangehrm-buzz').filter({
  8   |             has: this.page.locator('.orangehrm-buzz-post-body-text', {
  9   |                 hasText: message,
  10  |             }),
  11  |         });
  12  |     }
  13  | 
  14  |     private getCommentButton(post: Locator): Locator {
  15  |         return post.locator('button', { has: this.page.locator('.bi-chat-text-fill') });
  16  |     }
  17  | 
  18  |     private getCommentArea(post: Locator): Locator {
  19  |         return post.locator('.orangehrm-buzz-comment');
  20  |     }
  21  | 
  22  |     private getComment(post: Locator, comment: string): Locator {
  23  |         return post
  24  |         .locator('.orangehrm-post-comment')
  25  |         .filter({ hasText: comment });
  26  |     }
  27  | 
  28  |     private async ensureCommentAreaOpen(post: Locator) {
  29  |         const commentArea = this.getCommentArea(post);
  30  |         if (!(await commentArea.isVisible())) {
  31  |             await this.getCommentButton(post).click();
  32  |             await expect(commentArea).toBeVisible();
  33  |         }
  34  |     }
  35  | 
  36  |     private getCommentInput(post: Locator): Locator {
  37  |         return post.locator('.orangehrm-buzz-comment-add .oxd-input');
  38  |     }
  39  |     
  40  |     private getEditCommentInput(commentItem: Locator): Locator {
  41  |         return commentItem.locator('.oxd-input');
  42  |     }
  43  | 
  44  |     async goto() {
  45  |         await this.gotoModule('Buzz');
  46  |     }
  47  | 
  48  |     async addPost(message: string) {
  49  |         const messageInput = this.page.locator('textarea[placeholder="What\'s on your mind?"]');
  50  |         await messageInput.fill(message);
  51  |         await this.page.getByRole('button', { name: 'Post', exact: true }).click();
  52  |         const loader = this.page.locator('.oxd-loading-spinner-container');
  53  |         await loader.waitFor({ state: 'visible', timeout: 3000 }).catch(() => {});
  54  |         await loader.waitFor({ state: 'hidden', timeout: 10000 });
  55  |         await expect(this.getPost(message)).toHaveCount(1);
  56  |     }
  57  | 
  58  |     async likePost(message: string) {
  59  |         const post = this.getPost(message);
  60  |         await expect(post).toHaveCount(1);
  61  |         const likeButton = post.locator('.orangehrm-heart-icon');
  62  |         await likeButton.click();
  63  |         await expect(post.locator('.orangehrm-like-animation')).toBeVisible();
  64  |     }
  65  | 
  66  |     async deletePost(message: string) {
  67  |         const post = this.getPost(message);
  68  |         await expect(post).toHaveCount(1);
  69  |         await post.locator('.oxd-icon.bi-three-dots').click();
  70  |         await this.page.getByRole('listitem').filter({ hasText: /^Delete Post$/ }).click();
  71  |         await this.page.getByRole('button', { name: 'Yes, Delete' }).click();
  72  |         await expect(post).toHaveCount(0);
  73  |     }
  74  | 
  75  |     async commentOnPost(message: string, comment: string) {
  76  |         const post = this.getPost(message);
  77  |         await expect(post).toHaveCount(1);
  78  |         await this.ensureCommentAreaOpen(post);
  79  |         const commentInput = this.getCommentInput(post);
  80  |         await expect(commentInput).toBeVisible();
  81  |         await commentInput.fill(comment);
  82  |         await commentInput.press('Enter');
  83  |         await expect(this.getComment(post, comment)).toHaveCount(1);
  84  |     }
  85  | 
  86  |     async likeComment(message: string, comment: string) {
  87  |         const post = this.getPost(message);
  88  |         await expect(post).toHaveCount(1);
  89  |         await this.ensureCommentAreaOpen(post);
  90  |         const commentItem = this.getComment(post, comment);
  91  |         await expect(commentItem).toHaveCount(1);
  92  |         await commentItem.getByText('Like', { exact: true }).click();
  93  |     }
  94  | 
  95  |     async editComment(message: string, comment: string, newComment: string) {
  96  |         const post = this.getPost(message);
  97  |         await expect(post).toHaveCount(1);
  98  |         await this.ensureCommentAreaOpen(post);
  99  |         const commentItem = this.getComment(post, comment);
  100 |         await expect(commentItem).toHaveCount(1);
  101 |         const editButton = commentItem.getByText('Edit', { exact: true });
  102 |         const editInput = post.locator('.orangehrm-post-comment .oxd-input');
  103 |         await this.clickUntilVisible(editButton, editInput);
  104 |         await editInput.fill(newComment);
  105 |         await editInput.press('Enter');
  106 |         await expect(editInput).toBeHidden();
> 107 |         await expect(post.locator('.orangehrm-post-comment')).toContainText(newComment, { timeout: 10000 });
      |                                                               ^ Error: expect(locator).toContainText(expected) failed
  108 |     }
  109 | 
  110 |     async deleteComment(message: string, comment: string) {
  111 |         const post = this.getPost(message);
  112 |         await expect(post).toHaveCount(1);
  113 |         await this.ensureCommentAreaOpen(post);
  114 |         const commentItem = this.getComment(post, comment);
  115 |         await expect(commentItem).toHaveCount(1);
  116 |         await commentItem.getByText('Delete', { exact: true }).click();
  117 |         await this.page.getByRole('button', { name: 'Yes, Delete' }).click();
  118 |         await expect(commentItem).toHaveCount(0);
  119 |     }
  120 | }
```