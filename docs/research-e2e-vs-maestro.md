# TesterArmy `e2e` 調査レポート（Maestro との比較と業務活用）

調査日: 2026-10-23

## 0. 調査方法と注意点

- `https://tester.army/e2e` と `e2e.tester.army` は、調査環境から名前解決できず直接取得できませんでした。
- そのため一次情報として GitHub の `tester-army/e2e` の README と `docs/` を参照しました。
  - `docs/migrate/maestro.mdx`: Maestro 移行ガイド
  - `docs/cache.mdx`: リプレイキャッシュ
  - `docs/ci.mdx`: CI 設定
  - `docs/mobile.mdx`: モバイル設定
  - `docs/quickstart.mdx`: クイックスタート
- README によると、プロジェクトは「1.0 に向けて開発中」で、マイナーバージョン間で API や設定が変わる可能性があります。
- 第三者の記事は、実際に動かして検証したものではないと断っているものが多いです。
- Maestro との独立した比較レビューは見つかりませんでした。下の比較は、e2e の公式移行ガイドと Maestro の一般的な仕様に基づきます。
- 実機での動作、費用、速度は未検証です。第5章の PoC で確認します。

## 1. e2e とは

TesterArmy が公開している、Web とモバイル向けの **オープンソース（Apache-2.0）の E2E テストフレームワーク**です。TypeScript で書きます。

特徴は、1つのテストの中で次の2種類を混ぜて書けることです。

| 書き方 | 例 | モデル呼び出し |
|---|---|---|
| 従来型（ロケータ + アサーション） | `expect(screen.getByText('...')).toBeVisible()` | 不要 |
| エージェント型（自然言語のゴール） | `agent.act('Pro プランにアップグレードする')` | 必要 |

### 仕組みのポイント

- **`agent.act`**: 自然言語で書いた操作をエージェントが実行します。
- **`agent.assert` / `waitFor` / `extract`**: 画面の内容を自然言語で判定・待機・抽出します。常にモデルを呼びます。
- **リプレイキャッシュ**
  - 後続の検証（ロケータのアサーションや `agent.assert`）が通った `act` の操作は記録されます。
  - 次回以降は **モデルを呼ばずに再生**されます。
  - 画面が変わって再生に失敗した場合は、エージェントがその時点の画面から引き継ぎます。
  - 記録は `.e2e/cache/` に JSON で保存されます。プロンプト、スクリーンショット、シークレット値は含まれません。
  - CI ではキャッシュは read-only がデフォルトです。`--strict-cache` を付けると、古い記録は `REPLAY_STALE` で失敗します。
- **モデルは自分で用意**: ChatGPT / GitHub Copilot / SuperGrok などのサブスクリプション、API キー、ローカルモデルが使えます。エージェントを使わないテストはモデル不要です。
- **エンジン**
  - Web: Playwright 経由で Chromium / Firefox / WebKit（`@e2e-dev/web`）
  - モバイル: agent-device 経由で iOS シミュレータと Android エミュレータ（`@e2e-dev/mobile`）
  - クラウド実行: Limrun、EAS Simulators、TestMu（TestMu は実機あり）
- **サンプルプロジェクト**: Vite、Next.js、Astro、Expo、SwiftUI、Jetpack Compose、Kotlin Multiplatform、Flutter、.NET MAUI
- **CI**: GitHub Actions、EAS Workflows、Bitrise、Codemagic など。`--shard`、`--last-failed`、JUnit 出力、GitHub PR コメント用リポーターがあります。

## 2. 具体例

### 例1: README のサンプル（課金アップグレード）

```ts
import { test, expect } from 'e2e';

test('a member upgrades to Pro', async ({ app, agent, screen }) => {
  await app.open('/settings/billing');

  await agent.act('upgrade the workspace to the Pro plan');
  await agent.assert('the invoice preview shows a prorated amount');

  await expect(screen.getByRole('status')).toContainText('Pro');
});
```

