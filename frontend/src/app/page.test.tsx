/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Home from './page';
import React from 'react';
import ScenarioSelectionScreen from '@/components/ScenarioSelectionScreen';
import ApplicationStageFlow from '@/components/ApplicationStageFlow';
import { scenarios, pcPurchaseScenario } from '@/data/scenarios';

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

describe('Home Component Integration', () => {
  beforeEach(() => {
    useStateCallCount = 0;
    stateValues = [];
    stateSetters = [
      vi.fn(), // screen
      vi.fn(), // selectedScenario
      vi.fn(), // scenarioResult
      vi.fn(), // progress
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

  it('should restore selection screen from URL params', () => {
    mockLocation.search = '?screen=selection';
    useStateCallCount = 0;
    Home();

    registeredEffects.forEach((effect) => effect());

    expect(stateSetters[0]).toHaveBeenCalledWith('selection');
  });

  it('should restore game screen with the referenced scenario from URL params', () => {
    mockLocation.search = `?screen=game&scenario=${pcPurchaseScenario.id}`;
    useStateCallCount = 0;
    Home();

    registeredEffects.forEach((effect) => effect());

    expect(stateSetters[1]).toHaveBeenCalledWith(pcPurchaseScenario); // setSelectedScenario
    expect(stateSetters[0]).toHaveBeenCalledWith('game'); // setScreen('game')
  });

  it('should not restore game screen when the referenced scenario id does not exist', () => {
    mockLocation.search = '?screen=game&scenario=not-exist';
    useStateCallCount = 0;
    Home();

    registeredEffects.forEach((effect) => effect());

    expect(stateSetters[0]).not.toHaveBeenCalled();
    expect(stateSetters[1]).not.toHaveBeenCalled();
  });

  it('should render ScenarioSelectionScreen with correct props when screen is selection', () => {
    stateValues = ['selection', null, null, { rankIndex: 0, points: 0, clearedScenarioIds: [] }];

    useStateCallCount = 0;
    const result = Home() as React.ReactElement<any>;

    expect(result.type).toBe(ScenarioSelectionScreen);
    expect(result.props.scenarios).toBe(scenarios);
    expect(result.props.currentRank).toBe(0);
    expect(result.props.clearedScenarioIds).toEqual([]);

    result.props.onSelect(scenarios[0].id);
    expect(stateSetters[1]).toHaveBeenCalledWith(scenarios[0]); // setSelectedScenario
    expect(stateSetters[0]).toHaveBeenCalledWith('game'); // setScreen('game')

    result.props.onBack();
    expect(stateSetters[0]).toHaveBeenCalledWith('top'); // setScreen('top')
  });

  it('should render ApplicationStageFlow with the selected scenario when screen is game', () => {
    stateValues = ['game', pcPurchaseScenario, null, { rankIndex: 0, points: 0, clearedScenarioIds: [] }];

    useStateCallCount = 0;
    const result = Home() as React.ReactElement<any>;

    const flow = findByType(result, ApplicationStageFlow as any);
    expect(flow).toBeDefined();
    expect(flow.props.scenario).toBe(pcPurchaseScenario);

    // onCompleteでresult画面へ遷移する
    const judgement = {
      overallScore: 90,
      metricScores: { 格式: null, 礼節: 90, 誠意: null, 精密性: null },
      passed: true,
      comment: 'おおむね問題ありません。',
    };
    flow.props.onComplete(judgement);
    expect(stateSetters[2]).toHaveBeenCalledWith(judgement); // setScenarioResult
    expect(stateSetters[0]).toHaveBeenCalledWith('result'); // setScreen('result')
    // 合格時はrecordScenarioClearを通じてprogressも更新される
    // （overallScore=90 -> 基礎10点+round(90/10)=9点 = 19点）
    expect(stateSetters[3]).toHaveBeenCalledWith({
      rankIndex: 1,
      points: 19,
      clearedScenarioIds: [pcPurchaseScenario.id],
    });
  });

  it('should not record progress when the scenario is not passed', () => {
    stateValues = ['game', pcPurchaseScenario, null, { rankIndex: 0, points: 0, clearedScenarioIds: [] }];

    useStateCallCount = 0;
    const result = Home() as React.ReactElement<any>;

    const flow = findByType(result, ApplicationStageFlow as any);
    const judgement = {
      overallScore: 30,
      metricScores: { 格式: null, 礼節: 30, 誠意: null, 精密性: null },
      passed: false,
      comment: '残念ながら基準を満たしていません。再提出をお願いします。',
    };
    flow.props.onComplete(judgement);

    expect(stateSetters[3]).not.toHaveBeenCalled(); // setProgressは呼ばれない
  });

  it('should render the result screen with metric scores and pass state', () => {
    const judgement = {
      overallScore: 90,
      metricScores: { 格式: null, 礼節: 90, 誠意: null, 精密性: 80 },
      passed: true,
      comment: 'おおむね問題ありません。',
    };
    stateValues = ['result', pcPurchaseScenario, judgement, { rankIndex: 0, points: 0, clearedScenarioIds: [] }];

    useStateCallCount = 0;
    const result = Home() as React.ReactElement;

    expect(findByText(result, '承認されました')).toBeDefined();
    expect(findByText(result, 'おおむね問題ありません。')).toBeDefined();

    const backButton = findByText(result, '案件選択へ戻る');
    expect(backButton).toBeDefined();
    backButton.props.onClick();
    expect(stateSetters[0]).toHaveBeenCalledWith('selection'); // setScreen('selection')
  });

  it('should render the result screen with a failure heading when not passed', () => {
    const judgement = {
      overallScore: 30,
      metricScores: { 格式: null, 礼節: 30, 誠意: null, 精密性: null },
      passed: false,
      comment: '残念ながら基準を満たしていません。再提出をお願いします。',
    };
    stateValues = ['result', pcPurchaseScenario, judgement, { rankIndex: 0, points: 0, clearedScenarioIds: [] }];

    useStateCallCount = 0;
    const result = Home() as React.ReactElement;

    expect(findByText(result, '差し戻されました')).toBeDefined();
  });
});
