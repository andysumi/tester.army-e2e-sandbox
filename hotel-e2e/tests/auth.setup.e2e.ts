import { expect, credentials } from 'e2e';
import { members } from './data/users.ts';
import { test } from './fixtures.ts';

// 会員ごとに1回だけログインし、セッションを保存する。session オプションを付けたテストが、必要なときだけ実行する
const accounts = members.map((member) => member.account);

test.setup('会員ごとにログインしてセッションを保存する', { sessions: accounts }, async ({ app, browser, session, loginPage, myPage }) => {
  for (const member of members) {
    const user = credentials.user(member.account);
    await app.open('/ja/login.html');
    await loginPage.login(user.username, user.password);
    // session.save() はログインの成否を確かめないので、保存する前に確かめる
    await expect(browser).toHaveURL('/ja/mypage.html');
    await expect(myPage.rank).toHaveText(member.rank);
    await session.save(member.account);
    await app.clearState();
  }
});
