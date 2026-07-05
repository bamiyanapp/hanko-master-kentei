@dev-standards/CLAUDE.md

## 11. hanko-master-kentei固有ルール

### 対象パッケージ（「1. 開発プロセス」手順6、「4. 静的チェック」関連）

本リポジトリはnpm workspaces構成（`frontend` / `backend`）であり、対象パッケージは `frontend` と `backend` である。それぞれのディレクトリで以下を実行する。

- lint: `npm run lint`（eslint）
- test: `npm run test`（vitest。ルート直下からは `npm run test` でfrontend・backend双方をまとめて実行可能）
- build: `frontend` のみ `npm run build`（Next.jsの静的エクスポート）。`backend` にbuild相当の手順は無いため対象外とする。

commitlintはリポジトリルートで `npm run lint` を実行する。

### CI・自動マージ（「10. PR（MR）承認・マージ禁止」関連）

本リポジトリは `.github/workflows/ci.yml` から `dev-standards` の `reusable-ci.yml` を呼び出しており、commitlint・frontend/backendのlint・test・buildがすべて成功した場合にのみ `merge` ジョブがPRをsquashマージし作業ブランチを削除する仕組みを採用している。この仕組みの有無にかかわらず、共通ルール「10. PR（MR）承認・マージ禁止」を厳守し、PR（MR）の承認・マージは行わないこと。

デプロイ（`.github/workflows/cd.yml`）はfrontend（GitHub Pages）・backend（Serverless Framework）ともにプロダクト固有の手順であり、`main` ブランチへのpushをトリガーに直接デプロイする独自運用を維持する。dev-standardsの `reusable-cd.yml`（semantic-release・releaseブランチ運用が前提）は、本リポジトリでは採用しない。
