# DIPSナビAI

DIPS（ドローン情報基盤システム）マニュアルを RAG 検索するオペレーター向けアシスタント。

## セットアップ

1. `.env.example` を `.env.local` にコピーし、各サービスのキーを設定
2. `npm install`
3. `npm run setup:db` — DynamoDB テーブル作成
4. Pinecone で dimension=768 の Serverless インデックスを作成（例: `dips-navi`）。または `npm run setup:pinecone`
5. `npm run discover:manuals` — 公式ポータルから PDF URL を取得
6. `npm run ingest` — PDF をベクトル化して Pinecone に投入
7. Clerk Dashboard で管理者ユーザーに `publicMetadata.role = "admin"` を設定
8. `npm run dev`

## 主要コマンド

- `npm run dev` — 開発サーバー
- `npm run ingest` — マニュアル一括投入（CLI）
- `/admin/ingest` — 管理者向け再インデックス UI

## 無料枠

Vercel Hobby / Clerk Free / DynamoDB 無料枠 / Pinecone Serverless Free / Gemini API 無料枠を想定。
