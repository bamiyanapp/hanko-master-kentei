import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LongPressStampMinigame, { describePressureFeedback } from './LongPressStampMinigame';
import type { Rule } from '@/types/scenario';

// 目標1秒・許容差0.4秒: 差0.2秒以内=excellent、0.4秒以内=good、それ以外=fail
const rule: Rule = {
  id: 'test-pressure',
  description: 'テスト用長押しルール',
  type: 'pressure',
  difficulty: 1,
  target: 1,
  tolerance: 0.4,
};

function setup() {
  const onComplete = vi.fn();
  const user = userEvent.setup();
  render(<LongPressStampMinigame rule={rule} onComplete={onComplete} />);
  return { user, onComplete, button: screen.getByRole('button', { name: '押し続ける' }) };
}

function advance(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

// 印影の濃さ（opacity）を読む
function stampOpacity(): number {
  const style = screen.getByText('鈴木').parentElement?.getAttribute('style') ?? '';
  const match = /opacity:\s*([\d.]+)/.exec(style);
  return Number(match?.[1]);
}

describe('LongPressStampMinigame', () => {
  beforeEach(() => {
    // setTimeoutまで偽装するとuserEvent内部の待機が進まず固まるため、本コンポーネントが
    // 使うsetInterval系と、押下時間の計測に使うDateだけを偽装する
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'Date'] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('押す前はボタンが有効で、ルールの説明文と最も薄い印影を表示する', () => {
    const { button } = setup();

    expect(button).toBeEnabled();
    expect(screen.getByText('テスト用長押しルール')).toBeInTheDocument();
    expect(stampOpacity()).toBeCloseTo(0.2);
  });

  it('押している間、時間に応じて印影が濃くなり、上限（1）で頭打ちになる', async () => {
    const { user, button } = setup();

    await user.pointer({ keys: '[MouseLeft>]', target: button });
    advance(1000);
    expect(stampOpacity()).toBeCloseTo(0.6); // 0.2 + (1000/2000) x 0.8

    advance(3000);
    expect(stampOpacity()).toBe(1);
  });

  it('目標の時間（1秒）ちょうどで離すとexcellentでonCompleteが1回呼ばれ、ボタンが無効になる', async () => {
    const { user, onComplete, button } = setup();

    await user.pointer({ keys: '[MouseLeft>]', target: button });
    advance(1000);
    await user.pointer({ keys: '[/MouseLeft]', target: button });

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith({ actual: 1, score: 'excellent' });
    expect(button).toBeDisabled();
    expect(stampOpacity()).toBe(1); // 確定後は濃さを固定
  });

  it.each([
    { ms: 1250, score: 'good' }, // 差0.25秒 > 許容差の半分(0.2)、≦ 許容差0.4
    { ms: 700, score: 'good' }, // 差0.3秒 ≦ 許容差0.4
    { ms: 500, score: 'fail' }, // 差0.5秒 > 許容差0.4（短すぎる）
    { ms: 1500, score: 'fail' }, // 差0.5秒 > 許容差0.4（長すぎる）
  ])('$ms ミリ秒押して離すと「$score」になる', async ({ ms, score }) => {
    const { user, onComplete, button } = setup();

    await user.pointer({ keys: '[MouseLeft>]', target: button });
    advance(ms);
    await user.pointer({ keys: '[/MouseLeft]', target: button });

    expect(onComplete).toHaveBeenCalledWith({ actual: ms / 1000, score });
  });

  it('押してもいない状態で離しても、何も起きない', async () => {
    const { user, onComplete, button } = setup();

    await user.pointer({ keys: '[/MouseLeft]', target: button });

    expect(onComplete).not.toHaveBeenCalled();
    expect(button).toBeEnabled();
  });

  it('押したままボタンの外へマウスが出た場合も、そこで離したものとして確定する', async () => {
    const { user, onComplete, button } = setup();

    await user.pointer({ keys: '[MouseLeft>]', target: button });
    advance(1000);
    fireEvent.mouseLeave(button);

    expect(onComplete).toHaveBeenCalledWith({ actual: 1, score: 'excellent' });
  });

  it('タッチ操作（スマートフォン）でも、押して離すと確定する', () => {
    const { onComplete, button } = setup();

    fireEvent.touchStart(button);
    advance(1000);
    fireEvent.touchEnd(button);

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith({ actual: 1, score: 'excellent' });
  });

  it('確定後は、再度押しても記録が増えない', async () => {
    const { user, onComplete, button } = setup();
    await user.pointer({ keys: '[MouseLeft>]', target: button });
    advance(1000);
    await user.pointer({ keys: '[/MouseLeft]', target: button });

    fireEvent.touchStart(button);
    advance(500);
    fireEvent.touchEnd(button);

    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('押している最中にアンマウントされても、タイマーを解除する', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<LongPressStampMinigame rule={rule} onComplete={vi.fn()} />);
    await user.pointer({
      keys: '[MouseLeft>]',
      target: screen.getByRole('button', { name: '押し続ける' }),
    });
    expect(vi.getTimerCount()).toBeGreaterThan(0);

    unmount();

    expect(vi.getTimerCount()).toBe(0);
  });
});

describe('describePressureFeedback', () => {
  it('excellent/goodは「誠意を感じます」', () => {
    expect(describePressureFeedback('excellent', 1, rule)).toBe('誠意を感じます');
    expect(describePressureFeedback('good', 0.7, rule)).toBe('誠意を感じます');
  });

  it('failで目標未満は「軽率です」', () => {
    expect(describePressureFeedback('fail', 0.1, rule)).toBe('軽率です');
  });

  it('failで目標超過は「押しが強すぎます」', () => {
    expect(describePressureFeedback('fail', 3, rule)).toBe('押しが強すぎます');
  });
});
