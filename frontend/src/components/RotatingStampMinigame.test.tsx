import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RotatingStampMinigame from './RotatingStampMinigame';
import type { Rule } from '@/types/scenario';

// 印鑑は100msごとに6度ずつ回転する（実装の定数）。実際に到達できる角度のみで検証する。
const TICK_MS = 100;
const DEG_PER_TICK = 6;

const rule: Rule = {
  id: 'kito-bow-angle',
  description: 'テスト用ルール',
  type: 'angle',
  difficulty: 1,
  target: 90,
  tolerance: 10,
};

function setup(ruleOverride: Rule = rule) {
  const onComplete = vi.fn();
  const user = userEvent.setup();
  render(<RotatingStampMinigame rule={ruleOverride} onComplete={onComplete} />);
  return { user, onComplete };
}

function advanceTicks(ticks: number) {
  act(() => {
    vi.advanceTimersByTime(ticks * TICK_MS);
  });
}

// 回転する印鑑のtransformから現在の角度を読む
function currentAngle(): number {
  const style = screen.getByText('鈴木').parentElement?.getAttribute('style') ?? '';
  const match = /rotate\((-?[\d.]+)deg\)/.exec(style);
  return Number(match?.[1]);
}

describe('RotatingStampMinigame', () => {
  beforeEach(() => {
    // 本コンポーネントはsetIntervalのみ使う。setTimeoutまで偽装すると、Testing Libraryと
    // userEvent内部のsetTimeout待機が進まず固まるため、setInterval系だけを偽装する
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('停止前は「止める」ボタンが有効で、ルールの説明文と0度の印鑑を表示する', () => {
    setup();

    expect(screen.getByRole('button', { name: '止める' })).toBeEnabled();
    expect(screen.getByText('テスト用ルール')).toBeInTheDocument();
    expect(currentAngle()).toBe(0);
  });

  it('時間とともに6度ずつ回転し、360度で0度へ折り返す', () => {
    setup();

    advanceTicks(1);
    expect(currentAngle()).toBe(DEG_PER_TICK);

    advanceTicks(59);
    expect(currentAngle()).toBe(0); // 360度ちょうど

    advanceTicks(1);
    expect(currentAngle()).toBe(DEG_PER_TICK);
  });

  it('目標角度ちょうどで止めるとexcellentでonCompleteが1回呼ばれ、ボタンが無効になる', async () => {
    const { user, onComplete } = setup();

    advanceTicks(15); // 6 x 15 = 90度
    await user.click(screen.getByRole('button', { name: '止める' }));

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith({ actual: 90, score: 'excellent' });
    expect(screen.getByRole('button', { name: '止める' })).toBeDisabled();
  });

  it('許容差の範囲内（ただし半分より外）ならgoodになる', async () => {
    const { user, onComplete } = setup();

    advanceTicks(14); // 84度。目標90との差6 > 許容差10の半分(5)
    await user.click(screen.getByRole('button', { name: '止める' }));

    expect(onComplete).toHaveBeenCalledWith({ actual: 84, score: 'good' });
  });

  it('許容差の範囲外で止めるとfailになる', async () => {
    const { user, onComplete } = setup();

    advanceTicks(13); // 78度。目標90との差12 > 許容差10
    await user.click(screen.getByRole('button', { name: '止める' }));

    expect(onComplete).toHaveBeenCalledWith({ actual: 78, score: 'fail' });
  });

  it('止めた後は回転が止まり、ボタンも押せない', async () => {
    const { user, onComplete } = setup();

    advanceTicks(15);
    await user.click(screen.getByRole('button', { name: '止める' }));
    advanceTicks(30);

    expect(currentAngle()).toBe(90);
    await user.click(screen.getByRole('button', { name: '止める' }));
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('180度を超える角度は-180〜180度へ正規化してから採点する', async () => {
    const { user, onComplete } = setup();

    advanceTicks(33); // 198度 → 198-360=-162度
    await user.click(screen.getByRole('button', { name: '止める' }));

    expect(onComplete).toHaveBeenCalledWith({ actual: -162, score: 'fail' });
  });

  it('負の目標角度（左傾き）を持つルールでも、正規化により達成できる', async () => {
    const bowRule: Rule = {
      id: 'bow-angle',
      description: 'お辞儀角度ルール',
      type: 'angle',
      difficulty: 1,
      target: -22.5,
      tolerance: 12.5,
    };
    const { user, onComplete } = setup(bowRule);

    advanceTicks(56); // 336度 → -24度。目標-22.5との差1.5
    await user.click(screen.getByRole('button', { name: '止める' }));

    expect(onComplete).toHaveBeenCalledWith({ actual: -24, score: 'excellent' });
  });

  it('アンマウント時にタイマーを解除する（解除漏れで回り続けない）', () => {
    const { unmount } = render(<RotatingStampMinigame rule={rule} onComplete={vi.fn()} />);
    const timersBefore = vi.getTimerCount();

    unmount();

    expect(timersBefore).toBeGreaterThan(0);
    expect(vi.getTimerCount()).toBe(0);
  });
});
