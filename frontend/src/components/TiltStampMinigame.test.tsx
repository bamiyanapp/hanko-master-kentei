/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TiltStampMinigame from './TiltStampMinigame';
import type { Rule } from '@/types/scenario';

// DragDropStampMinigame.test.tsxと同じ方針: jsdomを使わず、useStateをモック
// してReact要素ツリーを直接走査する（本コンポーネントの状態順は
// dragging, startX, tiltDeg, resultの4つ）。
let stateValues: any[] = [];
let stateSetters: any[] = [];
let useStateCallCount = 0;

vi.mock('react', async () => {
  const actual = await vi.importActual<typeof import('react')>('react');
  return {
    ...actual,
    useState: (initialValue: any) => {
      const index = useStateCallCount;
      useStateCallCount++;
      if (stateValues[index] === undefined) {
        stateValues[index] = initialValue;
      }
      const setter = (newValue: any) => {
        if (typeof newValue === 'function') {
          stateValues[index] = newValue(stateValues[index]);
        } else {
          stateValues[index] = newValue;
        }
        stateSetters[index](newValue);
      };
      return [stateValues[index], setter];
    },
  };
});

function findByRole(element: any, role: string): any {
  if (!element) return undefined;
  if (element.props && element.props.role === role) return element;
  if (element.props && element.props.children) {
    const children = Array.isArray(element.props.children)
      ? element.props.children
      : [element.props.children];
    for (const child of children) {
      const found = findByRole(child, role);
      if (found) return found;
    }
  }
  return undefined;
}

function findAllButtons(element: any, acc: any[] = []): any[] {
  if (!element) return acc;
  if (element.type === 'button') acc.push(element);
  if (element.props && element.props.children) {
    const children = Array.isArray(element.props.children)
      ? element.props.children
      : [element.props.children];
    for (const child of children) {
      findAllButtons(child, acc);
    }
  }
  return acc;
}

// ドラッグ操作を受け付ける最外周のdiv（onMouseMove等を持つ）を取得するヘルパー
function findDragArea(element: any): any {
  if (!element) return undefined;
  if (element.props && typeof element.props.onMouseMove === 'function') return element;
  if (element.props && element.props.children) {
    const children = Array.isArray(element.props.children)
      ? element.props.children
      : [element.props.children];
    for (const child of children) {
      const found = findDragArea(child);
      if (found) return found;
    }
  }
  return undefined;
}

const rule: Rule = {
  id: 'test-tilt',
  description: 'テスト用傾きルール',
  type: 'tilt',
  difficulty: 2,
  target: 15,
  tolerance: 5,
};

