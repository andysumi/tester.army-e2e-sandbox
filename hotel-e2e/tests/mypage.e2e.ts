import { expect, credentials } from 'e2e';
import { members } from './data/users.ts';
import { test } from './fixtures.ts';

// auth.setup.e2e.ts が保存したセッションを復元し、ログイン画面を通らずにマイページを開く
for (const member of members) {
  test(`${member.rank}のマイページに会員情報が表示される`, { session: member.account }, async ({ app, browser, myPage }) => {
    await app.open('/ja/mypage.html');

    await expect(browser).toHaveURL('/ja/mypage.html');
    await expect(myPage.email).toHaveText(credentials.user(member.account).username);
    await expect(myPage.rank).toHaveText(member.rank);
  });
}