- 「Pro プランにする」までのタップ手順は書きません。エージェントが画面を見て実行します。
- 2回目以降は、手順が記録されていればモデルを呼ばずに再生されます。
- 最後の `expect` は、決定的なロケータ検証です。

### 例2: Maestro の YAML を e2e に置き換える（公式移行ガイドの対応表より）

Maestro:

```yaml
- launchApp:
    clearState: true
- tapOn: "Get started"
- inputText: "ada@example.test"
- assertVisible: "Check your inbox"
- scrollUntilVisible:
    element: "Resend"
- assertVisible:
    id: "resend"
```

e2e:

```ts
await app.clearState();
await agent.act('get started with the email {email}', { params: { email } });
await expect(screen.getByText('Check your inbox')).toBeVisible();
await screen.scrollUntilVisible(screen.getByTestId('resend'));
await expect(screen.getByTestId('resend')).toBeVisible();
```

`tapOn` と `inputText` の2行が、1つの `agent.act` にまとまっています。

### 例3: モバイルの設定ファイル（`docs/mobile.mdx` の記述をもとにした例）

```ts
import type { E2EConfig } from 'e2e';
import { mobile } from '@e2e-dev/mobile';

const app = { bundleId: 'com.example.app', appPath: './build/MyApp.app' };

export default {
  targets: [
    { name: 'iphone', engine: mobile({ platform: 'ios' }), app },
    { name: 'pixel', engine: mobile({ platform: 'android' }), app },
  ],
  workers: 1,
} satisfies E2EConfig;
```

### 例4: CI でシャーディングする（`docs/ci.mdx` より）

```yaml
- run: npx e2e run --shard ${{ matrix.shard }}/3 --reporter list,junit
```

## 3. Maestro との違い

| 観点 | Maestro | e2e (TesterArmy) |
|---|---|---|
| 記述形式 | YAML のフロー | TypeScript |
| 制御構文 | 限定的（`runFlow` の `when` など） | `if`、ループ、関数、フィクスチャが使える |
| 操作の指定 | 画面要素の指定が中心（`tapOn` など） | 要素指定に加え、自然言語のゴール（`agent.act`） |
| AI | `assertWithAI`、`extractTextWithAI` など一部 | `act`、`assert`、`waitFor`、`extract` が中核 |
| 再実行のコスト | 毎回同じ手順を実行 | 成功した `act` は記録を再生（モデル呼び出しなし） |
| 対象 | モバイル中心（Web も可） | Web（Playwright）とモバイル（agent-device）を同じ書き方で扱う |
| 実行環境 | ローカルと Maestro Cloud | ローカル、自前 CI、ホスト型デバイス（Limrun、EAS、TestMu） |
| 成熟度 | 広く使われている | 1.0 前で、API が変わる可能性がある |
| モデルの準備 | 不要 | エージェント手順には必須（サブスクリプション、API キー、ローカルモデル） |
| 成果物 | JUnit など | 各呼び出しがレポートのステップになる。トレース、スクリーンショット、手順ごとの動画（`--video`）もある |

### 移行時に注意が必要な点（公式移行ガイドより）

- **セレクタの一致規則が変わります。** Maestro は text/id を大文字小文字無視の正規表現として扱います。e2e は完全一致で、大文字小文字も区別します。
- **複数ヒットするとエラーになります。** Maestro は最初の一致をタップします。e2e は `LOCATOR_AMBIGUOUS` で失敗するので、必要なら `.first()` を付けます。
- **空間セレクタがありません。** `below`、`above`、`leftOf`、`rightOf` は未対応です。ラベル、testID、エージェントのゴールで代替します。
- **未対応の機能があります。** `addMedia`、`assertDarkMode`、HTML レポート、`copyTextFrom`、`pasteText`、Maestro Studio などです。`npx e2e mcp` が Studio に近い代替とされています。
- **併用できます。** 両方のランナーが同じシミュレータやエミュレータを共有できるので、1フローずつ移行できます。
- **シークレットの扱い。** 認証情報はモデルに見せない設計です。`credentials` と `secrets` で渡します。

