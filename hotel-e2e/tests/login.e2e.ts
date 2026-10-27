import { expect, credentials } from 'e2e';
import { members } from './data/users.ts';
import { test } from './fixtures.ts';

for (const member of members) {
  test(`${member.rank}でログインできる`, async ({ app, browser, loginPage, myPage }) => {
    const user = credentials.user(member.account);
    await app.open('/ja/login.html');

    await loginPage.login(user.username, user.password);

    await expect(browser).toHaveURL('/ja/mypage.html');
    await expect(myPage.email).toHaveText(user.username);
    await expect(myPage.rank).toHaveText(member.rank);
  });
}
