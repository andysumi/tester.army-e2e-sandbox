// バグバッシュの再現テスト（npx e2e guide bug-bash の「6. Verify」）。
// 不具合が直るまで失敗する。普段の実行（e2e.config.ts）からは外れていて、--config e2e.bugbash.config.ts のときだけ実行される
import { expect } from 'e2e';
import { test } from '../fixtures.ts';

const longText = (char: string) => char.repeat(300);

test('300文字のメールアドレスで会員登録する', { tags: ['bugbash'] }, async ({ app, browser, signupPage }) => {
  await app.open('/ja/signup.html');

  // ローカル部 288 文字 + @example.com で 300 文字
  await signupPage.signup({ email: `${'a'.repeat(288)}@example.com`, password: 'Passw0rd123', username: 'テスト太郎', rank: '一般会員' });

  // 期待: 登録されず、会員登録画面にとどまる
  await expect(browser).toHaveURL('/ja/signup.html');
});

test('300文字の氏名と住所で会員登録する', { tags: ['bugbash'] }, async ({ app, browser, signupPage }) => {
  await app.open('/ja/signup.html');

  await signupPage.signup({
    email: 'bugbash-long@example.com',
    password: 'Passw0rd123',
    username: longText('あ'),
    rank: '一般会員',
    address: longText('あ'),
  });

  // 期待: 登録されず、会員登録画面にとどまる
  await expect(browser).toHaveURL('/ja/signup.html');
});
