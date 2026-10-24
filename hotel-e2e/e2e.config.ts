import type { E2EConfig } from 'e2e';
import { web } from '@e2e-dev/web';
import { anthropic } from '@ai-sdk/anthropic';

export default {
  // agent.* のステップだけがモデルを呼ぶ。@ai-sdk/anthropic が ANTHROPIC_API_KEY を読む
  agents: {
    default: {
      model: anthropic('claude-sonnet-5-5'),
      // 公式サンプル（examples/with-vite）と同じ文言。操作の結果まで確かめさせる
      system: 'You are a thorough QA agent. Verify every outcome.',
      // 1つのゴールで使う操作数とモデル呼び出し回数の上限（既定はどちらも 25）
      maxSteps: 10,
      maxModelCalls: 10,
    },
  },
  // サイトのトップページに掲載されている登録済みユーザ。パスワードはテストでは Secret として扱われる
  // 公開されている練習用の値なので直接書いている。業務では process.env から読む
  // （実行時は E2E_USER_PREMIUM_PASSWORD などの環境変数で上書きできる）
  credentials: {
    premium: { username: 'ichiro@example.com', password: 'password' },
    normal: { username: 'sakura@example.com', password: 'pass1234' },
  },
  targets: [{
    // サイトに data-testid がないため、getByTestId で id 属性を参照する
    engine: web({ testIdAttribute: 'id' }),
    app: {
      url: process.env.APP_URL ?? 'https://hotel-example-site.takeyaqa.dev',
    },
  }],
} satisfies E2EConfig;
