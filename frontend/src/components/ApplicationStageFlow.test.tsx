/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ApplicationStageFlow, { CustomRuleStub } from './ApplicationStageFlow';
import RotatingStampMinigame from './RotatingStampMinigame';
import LongPressStampMinigame from './LongPressStampMinigame';
import DragDropStampMinigame from './DragDropStampMinigame';
import type { Scenario } from '@/types/scenario';

// page.test.tsx等と同じ方針: jsdomを使わず、useStateをモックしてReact要素
// ツリーを直接走査する（本コンポーネントの状態順は
// stageIndex, ruleIndex, stageResults, allResults, stageJudgementの5つ）。
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

function findByType(element: any, type: any): any {
  if (!element) return undefined;
  if (element.type === type) return element;
  if (element.props && element.props.children) {
    const children = Array.isArray(element.props.children)
      ? element.props.children
      : [element.props.children];
    for (const child of children) {
      const found = findByType(child, type);
      if (found) return found;
    }
  }
  return undefined;
}

function getElementText(element: any): string {
  if (!element) return '';
  if (typeof element === 'string') return element;
  if (typeof element === 'number') return String(element);
  if (Array.isArray(element)) return element.map(getElementText).join('');
  if (element.props && element.props.children) return getElementText(element.props.children);
  return '';
}

function findByText(element: any, text: string): any {
  if (!element) return undefined;
  if (typeof element === 'string' || typeof element === 'number') return undefined;
  const elementText = getElementText(element);
  if (elementText.includes(text)) {
    if (element.props && element.props.children) {
      const children = Array.isArray(element.props.children)
        ? element.props.children
        : [element.props.children];
      for (const child of children) {
        const found = findByText(child, text);
        if (found) return found;
      }
    }
    return element;
  }
  return undefined;
}

const testScenario: Scenario = {
  id: 'test-scenario',
  title: 'テスト案件',
  description: 'テスト用の案件',
  requiredRank: 0,
  stages: [
    {
      id: 'stage-kito',
      type: 'kito',
      rules: [
        { id: 'kito-angle', description: '角度ルール', type: 'angle', difficulty: 1, target: 0, tolerance: 10 },
      ],
    },
    {
      id: 'stage-saikan',
      type: 'saikan',
      rules: [
        { id: 'saikan-angle', description: '角度ルール2', type: 'angle', difficulty: 2, target: 0, tolerance: 10 },
        { id: 'saikan-timing', description: 'タイミングルール', type: 'timing', difficulty: 2, target: 1, tolerance: 0.5 },
      ],
    },
    {
      id: 'stage-kenetsu',
      type: 'kenetsu',
      rules: [
        {
          id: 'kenetsu-position',
          description: '課長印より下に配置',
          type: 'position',
          difficulty: 3,
          target: 1,
          tolerance: 0.5,
        },
        { id: 'kenetsu-custom', description: '謎マナー', type: 'custom', difficulty: 5 },
      ],
    },
  ],
};

