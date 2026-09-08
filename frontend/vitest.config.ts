import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    // tsconfig.jsonの`paths`（`@/*` -> `src/*`）とNext.jsのビルドは自動で
    // 解決されるが、vitestはViteのデフォルトリゾルバのみでは解決しないため
    // 明示的に設定する（issue #193でsrc配下の相互参照が増えたため発覚）。
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
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
        'src/components/ServiceWorkerRegistration.tsx',
        'src/components/UpdateNotifier.jsx',
      ],
    },
  },
});
