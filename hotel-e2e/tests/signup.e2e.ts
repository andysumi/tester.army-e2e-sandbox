import { expect } from 'e2e';
import { fullNewMember, newMember } from './data/users.ts';
import { test } from './fixtures.ts';

test('必須項目だけで会員登録できる', async ({ app, browser, signupPage, myPage }) => {
  await app.open('/ja/signup.html');

  await signupPage.signup(newMember);

  await expect(browser).toHaveURL('/ja/mypage.html');
  await expect(myPage.email).toHaveText(newMember.email);
  await expect(myPage.username).toHaveText(newMember.username);
  await expect(myPage.rank).toHaveText(newMember.rank);
  // 任意項目は未入力のため「未登録」と表示される
  await expect(myPage.address).toHaveText('未登録');
  await expect(myPage.tel).toHaveText('未登録');
  await expect(myPage.gender).toHaveText('未登録');
  await expect(myPage.birthday).toHaveText('未登録');
  await expect(myPage.notification).toHaveText('受け取らない');
});

test('全項目を入力してプレミアム会員で会員登録できる', async ({ app, browser, signupPage, myPage }) => {
  await app.open('/ja/signup.html');

  await signupPage.signup(fullNewMember);

  await expect(browser).toHaveURL('/ja/mypage.html');
  await expect(myPage.email).toHaveText(fullNewMember.email);
  await expect(myPage.username).toHaveText(fullNewMember.username);
  await expect(myPage.rank).toHaveText(fullNewMember.rank);
  await expect(myPage.address).toHaveText(fullNewMember.address);
  await expect(myPage.tel).toHaveText(fullNewMember.tel);
  await expect(myPage.gender).toHaveText(fullNewMember.gender);
  // マイページでは「YYYY年M月D日」の形式で表示される
  await expect(myPage.birthday).toHaveText('1990年1月15日');
  await expect(myPage.notification).toHaveText('受け取る');
});
