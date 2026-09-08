/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import DragDropStampMinigame from './DragDropStampMinigame';
import type { Rule } from '@/types/scenario';

// page.test.tsx等と同じ方針: jsdomを使わず、useState/useEffectをモックして
// React要素ツリーを直接走査する（本コンポーネントの状態順は
// dragging, startY, offsetUnits, resultの4つ）。
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

// ドロップゾーン（onMouseMove等を持つ最外周のdiv）を取得するヘルパー
function findDropZone(element: any): any {
  if (!element) return undefined;
  if (element.props && typeof element.props.onMouseMove === 'function') return element;
  if (element.props && element.props.children) {
    const children = Array.isArray(element.props.children)
      ? element.props.children
      : [element.props.children];
    for (const child of children) {
      const found = findDropZone(child);
      if (found) return found;
    }
  }
  return undefined;
}

const rule: Rule = {
  id: 'test-position',
  description: 'テスト用位置合わせルール',
  type: 'position',
  difficulty: 1,
  target: 1,
  tolerance: 0.5,
};

describe('DragDropStampMinigame', () => {
  beforeEach(() => {
    useStateCallCount = 0;
    stateValues = [];
    stateSetters = [vi.fn(), vi.fn(), vi.fn(), vi.fn()]; // dragging, startY, offsetUnits, result
  });

  it('確定前はドラッグ開始（onMouseDown）でdragging=true・startYが設定される', () => {
    stateValues = [false, null, 0, null];
    useStateCallCount = 0;
    const result = DragDropStampMinigame({ rule, onComplete: vi.fn() }) as any;

    const stamp = findByRole(result, 'button');
    expect(stamp).toBeDefined();
    stamp.props.onMouseDown({ clientY: 100 });

    expect(stateSetters[0]).toHaveBeenCalledWith(true); // setDragging(true)
    expect(stateSetters[1]).toHaveBeenCalledWith(100); // setStartY(100)
  });

  it('確定済み（result有り）の場合はドラッグ開始しても何も起きない', () => {
    stateValues = [false, null, 0, { actual: 1, score: 'excellent' }];
    useStateCallCount = 0;
    const result = DragDropStampMinigame({ rule, onComplete: vi.fn() }) as any;

    const stamp = findByRole(result, 'button');
    stamp.props.onMouseDown({ clientY: 100 });
    expect(stateSetters[0]).not.toHaveBeenCalled();
  });

  it('ドラッグ中の移動でoffsetUnitsが更新される（40pxあたり1単位）', () => {
    stateValues = [true, 100, 0, null];
    useStateCallCount = 0;
    const result = DragDropStampMinigame({ rule, onComplete: vi.fn() }) as any;

    const dropZone = findDropZone(result);
    expect(dropZone).toBeDefined();
    dropZone.props.onMouseMove({ clientY: 140 }); // 40px下 = 1単位

    expect(stateSetters[2]).toHaveBeenCalledWith(1);
  });

  it('dragging=falseの間は移動しても何も起きない', () => {
    stateValues = [false, null, 0, null];
    useStateCallCount = 0;
    const result = DragDropStampMinigame({ rule, onComplete: vi.fn() }) as any;

    const dropZone = findDropZone(result);
    dropZone.props.onMouseMove({ clientY: 140 });
    expect(stateSetters[2]).not.toHaveBeenCalled();
  });

  it('ドラッグ終了（onMouseUp）で採点しonCompleteが呼ばれる（目標ちょうどでexcellent）', () => {
    stateValues = [true, 100, 1, null]; // offsetUnits=1 = target=1ちょうど
    useStateCallCount = 0;
    const onComplete = vi.fn();
    const result = DragDropStampMinigame({ rule, onComplete }) as any;

    const dropZone = findDropZone(result);
    dropZone.props.onMouseUp();

    expect(stateSetters[0]).toHaveBeenCalledWith(false); // setDragging(false)
    expect(onComplete).toHaveBeenCalledWith({ actual: 1, score: 'excellent' });
  });

  it('dragging=falseの状態でonMouseUpが呼ばれても何も起きない', () => {
    stateValues = [false, null, 0, null];
    useStateCallCount = 0;
    const onComplete = vi.fn();
    const result = DragDropStampMinigame({ rule, onComplete }) as any;

    const dropZone = findDropZone(result);
    dropZone.props.onMouseUp();
    expect(onComplete).not.toHaveBeenCalled();
  });

  it('目標から大きく外れて確定するとfailでonCompleteが呼ばれる', () => {
    stateValues = [true, 100, 5, null];
    useStateCallCount = 0;
    const onComplete = vi.fn();
    const result = DragDropStampMinigame({ rule, onComplete }) as any;

    const dropZone = findDropZone(result);
    dropZone.props.onMouseUp();

    expect(onComplete).toHaveBeenCalledWith({ actual: 5, score: 'fail' });
  });

  it('referenceLabelを指定すると基準マーカーの表示に反映される（相対位置制約の想定）', () => {
    stateValues = [false, null, 0, null];
    useStateCallCount = 0;
    const result = DragDropStampMinigame({
      rule,
      referenceLabel: '課長印',
      onComplete: vi.fn(),
    }) as any;

    function collectText(element: any): string {
      if (!element) return '';
      if (typeof element === 'string' || typeof element === 'number') return String(element);
      if (Array.isArray(element)) return element.map(collectText).join('');
      if (element.props && element.props.children) return collectText(element.props.children);
      return '';
    }

    expect(collectText(result)).toContain('課長印');
  });
});
