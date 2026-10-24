import { expect } from 'e2e';
import { members } from './data/users.ts';
import { test } from './fixtures.ts';

// 比べる画像は tests/visual.e2e.ts-snapshots/ に OS ごとに保存される。初回は画像を保存して失敗する
test('ログイン画面の見た目', async ({ app, screen }) => {
  await app.open('/ja/login.html');

  await expect(screen).toHaveScreenshot('login.png');
});

test('ログインフォームの見た目', async ({ app, screen }) => {
  await app.open('/ja/login.html');

  await expect(screen.getByTestId('login-form')).toHaveScreenshot('login-form.png');
});

// 会員ごとに違う値を mask で隠し、2人の会員で同じ画像と比べる
for (const member of members) {
  test(`${member.rank}のマイページの見た目`, { session: member.account }, async ({ app, screen, myPage }) => {
    await app.open('/ja/mypage.html');

    // mask は要素の箱を塗るため、値の要素だと文字の長さで幅が変わる。幅が一定の行（listitem）ごと隠す
    const values = [
      myPage.email,
      myPage.username,
      myPage.rank,
      myPage.address,
      myPage.tel,
      myPage.gender,
      myPage.birthday,
      myPage.notification,
    ];
    await expect(screen).toHaveScreenshot('mypage.png', {
      mask: values.map((value) => screen.getByRole('listitem').filter({ has: value })),
    });
  });
}
