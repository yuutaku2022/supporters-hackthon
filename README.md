## 開発環境

### 必要なもの

- Node.js 22.x 以上
- npm
- Git
- Supabase アカウントとプロジェクト（Supabaseを使う機能の開発時）

Supabase JavaScript Client の現在の依存バージョンは Node.js 22 以上を必要とします。Node.js のバージョンは `node --version`、npm は `npm --version` で確認してください。

### セットアップ

1. リポジトリを取得して、プロジェクトのディレクトリに移動します。

   ```bash
   git clone <リポジトリのURL>
   cd supporters-hackthon
   ```

2. 依存パッケージをインストールします。

   ```bash
   npm ci
   ```

3. 環境変数ファイルを作成します。ラインに.env.localファイルがあるのでそれをダウンロードして、このプロジェクトのディレクトリ直下においてほしい。
  
   Windows PowerShell の場合：
   
   ```powershell
   Copy-Item .env.example .env.local
   ```

   macOS / Linux の場合：

   ```bash
   cp .env.example .env.local
   ```

6. Supabase の Project URL と公開用キーを `.env.local` に設定します。キーは Supabase Dashboard のプロジェクト設定から取得してください。`SUPABASE_SERVICE_ROLE_KEY` はサーバー専用の秘密鍵です。必要になった場合だけローカルの `.env.local` に設定し、ブラウザー向けコードから絶対に参照しないでください。

   Supabase の分離された開発用・本番用プロジェクトを使うことを推奨します。開発環境と本番環境で同じプロジェクトを使うと、ローカルでの操作が本番データに影響する可能性があります。

7. 開発サーバーを起動します。

   ```bash
   npm run dev
   ```

   ブラウザーで [http://localhost:3000](http://localhost:3000) を開きます。

### 確認用コマンド

```bash
npm run lint
npm run build
```

## 環境変数

`.env.example` は共有用のひな形で、秘密情報は含めません。実際の値は各自の `.env.local` に設定してください。`.env.local` は Git の管理対象外です。

| 変数 | 用途 | 注意 |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase プロジェクトの URL | クライアントで利用可能 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase の公開用キー（anon / publishable key） | クライアントで利用可能。DBのアクセス制御は RLS で行う |

必要なキーは、実装する Supabase クライアントと Supabase Dashboard に表示されるキーの種類に合わせてください。サーバー用の管理キーは現在の構成では必須ではなく、管理者権限が必要なサーバー処理を実装するときだけ設定します。

### Vercel にデプロイするとき

Vercel の Project Settings → Environment Variables で、必要な環境変数を設定します。Preview と Production それぞれの適用先を選び、可能であれば別々の Supabase プロジェクトの値を登録してください。Production の秘密鍵を Preview に流用しないでください。環境変数を変更した後は、対象環境を再デプロイして反映します。

GitHub に push したブランチから Vercel Preview を確認し、Pull Request でレビュー・動作確認してから `main` に統合します。`main` への統合後に Production へデプロイする運用を想定しています。

## ディレクトリ構成

以下は現在のアプリと、今後の実装で使う予定の配置です。`.gitkeep` は未使用のディレクトリを Git 上に残すための空の目印で、アプリのコードではありません。機能の実装に合わせて置き換えたり削除したりしてください。

```text
supporters-hackthon/
├── public/
│   ├── images/                 # 画像などの静的ファイル
│   └── sounds/                 # 効果音などの静的ファイル
├── app/
│   ├── layout.tsx              # 共通レイアウト（作成済み）
│   ├── page.tsx                # スタート画面（/）
│   ├── start/page.tsx          # 旧スタートURLから/へのリダイレクト
│   ├── play/page.tsx           # ゲーム画面（/play）
│   ├── result/page.tsx         # 結果画面（/result）
│   ├── globals.css             # 全体のスタイル（作成済み）
│   ├── not-found.tsx           # 404ページ（必要になったら追加）
│   ├── error.tsx               # エラー画面（必要になったら追加）
│   └── api/                    # Route Handlers（API実装時に追加）
├── components/
│   ├── ui/                     # 汎用UI部品
│   ├── layout/                 # ヘッダー、フッターなど
│   └── common/                 # ローディング、エラー表示など
├── features/                   # ゲーム、コメント、ランキングなどの機能
├── lib/
│   ├── supabase/               # Supabaseクライアント
│   └── constants/              # 共通定数
├── server/
│   ├── repositories/           # データベースアクセス
│   └── services/               # ゲームルール、スコア計算など
├── types/                      # アプリケーション共通型
├── supabase/
│   ├── migrations/             # DB変更履歴（SQL）
│   └── seed.sql                # 開発用初期データ（必要になったら追加）
├── ai/                         # AIコメント生成・学習用（Webアプリとは分離）
├── tests/                      # テスト
├── .env.example                # 環境変数名の共有用ひな形
├── .gitignore
├── eslint.config.mjs           # ESLint設定（作成済み）
├── next.config.ts              # Next.js設定（作成済み）
├── package.json
├── package-lock.json
├── tsconfig.json
└── README.md
```

### 画面遷移

スタート画面（`/`）からゲーム画面（`/play`）へ進み、ゲーム終了後に結果画面（`/result?score=合計点`）を表示します。結果画面からはスタート画面へ戻れます。

### 配置のルール

- `app/` には画面と API の入口を置き、ゲーム処理そのものは詰め込みません。
- `components/` は複数の画面や機能で使い回す UI 部品を置きます。ゲーム固有の表示・処理は `features/` にまとめます。
- `lib/` は外部サービス接続や共通ユーティリティ、`server/` はサーバー側の DB アクセスとビジネスロジックを置きます。
- 正解判定、スコア計算、セッション確定など、改ざんさせたくない処理はサーバー側で実行します。
- `supabase/migrations/` で DB の変更を管理します。既存テーブルを確認せずに削除・再作成する変更は行いません。
- `ai/` は学習・コメント生成の作業場所です。初期段階では Web アプリから AI 学習処理を呼び出しません。

## チーム開発

1. 機能ごとにブランチを作成します。
2. 変更を push し、Pull Request で差分と動作を確認します。
3. lint と build を確認し、レビュー後に `main` へ統合します。
4. `.env.local`、Supabase の秘密鍵、その他の認証情報はコミットしません。
5. DB の変更は可能な限りマイグレーションで管理し、適用前に対象環境と既存データへの影響を確認します。

## デプロイ

Vercel に GitHub リポジトリを接続し、Preview / Production の環境変数を設定します。GitHub のブランチへの push で Preview を確認し、`main` への統合後に Production をデプロイする構成を想定しています。実際のデプロイ設定や環境変数は Vercel のプロジェクト設定で管理してください。
