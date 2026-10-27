import { expect, credentials } from 'e2e';
import { premiumMember } from './data/users.ts';
import { test } from './fixtures.ts';

// エージェントのステップは e2e.config.ts のモデルを呼ぶ。キーがなければスキップする
const skip = process.env.ANTHROPIC_API_KEY ? false : 'ANTHROPIC_API_KEY を設定するとエージェントのテストを実行する';

test('エージェントがプレミアム会員でログインする', { skip }, async ({ app, browser, agent, myPage }) => {
  const user = credentials.user(premiumMember.account);
  await app.open('/ja/login.html');

  // 入力欄やボタンの指定はせず、ゴールだけを日本語で渡す
  // パスワードは Secret。モデルには名前しか見えず、値はランナーが入力する
  await agent.act('メールアドレス {email} とパスワード {password} でログインする', {
    params: { email: user.username, password: user.password },
  });

  // 結果の確認は、モデルに頼らずロケータで行う
  await expect(browser).toHaveURL('/ja/mypage.html');
  await expect(myPage.email).toHaveText(user.username);
  await expect(myPage.rank).toHaveText(premiumMember.rank);
});
