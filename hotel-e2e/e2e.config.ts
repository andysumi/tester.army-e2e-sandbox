import type { E2EConfig } from 'e2e';
import { web } from '@e2e-dev/web';
import { anthropic } from '@ai-sdk/anthropic';

// エージェント同士は設定を引き継がないため、共通の値は定数にして各エントリに書く
const sonnet = anthropic('claude-sonnet-5-5');
// 公式サンプル（examples/with-vite）と同じ文言。操作の結果まで確かめさせる
const qa = 'You are a thorough QA agent. Verify every outcome.';
// 1つのゴールで使う操作数とモデル呼び出し回数の上限（既定はどちらも 25）
const budget = { maxSteps: 10, maxModelCalls: 10 };
// アプリの用語。act と判定（assert など）の両方に渡る
const vocabulary = 'HOTEL PLANISPHERE はホテルの宿泊予約サイト。宿泊プランの一覧は、ナビバーの「宿泊予約」から開く。表示されるプランは会員ランクで変わる。';

export default {
  // agent.* のステップだけがモデルを呼ぶ。@ai-sdk/anthropic が ANTHROPIC_API_KEY を読む
  agents: {
    default: { model: sonnet, system: qa, ...budget },
    // モデルの比較用。--agent fast で切り替える
    fast: { model: anthropic('claude-haiku-5-5'), system: qa, ...budget },
    // ペルソナ。credentials とセッションの名前にそろえる
    premium: { model: sonnet, system: `${qa} You are a premium member of this hotel site.`, context: vocabulary, ...budget },
    normal: { model: sonnet, system: `${qa} You are a regular member of this hotel site.`, context: vocabulary, ...budget },
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
