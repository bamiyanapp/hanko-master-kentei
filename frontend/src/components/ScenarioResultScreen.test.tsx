import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ScenarioResultScreen from './ScenarioResultScreen';
import { pcPurchaseScenario } from '@/data/scenarios';
import type { JudgementResult } from '@/lib/judgement';
import { RANK_NAMES } from '@/lib/rank';

const baseResult: JudgementResult = {
  overallScore: 90,
  metricScores: { 格式: null, 礼節: 90, 誠意: null, 精密性: 80 },
  passed: true,
  comment: 'おおむね問題ありません。',
};

function renderScreen(
  overrides: Partial<React.ComponentProps<typeof ScenarioResultScreen>> = {},
) {
  const onBackToSelection = vi.fn();
  const onShowEnding = vi.fn();
  render(
    <ScenarioResultScreen
      scenario={pcPurchaseScenario}
      result={baseResult}
      rankUpTo={null}
      onBackToSelection={onBackToSelection}
      onShowEnding={onShowEnding}
      {...overrides}
    />,
  );
  return { onBackToSelection, onShowEnding };
}

// 指標名のラベルが入ったタイル全体（ラベル＋スコア）を取得する
function metricTile(name: string): HTMLElement {
  return screen.getByText(name).parentElement as HTMLElement;
}

describe('ScenarioResultScreen', () => {
  it('案件名・総合スコア・コメントを表示し、昇格なしなら「案件選択へ戻る」で戻る', async () => {
    const user = userEvent.setup();
    const { onBackToSelection, onShowEnding } = renderScreen();

    expect(
      screen.getByRole('heading', { name: `${pcPurchaseScenario.title}：案件クリア` }),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /承認されました.*総合スコア90点/ })).toBeInTheDocument();
    expect(screen.getByText('おおむね問題ありません。')).toBeInTheDocument();
    expect(screen.queryByText(/昇格/)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'エンディングを見る' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '案件選択へ戻る' }));

    expect(onBackToSelection).toHaveBeenCalledTimes(1);
    expect(onShowEnding).not.toHaveBeenCalled();
  });

  it('4指標のスコアを表示し、未計測の指標は「－」にする', () => {
    renderScreen();

    expect(metricTile('礼節')).toHaveTextContent('90');
    expect(metricTile('精密性')).toHaveTextContent('80');
    expect(metricTile('格式')).toHaveTextContent('－');
    expect(metricTile('誠意')).toHaveTextContent('－');
  });

  it('最高ランク未満への昇格では、昇格表示と「案件選択へ戻る」ボタンを表示する', () => {
    renderScreen({ rankUpTo: 1 });

    expect(
      screen.getByRole('heading', { name: new RegExp(`昇格.*「${RANK_NAMES[1]}」に認定`) }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '案件選択へ戻る' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'エンディングを見る' })).not.toBeInTheDocument();
  });

  it('最高ランクへ昇格した場合は「エンディングを見る」のみ表示し、押すとonShowEndingが呼ばれる', async () => {
    const user = userEvent.setup();
    const maxRankIndex = RANK_NAMES.length - 1;
    const { onBackToSelection, onShowEnding } = renderScreen({ rankUpTo: maxRankIndex });

    expect(screen.queryByRole('button', { name: '案件選択へ戻る' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'エンディングを見る' }));

    expect(onShowEnding).toHaveBeenCalledTimes(1);
    expect(onBackToSelection).not.toHaveBeenCalled();
  });

  it('不合格時は差し戻し表示になり、承認の文言は出さない', () => {
    renderScreen({
      result: {
        overallScore: 30,
        metricScores: { 格式: null, 礼節: 30, 誠意: null, 精密性: null },
        passed: false,
        comment: '残念ながら基準を満たしていません。再提出をお願いします。',
      },
    });

    expect(screen.getByRole('heading', { name: /差し戻されました.*総合スコア30点/ })).toBeInTheDocument();
    expect(screen.queryByText(/承認されました/)).not.toBeInTheDocument();
    expect(
      screen.getByText('残念ながら基準を満たしていません。再提出をお願いします。'),
    ).toBeInTheDocument();
  });
});
