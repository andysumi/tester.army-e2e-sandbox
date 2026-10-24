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

## 6. 追加調査: Test Filters API（2026-10-23 時点）

X の投稿で話題になっていた Test Filters API について、リリースノートと PR で確認しました。実際に動かしての検証はしていません。

### 概要

PR が影響しうるテストだけを実行する機能です。毎回全テストを回すと遅くて高くつく、という動機で追加されました（[PR #1206](https://github.com/tester-army/e2e/pull/1206)）。

| 項目 | 内容 |
|---|---|
| フィルタの仕組み | `@e2e-dev/github` 0.4.3 が `filters` を提供 |
| AI による判定 | `@e2e-dev/decision` 0.3.0 の `decisionFilter({ model })`。リリースノートの例は `gateway.decisionModel('typesafe-ai/jev')` |
| カスタムフィルタ | 自分で書ける。設定ファイルは `context.configFile` として読める |
| 必要なバージョン | e2e 0.21.3 以上 |
| 実行方法 | `npx e2e run --changed-since origin/main` |
| 事前確認 | `npx e2e list --changed-since origin/main` で除外結果をプレビュー |

設定のイメージ（リリースノートの記述から組み立てたスケッチで、未実行）:

```ts
import { decisionFilter } from '@e2e-dev/decision';

export default {
  // ...
  filters: [decisionFilter({ model })],
} satisfies E2EConfig;
```

### 判定の安全設計（PR #1206 の説明より）

- decision model が、差分でテストの検証内容が変わる確率と、保存したセッション設定が壊れる確率を見積もります。両方が20%未満のときだけ除外します。
- 次の場合は全テストを実行します。
  - 設定ファイルやロックファイルの変更
  - テストファイル、セットアップファイル、スナップショットの変更
  - `--last-failed` での再実行
  - `pull_request_target` での実行（フォークの差分がシークレットと同じ場所でモデルに渡るのを避けるため）
- 比較対象がない実行（main への push、マージキュー、ローカル）は全テストを実行します。
- 除外されたテストは PR コメント、`junit.xml`、レポートに残ります。実行対象がゼロならエンジンもアプリも起動しません。

### decision model と Jev

- decision model は、自由な文章を生成せず、選択肢に確率を付けて答えるモデルです（[`docs/decision-models.mdx`](https://github.com/tester-army/e2e/blob/main/docs/decision-models.mdx)）。
- フィルタ以外に、`agent.act` と `agent.assert` を LLM エージェントの代わりに decision model で動かす使い方もあります。
- Jev は TypeSafe AI のモデルです（`@ai-sdk/typesafe-ai`、`TYPESAFE_AI_API_KEY`）。docs にモデル自体の説明はなく、OpenAI の `gpt-6-luna` なども使えるとされています。

### 導入判断の観点

- 数本の PoC では恩恵が小さく、テストが数十本に増えて CI の時間や費用が気になってから検討すれば十分です。
- フィルタ自体がモデルを呼ぶため、その費用も含めて損得を測る必要があります。リリースノートに料金や呼び出し回数の記載はありません。
- `decisionFilter` は PR の差分（ソースコード）をモデルに送ります。ソースコードの外部送信が社内ルール上問題ないか確認が必要です。`providerOptions` でゼロデータ保持などを設定できるとされています。
- 判定が外れて必要なテストが落ちるリスクがあるため、main への push では全件実行する運用が保険になります。

### バージョンの動き

初回調査時の最新は 0.18.0 でしたが、2026-10-23 時点では e2e 0.21.3 です。更新が活発で、API が変わる前提で、PoC ではバージョンを固定してください。同じリリースで `e2e upgrade`、`e2e init --example`、JavaScript の設定ファイル対応、`--action-timeout` / `--assertion-timeout`、Playwright 1.64.1 への更新も入っています。

## 7. 追加調査: 紹介動画（ライブ配信）の要約

TesterArmy の開発者アドボケイトによる、e2e の紹介ライブ配信の文字起こしを要約したものです。話者の発言をまとめたもので、私たちの環境での検証結果ではありません。

### 2つのプロジェクト

- TesterArmy には、エージェント型テストの SaaS（TesterArmy プラットフォーム）と、無料のオープンソースフレームワーク（e2e）の2つがあります。
- 現時点では別プロジェクトで、将来統合する可能性があるそうです。
- 公開から3週間で、GitHub のスター約1.1万、npm ダウンロード60万超とのことです。

### 開発の動機

- test ID、CSS クラス、iframe 名のような実装の詳細に依存するテストは、デザイン変更やサードパーティ側の変更で壊れます。
- コーディングエージェントにテストを書かせると、コードを見て実装に沿ったテスト（ホワイトボックス）になり、脆くなりがちです。
- e2e は、ユーザーが実際にやる操作（ユーザーフロー）をテストする考え方です。

### 仕組み

- `agent.act` は操作を平易な言葉で指示し、`agent.assert` は状態の変化をエージェントが判定します。Playwright や Maestro と同じ決定的な API（`getByRole`、`getByText`、`getByTestId`）とも混在できます。
- 1回目はエージェントが実行し、`act` の操作が記録されます。2回目以降はほぼ無料で再生されます。`agent.assert` は毎回エージェントが判定するため、キャッシュされません。
- アプリが変わって再生に失敗すると、その時点からエージェントが引き継ぎます。
- 画面とアクセシビリティツリーしか見ないブラックボックス型なので、フレームワークの種類やアーキテクチャに依存しません。

### 探索エージェントとバグバッシュ

- コードを書かずにアプリを壊しにいく探索エージェントを、PR ごとに走らせられます。結果はレポートになり、コーディングエージェントに渡して一括で直せます。
- 探索エージェントを6〜7個同時に走らせるのが「バグバッシュモード」で、PR ごとに動かしているそうです。
- 検証用スキル（create verification skill）で、PR の変更前後のスクリーンショットや録画を付けて出荷できます。Web とアプリの両方に対応するとのことです。

### 対応環境

- **プラットフォーム:** Web、iOS、Android に単一の API で対応しています。土台は Playwright と agent-device で、将来変わる可能性があります。`defineEngine` で独自エンジンを足せます（Electron を実装した例があるそうです）。
- **CI:** Node.js が動けばどこでも動きます。
- **モデル:** Vercel AI Gateway 経由でほぼ何でも使えます。OpenAI、Anthropic、Qwen などの直接利用も可能です。act と assert で別のモデルを指定できます。
- **サブスク:** OpenAI、GitHub Copilot、OpenCode、SpaceX AI が使えます。Claude はサブスクを直接使えず、別途 API キーが必要です。
- **移行スキル:** Playwright、Maestro、Detox から1スイートずつ段階的に移行するスキルがあります。

### デモで分かったこと（Expo アプリ、Next.js の Venmo クローン）

- `npx e2e init` で、エンジン、モデルの渡し方、スキルと MCP の追加を選びます。`e2e.config.ts` とサンプルテストが生成されます。
- サンプルは Settings アプリを開く設定なので、自分のアプリの `bundleId` に直す必要があります。
- `workers` を増やすと、iOS、Android、Web を並列実行できます。1だと順番に実行されて遅くなります。
- ヘッドレスがデフォルトです。画面を見たいときは headed で実行します。
- 2回目の実行はキャッシュから再生され、コストが約4分の1になりました。キャッシュ率は62%でした。
- 本番に近い例では、大半がキャッシュで動き、数回は引き継ぎが発生しました。1件はキャッシュが効かず、全体をエージェントでやり直しました。
- モバイルはアニメーションなどで Web より遅いそうです。
- 認証情報は設定ファイルの `credentials` に置き、環境変数から渡せます。

### コストと運用

- **コスト:** 15テスト・6ファイルのスイートで、実行は1セント未満と話しています。大きめのスイートでも1セント未満とのことです。これは話者の発言で、モデルやアプリによって変わります。
- **モデルの選び方:** 安価なモデルで十分という感触だそうです。担当者が言及したモデル名は文字起こしでは「GPT-4o mini」ですが、公式ドキュメントの例とは名前が違うため、聞き取りの誤りかもしれません。
- **decision model:** CTO が試していて、さらに安い解決策もあるそうです。話者は自分では試していないと断っています。
- **ドル金額の表示:** API キー（Gateway 経由）なら出ます。サブスク利用では出ません。
- **キャッシュの共有:** 現状は**コミットするのが一番簡単**で、ビジュアルリグレッションのスクリーンショットのようにテスト資産として扱うよう勧めています。GitHub Actions のキャッシュや S3 も選べます。

### GitHub Actions と PR コメント

- ドキュメントの GitHub Actions のページに、エージェント用プロンプトがあります。Claude などに貼ると YAML (`e2e.yaml`) を設定してくれます。手動でコピーも可能です。
- AI Gateway のキーは、リポジトリの Secrets に登録します。
- 専用パッケージを足すと、Web、Android、iOS のテスト結果が PR にコメントされます。

### Q&A のポイント

- Playwright の generator / planner / healer のような別機能は不要で、フレームワークに組み込みの考え方です。
- Page Object Model のような特別な設計は不要です。
- Windows ソフトのプラグインに使えるかは、カスタムエンジンで可能性はあるが、話者は未検証です。

### これまでの調査との関係

- Claude サブスクを直接使えない点は、公式の `docs/subscriptions.mdx` の記述と一致しています。
- キャッシュのコミットは動画でも推奨されています。ただしキャッシュには署名がなく、レビュー対象にすべきです（`docs/security.mdx` より）。
- 動画では、サンドボックスがないこと、接続先の制限がないこと、decisionFilter が PR の差分を外部モデルに送ることには触れていません。セキュリティ面は公式の security ドキュメントで判断してください。

## 参考リンク

- [tester-army/e2e（GitHub）](https://github.com/tester-army/e2e)
- [Maestro 移行ガイド](https://github.com/tester-army/e2e/blob/main/docs/migrate/maestro.mdx)
- [キャッシュ / リプレイ](https://github.com/tester-army/e2e/blob/main/docs/cache.mdx)
- [CI](https://github.com/tester-army/e2e/blob/main/docs/ci.mdx)
- [モバイル](https://github.com/tester-army/e2e/blob/main/docs/mobile.mdx)
- [クイックスタート](https://github.com/tester-army/e2e/blob/main/docs/quickstart.mdx)
- [Test Filters の PR #1206](https://github.com/tester-army/e2e/pull/1206)
- [リリース一覧](https://github.com/tester-army/e2e/releases)
- [Decision models](https://github.com/tester-army/e2e/blob/main/docs/decision-models.mdx)
- [公式サイト](https://tester.army/e2e)（調査環境からは未取得）
