/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Home, { judgeHankoAngle, judgePvP } from './page';
import React from 'react';

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

// ReactElementツリーを再帰的に走査して、指定した条件に合う要素を探すヘルパー
function findType(element: any, type: string): any {
  if (!element) return undefined;
  if (element.type === type) return element;
  if (element.props && element.props.children) {
    if (Array.isArray(element.props.children)) {
      for (const child of element.props.children) {
        const found = findType(child, type);
        if (found) return found;
      }
    } else {
      return findType(element.props.children, type);
    }
  }
  return undefined;
}

// 要素内のすべてのテキストを取得するヘルパー
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

// テキスト内容から要素を探すヘルパー
function findByText(element: any, text: string): any {
  if (!element) return undefined;
  if (typeof element === 'string' || typeof element === 'number') return undefined;

  const elementText = getElementText(element);
  if (elementText.includes(text)) {
    // まずは子要素にマッチするReact要素があるか探す
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
    // 子要素にマッチするReact要素がなければ、自分自身を返す
    return element;
  }
  return undefined;
}

describe('Home Component Integration', () => {
  beforeEach(() => {
    useStateCallCount = 0;
    stateValues = [];
    stateSetters = [
      vi.fn(), // isStarted
      vi.fn(), // angle
      vi.fn(), // judged
      vi.fn(), // resultMessage
      vi.fn(), // isPassed
      vi.fn(), // isPvP
      vi.fn(), // pvpStep
      vi.fn(), // p1Angle
      vi.fn(), // p2Angle
    ];
    registeredEffects = [];
    mockLocation.search = '';
    mockPushState.mockClear();
  });

  it('should render initial state and check transitions', () => {
    // 1. 初期レンダリング
    useStateCallCount = 0;
    const result = Home() as React.ReactElement;
    expect(result.type).toBe('main');

    // 「検定を開始する」ボタンがあることを確認
    const startButton = findByText(result, '検定を開始する');
    expect(startButton).toBeDefined();

    // 2. handleStartの実行
    startButton.props.onClick();
    expect(stateSetters[0]).toHaveBeenCalledWith(true); // setIsStarted(true)
    expect(stateSetters[1]).toHaveBeenCalledWith(0);    // setAngle(0)
    expect(stateSetters[2]).toHaveBeenCalledWith(false); // setJudged(false)
  });

  it('should restore state from URL params in useEffect', () => {
    // URLパラメータがある状態をシミュレート
    mockLocation.search = '?started=true&angle=-20&judged=true';
    useStateCallCount = 0;
    Home();

    // 登録されたuseEffectをすべて実行する
    registeredEffects.forEach((effect) => effect());

    expect(stateSetters[0]).toHaveBeenCalledWith(true); // setIsStarted(true)
    expect(stateSetters[1]).toHaveBeenCalledWith(-20);  // setAngle(-20)
    expect(stateSetters[2]).toHaveBeenCalledWith(true);  // setJudged(true)
  });

  it('should render game state when isStarted is true', () => {
    // isStarted=true, angle=-20, judged=false の状態をセット
    stateValues = [true, -20, false, '', false];

    useStateCallCount = 0;
    const result = Home() as React.ReactElement;

    // ミッションの説明などがあることを確認
    const mission = findByText(result, '稟議書（パソコン購入申請）に捺印しなさい。');
    expect(mission).toBeDefined();

    // スライダーの変更テスト
    const input = findType(result, 'input');
    expect(input).toBeDefined();
    input.props.onChange({ target: { value: '-25' } });
    expect(stateSetters[1]).toHaveBeenCalledWith(-25); // setAngle(-25)

    // 「これで捺印を申請する」ボタンのテスト
    const judgeButton = findByText(result, 'これで捺印を申請する');
    expect(judgeButton).toBeDefined();
    judgeButton.props.onClick();
    expect(stateSetters[2]).toHaveBeenCalledWith(true); // setJudged(true)
  });

  it('should render result state when judged is true', () => {
    // isStarted=true, angle=-20, judged=true, resultMessage='🎉 合格！', isPassed=true の状態をセット
    stateValues = [true, -20, true, '【合格】...', true];

    useStateCallCount = 0;
    const result = Home() as React.ReactElement;

    // 合格表示
    const passedText = findByText(result, '🎉 合格！');
    expect(passedText).toBeDefined();

    // 「もう一度調整する」ボタンのテスト
    const resetButton = findByText(result, 'もう一度調整する');
    expect(resetButton).toBeDefined();
    resetButton.props.onClick();
    expect(stateSetters[1]).toHaveBeenCalledWith(0); // setAngle(0)
    expect(stateSetters[2]).toHaveBeenCalledWith(false); // setJudged(false)

    // 「メイン画面へ戻る」ボタンのテスト
    const backButton = findByText(result, 'メイン画面へ戻る');
    expect(backButton).toBeDefined();
    backButton.props.onClick();
    expect(stateSetters[0]).toHaveBeenCalledWith(false); // setIsStarted(false)
  });

  it('should render result state when judged is true and isPassed is false', () => {
    // isStarted=true, angle=0, judged=true, resultMessage='【差し戻し】...', isPassed=false の状態をセット
    stateValues = [true, 0, true, '【差し戻し】...', false];

    useStateCallCount = 0;
    const result = Home() as React.ReactElement;

    // 差し戻し表示
    const failedText = findByText(result, '❌ 差し戻し！');
    expect(failedText).toBeDefined();
  });

  it('should trigger updateUrl in handleBackToTop on the page header', () => {
    stateValues = [true, -20, false, '', false];
    useStateCallCount = 0;
    const result = Home() as React.ReactElement;

    const backButton = findByText(result, '戻る');
    expect(backButton).toBeDefined();
    backButton.props.onClick();
    expect(stateSetters[0]).toHaveBeenCalledWith(false);
  });
});

