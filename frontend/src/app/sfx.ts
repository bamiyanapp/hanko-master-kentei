// dev-standards共通効果音（shared/sfx/）の再生ヘルパー。
// iOS Safari等の自動再生ポリシーに対応するため、必ずユーザー操作（クリックハンドラ等）内で呼び出すこと。
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

function playSound(fileName: string) {
  // SSR環境・テスト環境（Audio未実装のDOM）等、Audio APIが存在しない場合は何もしない。
  if (typeof Audio === 'undefined') return;
  const audio = new Audio(`${basePath}/sfx/${fileName}`);
  // 再生失敗（自動再生ポリシー等）はゲーム進行に影響させないよう握りつぶす。
  audio.play().catch(() => {});
}

export const playClickSound = () => playSound('click.mp3');
export const playSuccessSound = () => playSound('success.mp3');
export const playFailureSound = () => playSound('failure.mp3');
