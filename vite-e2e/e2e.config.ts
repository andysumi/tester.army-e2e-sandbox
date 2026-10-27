import type { E2EConfig } from 'e2e';
import { web } from '@e2e-dev/web';
import { anthropic } from '@ai-sdk/anthropic';

// 公式サンプル（examples/with-vite）をもとに、画面変更時の引き継ぎ（ハンドオフ）を確かめるための設定
export default {
  // agent.* のステップだけがモデルを呼ぶ。@ai-sdk/anthropic が ANTHROPIC_API_KEY を読む
  agents: {
    default: {
      model: anthropic('claude-sonnet-5-5'),
      system: 'You are a thorough QA agent. Verify every outcome.',
      // hotel-e2e のテスト用エージェントと同じ上限
      maxSteps: 10,
      maxModelCalls: 10,
    },
  },
  targets: [
    {
      engine: web(),
      app: {
        url: 'http://localhost:5173',
        // The runner starts the Vite dev server and waits for the URL to answer.
        // Outside CI, a server you already started on that port is reused.
        command: { executable: 'npm', args: ['run', 'dev'], reuseExisting: true },
      },
    },
  ],
} satisfies E2EConfig;
