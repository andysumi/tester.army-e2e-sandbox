import { describe } from '@e2e-dev/web';
import { expect } from 'e2e';
import { members } from './data/users.ts';
import { test } from './fixtures.ts';

// エージェントのステップは e2e.config.ts のモデルを呼ぶ。キーがなければスキップする
const skip = process.env.ANTHROPIC_API_KEY ? false : 'ANTHROPIC_API_KEY を設定するとエージェントのテストを実行する';

// 会員ごとに、同じ名前のエージェント（ペルソナ）とセッションを組にする（docs/authentication.mdx の Several signed-in users）
// テスト名はモデルに見えるため、期待する結果ではなく、操作の対象だけを書く
for (const member of members) {
  describe(`${member.rank}として`, { agent: member.account, session: member.account }, () => {
    test('宿泊プランの一覧を開く', { skip }, async ({ app, browser, agent, screen }) => {
      await app.open('/ja/index.html');

      await agent.act('宿泊プランの一覧を表示する');

      await expect(browser).toHaveURL('/ja/plans.html');
      // 一覧の読み込みを、会員なら誰でも見えるプランで確かめてから、ランクで変わるプランを数える
      await expect(screen.getByRole('heading', 'ディナー付きプラン')).toBeVisible();
      await expect(screen.getByRole('heading', 'プレミアムプラン')).toHaveCount(member.seesPremiumPlan ? 1 : 0);
    });
  });
}
