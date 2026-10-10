import { test, expect } from '../fixtures/authedPage.fixture';
import { BuzzPage } from '../pages/buzzPage';
import { uniqueId } from '../utils/unique';

test.describe('Buzz', () => {
  let buzz: BuzzPage;
  let postText = '';
  let postCreated = false;

  test.afterEach(async () => {
    if (!postCreated) return;
    try {
      await buzz.goto();
      await buzz.deletePostIfExists(postText);
    } catch (e) {
      console.warn(`[cleanup 실패] ${postText}:`, e);
      test.info().annotations.push({ type: 'cleanup-failed', description: postText });
    }
  });

  test('게시글과 댓글의 등록, 수정, 삭제 흐름을 검증한다', async ({ authedPage: page }) => {
    buzz = new BuzzPage(page);
    postText = `Post ${uniqueId()}`;
    const comment = `Comment ${uniqueId()}`;
    const edited = `Edited ${uniqueId()}`;

    await buzz.goto();

    await test.step('게시글을 등록한다', async () => {
      postCreated = true;
      await buzz.addPost(postText);
    });

    await test.step('게시글에 좋아요를 누르면 좋아요 수가 1이 된다', async () => {
      await buzz.likePost(postText);
      await expect(buzz.likeStat(postText)).toHaveText(/^1 Likes?$/);
    });

    await test.step('댓글을 등록하면 댓글 수가 1이 된다', async () => {
      await buzz.commentOnPost(postText, comment);
      await expect(buzz.commentStat(postText)).toHaveText(/^1 Comments?$/);
    });

    await test.step('댓글에 좋아요를 누르면 댓글 좋아요 수가 1이 된다', async () => {
      await buzz.likeComment(postText, comment);
      await expect(buzz.commentLikeStat(postText, comment)).toHaveText('1');
    });

    await test.step('댓글 수정 중 Esc를 누르면 원래 내용이 유지된다', async () => {
      await buzz.cancelEditComment(postText, comment);
    });

    await test.step('댓글을 수정하면 새 내용이 표시된다', async () => {
      await buzz.editComment(postText, comment, edited);
    });

    await test.step('댓글을 삭제하면 목록에서 사라진다', async () => {
      await buzz.deleteComment(postText, edited);
    });

    await test.step('게시글을 삭제하면 피드에서 사라진다', async () => {
      await buzz.deletePost(postText);
      postCreated = false;
    });
  });
});