describe('ApplicationStageFlow', () => {
  beforeEach(() => {
    useStateCallCount = 0;
    stateValues = [];
    stateSetters = [vi.fn(), vi.fn(), vi.fn(), vi.fn(), vi.fn()]; // stageIndex, ruleIndex, stageResults, allResults, stageJudgement
  });

  it('初期状態でステージ1（起票）・1件目のangleルールをRotatingStampMinigameへ渡す', () => {
    stateValues = [0, 0, [], [], null];
    useStateCallCount = 0;
    const result = ApplicationStageFlow({
      scenario: testScenario,
      onComplete: vi.fn(),
      onBack: vi.fn(),
    }) as any;

    const badge = findByText(result, '起票');
    expect(badge).toBeDefined();

    const minigame = findByType(result, RotatingStampMinigame as any);
    expect(minigame).toBeDefined();
    expect(minigame.props.rule).toBe(testScenario.stages[0].rules[0]);
  });

  it('起票（ルール1件）完了で即座にstageJudgementが計算される', () => {
    stateValues = [0, 0, [], [], null];
    useStateCallCount = 0;
    const result = ApplicationStageFlow({
      scenario: testScenario,
      onComplete: vi.fn(),
      onBack: vi.fn(),
    }) as any;

    const minigame = findByType(result, RotatingStampMinigame as any);
    minigame.props.onComplete({ actual: 0, score: 'excellent' });

    // 最後のルールなのでruleIndexは進めず、stageJudgementが設定される
    expect(stateSetters[1]).not.toHaveBeenCalled(); // setRuleIndex は呼ばれない
    expect(stateSetters[4]).toHaveBeenCalled(); // setStageJudgement
    const judgement = stateSetters[4].mock.calls[0][0];
    expect(judgement.passed).toBe(true);
  });

  it('再鑑（ルール2件）の1件目完了ではまだstageJudgementを計算せずruleIndexを進める', () => {
    stateValues = [1, 0, [], [], null];
    useStateCallCount = 0;
    const result = ApplicationStageFlow({
      scenario: testScenario,
      onComplete: vi.fn(),
      onBack: vi.fn(),
    }) as any;

    const minigame = findByType(result, RotatingStampMinigame as any);
    minigame.props.onComplete({ actual: 0, score: 'excellent' });

    expect(stateSetters[1]).toHaveBeenCalledWith(1); // setRuleIndex(1)
    expect(stateSetters[4]).not.toHaveBeenCalled(); // setStageJudgementはまだ呼ばれない
  });

  it('再鑑の2件目（timingルール）はLongPressStampMinigameへ渡される', () => {
    stateValues = [1, 1, [{ rule: testScenario.stages[1].rules[0], score: 'excellent' }], [], null];
    useStateCallCount = 0;
    const result = ApplicationStageFlow({
      scenario: testScenario,
      onComplete: vi.fn(),
      onBack: vi.fn(),
    }) as any;

    const minigame = findByType(result, LongPressStampMinigame as any);
    expect(minigame).toBeDefined();
    expect(minigame.props.rule).toBe(testScenario.stages[1].rules[1]);
  });

  it('検閲のpositionルールは「課長印」を含む説明文からreferenceLabelを決定する', () => {
    stateValues = [2, 0, [], [], null];
    useStateCallCount = 0;
    const result = ApplicationStageFlow({
      scenario: testScenario,
      onComplete: vi.fn(),
      onBack: vi.fn(),
    }) as any;

    const minigame = findByType(result, DragDropStampMinigame as any);
    expect(minigame).toBeDefined();
    expect(minigame.props.referenceLabel).toBe('課長印');
  });

  it('検閲のcustomルールはCustomRuleStubへ渡される', () => {
    stateValues = [2, 1, [{ rule: testScenario.stages[2].rules[0], score: 'excellent' }], [], null];
    useStateCallCount = 0;
    const result = ApplicationStageFlow({
      scenario: testScenario,
      onComplete: vi.fn(),
      onBack: vi.fn(),
    }) as any;

    const stub = findByType(result, CustomRuleStub as any);
    expect(stub).toBeDefined();
    expect(stub.props.rule).toBe(testScenario.stages[2].rules[1]);
  });

  it('CustomRuleStubは承知ボタンでgood評価のonCompleteを呼ぶ', () => {
    const onComplete = vi.fn();
    const result = CustomRuleStub({
      rule: testScenario.stages[2].rules[1],
      onComplete,
    }) as any;

    const button = findByText(result, '承知しました');
    expect(button).toBeDefined();
    button.props.onClick();

    expect(onComplete).toHaveBeenCalledWith({ actual: 0, score: 'good' });
  });

  it('不合格の場合は「このステージをやり直す」ボタンでリセットされる', () => {
    stateValues = [
      0,
      0,
      [{ rule: testScenario.stages[0].rules[0], score: 'fail' }],
      [],
      { overallScore: 30, metricScores: { 格式: null, 礼節: 30, 誠意: null, 精密性: null }, passed: false, comment: 'ng' },
    ];
    useStateCallCount = 0;
    const result = ApplicationStageFlow({
      scenario: testScenario,
      onComplete: vi.fn(),
      onBack: vi.fn(),
    }) as any;

    const retryButton = findByText(result, 'このステージをやり直す');
    expect(retryButton).toBeDefined();
    retryButton.props.onClick();

    expect(stateSetters[1]).toHaveBeenCalledWith(0); // setRuleIndex(0)
    expect(stateSetters[2]).toHaveBeenCalledWith([]); // setStageResults([])
    expect(stateSetters[4]).toHaveBeenCalledWith(null); // setStageJudgement(null)
  });

  it('合格・最終ステージでない場合は「次のステージへ進む」ボタンで次ステージへ進む', () => {
    stateValues = [
      0,
      0,
      [{ rule: testScenario.stages[0].rules[0], score: 'excellent' }],
      [],
      { overallScore: 100, metricScores: { 格式: null, 礼節: 100, 誠意: null, 精密性: null }, passed: true, comment: 'ok' },
    ];
    useStateCallCount = 0;
    const onComplete = vi.fn();
    const result = ApplicationStageFlow({
      scenario: testScenario,
      onComplete,
      onBack: vi.fn(),
    }) as any;

    const advanceButton = findByText(result, '次のステージへ進む');
    expect(advanceButton).toBeDefined();
    advanceButton.props.onClick();

    expect(stateSetters[0]).toHaveBeenCalledWith(1); // setStageIndex(1)
    expect(stateSetters[1]).toHaveBeenCalledWith(0); // setRuleIndex(0)
    expect(onComplete).not.toHaveBeenCalled();
  });

  it('合格・最終ステージの場合は「案件をクリアする」ボタンでonCompleteが呼ばれる', () => {
    stateValues = [
      2,
      1,
      [
        { rule: testScenario.stages[2].rules[0], score: 'excellent' },
        { rule: testScenario.stages[2].rules[1], score: 'good' },
      ],
      [
        { rule: testScenario.stages[0].rules[0], score: 'excellent' },
        { rule: testScenario.stages[1].rules[0], score: 'excellent' },
        { rule: testScenario.stages[1].rules[1], score: 'excellent' },
      ],
      { overallScore: 90, metricScores: { 格式: null, 礼節: null, 誠意: null, 精密性: 90 }, passed: true, comment: 'ok' },
    ];
    useStateCallCount = 0;
    const onComplete = vi.fn();
    const result = ApplicationStageFlow({
      scenario: testScenario,
      onComplete,
      onBack: vi.fn(),
    }) as any;

    const clearButton = findByText(result, '案件をクリアする');
    expect(clearButton).toBeDefined();
    clearButton.props.onClick();

    expect(onComplete).toHaveBeenCalledTimes(1);
    const finalJudgement = onComplete.mock.calls[0][0];
    // 全5件（3件excellent + 1件excellent + 1件good）の総合判定
    expect(finalJudgement.passed).toBe(true);
  });

  it('「戻る」ボタンでonBackが呼ばれる', () => {
    stateValues = [0, 0, [], [], null];
    useStateCallCount = 0;
    const onBack = vi.fn();
    const result = ApplicationStageFlow({
      scenario: testScenario,
      onComplete: vi.fn(),
      onBack,
    }) as any;

    const backButton = findByText(result, '戻る');
    expect(backButton).toBeDefined();
    backButton.props.onClick();
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
