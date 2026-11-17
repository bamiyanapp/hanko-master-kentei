import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ScenarioSelectionScreen from './ScenarioSelectionScreen';
import type { Scenario } from '@/types/scenario';

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

function renderScreen(
  overrides: Partial<React.ComponentProps<typeof ScenarioSelectionScreen>> = {},
) {
  const onSelect = vi.fn();
  const onBack = vi.fn();
  render(
    <ScenarioSelectionScreen
      scenarios={[scenarioA, scenarioB]}
      currentRank={0}
      clearedScenarioIds={[]}
      onSelect={onSelect}
      onBack={onBack}
      {...overrides}
    />,
  );
  return { onSelect, onBack };
}

describe('ScenarioSelectionScreen', () => {
  it('見出しと、全シナリオ＋戻るボタンを表示する', () => {
    renderScreen();

    expect(screen.getByRole('heading', { name: '案件を選択してください' })).toBeInTheDocument();
    // シナリオ数(2) + 戻るボタン(1)
    expect(screen.getAllByRole('button')).toHaveLength(3);
    expect(screen.getByRole('button', { name: '戻る' })).toBeInTheDocument();
  });

  it('未解放（requiredRankが現在ランクより高い）シナリオを🔒表示・disabledにし、解放条件を示す', () => {
    renderScreen();

    const locked = screen.getByRole('button', { name: /シナリオB/ });
    expect(locked).toBeDisabled();
    expect(locked).toHaveTextContent('🔒');
    expect(locked).toHaveTextContent('解放条件: ランク5以上');
    // 未解放の間は説明文を見せない
    expect(screen.queryByText('description-b')).not.toBeInTheDocument();
  });

  it('未解放シナリオをクリックしてもonSelectは呼ばれない', async () => {
    const user = userEvent.setup();
    const { onSelect } = renderScreen();

    await user.click(screen.getByRole('button', { name: /シナリオB/ }));

    expect(onSelect).not.toHaveBeenCalled();
  });

  it('解放済みシナリオは説明文を表示し、クリックするとonSelectがidつきで呼ばれる', async () => {
    const user = userEvent.setup();
    const { onSelect } = renderScreen();

    const unlocked = screen.getByRole('button', { name: /シナリオA/ });
    expect(unlocked).toBeEnabled();
    expect(unlocked).toHaveTextContent('description-a');

    await user.click(unlocked);

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith('a');
  });

  it('現在ランクがrequiredRank以上になるとシナリオが選択可能になる', () => {
    renderScreen({ currentRank: 5 });

    expect(screen.getByRole('button', { name: /シナリオB/ })).toBeEnabled();
  });

  it('クリア済みシナリオを✓表示にする（クリア済みなら🔒より優先）', () => {
    renderScreen({
      scenarios: [scenarioB],
      currentRank: 0,
      clearedScenarioIds: ['b'],
    });

    const button = screen.getByRole('button', { name: /シナリオB/ });
    expect(screen.getByLabelText('クリア済み')).toHaveTextContent('✓');
    expect(button).not.toHaveTextContent('🔒');
  });

  it('戻るボタンでonBackが呼ばれる', async () => {
    const user = userEvent.setup();
    const { onBack } = renderScreen();

    await user.click(screen.getByRole('button', { name: '戻る' }));

    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
