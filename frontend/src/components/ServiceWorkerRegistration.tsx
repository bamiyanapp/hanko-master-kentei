'use client';

import { useEffect } from 'react';

// dev-standards共通のshared/pwa/ServiceWorkerRegistration.jsxをベースに、
// GitHub PagesのbasePath配下（/hanko-master-kentei）への配信に対応させたコピー。
// オリジナルはregister("/sw.js")とルート絶対パス固定でsymlink共有できるが、
// 本アプリはサブパス配信のためNEXT_PUBLIC_BASE_PATHを反映する必要があり、
// symlink化を見送りコピーして個別管理する
// （dev-standards docs/service-worker-update-pattern.md参照、issue #214）。
//
// iOS PWA（ホーム画面から起動したスタンドアロン表示）はブラウザの自動的な
// Service Worker更新チェック（ページ遷移時・約24時間おき）が働きにくく、
// アプリを終了せずバックグラウンドへ回して再度開いただけでは新バージョンに
// 気づかないことがある。アプリがフォアグラウンドに戻るたびに明示的に
// registration.update()を呼び、新バージョンの検知（UpdateNotifierが拾う
// controllerchangeイベント）を確実にする。
const UPDATE_CHECK_INTERVAL_MS = 5 * 60 * 1000;

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
    let registration: ServiceWorkerRegistration | undefined;
    navigator.serviceWorker
      .register(`${basePath}/sw.js`)
      .then((reg) => {
        registration = reg;
      })
      .catch((error) => {
        console.error('Service Worker registration failed', error);
      });

    function checkForUpdate() {
      if (document.visibilityState === 'visible') {
        registration?.update().catch(() => {
          // オフライン等での更新チェック失敗は致命的ではないため無視する
        });
      }
    }

    document.addEventListener('visibilitychange', checkForUpdate);
    const intervalId = setInterval(checkForUpdate, UPDATE_CHECK_INTERVAL_MS);

    return () => {
      document.removeEventListener('visibilitychange', checkForUpdate);
      clearInterval(intervalId);
    };
  }, []);

  return null;
}