## 4. あなたの業務への活用案

「業務で Maestro を使っている」という情報だけで、アプリの種類や運用体制は分かっていません。以下は一般的な使いどころからの提案です。実際のフローに合わせて取捨選択してください。

### 活用案A: 壊れやすいフローをエージェントに任せる

- 例: オンボーディング、ログイン、課金、アンケート、A/B テストで文言や並びが変わる画面。
- Maestro では文言やレイアウトの変更でセレクタが壊れやすい部分です。
- `agent.act('メールアドレス {email} で登録を始める', { params: { email } })` のように書きます。
- 最後の検証だけは `expect(...)` で決定的に書きます。
- 手順は記録されて再生されるので、2回目以降はモデルのコストがほとんどかかりません。

### 活用案B: Web と iOS/Android の同じシナリオを1つの書き方で

- ログインから購入完了までのように、画面は違っても意図が同じシナリオに向きます。
- `targets` に iOS と Android を並べれば、同じテストを両方で走らせられます。

### 活用案C: 回帰の「想定外」を探す

- ドキュメントに `explore.mdx`、`bug-bash.mdx`、`visual-testing.mdx` があります。
- 固定シナリオ以外の探索的テストや、見た目の確認にも使えるようです。
- 内容は未確認なので、PoC で試す価値があります。

### 向かないケース（当面は Maestro のまま）

- 空間セレクタに強く依存しているフロー。
- Maestro の未対応機能（`addMedia`、ダークモードのアサート、HTML レポートなど）を使うフロー。
- モデルへの画面送信に制約がある案件。画面のテキストスナップショットがモデルへ送られる点は、機密性の確認が必要です。ローカルモデルを使う選択肢はあります。
- 安定性が最優先で、API 変更への追従コストをかけられない場合。

### 推奨する進め方（PoC）

1. **まずモデルなしで動かす。** `npx e2e init` のサンプルはモデル呼び出しなしで動きます。環境（Node 24.8+、Xcode / Android SDK）と `npx agent-device doctor` を確認します。
2. **既存の Maestro フロー1本を移行する。** `docs/migrate/maestro.mdx` の対応表に沿って変換します。
   - 最初は、ロケータだけで書く版と、`agent.act` を使う版の2つを作って比べます。
   - Maestro と同じシミュレータで並走できます。
3. **測るもの**: 初回と2回目以降の所要時間、トークン消費（実行サマリに出ます）、キャッシュのヒット率、画面変更時の復旧（引き継ぎ）の成功率。
4. **CI へ**: `--strict-cache` と `--last-failed`、JUnit 出力を試します。iOS は macOS、Android は KVM 付きの Linux で、ジョブを分けます。
5. **判断基準**: Maestro のメンテナンス工数が減るか、モデル費用とのトレードオフが見合うか。

## 5. 未確認事項（実際に動かして確認したいこと）

- モデル利用料の実額。ドキュメントに具体的な金額はありません。
- 日本語のゴール指示の精度。
- 画面変更時に、エージェントの引き継ぎがどれくらい成功するか。
- 自社アプリの testID の付与状況と、`getByTestId` との相性。
- 機密情報を含む画面をモデルに送ってよいか、社内ルールとの整合。

## 参考リンク

- [tester-army/e2e（GitHub）](https://github.com/tester-army/e2e)
- [Maestro 移行ガイド](https://github.com/tester-army/e2e/blob/main/docs/migrate/maestro.mdx)
- [キャッシュ / リプレイ](https://github.com/tester-army/e2e/blob/main/docs/cache.mdx)
- [CI](https://github.com/tester-army/e2e/blob/main/docs/ci.mdx)
- [モバイル](https://github.com/tester-army/e2e/blob/main/docs/mobile.mdx)
- [クイックスタート](https://github.com/tester-army/e2e/blob/main/docs/quickstart.mdx)
- [公式サイト](https://tester.army/e2e)（調査環境からは未取得）
