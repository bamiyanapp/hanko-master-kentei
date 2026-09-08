/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Home, { formatResultHeading, getFlavorMessage } from './page';
import React from 'react';
import ScenarioSelectionScreen from '@/components/ScenarioSelectionScreen';
import RotatingStampMinigame from '@/components/RotatingStampMinigame';
import { scenarios, pcPurchaseScenario } from '@/data/scenarios';
import type { Rule } from '@/types/scenario';

// window オブジェクトのモック
const mockPushState = vi.fn();
const mockLocation = {
  pathname: '/test',
  search: '',
};

global.window = {
  location: mockLocation,
  history: {
    pushState: mockPushState,
  },
} as any;

// グローバルな状態管理（テストごとに初期化）
let stateValues: any[] = [];
let stateSetters: any[] = [];
let useStateCallCount = 0;
let registeredEffects: (() => void)[] = [];

// useState & useEffect のカスタムモック
vi.mock('react', async () => {
  const actual = await vi.importActual<typeof import('react')>('react');
  return {
    ...actual,
    useState: (initialValue: any) => {
      const index = useStateCallCount;
      useStateCallCount++;

      // 初期値の格納
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
    useEffect: (callback: () => void) => {
      registeredEffects.push(callback);
    },
  };
});

// テキスト内容から要素を探すヘルパー
function getElementText(element: any): string {
  if (!element) return '';
  if (typeof element === 'string') return element;
  if (typeof element === 'number') return String(element);
  if (Array.isArray(element)) return element.map(getElementText).join('');
  if (element.props && element.props.children) {
    return getElementText(element.props.children);
  }
  return '';
}

function findByText(element: any, text: string): any {
  if (!element) return undefined;
  if (typeof element === 'string' || typeof element === 'number') return undefined;

  const elementText = getElementText(element);
  if (elementText.includes(text)) {
    if (element.props && element.props.children) {
      if (Array.isArray(element.props.children)) {
        for (const child of element.props.children) {
          const found = findByText(child, text);
          if (found) return found;
        }
      } else {
        const found = findByText(element.props.children, text);
        if (found) return found;
      }
    }
    return element;
  }
  return undefined;
}

// ReactElementツリーを再帰的に走査して、指定したtype（コンポーネント関数）に
// 一致する要素を探すヘルパー
function findByType(element: any, type: any): any {
  if (!element) return undefined;
  if (element.type === type) return element;
  if (element.props && element.props.children) {
    if (Array.isArray(element.props.children)) {
      for (const child of element.props.children) {
        const found = findByType(child, type);
        if (found) return found;
      }
    } else {
      return findByType(element.props.children, type);
    }
  }
  return undefined;
}

const demoRule = pcPurchaseScenario.stages[0].rules[0];

describe('Home Component Integration', () => {
  beforeEach(() => {
    useStateCallCount = 0;
    stateValues = [];
    stateSetters = [
      vi.fn(), // screen
      vi.fn(), // minigameResult
    ];
    registeredEffects = [];
    mockLocation.search = '';
    mockPushState.mockClear();
  });

  it('should render top screen initially and transition to selection screen', () => {
    useStateCallCount = 0;
    const result = Home() as React.ReactElement;
    expect(result.type).toBe('main');

    const rankText = findByText(result, '見習い');
    expect(rankText).toBeDefined();

    const startButton = findByText(result, '検定を受ける');
    expect(startButton).toBeDefined();

    startButton.props.onClick();
    expect(stateSetters[0]).toHaveBeenCalledWith('selection'); // setScreen('selection')
  });

  it('should restore state from URL params in useEffect', () => {
    mockLocation.search = '?screen=game&actual=90&score=excellent';
    useStateCallCount = 0;
    Home();

    registeredEffects.forEach((effect) => effect());

    expect(stateSetters[0]).toHaveBeenCalledWith('game'); // setScreen('game')
    expect(stateSetters[1]).toHaveBeenCalledWith({ actual: 90, score: 'excellent' });
  });

  it('should render ScenarioSelectionScreen with correct props when screen is selection', () => {
    stateValues = ['selection', null];

    useStateCallCount = 0;
    const result = Home() as React.ReactElement<any>;

    expect(result.type).toBe(ScenarioSelectionScreen);
    expect(result.props.scenarios).toBe(scenarios);
    expect(result.props.currentRank).toBe(0);
    expect(result.props.clearedScenarioIds).toEqual([]);

    result.props.onSelect(scenarios[0].id);
    expect(stateSetters[0]).toHaveBeenCalledWith('game'); // setScreen('game')

    result.props.onBack();
    expect(stateSetters[0]).toHaveBeenCalledWith('top'); // setScreen('top')
  });

  it('should render RotatingStampMinigame with the demo rule before a result exists', () => {
    stateValues = ['game', null];

    useStateCallCount = 0;
    const result = Home() as React.ReactElement<any>;

    const minigame = findByType(result, RotatingStampMinigame as any);
    expect(minigame).toBeDefined();
    expect(minigame.props.rule).toBe(demoRule);

    // onCompleteでminigameResultが保存される
    minigame.props.onComplete({ actual: 90, score: 'excellent' });
    expect(stateSetters[1]).toHaveBeenCalledWith({ actual: 90, score: 'excellent' });
  });

  it('should render result state when minigameResult exists (excellent)', () => {
    stateValues = ['game', { actual: 90, score: 'excellent' }];

    useStateCallCount = 0;
    const result = Home() as React.ReactElement;

    const passedText = findByText(result, '合格');
    expect(passedText).toBeDefined();

    const resetButton = findByText(result, 'もう一度調整する');
    expect(resetButton).toBeDefined();
    resetButton.props.onClick();
    expect(stateSetters[1]).toHaveBeenCalledWith(null); // setMinigameResult(null)

    const backButton = findByText(result, '案件選択へ戻る');
    expect(backButton).toBeDefined();
    backButton.props.onClick();
    expect(stateSetters[0]).toHaveBeenCalledWith('selection'); // setScreen('selection')
  });

  it('should render result state when minigameResult exists (fail) and hide the return button', () => {
    stateValues = ['game', { actual: 200, score: 'fail' }];

    useStateCallCount = 0;
    const result = Home() as React.ReactElement;

    const failedText = findByText(result, '差し戻し');
    expect(failedText).toBeDefined();

    const backButton = findByText(result, '案件選択へ戻る');
    expect(backButton).toBeUndefined();
  });

  it('should trigger updateUrl in handleGoToSelection on the game screen header', () => {
    stateValues = ['game', null];
    useStateCallCount = 0;
    const result = Home() as React.ReactElement;

    const backButton = findByText(result, '戻る');
    expect(backButton).toBeDefined();
    backButton.props.onClick();
    expect(stateSetters[0]).toHaveBeenCalledWith('selection');
  });
});

describe('formatResultHeading', () => {
  it('excellentは合格（Excellent）', () => {
    expect(formatResultHeading('excellent')).toContain('合格');
    expect(formatResultHeading('excellent')).toContain('Excellent');
  });

  it('goodは合格（Good）', () => {
    expect(formatResultHeading('good')).toContain('合格');
  });

  it('failは差し戻し', () => {
    expect(formatResultHeading('fail')).toContain('差し戻し');
  });
});

describe('getFlavorMessage', () => {
  const rule: Rule = {
    id: 'r1',
    description: 'test',
    type: 'angle',
    difficulty: 1,
    target: -22.5,
    tolerance: 12.5,
  };

  it('excellentは称賛メッセージ', () => {
    const message = getFlavorMessage({ actual: -22.5, score: 'excellent' }, rule);
    expect(message).toContain('見事');
  });

  it('goodは及第点メッセージ', () => {
    const message = getFlavorMessage({ actual: -30, score: 'good' }, rule);
    expect(message).toContain('及第点');
  });

  it('failで目標より大きい場合は敬意不足メッセージ', () => {
    const message = getFlavorMessage({ actual: 50, score: 'fail' }, rule);
    expect(message).toContain('敬意');
  });

  it('failで目標より小さい場合はやりすぎメッセージ', () => {
    const message = getFlavorMessage({ actual: -90, score: 'fail' }, rule);
    expect(message).toContain('やりすぎ');
  });
});
