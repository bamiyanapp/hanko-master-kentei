/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import EndingSequence from './EndingSequence';

// page.test.tsx等と同じ方針: jsdomを使わず、useStateをモックしてReact要素
// ツリーを直接走査する。
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

function getElementText(element: any): string {
  if (!element) return '';
  if (typeof element === 'string') return element;
  if (typeof element === 'number') return String(element);
  if (Array.isArray(element)) return element.map(getElementText).join('');
  if (element.props && element.props.children) return getElementText(element.props.children);
  return '';
}

describe('EndingSequence', () => {
  beforeEach(() => {
    useStateCallCount = 0;
    stateValues = [];
    stateSetters = [vi.fn()]; // stepIndex
  });

  it('1コマ目は「認定されました」の文言を表示する', () => {
    stateValues = [0];
    useStateCallCount = 0;
    const result = EndingSequence({ onFinish: vi.fn() }) as any;

    expect(getElementText(result)).toContain('認定されました');
    expect(getElementText(result)).toContain('タップして次へ');
  });

  it('クリックするとstepIndexが進む', () => {
    stateValues = [0];
    useStateCallCount = 0;
    const result = EndingSequence({ onFinish: vi.fn() }) as any;

    result.props.onClick();
    expect(stateSetters[0]).toHaveBeenCalledWith(1);
  });

  it('暗転コマ（1コマ目）はテキスト・タップ案内を表示しない', () => {
    stateValues = [1];
    useStateCallCount = 0;
    const result = EndingSequence({ onFinish: vi.fn() }) as any;

    expect(getElementText(result)).toBe('');
    expect(result.props.className).toContain('bg-black');
  });

  it('電子承認システム導入のコマを順番に表示する', () => {
    stateValues = [2];
    useStateCallCount = 0;
    const result = EndingSequence({ onFinish: vi.fn() }) as any;
    expect(getElementText(result)).toContain('電子承認システム');

    stateValues = [3];
    useStateCallCount = 0;
    const result2 = EndingSequence({ onFinish: vi.fn() }) as any;
    expect(getElementText(result2)).toContain('押印は原則廃止');

    stateValues = [4];
    useStateCallCount = 0;
    const result3 = EndingSequence({ onFinish: vi.fn() }) as any;
    expect(getElementText(result3)).toContain('無駄ではありませんでした');
  });

  it('全コマ終了後はGAME CLEAR画面を表示し、ボタンでonFinishが呼ばれる', () => {
    stateValues = [5];
    useStateCallCount = 0;
    const onFinish = vi.fn();
    const result = EndingSequence({ onFinish }) as any;

    expect(getElementText(result)).toContain('GAME CLEAR');
    expect(getElementText(result)).toContain('トップ画面へ戻る');

    // main > button
    const button = result.props.children[1];
    button.props.onClick();
    expect(onFinish).toHaveBeenCalledTimes(1);
  });
});
