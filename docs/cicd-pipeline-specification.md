# CI/CD Pipeline Specification（hanko-master-kentei固有）

共通のCI/CDパイプライン仕様（Architecture・`reusable-ci.yml` / `reusable-cd.yml` の実行内容・リリース運用等）は
[dev-standards/docs/cicd-pipeline-specification.md](../dev-standards/docs/cicd-pipeline-specification.md) を参照する。

本ドキュメントには、共通ドキュメントに書かれていない本リポジトリ固有のデプロイ内容のみを記載する。

## CI（`.github/workflows/ci.yml`）

`dev-standards` の `reusable-ci.yml` を呼び出す（`node_version: "24"` / `workspaces: true`）。
本リポジトリは semantic-release によるバージョン管理・リリースを行わないため、非推奨input `enable_release`（reusable-cd.ymlへ移動済み）は指定しない。

## CD（`.github/workflows/cd.yml`）

`reusable-cd.yml`（semantic-release・releaseブランチ運用が前提）は採用せず、`main` ブランチへのpushをトリガーに
frontend・backendを直接デプロイする独自ワークフローを持つ。

### frontend（GitHub Pages）

- dev-standardsの共通複合action `deploy-github-pages`（タグ固定参照、`workspaces: true`）を呼び出す
- リポジトリルートで `npm ci`（npm workspaces構成のため） → `frontend` で `npm run build`（Next.jsの静的エクスポート、出力先 `frontend/out`） → `actions/upload-pages-artifact` → `actions/deploy-pages` でGitHub Pagesへデプロイ

### backend（OSLS / AWS Lambda）

- `backend` で `npx osls deploy`（`serverless.yml` に基づきAWS Lambda / API Gatewayを構築、region: `ap-northeast-1`）
- OSLS（[oss-serverless/osls](https://github.com/oss-serverless/osls)）はServerless Framework互換のOSSフォークで、`serverless.yml`の設定形式・CLIコマンド体系をそのまま引き継ぐ。Serverless Framework v4以降が要求するサインイン・ライセンスキーが不要なため採用している（issue #96）
- デプロイ後、`node seed.js` でDynamoDBへ初期データを投入

### 環境変数（プロダクト固有）

| 変数名 | 説明 |
|---|---|
| `AWS_ACCESS_KEY_ID` | backendデプロイ（`osls deploy`）・seed投入（`seed.js`）で使用するAWS認証情報 |
| `AWS_SECRET_ACCESS_KEY` | 同上 |