describe('TiltStampMinigame', () => {
  beforeEach(() => {
    useStateCallCount = 0;
    stateValues = [];
    stateSetters = [vi.fn(), vi.fn(), vi.fn(), vi.fn()]; // dragging, startX, tiltDeg, result
  });

  it('確定前はドラッグ開始（onMouseDown）でdragging=true・startXが設定される', () => {
    stateValues = [false, null, 0, null];
    useStateCallCount = 0;
    const result = TiltStampMinigame({ rule, onComplete: vi.fn() }) as any;

    const stamp = findByRole(result, 'button');
    expect(stamp).toBeDefined();
    stamp.props.onMouseDown({ clientX: 100 });

    expect(stateSetters[0]).toHaveBeenCalledWith(true); // setDragging(true)
    expect(stateSetters[1]).toHaveBeenCalledWith(100); // setStartX(100)
  });

  it('確定済み（result有り）の場合はドラッグ開始しても何も起きない', () => {
    stateValues = [false, null, 15, { actual: 15, score: 'excellent' }];
    useStateCallCount = 0;
    const result = TiltStampMinigame({ rule, onComplete: vi.fn() }) as any;

    const stamp = findByRole(result, 'button');
    stamp.props.onMouseDown({ clientX: 100 });
    expect(stateSetters[0]).not.toHaveBeenCalled();
  });

  it('ドラッグ中の移動でtiltDegが更新される（1pxあたり0.5度）', () => {
    stateValues = [true, 100, 0, null];
    useStateCallCount = 0;
    const result = TiltStampMinigame({ rule, onComplete: vi.fn() }) as any;

    const dragArea = findDragArea(result);
    expect(dragArea).toBeDefined();
    dragArea.props.onMouseMove({ clientX: 130 }); // 30px右 = 15度

    expect(stateSetters[2]).toHaveBeenCalledWith(15);
  });

  it('傾きは±90度でクランプされる', () => {
    stateValues = [true, 0, 0, null];
    useStateCallCount = 0;
    const result = TiltStampMinigame({ rule, onComplete: vi.fn() }) as any;

    const dragArea = findDragArea(result);
    dragArea.props.onMouseMove({ clientX: 1000 });

    expect(stateSetters[2]).toHaveBeenCalledWith(90);
  });

  it('dragging=falseの間は移動しても何も起きない', () => {
    stateValues = [false, null, 0, null];
    useStateCallCount = 0;
    const result = TiltStampMinigame({ rule, onComplete: vi.fn() }) as any;

    const dragArea = findDragArea(result);
    dragArea.props.onMouseMove({ clientX: 130 });
    expect(stateSetters[2]).not.toHaveBeenCalled();
  });

  it('「捺印する」ボタンで採点しonCompleteが呼ばれる（目標ちょうどでexcellent）', () => {
    stateValues = [false, null, 15, null]; // tiltDeg=15 = target=15ちょうど
    useStateCallCount = 0;
    const onComplete = vi.fn();
    const result = TiltStampMinigame({ rule, onComplete }) as any;

    const [confirmButton] = findAllButtons(result);
    confirmButton.props.onClick();

    expect(stateSetters[3]).toHaveBeenCalledWith({ actual: 15, score: 'excellent' });
    expect(onComplete).toHaveBeenCalledWith({ actual: 15, score: 'excellent' });
  });

  it('目標から大きく外れて確定するとfailでonCompleteが呼ばれる', () => {
    stateValues = [false, null, 80, null];
    useStateCallCount = 0;
    const onComplete = vi.fn();
    const result = TiltStampMinigame({ rule, onComplete }) as any;

    const [confirmButton] = findAllButtons(result);
    confirmButton.props.onClick();

    expect(onComplete).toHaveBeenCalledWith({ actual: 80, score: 'fail' });
  });

  it('ドラッグ終了（onMouseUp）でdragging=false・startX=nullになる', () => {
    stateValues = [true, 100, 15, null];
    useStateCallCount = 0;
    const result = TiltStampMinigame({ rule, onComplete: vi.fn() }) as any;

    const dragArea = findDragArea(result);
    dragArea.props.onMouseUp();

    expect(stateSetters[0]).toHaveBeenCalledWith(false); // setDragging(false)
    expect(stateSetters[1]).toHaveBeenCalledWith(null); // setStartX(null)
  });

  it('dragging=falseの状態でonMouseUpが呼ばれても何も起きない', () => {
    stateValues = [false, null, 0, null];
    useStateCallCount = 0;
    const result = TiltStampMinigame({ rule, onComplete: vi.fn() }) as any;

    const dragArea = findDragArea(result);
    dragArea.props.onMouseUp();
    expect(stateSetters[0]).not.toHaveBeenCalled();
  });

  it('タッチ操作（onTouchStart/onTouchMove）でも同様に傾きが更新される', () => {
    stateValues = [true, 100, 0, null];
    useStateCallCount = 0;
    const result = TiltStampMinigame({ rule, onComplete: vi.fn() }) as any;

    const stamp = findByRole(result, 'button');
    stamp.props.onTouchStart({ touches: [{ clientX: 100 }] });
    expect(stateSetters[1]).toHaveBeenCalledWith(100); // setStartX(100)

    const dragArea = findDragArea(result);
    dragArea.props.onTouchMove({ touches: [{ clientX: 130 }] });
    expect(stateSetters[2]).toHaveBeenCalledWith(15);

    dragArea.props.onTouchEnd();
    expect(stateSetters[0]).toHaveBeenCalledWith(false);
  });

  it('確定済み（result有り）の場合は「捺印する」ボタンが無効化される', () => {
    stateValues = [false, null, 15, { actual: 15, score: 'excellent' }];
    useStateCallCount = 0;
    const result = TiltStampMinigame({ rule, onComplete: vi.fn() }) as any;

    const [confirmButton] = findAllButtons(result);
    expect(confirmButton.props.disabled).toBe(true);
  });
});
