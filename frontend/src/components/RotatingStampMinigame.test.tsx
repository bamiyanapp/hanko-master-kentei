/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import RotatingStampMinigame from './RotatingStampMinigame';
import type { Rule } from '@/types/scenario';

// page.test.tsx・ScenarioSelectionScreen.test.tsxと同じ方針: jsdomを使わず、
// useState/useEffectをモックしてReact要素ツリーを直接走査する。
let stateValues: any[] = [];
let stateSetters: any[] = [];
let useStateCallCount = 0;
let registeredEffects: (() => void | (() => void))[] = [];

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
    useEffect: (callback: () => void | (() => void)) => {
      registeredEffects.push(callback);
    },
  };
});

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

const rule: Rule = {
  id: 'kito-bow-angle',
  description: 'テスト用ルール',
  type: 'angle',
  difficulty: 1,
  target: 90,
  tolerance: 10,
};

describe('RotatingStampMinigame', () => {
  beforeEach(() => {
    useStateCallCount = 0;
    stateValues = [];
    stateSetters = [vi.fn(), vi.fn()]; // angle, stopped
    registeredEffects = [];
  });

  it('停止前は「止める」ボタンが有効で、ルールの説明文を表示する', () => {
    stateValues = [0, false];
    useStateCallCount = 0;
    const onComplete = vi.fn();
    const result = RotatingStampMinigame({ rule, onComplete }) as any;

    const buttons = findAllButtons(result);
    expect(buttons.length).toBe(1);
    expect(buttons[0].props.disabled).toBe(false);
  });

  it('目標角度ちょうどで停止するとexcellentでonCompleteが呼ばれる', () => {
    stateValues = [90, false];
    useStateCallCount = 0;
    const onComplete = vi.fn();
    const result = RotatingStampMinigame({ rule, onComplete }) as any;

    const [stopButton] = findAllButtons(result);
    stopButton.props.onClick();

    expect(stateSetters[1]).toHaveBeenCalledWith(true); // setStopped(true)
    expect(onComplete).toHaveBeenCalledWith({ actual: 90, score: 'excellent' });
  });

  it('目標から大きく外れて停止するとfailでonCompleteが呼ばれる', () => {
    stateValues = [200, false];
    useStateCallCount = 0;
    const onComplete = vi.fn();
    const result = RotatingStampMinigame({ rule, onComplete }) as any;

    const [stopButton] = findAllButtons(result);
    stopButton.props.onClick();

    expect(onComplete).toHaveBeenCalledWith({ actual: 200, score: 'fail' });
  });

  it('停止済み（stopped=true）の場合は「止める」ボタンが無効化される', () => {
    stateValues = [90, true];
    useStateCallCount = 0;
    const result = RotatingStampMinigame({ rule, onComplete: vi.fn() }) as any;

    const [stopButton] = findAllButtons(result);
    expect(stopButton.props.disabled).toBe(true);
  });

  it('回転タイマーが一定間隔で角度を進める（360で折り返す）', () => {
    vi.useFakeTimers();
    try {
      stateValues = [354, false];
      useStateCallCount = 0;
      RotatingStampMinigame({ rule, onComplete: vi.fn() });

      expect(registeredEffects.length).toBe(1);
      const cleanup = registeredEffects[0]();
      expect(typeof cleanup).toBe('function');

      vi.advanceTimersByTime(100);

      expect(stateSetters[0]).toHaveBeenCalledTimes(1);
      const updater = stateSetters[0].mock.calls[0][0];
      expect(typeof updater).toBe('function');
      expect(updater(354)).toBe(0); // (354 + 6) % 360 = 0（折り返し）

      if (typeof cleanup === 'function') cleanup();
    } finally {
      vi.useRealTimers();
    }
  });

  it('停止済み（stopped=true）の場合はタイマーを設定しない', () => {
    stateValues = [90, true];
    useStateCallCount = 0;
    RotatingStampMinigame({ rule, onComplete: vi.fn() });

    expect(registeredEffects.length).toBe(1);
    const cleanup = registeredEffects[0]();
    expect(cleanup).toBeUndefined();
  });
});
