import { expect } from 'e2e';
import { premiumMember } from './data/users.ts';
import { test } from './fixtures.ts';

// エージェントのステップは e2e.config.ts のモデルを呼ぶ。キーがなければスキップする
const skip = process.env.ANTHROPIC_API_KEY ? false : 'ANTHROPIC_API_KEY を設定するとエージェントのテストを実行する';

test('エージェントがプレミアム会員でログインする', { skip }, async ({ app, browser, agent, myPage }) => {
  await app.open('/ja/login.html');

  // 入力欄やボタンの指定はせず、ゴールだけを日本語で渡す
  await agent.act('メールアドレス {email} とパスワード {password} でログインする', {
    params: { email: premiumMember.email, password: premiumMember.password },
  });

  // 結果の確認は、モデルに頼らずロケータで行う
  await expect(browser).toHaveURL('/ja/mypage.html');
  await expect(myPage.email).toHaveText(premiumMember.email);
  await expect(myPage.rank).toHaveText(premiumMember.rank);
});
