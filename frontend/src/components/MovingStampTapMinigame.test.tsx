import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MovingStampTapMinigame from './MovingStampTapMinigame';
import type { Rule } from '@/types/scenario';

// 実装の定数: 60msごとに4%ずつ動き、0〜100%の間を往復する（端で折り返す）。
// 目標50・許容差10 なので 45〜55=excellent、40〜60=good、それ以外=fail
const TICK_MS = 60;

const rule: Rule = {
  id: 'test-moving-tap',
  description: 'テスト用タイミングルール',
  type: 'moving-tap',
  difficulty: 2,
  target: 50,
  tolerance: 10,
};

function setup() {
  const onComplete = vi.fn();
  const user = userEvent.setup();
  render(<MovingStampTapMinigame rule={rule} onComplete={onComplete} />);
  return { user, onComplete, button: screen.getByRole('button', { name: 'スタンプ！' }) };
}

function advanceTicks(ticks: number) {
  act(() => {
    vi.advanceTimersByTime(ticks * TICK_MS);
  });
}

// 印鑑の現在位置（左端からの%）を読む
function position(): number {
  const style = screen.getByText('鈴木').parentElement?.getAttribute('style') ?? '';
  const match = /left:\s*(-?[\d.]+)%/.exec(style);
  if (!match) throw new Error('印鑑の位置を読み取れません');
  return Number(match[1]);
}

describe('MovingStampTapMinigame', () => {
  beforeEach(() => {
    // setTimeoutまで偽装するとuserEvent内部の待機が進まず固まるため、本コンポーネントが
    // 使うsetInterval系だけを偽装する
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('初期状態は左端(0%)で、ルールの説明文と有効なボタンを表示する', () => {
    const { button } = setup();

    expect(position()).toBe(0);
    expect(screen.getByText('テスト用タイミングルール')).toBeInTheDocument();
    expect(button).toBeEnabled();
  });

  it('時間とともに4%ずつ右へ動き、右端で折り返して戻り、左端でまた折り返す', () => {
    setup();

    advanceTicks(1);
    expect(position()).toBe(4);

    advanceTicks(24);
    expect(position()).toBe(100); // 右端

    advanceTicks(1);
    expect(position()).toBe(96); // 折り返して左へ

    advanceTicks(24);
    expect(position()).toBe(0); // 左端

    advanceTicks(1);
    expect(position()).toBe(4); // 再び右へ
  });

  it.each([
    { ticks: 12, actual: 48, score: 'excellent' },
    { ticks: 13, actual: 52, score: 'excellent' },
    { ticks: 11, actual: 44, score: 'good' }, // 差6 > 許容差の半分(5)
    { ticks: 15, actual: 60, score: 'good' }, // 差10（許容差ちょうど）
    { ticks: 16, actual: 64, score: 'fail' }, // 遅すぎる
    { ticks: 5, actual: 20, score: 'fail' }, // 早すぎる
    { ticks: 38, actual: 48, score: 'excellent' }, // 右端から戻ってくる途中でタップ
    { ticks: 0, actual: 0, score: 'fail' }, // 動き出す前にタップ
  ])('$ticks 回動いた時点（位置 $actual %）でタップすると「$score」になる', async ({ ticks, actual, score }) => {
    const { user, onComplete, button } = setup();
    advanceTicks(ticks);

    await user.click(button);

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith({ actual, score });
  });

  it('タップすると印鑑が止まり、ボタンも押せなくなる', async () => {
    const { user, onComplete, button } = setup();
    advanceTicks(12);
    await user.click(button);

    advanceTicks(30);

    expect(position()).toBe(48);
    expect(button).toBeDisabled();
    await user.click(button);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('アンマウント時にタイマーを解除する（解除漏れで動き続けない）', () => {
    const { unmount } = render(<MovingStampTapMinigame rule={rule} onComplete={vi.fn()} />);
    expect(vi.getTimerCount()).toBeGreaterThan(0);

    unmount();

    expect(vi.getTimerCount()).toBe(0);
  });
});