describe('judgeHankoAngle', () => {
  it('should return isPassed true and pass message for ideal angle (e.g. -20)', () => {
    const result = judgeHankoAngle(-20);
    expect(result.isPassed).toBe(true);
    expect(result.message).toContain('合格');
  });

  it('should return isPassed false and straight message for 0 angle', () => {
    const result = judgeHankoAngle(0);
    expect(result.isPassed).toBe(false);
    expect(result.message).toContain('直立不動');
  });

  it('should return isPassed false and backward message for positive angle (e.g. 10)', () => {
    const result = judgeHankoAngle(10);
    expect(result.isPassed).toBe(false);
    expect(result.message).toContain('のけぞっている');
  });

  it('should return isPassed false and over-angled message for deep negative angle (e.g. -50)', () => {
    const result = judgeHankoAngle(-50);
    expect(result.isPassed).toBe(false);
    expect(result.message).toContain('傾けすぎ');
  });
});

describe('judgePvP', () => {
  it('should declare p1 winner if p1 is passed and p2 is failed', () => {
    const result = judgePvP(-20, 0);
    expect(result.winner).toBe('p1');
    expect(result.message).toContain('プレイヤー1（鈴木）の勝利');
  });

  it('should declare p2 winner if p1 is failed and p2 is passed', () => {
    const result = judgePvP(10, -20);
    expect(result.winner).toBe('p2');
    expect(result.message).toContain('プレイヤー2（佐藤）の勝利');
  });

  it('should declare draw if both fail', () => {
    const result = judgePvP(0, 10);
    expect(result.winner).toBe('draw');
    expect(result.message).toContain('両者差し戻し');
  });

  it('should compare score and declare closer one winner if both pass', () => {
    // 理想の角度は -22度。-20度（差2度） vs -30度（差8度） -> p1勝ち
    const result = judgePvP(-20, -30);
    expect(result.winner).toBe('p1');
    expect(result.message).toContain('理想のお辞儀（-22度）に近く');
  });
});

describe('Home Component PvP Flow', () => {
  beforeEach(() => {
    useStateCallCount = 0;
    stateValues = [];
    stateSetters = [
      vi.fn(), // isStarted
      vi.fn(), // angle
      vi.fn(), // judged
      vi.fn(), // resultMessage
      vi.fn(), // isPassed
      vi.fn(), // isPvP
      vi.fn(), // pvpStep
      vi.fn(), // p1Angle
      vi.fn(), // p2Angle
    ];
    registeredEffects = [];
    mockLocation.search = '';
    mockPushState.mockClear();
  });

  it('should start PvP mode from top page', () => {
    useStateCallCount = 0;
    const result = Home() as React.ReactElement;
    
    const pvpButton = findByText(result, '対戦モードを開始する');
    expect(pvpButton).toBeDefined();

    pvpButton.props.onClick();
    expect(stateSetters[0]).toHaveBeenCalledWith(true); // isStarted -> true
    expect(stateSetters[5]).toHaveBeenCalledWith(true); // isPvP -> true
    expect(stateSetters[6]).toHaveBeenCalledWith('p1_turn'); // pvpStep -> 'p1_turn'
  });

  it('should render P1 turn interface and transition to P2 turn', () => {
    // states: isStarted=true, angle=0, judged=false, resultMessage='', isPassed=false, isPvP=true, pvpStep='p1_turn', p1Angle=0, p2Angle=0
    stateValues = [true, 0, false, '', false, true, 'p1_turn', 0, 0];
    useStateCallCount = 0;
    const result = Home() as React.ReactElement;

    const banner = findByText(result, '誠意の限界捺印バトル（2人対戦）');
    expect(banner).toBeDefined();

    const turnLabel = findByText(result, '【プレイヤー1（鈴木）の番】');
    expect(turnLabel).toBeDefined();

    // P1 angle slider adjustment
    const input = findType(result, 'input');
    expect(input).toBeDefined();
    input.props.onChange({ target: { value: '-22' } });
    expect(stateSetters[7]).toHaveBeenCalledWith(-22); // setP1Angle(-22)

    // Submit P1
    const submitBtn = findByText(result, 'プレイヤー1が捺印を決定');
    expect(submitBtn).toBeDefined();
    submitBtn.props.onClick();
    expect(stateSetters[6]).toHaveBeenCalledWith('p2_turn');
  });

  it('should render P2 turn interface and submit to result', () => {
    // states: isStarted=true, angle=0, judged=false, resultMessage='', isPassed=false, isPvP=true, pvpStep='p2_turn', p1Angle=-22, p2Angle=0
    stateValues = [true, 0, false, '', false, true, 'p2_turn', -22, 0];
    useStateCallCount = 0;
    const result = Home() as React.ReactElement;

    const turnLabel = findByText(result, '【プレイヤー2（佐藤）の番】');
    expect(turnLabel).toBeDefined();

    // P2 angle slider adjustment
    const input = findType(result, 'input');
    expect(input).toBeDefined();
    input.props.onChange({ target: { value: '-10' } });
    expect(stateSetters[8]).toHaveBeenCalledWith(-10); // setP2Angle(-10)

    // Submit P2
    const submitBtn = findByText(result, 'プレイヤー2が捺印を決定');
    expect(submitBtn).toBeDefined();
    submitBtn.props.onClick();
    expect(stateSetters[6]).toHaveBeenCalledWith('result');
  });
});
