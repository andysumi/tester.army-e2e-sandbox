import { expect } from 'e2e';
import { members } from './data/users.ts';
import { test } from './fixtures.ts';

for (const member of members) {
  test(`${member.rank}でログインできる`, async ({ app, browser, loginPage, myPage }) => {
    await app.open('/ja/login.html');

    await loginPage.login(member.email, member.password);

    await expect(browser).toHaveURL('/ja/mypage.html');
    await expect(myPage.email).toHaveText(member.email);
    await expect(myPage.rank).toHaveText(member.rank);
  });
}
