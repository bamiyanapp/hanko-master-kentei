/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi } from 'vitest';
import ScenarioSelectionScreen from './ScenarioSelectionScreen';
import type { Scenario } from '@/types/scenario';

// ReactElementツリーを再帰的に走査して、指定した条件に合う要素を探すヘルパー
// （page.test.tsxと同じ方針: jsdomを使わずReact要素ツリーを直接走査する）
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

const scenarioA: Scenario = {
  id: 'a',
  title: 'シナリオA（解放済み）',
  description: 'description-a',
  requiredRank: 0,
  stages: [],
};

const scenarioB: Scenario = {
  id: 'b',
  title: 'シナリオB（未解放）',
  description: 'description-b',
  requiredRank: 5,
  stages: [],
};

describe('ScenarioSelectionScreen', () => {
  it('未解放（requiredRankが現在ランクより高い）シナリオを🔒表示・disabledにする', () => {
    const onSelect = vi.fn();
    const onBack = vi.fn();
    const result = ScenarioSelectionScreen({
      scenarios: [scenarioA, scenarioB],
      currentRank: 0,
      clearedScenarioIds: [],
      onSelect,
      onBack,
    }) as any;

    const buttons = findAllButtons(result);
    // シナリオ数(2) + 戻るボタン(1)
    expect(buttons.length).toBe(3);

    const lockedButton = buttons.find((b) => getElementText(b).includes('シナリオB'));
    expect(lockedButton).toBeDefined();
    expect(lockedButton.props.disabled).toBe(true);
    expect(getElementText(lockedButton)).toContain('🔒');

    // disabledなシナリオをクリックしてもonSelectは呼ばれない
    lockedButton.props.onClick();
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('解放済みシナリオをクリックするとonSelectが呼ばれる', () => {
    const onSelect = vi.fn();
    const onBack = vi.fn();
    const result = ScenarioSelectionScreen({
      scenarios: [scenarioA, scenarioB],
      currentRank: 0,
      clearedScenarioIds: [],
      onSelect,
      onBack,
    }) as any;

    const buttons = findAllButtons(result);
    const unlockedButton = buttons.find((b) => getElementText(b).includes('シナリオA'));
    expect(unlockedButton).toBeDefined();
    expect(unlockedButton.props.disabled).toBe(false);

    unlockedButton.props.onClick();
    expect(onSelect).toHaveBeenCalledWith('a');
  });

  it('クリア済みシナリオを✓表示にする', () => {
    const result = ScenarioSelectionScreen({
      scenarios: [scenarioA],
      currentRank: 0,
      clearedScenarioIds: ['a'],
      onSelect: vi.fn(),
      onBack: vi.fn(),
    }) as any;

    const buttons = findAllButtons(result);
    const clearedButton = buttons.find((b) => getElementText(b).includes('シナリオA'));
    expect(getElementText(clearedButton)).toContain('✓');
  });

  it('戻るボタンでonBackが呼ばれる', () => {
    const onBack = vi.fn();
    const result = ScenarioSelectionScreen({
      scenarios: [scenarioA],
      currentRank: 0,
      clearedScenarioIds: [],
      onSelect: vi.fn(),
      onBack,
    }) as any;

    const buttons = findAllButtons(result);
    const backButton = buttons.find((b) => getElementText(b) === '戻る');
    expect(backButton).toBeDefined();
    backButton.props.onClick();
    expect(onBack).toHaveBeenCalled();
  });
});
