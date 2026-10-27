import { test } from '@e2e-dev/web';
import { expect } from 'e2e';

// 画面変更時の引き継ぎ（ハンドオフ）を確かめるテスト。src/App.tsx を書き換えながら、同じテストを何度か実行する
// エージェントのステップは e2e.config.ts のモデルを呼ぶ。キーがなければスキップする
const skip = process.env.ANTHROPIC_API_KEY ? false : 'ANTHROPIC_API_KEY を設定するとエージェントのテストを実行する';

// テスト名はモデルに見えるため、期待する結果ではなく、操作の対象だけを書く
test('名前を入力してあいさつを表示する', { skip }, async ({ app, agent, screen }) => {
  await app.open('/');

  await agent.act('名前 {name} であいさつを表示させる', { params: { name: 'Grace' } });

  // この確認が通ったときだけ、操作がキャッシュに記録される
  await expect(screen.getByRole('status')).toHaveText('Hello, Grace!');
});
