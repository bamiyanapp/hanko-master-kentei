// dev-standards共通sw.js（shared/pwa/sw.js）が importScripts で読み込む設定。
// このファイルはプロダクト固有のためsymlinkにせず実ファイルとして管理する
// （docs/service-worker-update-pattern.md「セットアップ手順」参照）。
//
// GitHub PagesのbasePath（/hanko-master-kentei）配下に配信されるため、
// sw.js自身のスクリプトURL（self.location）からbasePathを動的に導出する。
// ローカル開発（basePathなし）では空文字列になる。
const basePath = self.location.pathname.replace(/\/sw\.js$/, '');

self.SW_CONFIG = {
  // キャッシュ戦略・precacheUrls等を変更した際は必ず値を変更し、activate時に
  // 旧キャッシュを確実に破棄させること
  cacheVersion: 'v1',
  precacheUrls: [`${basePath}/`],
  // 現状フロントエンドは外部API（backend）を呼び出していないため空。
  // 将来judgeHanko等のAPI呼び出しを追加する場合はAPI Gatewayのホスト名を追記する。
  apiHostnames: [],
  noCacheSameOriginPrefixes: [],
};
