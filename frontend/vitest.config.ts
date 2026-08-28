import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*'],
      exclude: [
        'src/app/layout.tsx',
        'src/app/globals.css',
        // dev-standards共通コンポーネント（shared/pwa/）をbasePath・Tailwind対応の
        // ため個別コピーしたもの。layout.tsxからの配線のみを行う薄いラッパーで、
        // ブラウザAPI（navigator.serviceWorker等）への依存が強くjsdom等のDOM環境が
        // 無い本プロジェクトのテスト構成では検証しづらいため対象外とする（issue #214）
        'src/components/**',
      ],
    },
  },
});
