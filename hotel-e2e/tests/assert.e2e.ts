import { describe } from '@e2e-dev/web';
import { expect } from 'e2e';
import { members } from './data/users.ts';
import { test } from './fixtures.ts';

// agent.assert は、画面の内容を自然言語で判定する。キャッシュされず、毎回モデルを呼ぶ
const skip = process.env.ANTHROPIC_API_KEY ? false : 'ANTHROPIC_API_KEY を設定するとエージェントのテストを実行する';

for (const member of members) {
  describe(`${member.rank}として`, { agent: member.account, session: member.account }, () => {
    test('マイページの会員ランクを判定する', { skip }, async ({ app, agent }) => {
      await app.open('/ja/mypage.html');

      await agent.assert(`会員ランクの欄に「${member.rank}」と表示されている`);
    });

    test('宿泊プランの一覧を判定する', { skip }, async ({ app, agent, screen }) => {
      await app.open('/ja/plans.html');
      // assert は待たないので、一覧の読み込みをロケータで待ってから判定する
      await expect(screen.getByRole('heading', 'ディナー付きプラン')).toBeVisible();

      await agent.assert(
        member.seesPremiumPlan
          ? '宿泊プランの一覧に「プレミアムプラン」がある'
          : '宿泊プランの一覧に「プレミアムプラン」はない',
      );
    });
  });
}

// 画像だけで判定する（vision: 'only'）。パスワードを入力したセッションでは画像を送れないため、セッションなしで開く
test('ログイン画面の見た目を画像で判定する', { skip }, async ({ app, agent }) => {
  await app.open('/ja/login.html');

  await agent.assert('ログインフォームの送信ボタンは青い', { vision: 'only' });
});
