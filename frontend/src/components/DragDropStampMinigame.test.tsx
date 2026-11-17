import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DragDropStampMinigame from './DragDropStampMinigame';
import type { Rule } from '@/types/scenario';

// 実装の定数: 40px = 1単位。目標1・許容差0.5 なので
// 0.75〜1.25単位(30〜50px)=excellent、0.5〜1.5単位(20〜60px)=good、それ以外=fail
const PIXELS_PER_UNIT = 40;

const rule: Rule = {
  id: 'test-position',
  description: 'テスト用位置合わせルール',
  type: 'position',
  difficulty: 1,
  target: 1,
  tolerance: 0.5,
};

function setup(props: { referenceLabel?: string } = {}) {
  const onComplete = vi.fn();
  const user = userEvent.setup();
  render(<DragDropStampMinigame rule={rule} onComplete={onComplete} {...props} />);
  const stamp = screen.getByRole('button', { name: '鈴木' });
  return { user, onComplete, stamp, area: stamp.parentElement as HTMLElement };
}

type User = ReturnType<typeof userEvent.setup>;

// startYで掴み、endYまでマウスで動かして離す
async function dragWithMouse(user: User, stamp: HTMLElement, startY: number, endY: number) {
  await user.pointer([
    { keys: '[MouseLeft>]', target: stamp, coords: { clientY: startY } },
    { target: stamp, coords: { clientY: endY } },
    { keys: '[/MouseLeft]' },
  ]);
}

// 印影の縦位置（style）から動いたpx数を読む
// （jsdomはcalc式の項の順序を正規化して出力するため、形式を決め打ちせずtop宣言内のpx値を読む。
// 本テストは0以上の位置のみ検証する）
function stampOffsetPx(stamp: HTMLElement): number {
  const top = /top:\s*([^;]+)/.exec(stamp.getAttribute('style') ?? '')?.[1];
  if (top === undefined) throw new Error('印影のtopが設定されていません');
  const px = /(\d+(?:\.\d+)?)px/.exec(top);
  return px ? Number(px[1]) : 0;
}

describe('DragDropStampMinigame', () => {
  it('ルールの説明文と、既定の基準マーカー「目標位置」を表示する', () => {
    setup();

    expect(screen.getByText('テスト用位置合わせルール')).toBeInTheDocument();
    expect(screen.getByText('目標位置')).toBeInTheDocument();
  });

  it('referenceLabelを指定すると基準マーカーの表示に反映される（相対位置制約）', () => {
    setup({ referenceLabel: '課長印' });

    expect(screen.getByText('課長印')).toBeInTheDocument();
    expect(screen.queryByText('目標位置')).not.toBeInTheDocument();
  });

  it('ドラッグ中は、動かした距離だけ印影が追従する（40pxあたり1単位）', async () => {
    const { user, stamp } = setup();
    expect(stampOffsetPx(stamp)).toBe(0);

    await user.pointer([
      { keys: '[MouseLeft>]', target: stamp, coords: { clientY: 100 } },
      { target: stamp, coords: { clientY: 140 } },
    ]);

    expect(stampOffsetPx(stamp)).toBe(40);
  });

  it('目標の距離ちょうど（1単位=40px）で離すとexcellentでonCompleteが1回呼ばれる', async () => {
    const { user, onComplete, stamp } = setup();

    await dragWithMouse(user, stamp, 100, 100 + PIXELS_PER_UNIT);

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith({ actual: 1, score: 'excellent' });
  });

  it.each([
    { px: 24, actual: 0.6, score: 'good' }, // 差0.4: 許容差の半分(0.25)超、許容差(0.5)以内
    { px: 56, actual: 1.4, score: 'good' }, // 目標より行き過ぎ
    { px: 0, actual: 0, score: 'fail' }, // 動かさずに離す（差1 > 0.5）
    { px: 80, actual: 2, score: 'fail' }, // 動かし過ぎ
    { px: -40, actual: -1, score: 'fail' }, // 逆方向（上）へ動かす
  ])('$px px動かして離すと「$score」になる', async ({ px, actual, score }) => {
    const { user, onComplete, stamp } = setup();

    await dragWithMouse(user, stamp, 100, 100 + px);

    expect(onComplete).toHaveBeenCalledWith({ actual, score });
  });

  it('掴んでいない状態でマウスを動かしても、印影は動かず確定もしない', async () => {
    const { user, onComplete, stamp } = setup();

    await user.pointer([{ target: stamp, coords: { clientY: 100 } }, { target: stamp, coords: { clientY: 160 } }]);

    expect(stampOffsetPx(stamp)).toBe(0);
    expect(onComplete).not.toHaveBeenCalled();
  });

  it('掴んでいない状態で離しても、何も起きない', async () => {
    const { user, onComplete, stamp } = setup();

    await user.pointer({ keys: '[/MouseLeft]', target: stamp });

    expect(onComplete).not.toHaveBeenCalled();
  });

  it('掴んだままエリアの外へマウスが出た場合も、そこで離したものとして確定する', async () => {
    const { user, onComplete, stamp, area } = setup();
    await user.pointer([
      { keys: '[MouseLeft>]', target: stamp, coords: { clientY: 100 } },
      { target: stamp, coords: { clientY: 140 } },
    ]);

    fireEvent.mouseLeave(area);

    expect(onComplete).toHaveBeenCalledWith({ actual: 1, score: 'excellent' });
  });

  it('タッチ操作（スマートフォン）でも、掴んで動かして離すと確定する', () => {
    const { onComplete, stamp, area } = setup();

    fireEvent.touchStart(stamp, { touches: [{ clientY: 100 }] });
    fireEvent.touchMove(area, { touches: [{ clientY: 140 }] });
    fireEvent.touchEnd(area);

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith({ actual: 1, score: 'excellent' });
  });

  it('確定後は、もう一度掴んで動かしても印影は動かず、記録も増えない', async () => {
    const { user, onComplete, stamp } = setup();
    await dragWithMouse(user, stamp, 100, 140);
    const offsetAfterComplete = stampOffsetPx(stamp);

    await dragWithMouse(user, stamp, 100, 220);

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(stampOffsetPx(stamp)).toBe(offsetAfterComplete);
  });
});
