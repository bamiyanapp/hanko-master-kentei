'use client';

import { useEffect, useState } from 'react';

// dev-standards共通のshared/pwa/UpdateNotifier.jsxをベースに、Bootstrap
// クラス（alert/btn等）を本アプリが採用するTailwind CSSのクラスへ置き換えた
// コピー。オリジナルはBootstrap前提のためsymlink共有すると無スタイルの
// バナーになってしまう。dev-standardsのドキュメントが非Bootstrap構成の
// プロダクト向けに明示している「コピーして個別管理する」方針に従う
// （dev-standards docs/service-worker-update-pattern.md参照、issue #214）。
//
// Service Worker導入後、PWAとしてホーム画面に追加した状態では新しいバージョンに
// 切り替わったことに気づきにくく、キャッシュされた古い画面が表示され続けている
// ように見えてしまい、ホーム画面からの削除・再追加が必要になりがちだった。
// ページ読み込み時点で既にService Workerの制御下にあった場合のみ（＝初回
// インストールではなく既存バージョンからの切り替わりの場合のみ）controllerchange
// イベントを「更新」とみなし、再読み込みを促すバナーを表示する。入力中のフォーム等を
// 妨げないよう、自動的な強制リロードはしない。
export default function UpdateNotifier() {
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const hadControllerAtLoad = Boolean(navigator.serviceWorker.controller);

    function handleControllerChange() {
      if (hadControllerAtLoad) {
        setUpdateAvailable(true);
      }
    }

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);
    return () => navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
  }, []);

  if (!updateAvailable) return null;

  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 mb-3 z-[1080]">
      <div
        role="alert"
        className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-blue-900 shadow-lg"
      >
        <span className="text-sm font-medium">新しいバージョンがあります</span>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-bold text-white transition-colors hover:bg-blue-700"
        >
          更新する
        </button>
      </div>
    </div>
  );
}
