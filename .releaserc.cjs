// release-config.cjsはCI実行時（enable_shared_release_config: true）にdev-standardsから
// このリポジトリのルートへコピーされるため、通常のrequireで読み込める（issue #261）。
const { buildReleaseConfig } = require("./release-config.cjs");

module.exports = buildReleaseConfig({
  repositoryUrl: "https://github.com/bamiyanapp/hanko-master-kentei.git",
  gitAssets: ["CHANGELOG.md", "package.json", "package-lock.json"],
  // scripts/convert-changelog-to-json.jsは本リポジトリに実体を持たず、
  // 変換後JSONを表示するUIも無いため、prepareCmdはno-opにする。
  changelogPrepareCmd: "true",
});
