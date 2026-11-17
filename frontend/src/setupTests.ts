import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup, configure } from '@testing-library/react';

// vitestはglobalsを有効にしていないため、Testing Libraryの自動cleanupが働かない。
// テスト間でDOMが残らないよう明示的に呼ぶ。
afterEach(() => {
  cleanup();
});

// jsdomはメディア再生を実装しておらず、HTMLMediaElement#play()がPromiseではなく
// undefinedを返す（"Not implemented"を出力する）。実ブラウザのplay()はPromiseを返し、
// 効果音（sfx.ts）は`.catch()`をチェーンしているため、外部境界のスタブとして補う。
Object.defineProperty(window.HTMLMediaElement.prototype, 'play', {
  configurable: true,
  value: () => Promise.resolve(),
});

// CI実行はローカルより遅くなることがあり、waitFor系の既定タイムアウト（1000ms）では
// アニメーション・タイマー待ちを伴うテストがまれに失敗するため底上げしておく。
configure({ asyncUtilTimeout: 3000 });
