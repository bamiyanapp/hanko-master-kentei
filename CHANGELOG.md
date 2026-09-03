## [1.0.1](https://github.com/bamiyanapp/hanko-master-kentei/compare/v1.0.0...v1.0.1) (2026-09-03)


### Bug Fixes

* **cd:** dev-standards参照をv2.7.4へ更新しreleaseジョブの不具合を解消 ([#263](https://github.com/bamiyanapp/hanko-master-kentei/issues/263)) ([aeb0402](https://github.com/bamiyanapp/hanko-master-kentei/commit/aeb0402af3996f858b7dbe98e33550f6b05a8e41)), closes [#261](https://github.com/bamiyanapp/hanko-master-kentei/issues/261)

# 1.0.0 (2026-09-03)


### Bug Fixes

* **backend:** ESLint v9 形式の設定ファイルを追加 ([86acddc](https://github.com/bamiyanapp/hanko-master-kentei/commit/86acddcf5c45b620bab8358b2f943b9461756f83))
* **backend:** Serverless Frameworkをv3に固定 ([#22](https://github.com/bamiyanapp/hanko-master-kentei/issues/22)) ([a5b9777](https://github.com/bamiyanapp/hanko-master-kentei/commit/a5b977770fb101f8f19c55d8bbb7d29fe28f8461))
* **backend:** serverless.ymlのframeworkVersionをv4へ合わせる ([#96](https://github.com/bamiyanapp/hanko-master-kentei/issues/96)) ([#97](https://github.com/bamiyanapp/hanko-master-kentei/issues/97)) ([63ec8eb](https://github.com/bamiyanapp/hanko-master-kentei/commit/63ec8eb593979aae4db74c5844da8740e65f1237))
* **backend:** データベースシード用のプレースホルダーファイルを追加 ([#24](https://github.com/bamiyanapp/hanko-master-kentei/issues/24)) ([850a3d9](https://github.com/bamiyanapp/hanko-master-kentei/commit/850a3d9ec617eab74988cd0ae94a76d224bc9708))
* **backend:** デプロイをOSLSへ切り替える ([#96](https://github.com/bamiyanapp/hanko-master-kentei/issues/96)) ([#99](https://github.com/bamiyanapp/hanko-master-kentei/issues/99)) ([aee9556](https://github.com/bamiyanapp/hanko-master-kentei/commit/aee9556e117d810180a194b121f8b65417487c6b)), closes [#88](https://github.com/bamiyanapp/hanko-master-kentei/issues/88)
* **cd:** frontendデプロイのcheckoutでsubmoduleを取得する ([#220](https://github.com/bamiyanapp/hanko-master-kentei/issues/220)) ([b622064](https://github.com/bamiyanapp/hanko-master-kentei/commit/b6220641df2a336c54d63d2e5f78abfdaea44dce)), closes [#219](https://github.com/bamiyanapp/hanko-master-kentei/issues/219)
* **ci:** CDのgitプッシュにおける403エラーを修正 ([#17](https://github.com/bamiyanapp/hanko-master-kentei/issues/17)) ([fb11ff5](https://github.com/bamiyanapp/hanko-master-kentei/commit/fb11ff53a9d190a91f48d4e7f8c210717e602b05))
* **ci:** CDのトリガーをmainブランチの更新に変更 ([#14](https://github.com/bamiyanapp/hanko-master-kentei/issues/14)) ([59bc232](https://github.com/bamiyanapp/hanko-master-kentei/commit/59bc2320e50e56eb98703f5025319f2c7026998d))
* **ci:** CDのトリガーをPRクローズ（マージ時）に変更 ([#15](https://github.com/bamiyanapp/hanko-master-kentei/issues/15)) ([717e47b](https://github.com/bamiyanapp/hanko-master-kentei/commit/717e47b4db40518c0b92f8a4cd799ff7b758cffb))
* **ci:** commitlintの依存関係と設定ファイルを追加し、CIジョブを修正 ([e58a579](https://github.com/bamiyanapp/hanko-master-kentei/commit/e58a5791c49ff54f443e562ee63acf3b57a12997))
* **ci:** fix lint command by specifying directory for next lint ([1373250](https://github.com/bamiyanapp/hanko-master-kentei/commit/1373250f48316f6359e7d5a2e9ec8d93563c0b4e))
* **ci:** GitHub Actionsでの依存関係キャッシュ解決エラーの修正 ([#19](https://github.com/bamiyanapp/hanko-master-kentei/issues/19)) ([5be18a1](https://github.com/bamiyanapp/hanko-master-kentei/commit/5be18a1561caf4f8a836bd0fc3d09b7d774c2674))
* **ci:** GitHub ActionsのNode.jsを24へ移行、キャッシュ設定の修正 ([#20](https://github.com/bamiyanapp/hanko-master-kentei/issues/20)) ([daeb8f9](https://github.com/bamiyanapp/hanko-master-kentei/commit/daeb8f9e7922692b8cd0d497ee49393c52ad5652))
* **ci:** remove npm cache to avoid lock file error ([b2561b6](https://github.com/bamiyanapp/hanko-master-kentei/commit/b2561b6b2e174e06382b078d62bb758b367db40c))
* **ci:** reusable-ci.yml呼び出しの入力名をenable_release_syncからenable_releaseへ修正 ([#40](https://github.com/bamiyanapp/hanko-master-kentei/issues/40)) ([61f6b79](https://github.com/bamiyanapp/hanko-master-kentei/commit/61f6b79acfc3f13e187b409aea4f5ae1776e6c78))
* **ci:** リリース同期処理での権限エラーの解決 ([#13](https://github.com/bamiyanapp/hanko-master-kentei/issues/13)) ([09af532](https://github.com/bamiyanapp/hanko-master-kentei/commit/09af532ac7bba2b1d801b98de3074e9e3edadf50))
* **ci:** 自動マージにBOT_TOKENを使用するよう修正 ([#21](https://github.com/bamiyanapp/hanko-master-kentei/issues/21)) ([462e83a](https://github.com/bamiyanapp/hanko-master-kentei/commit/462e83a4dd675e15525bf2a262fd36ba569bd288))
* **deps:** update nextjs monorepo to v16.3.0 ([#109](https://github.com/bamiyanapp/hanko-master-kentei/issues/109)) ([1b13d49](https://github.com/bamiyanapp/hanko-master-kentei/commit/1b13d49dbfa72783238a0187e9ce7162d903aead))
* **deps:** update nextjs monorepo to v16.3.1 ([#130](https://github.com/bamiyanapp/hanko-master-kentei/issues/130)) ([ed776ca](https://github.com/bamiyanapp/hanko-master-kentei/commit/ed776ca4f779f2b2452cfbffc7db52a64fa8613a))
* **deps:** update nextjs monorepo to v16.3.2 ([#159](https://github.com/bamiyanapp/hanko-master-kentei/issues/159)) ([d84c149](https://github.com/bamiyanapp/hanko-master-kentei/commit/d84c149aef0b86aa65fccf1034a48a02a2c38f77))
* **deps:** update nextjs monorepo to v16.3.3 ([#176](https://github.com/bamiyanapp/hanko-master-kentei/issues/176)) ([2fe0d01](https://github.com/bamiyanapp/hanko-master-kentei/commit/2fe0d0115f33cf230c61206917a9f7df2298ea0e))
* **deps:** update nextjs monorepo to v16.3.4 ([#251](https://github.com/bamiyanapp/hanko-master-kentei/issues/251)) ([d8f3592](https://github.com/bamiyanapp/hanko-master-kentei/commit/d8f359270dad75ba494ce09f73c1177b36025828))
* **frontend:** CI上のnext lintエラーの修正 ([f5ad100](https://github.com/bamiyanapp/hanko-master-kentei/commit/f5ad10006b45c2989bd48436a31e3fd30653b4df))
* **frontend:** GitHub PagesでCSSが効かない問題を修正 ([c53045c](https://github.com/bamiyanapp/hanko-master-kentei/commit/c53045c4cd32dd56e765e69c7c77cb10583c476d))
* **frontend:** GitHub Pages向けの静的エクスポートを有効化 ([#23](https://github.com/bamiyanapp/hanko-master-kentei/issues/23)) ([ad50341](https://github.com/bamiyanapp/hanko-master-kentei/commit/ad503416bdc5038fc29a6a48673687674b6aaab2))
* **frontend:** ダークモード時のトップ画面文字色が読めない不具合を修正 ([#257](https://github.com/bamiyanapp/hanko-master-kentei/issues/257)) ([855cff4](https://github.com/bamiyanapp/hanko-master-kentei/commit/855cff4d9fa05c445e7f4bd3e7bbdc065c5142c6)), closes [#239](https://github.com/bamiyanapp/hanko-master-kentei/issues/239)
* **frontend:** フロントエンドのテスト修正とカバレッジ閾値の調整 ([ec09eae](https://github.com/bamiyanapp/hanko-master-kentei/commit/ec09eae84c88e60ceb3267dc36aa0034c9705f6f))
* **frontend:** 検定開始ボタンのイベント追加と判定実装 ([#25](https://github.com/bamiyanapp/hanko-master-kentei/issues/25)) ([2f83a3a](https://github.com/bamiyanapp/hanko-master-kentei/commit/2f83a3a061d43428157dbd017c0d79b99e1f78bd))
* **frontend:** 稟議タイトルや捺印欄等の文字色視認性向上 ([#30](https://github.com/bamiyanapp/hanko-master-kentei/issues/30)) ([b5e374e](https://github.com/bamiyanapp/hanko-master-kentei/commit/b5e374e9517319b287a22c7d7284c0ead96433d8))
* **renovate:** typescriptのメジャー更新を保留する ([#91](https://github.com/bamiyanapp/hanko-master-kentei/issues/91)) ([#94](https://github.com/bamiyanapp/hanko-master-kentei/issues/94)) ([bdb4d36](https://github.com/bamiyanapp/hanko-master-kentei/commit/bdb4d362134022e819e4cf2939fca32a5ab1aa15))
* **ui:** Tailwind v4 のビルド設定を追加しCSSが効かない問題を解決 ([b5c629c](https://github.com/bamiyanapp/hanko-master-kentei/commit/b5c629c3e3b190e66b728b0f0df1bcb78580a15c))


### Features

* **cd:** semantic-releaseを導入しGitHub側にバージョンを反映する ([#262](https://github.com/bamiyanapp/hanko-master-kentei/issues/262)) ([78066c7](https://github.com/bamiyanapp/hanko-master-kentei/commit/78066c7b940684c2df0a15494ea97aad83268468)), closes [#261](https://github.com/bamiyanapp/hanko-master-kentei/issues/261)
* **ci:** CIとCDのワークフローを分離 ([#18](https://github.com/bamiyanapp/hanko-master-kentei/issues/18)) ([7eed47b](https://github.com/bamiyanapp/hanko-master-kentei/commit/7eed47b0037fa008f7f277a392eddec662592247))
* **ci:** CIワークフローとCDワークフローを一本化 ([#16](https://github.com/bamiyanapp/hanko-master-kentei/issues/16)) ([e40f15b](https://github.com/bamiyanapp/hanko-master-kentei/commit/e40f15ba638421c4861c194589bafafb4de14748))
* **ci:** GitHub Actionsワークフローの設定とプロジェクト構成の調整 ([c8d05ba](https://github.com/bamiyanapp/hanko-master-kentei/commit/c8d05ba00e5c78ca5adfb42429b840dff019894e))
* **ci:** フロント・バックのテストジョブを matrix を用いて並列化 ([50c835f](https://github.com/bamiyanapp/hanko-master-kentei/commit/50c835fcd284210884aab52055d09293d1f651f3))
* **ci:** 並列でのコードLintジョブの復元とエラー解決 ([#12](https://github.com/bamiyanapp/hanko-master-kentei/issues/12)) ([6123853](https://github.com/bamiyanapp/hanko-master-kentei/commit/6123853643c6d1dd087e097f2342eb895637f829))
* **ci:** 品質ゲート機能を導入する ([#89](https://github.com/bamiyanapp/hanko-master-kentei/issues/89)) ([#102](https://github.com/bamiyanapp/hanko-master-kentei/issues/102)) ([a9fb06f](https://github.com/bamiyanapp/hanko-master-kentei/commit/a9fb06f0ee2cd2c59035e4f8b9ba9ea85e285cdf))
* **deps:** Bootstrap 5.3を導入する（Tailwindと並存） ([#229](https://github.com/bamiyanapp/hanko-master-kentei/issues/229)) ([8a2f736](https://github.com/bamiyanapp/hanko-master-kentei/commit/8a2f736bbbeeaa5419f9c89ac29adcfec13fa587)), closes [#224](https://github.com/bamiyanapp/hanko-master-kentei/issues/224)
* **frontend:** URLパラメータとの同期によるブックマーカブル化 ([#29](https://github.com/bamiyanapp/hanko-master-kentei/issues/29)) ([ddc3451](https://github.com/bamiyanapp/hanko-master-kentei/commit/ddc34511ae869e8dbfd67601c89de844fc7e7388))
* **frontend:** クイズ画面をBootstrapクラスへ書き換え ([#236](https://github.com/bamiyanapp/hanko-master-kentei/issues/236)) ([6e8ffd2](https://github.com/bamiyanapp/hanko-master-kentei/commit/6e8ffd286aeefa6dc549c4e26b5f332b5a2e3a95)), closes [#226](https://github.com/bamiyanapp/hanko-master-kentei/issues/226)
* **frontend:** トップ画面をBootstrapクラスへ書き換え ([#233](https://github.com/bamiyanapp/hanko-master-kentei/issues/233)) ([b1d5c72](https://github.com/bamiyanapp/hanko-master-kentei/commit/b1d5c722cf5ed858132d77472b4ea59cc945cf59)), closes [#225](https://github.com/bamiyanapp/hanko-master-kentei/issues/225)
* **frontend:** ビルドバージョン情報をトップ画面に表示する ([#260](https://github.com/bamiyanapp/hanko-master-kentei/issues/260)) ([ed26f7a](https://github.com/bamiyanapp/hanko-master-kentei/commit/ed26f7a189d4256ac9c728975cf14ea9d6c22445)), closes [#248](https://github.com/bamiyanapp/hanko-master-kentei/issues/248)
* **pwa:** Service Worker導入でPWA更新問題を解消 ([#214](https://github.com/bamiyanapp/hanko-master-kentei/issues/214)) ([#215](https://github.com/bamiyanapp/hanko-master-kentei/issues/215)) ([e309de7](https://github.com/bamiyanapp/hanko-master-kentei/commit/e309de74e9347d82d49be072617cd20118c4eec6))
* **pwa:** アイコンをトップページの💮デザインへ差し替え ([#218](https://github.com/bamiyanapp/hanko-master-kentei/issues/218)) ([ae269cd](https://github.com/bamiyanapp/hanko-master-kentei/commit/ae269cd96e612af941c1ae832552af4058a23b73)), closes [#fee2e2](https://github.com/bamiyanapp/hanko-master-kentei/issues/fee2e2) [#217](https://github.com/bamiyanapp/hanko-master-kentei/issues/217)
* **pwa:** はんこアイコンでPWAインストールに対応 ([#160](https://github.com/bamiyanapp/hanko-master-kentei/issues/160)) ([#161](https://github.com/bamiyanapp/hanko-master-kentei/issues/161)) ([9ab552b](https://github.com/bamiyanapp/hanko-master-kentei/commit/9ab552beb94b8ef15e473096235468700b0fad48))
* **setup:** frontendとbackendのプロジェクト構成を初期化 ([30fedfe](https://github.com/bamiyanapp/hanko-master-kentei/commit/30fedfe13f513355818eb438d9a5b16dbc025101))
* **sfx:** 捺印操作へdev-standards共通効果音を設定 ([#210](https://github.com/bamiyanapp/hanko-master-kentei/issues/210)) ([#211](https://github.com/bamiyanapp/hanko-master-kentei/issues/211)) ([dbea635](https://github.com/bamiyanapp/hanko-master-kentei/commit/dbea635259d735f0abdebb4f7643ba6942218b4a))
