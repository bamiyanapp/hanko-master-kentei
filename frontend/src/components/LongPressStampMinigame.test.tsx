/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import LongPressStampMinigame, { describePressureFeedback } from './LongPressStampMinigame';
import type { Rule } from '@/types/scenario';

// page.test.tsx等と同じ方針: jsdomを使わず、useState/useEffectをモックして
// React要素ツリーを直接走査する（本コンポーネントの状態順は
// pressing, pressStartTime, pressElapsedMs, resultの4つ）。
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
  id: 'test-pressure',
  description: 'テスト用長押しルール',
  type: 'pressure',
  difficulty: 1,
  target: 1,
  tolerance: 0.4,
};

describe('LongPressStampMinigame', () => {
  beforeEach(() => {
    useStateCallCount = 0;
    stateValues = [];
    stateSetters = [vi.fn(), vi.fn(), vi.fn(), vi.fn()]; // pressing, pressStartTime, pressElapsedMs, result
    registeredEffects = [];
  });

  it('未押下・未確定の場合はボタンが有効', () => {
    stateValues = [false, null, 0, null];
    useStateCallCount = 0;
    const result = LongPressStampMinigame({ rule, onComplete: vi.fn() }) as any;

    const [button] = findAllButtons(result);
    expect(button.props.disabled).toBe(false);
  });

  it('押下開始でonMouseDownがpressing=trueにし、開始時刻・経過時間を初期化する', () => {
    stateValues = [false, null, 0, null];
    useStateCallCount = 0;
    const result = LongPressStampMinigame({ rule, onComplete: vi.fn() }) as any;

    const [button] = findAllButtons(result);
    button.props.onMouseDown();
    expect(stateSetters[1]).toHaveBeenCalled(); // setPressStartTime(Date.now())
    expect(stateSetters[2]).toHaveBeenCalledWith(0); // setPressElapsedMs(0)
    expect(stateSetters[0]).toHaveBeenCalledWith(true); // setPressing(true)
  });

  it('確定済み（result有り）の場合はボタンが無効化され、押下開始しても何も起きない', () => {
    stateValues = [false, null, 0, { actual: 1, score: 'excellent' }];
    useStateCallCount = 0;
    const result = LongPressStampMinigame({ rule, onComplete: vi.fn() }) as any;

    const [button] = findAllButtons(result);
    expect(button.props.disabled).toBe(true);

    button.props.onMouseDown();
    expect(stateSetters[0]).not.toHaveBeenCalled();
  });

  it('押下→離すの一連の操作でonCompleteが呼ばれ、目標時間に近ければexcellent', () => {
    const start = 1_000_000;
    vi.spyOn(Date, 'now').mockReturnValueOnce(start).mockReturnValueOnce(start + 1000);

    stateValues = [false, null, 0, null];
    useStateCallCount = 0;
    const onComplete = vi.fn();
    let result = LongPressStampMinigame({ rule, onComplete }) as any;
    let [button] = findAllButtons(result);
    button.props.onMouseDown(); // pressStartTime = start（モックのsetterがstateValuesへ即時反映する）

    useStateCallCount = 0;
    result = LongPressStampMinigame({ rule, onComplete }) as any;
    [button] = findAllButtons(result);
    button.props.onMouseUp(); // Date.now() = start + 1000 -> duration 1.0秒

    expect(onComplete).toHaveBeenCalledWith({ actual: 1, score: 'excellent' });

    vi.restoreAllMocks();
  });

  it('pressing=falseの状態でonMouseUpが呼ばれても何も起きない（未押下からの離しは無視）', () => {
    stateValues = [false, null, 0, null];
    useStateCallCount = 0;
    const result = LongPressStampMinigame({ rule, onComplete: vi.fn() }) as any;

    const [button] = findAllButtons(result);
    button.props.onMouseUp();
    expect(stateSetters[3]).not.toHaveBeenCalled();
  });

  it('回転印同様、pressing=falseの間はタイマーを設定しない', () => {
    stateValues = [false, null, 0, null];
    useStateCallCount = 0;
    LongPressStampMinigame({ rule, onComplete: vi.fn() });

    expect(registeredEffects.length).toBe(1);
    const cleanup = registeredEffects[0]();
    expect(cleanup).toBeUndefined();
  });

  it('pressing=trueの間はタイマーがpressElapsedMsを更新する', () => {
    vi.useFakeTimers();
    try {
      stateValues = [true, 1_000_000, 0, null];
      useStateCallCount = 0;
      LongPressStampMinigame({ rule, onComplete: vi.fn() });

      expect(registeredEffects.length).toBe(1);
      const cleanup = registeredEffects[0]();
      expect(typeof cleanup).toBe('function');

      vi.advanceTimersByTime(100);
      expect(stateSetters[2]).toHaveBeenCalled();

      if (typeof cleanup === 'function') cleanup();
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('describePressureFeedback', () => {
  const rule: Rule = {
    id: 'r1',
    description: 'test',
    type: 'pressure',
    difficulty: 1,
    target: 1,
    tolerance: 0.4,
  };

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
