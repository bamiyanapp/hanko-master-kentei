/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi } from 'vitest';
import ScenarioResultScreen from './ScenarioResultScreen';
import { pcPurchaseScenario } from '@/data/scenarios';
import type { JudgementResult } from '@/lib/judgement';
import { RANK_NAMES } from '@/lib/rank';

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

const baseResult: JudgementResult = {
  overallScore: 90,
  metricScores: { 格式: null, 礼節: 90, 誠意: null, 精密性: 80 },
  passed: true,
  comment: 'おおむね問題ありません。',
};

describe('ScenarioResultScreen', () => {
  it('スコア・コメントを表示し、rankUpTo=nullの場合は「案件選択へ戻る」ボタンを表示する', () => {
    const onBackToSelection = vi.fn();
    const result = ScenarioResultScreen({
      scenario: pcPurchaseScenario,
      result: baseResult,
      rankUpTo: null,
      onBackToSelection,
      onShowEnding: vi.fn(),
    }) as any;

    expect(findByText(result, '承認されました')).toBeDefined();
    expect(findByText(result, 'おおむね問題ありません。')).toBeDefined();
    expect(findByText(result, '昇格')).toBeUndefined();

    const backButton = findByText(result, '案件選択へ戻る');
    expect(backButton).toBeDefined();
    backButton.props.onClick();
    expect(onBackToSelection).toHaveBeenCalledTimes(1);
  });

  it('rankUpToが最高ランク未満の場合も「案件選択へ戻る」ボタンを表示する', () => {
    const result = ScenarioResultScreen({
      scenario: pcPurchaseScenario,
      result: baseResult,
      rankUpTo: 1,
      onBackToSelection: vi.fn(),
      onShowEnding: vi.fn(),
    }) as any;

    expect(findByText(result, '昇格')).toBeDefined();
    expect(findByText(result, RANK_NAMES[1])).toBeDefined();
    expect(findByText(result, '案件選択へ戻る')).toBeDefined();
    expect(findByText(result, 'エンディング')).toBeUndefined();
  });

  it('rankUpToが最高ランクの場合は「エンディングを見る」ボタンを表示する', () => {
    const onShowEnding = vi.fn();
    const maxRankIndex = RANK_NAMES.length - 1;
    const result = ScenarioResultScreen({
      scenario: pcPurchaseScenario,
      result: baseResult,
      rankUpTo: maxRankIndex,
      onBackToSelection: vi.fn(),
      onShowEnding,
    }) as any;

    const endingButton = findByText(result, 'エンディングを見る');
    expect(endingButton).toBeDefined();
    endingButton.props.onClick();
    expect(onShowEnding).toHaveBeenCalledTimes(1);

    expect(findByText(result, '案件選択へ戻る')).toBeUndefined();
  });

  it('不合格時は差し戻し表示になる', () => {
    const failResult: JudgementResult = {
      overallScore: 30,
      metricScores: { 格式: null, 礼節: 30, 誠意: null, 精密性: null },
      passed: false,
      comment: '残念ながら基準を満たしていません。再提出をお願いします。',
    };
    const result = ScenarioResultScreen({
      scenario: pcPurchaseScenario,
      result: failResult,
      rankUpTo: null,
      onBackToSelection: vi.fn(),
      onShowEnding: vi.fn(),
    }) as any;

    expect(findByText(result, '差し戻されました')).toBeDefined();
  });
});
