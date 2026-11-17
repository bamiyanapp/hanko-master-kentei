import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TiltStampMinigame from './TiltStampMinigame';
import type { Rule } from '@/types/scenario';

// 実装の定数: 横に1pxドラッグすると0.5度傾く（上限は左右とも90度）。
// 目標15度・許容差5度 なので 12.5〜17.5度=excellent、10〜20度=good、それ以外=fail
const rule: Rule = {
  id: 'test-tilt',
  description: 'テスト用傾きルール',
  type: 'tilt',
  difficulty: 2,
  target: 15,
  tolerance: 5,
};

function setup() {
  const onComplete = vi.fn();
  const user = userEvent.setup();
  render(<TiltStampMinigame rule={rule} onComplete={onComplete} />);
  const stamp = screen.getByRole('button', { name: '鈴木' });
  return {
    user,
    onComplete,
    stamp,
    area: stamp.parentElement as HTMLElement,
    confirm: screen.getByRole('button', { name: '捺印する' }),
  };
}

type User = ReturnType<typeof userEvent.setup>;

// startXで掴み、endXまでマウスで動かす（離さない）
async function dragHold(user: User, stamp: HTMLElement, startX: number, endX: number) {
  await user.pointer([
    { keys: '[MouseLeft>]', target: stamp, coords: { clientX: startX } },
    { target: stamp, coords: { clientX: endX } },
  ]);
}

// 印影の現在の傾き（度）をtransformから読む
function tiltDeg(stamp: HTMLElement): number {
  const match = /rotate\((-?[\d.]+)deg\)/.exec(stamp.getAttribute('style') ?? '');
  if (!match) throw new Error('印影の傾きを読み取れません');
  return Number(match[1]);
}

describe('TiltStampMinigame', () => {
  it('初期状態は傾き0度で、ルールの説明文と有効な「捺印する」ボタンを表示する', () => {
    const { stamp, confirm } = setup();

    expect(tiltDeg(stamp)).toBe(0);
    expect(screen.getByText('テスト用傾きルール')).toBeInTheDocument();
    expect(confirm).toBeEnabled();
  });

  it.each([
    { dx: 30, deg: 15 },
    { dx: -30, deg: -15 },
    { dx: 400, deg: 90 }, // 右の上限
    { dx: -400, deg: -90 }, // 左の上限
  ])('掴んで横に$dx px動かすと、傾きが $deg 度になる（上限は±90度）', async ({ dx, deg }) => {
    const { user, stamp } = setup();

    await dragHold(user, stamp, 100, 100 + dx);

    expect(tiltDeg(stamp)).toBe(deg);
  });

  it('掴んでいない状態でマウスを動かしても、傾かない', async () => {
    const { user, stamp } = setup();

    await user.pointer([{ target: stamp, coords: { clientX: 100 } }, { target: stamp, coords: { clientX: 160 } }]);

    expect(tiltDeg(stamp)).toBe(0);
  });

  it('マウスを離すとドラッグが終わり、その後に動かしても傾きは変わらない', async () => {
    const { user, stamp } = setup();
    await dragHold(user, stamp, 100, 130);
    await user.pointer({ keys: '[/MouseLeft]' });

    await user.pointer({ target: stamp, coords: { clientX: 300 } });

    expect(tiltDeg(stamp)).toBe(15);
  });

  it('掴んだままエリアの外へマウスが出た場合も、ドラッグが終わる', async () => {
    const { user, stamp, area } = setup();
    await dragHold(user, stamp, 100, 130);

    fireEvent.mouseLeave(area);
    await user.pointer({ target: stamp, coords: { clientX: 300 } });

    expect(tiltDeg(stamp)).toBe(15);
  });

  it('タッチ操作（スマートフォン）でも、掴んで動かして傾けられる', () => {
    const { stamp, area } = setup();

    fireEvent.touchStart(stamp, { touches: [{ clientX: 100 }] });
    fireEvent.touchMove(area, { touches: [{ clientX: 130 }] });
    fireEvent.touchEnd(area);
    fireEvent.touchMove(area, { touches: [{ clientX: 300 }] }); // 離した後は無視される

    expect(tiltDeg(stamp)).toBe(15);
  });

  it('目標の角度（15度）で捺印するとexcellentでonCompleteが1回呼ばれ、ボタンが無効になる', async () => {
    const { user, onComplete, stamp, confirm } = setup();
    await dragHold(user, stamp, 100, 130);
    await user.pointer({ keys: '[/MouseLeft]' });

    await user.click(confirm);

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith({ actual: 15, score: 'excellent' });
    expect(confirm).toBeDisabled();
  });

  it.each([
    { dx: 24, actual: 12, score: 'good' }, // 差3 > 許容差の半分(2.5)、≦ 許容差5
    { dx: 40, actual: 20, score: 'good' }, // 差5（許容差ちょうど）
    { dx: 16, actual: 8, score: 'fail' }, // 差7 > 5
    { dx: 0, actual: 0, score: 'fail' }, // 傾けずに捺印
    { dx: -30, actual: -15, score: 'fail' }, // 逆向きに傾ける
  ])('$actual 度で捺印すると「$score」になる', async ({ dx, actual, score }) => {
    const { user, onComplete, stamp, confirm } = setup();
    if (dx !== 0) {
      await dragHold(user, stamp, 100, 100 + dx);
      await user.pointer({ keys: '[/MouseLeft]' });
    }

    await user.click(confirm);

    expect(onComplete).toHaveBeenCalledWith({ actual, score });
  });

  it('捺印後は、もう一度掴んで動かしても傾きは変わらず、記録も増えない', async () => {
    const { user, onComplete, stamp, confirm } = setup();
    await dragHold(user, stamp, 100, 130);
    await user.pointer({ keys: '[/MouseLeft]' });
    await user.click(confirm);

    await dragHold(user, stamp, 100, 200);
    await user.pointer({ keys: '[/MouseLeft]' });

    expect(tiltDeg(stamp)).toBe(15);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});
