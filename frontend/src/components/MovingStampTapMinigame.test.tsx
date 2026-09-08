/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import MovingStampTapMinigame from './MovingStampTapMinigame';
import type { Rule } from '@/types/scenario';

// RotatingStampMinigame.test.tsxと同じ方針: jsdomを使わず、useState/
// useEffectをモックしてReact要素ツリーを直接走査する（本コンポーネントの
// 状態順は moving({position, direction}), stoppedの2つ）。
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
  id: 'test-moving-tap',
  description: 'テスト用タイミングルール',
  type: 'moving-tap',
  difficulty: 2,
  target: 50,
  tolerance: 10,
};

describe('MovingStampTapMinigame', () => {
  beforeEach(() => {
    useStateCallCount = 0;
    stateValues = [];
    stateSetters = [vi.fn(), vi.fn()]; // moving, stopped
    registeredEffects = [];
  });

  it('停止前は「スタンプ！」ボタンが有効で、ルールの説明文を表示する', () => {
    stateValues = [{ position: 0, direction: 1 }, false];
    useStateCallCount = 0;
    const result = MovingStampTapMinigame({ rule, onComplete: vi.fn() }) as any;

    const buttons = findAllButtons(result);
    expect(buttons.length).toBe(1);
    expect(buttons[0].props.disabled).toBe(false);
  });

  it('目標位置ちょうどでタップするとexcellentでonCompleteが呼ばれる', () => {
    stateValues = [{ position: 50, direction: 1 }, false];
    useStateCallCount = 0;
    const onComplete = vi.fn();
    const result = MovingStampTapMinigame({ rule, onComplete }) as any;

    const [tapButton] = findAllButtons(result);
    tapButton.props.onClick();

    expect(stateSetters[1]).toHaveBeenCalledWith(true); // setStopped(true)
    expect(onComplete).toHaveBeenCalledWith({ actual: 50, score: 'excellent' });
  });

  it('目標から大きく外れた位置でタップするとfailでonCompleteが呼ばれる', () => {
    stateValues = [{ position: 5, direction: 1 }, false];
    useStateCallCount = 0;
    const onComplete = vi.fn();
    const result = MovingStampTapMinigame({ rule, onComplete }) as any;

    const [tapButton] = findAllButtons(result);
    tapButton.props.onClick();

    expect(onComplete).toHaveBeenCalledWith({ actual: 5, score: 'fail' });
  });

  it('停止済み（stopped=true）の場合は「スタンプ！」ボタンが無効化される', () => {
    stateValues = [{ position: 50, direction: 1 }, true];
    useStateCallCount = 0;
    const result = MovingStampTapMinigame({ rule, onComplete: vi.fn() }) as any;

    const [tapButton] = findAllButtons(result);
    expect(tapButton.props.disabled).toBe(true);
  });

  it('移動タイマーが一定間隔で位置を進める', () => {
    vi.useFakeTimers();
    try {
      stateValues = [{ position: 0, direction: 1 }, false];
      useStateCallCount = 0;
      MovingStampTapMinigame({ rule, onComplete: vi.fn() });

      expect(registeredEffects.length).toBe(1);
      const cleanup = registeredEffects[0]();
      expect(typeof cleanup).toBe('function');

      vi.advanceTimersByTime(60);

      expect(stateSetters[0]).toHaveBeenCalledTimes(1);
      const updater = stateSetters[0].mock.calls[0][0];
      expect(typeof updater).toBe('function');
      expect(updater({ position: 0, direction: 1 })).toEqual({ position: 4, direction: 1 });

      if (typeof cleanup === 'function') cleanup();
    } finally {
      vi.useRealTimers();
    }
  });

  it('右端（100）に到達すると移動方向が反転する', () => {
    vi.useFakeTimers();
    try {
      stateValues = [{ position: 98, direction: 1 }, false];
      useStateCallCount = 0;
      MovingStampTapMinigame({ rule, onComplete: vi.fn() });

      registeredEffects[0]();
      vi.advanceTimersByTime(60);
      const fn = stateSetters[0].mock.calls[0][0];
      expect(fn({ position: 98, direction: 1 })).toEqual({ position: 100, direction: -1 });
    } finally {
      vi.useRealTimers();
    }
  });

  it('左端（0）に到達すると移動方向が反転する', () => {
    vi.useFakeTimers();
    try {
      stateValues = [{ position: 2, direction: -1 }, false];
      useStateCallCount = 0;
      MovingStampTapMinigame({ rule, onComplete: vi.fn() });

      registeredEffects[0]();
      vi.advanceTimersByTime(60);
      const fn = stateSetters[0].mock.calls[0][0];
      expect(fn({ position: 2, direction: -1 })).toEqual({ position: 0, direction: 1 });
    } finally {
      vi.useRealTimers();
    }
  });

  it('停止済み（stopped=true）の場合はタイマーを設定しない', () => {
    stateValues = [{ position: 50, direction: 1 }, true];
    useStateCallCount = 0;
    MovingStampTapMinigame({ rule, onComplete: vi.fn() });

    expect(registeredEffects.length).toBe(1);
    const cleanup = registeredEffects[0]();
    expect(cleanup).toBeUndefined();
  });
});
