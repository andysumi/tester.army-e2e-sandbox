// バグバッシュ用の設定（npx e2e guide bug-bash の「1. Prepare」にならう）。実行は bugbash/run.sh から
import type { E2EConfig } from 'e2e';
import { anthropic } from '@ai-sdk/anthropic';
import base from './e2e.config.ts';

const shared: E2EConfig = base;

// サイトの仕様と、探索が不具合と読み違えやすいこと
const context =
  'HOTEL PLANISPHERE はテスト自動化の練習用のホテル予約サイト。入力したデータはブラウザの中（Cookie、Local Storage、Session Storage）にしか保存されず、サーバーには送られない。' +
  'トップページに載っている登録済みユーザ（ichiro@example.com など）は、練習用に公開されているもので、不具合ではない。' +
  '宿泊予約画面の合計金額は、宿泊日・宿泊数・人数の入力欄からフォーカスが外れたとき（change イベント）に計算し直される。値を入力したら Tab キーなどでフォーカスを外してから確かめる。' +
  'フォームの送信では、入力値が URL のクエリに付く。これはサイトの作りで、不具合ではない。' +
  '不具合ではないもの: 新しいタブで開くリンクは今のタブを変えない（宿泊プランの「このプランで予約」は新しいタブで開くので、予約画面は URL で直接開く）。' +
  '負荷をかけない: 同じ操作を何十回も繰り返さない。';

const persona = { model: anthropic('claude-sonnet-5-5'), maxSteps: 40, maxModelCalls: 40, context };

export default {
  ...shared,
  // プロジェクトのテストと、6. Verify で書く再現テスト（e2e.config.ts では tests/bugbash/ を外している）
  tests: ['tests/**/*.e2e.ts'],
  retries: 0,
  reporters: ['list'],
  // 2. Plan charters の姿勢を、エージェント（ペルソナ）として用意する
  // 既存のテストが premium などのエージェントを固定しているので、元の設定のエージェントも引き継ぐ
  agents: {
    ...shared.agents,
    default: persona,
    skeptic: {
      ...persona,
      system: 'Distrust every number, date, count, and claim on screen; cross-check each against every other place it appears.',
    },
    fuzzer: {
      ...persona,
      system: "At every input, run the goal's input matrix before anything else, judging each entry before the next. Never take the happy path.",
    },
  },
} satisfies E2EConfig;
