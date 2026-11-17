import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ApplicationStageFlow, { CustomRuleStub } from './ApplicationStageFlow';
import type { Rule, Scenario, Stage, StageType } from '@/types/scenario';

// 謎マナー（custom）は「承知しました」を押すだけでgood(70点)になる。
// 1件ずつ決定的に進められるため、フロー（進行・合否・やり直し）の検証に使う。
const customRule = (id: string, description = `謎マナー${id}`): Rule => ({
  id,
  description,
  type: 'custom',
  difficulty: 1,
});

// お辞儀（tilt）は、傾けずに捺印すればfail(30点)、15度傾けて捺印すればexcellent(100点)にできる。
const tiltRule = (id: string): Rule => ({
  id,
  description: `お辞儀${id}`,
  type: 'tilt',
  difficulty: 1,
  target: 15,
  tolerance: 5,
});

const stage = (type: StageType, rules: Rule[]): Stage => ({
  id: `stage-${type}`,
  type,
  rules,
});

const scenarioOf = (...stages: Stage[]): Scenario => ({
  id: 'test-scenario',
  title: 'テスト案件',
  description: 'テスト用',
  requiredRank: 0,
  stages,
});

function setup(scenario: Scenario) {
  const onComplete = vi.fn();
  const onBack = vi.fn();
  const user = userEvent.setup();
  render(<ApplicationStageFlow scenario={scenario} onComplete={onComplete} onBack={onBack} />);
  return { user, onComplete, onBack };
}

type User = ReturnType<typeof userEvent.setup>;

const accept = (user: User) => user.click(screen.getByRole('button', { name: '承知しました' }));

// お辞儀ミニゲームを15度傾けて捺印する（excellent）
async function stampTiltPerfectly(user: User) {
  const stamp = screen.getByRole('button', { name: '鈴木' });
  await user.pointer([
    { keys: '[MouseLeft>]', target: stamp, coords: { clientX: 100 } },
    { target: stamp, coords: { clientX: 130 } },
    { keys: '[/MouseLeft]' },
  ]);
  await user.click(screen.getByRole('button', { name: '捺印する' }));
}

// 何もせず捺印する（fail）
const stampTiltBadly = (user: User) => user.click(screen.getByRole('button', { name: '捺印する' }));

describe('ApplicationStageFlow: ルール種別に応じたミニゲームの振り分け', () => {
  it.each([
    { type: 'angle', expected: () => screen.getByRole('button', { name: '止める' }) },
    { type: 'timing', expected: () => screen.getByRole('button', { name: '押し続ける' }) },
    { type: 'pressure', expected: () => screen.getByRole('button', { name: '押し続ける' }) },
    { type: 'tilt', expected: () => screen.getByRole('button', { name: '捺印する' }) },
    { type: 'moving-tap', expected: () => screen.getByRole('button', { name: 'スタンプ！' }) },
    { type: 'custom', expected: () => screen.getByRole('button', { name: '承知しました' }) },
  ] as const)('$type のルールは対応するミニゲームを表示する', ({ type, expected }) => {
    const rule: Rule = { id: 'r', description: 'ルール説明', type, difficulty: 1, target: 1, tolerance: 1 };
    setup(scenarioOf(stage('kito', [rule])));

    expect(expected()).toBeInTheDocument();
    expect(screen.getByText('ルール説明')).toBeInTheDocument();
  });

  it('positionのルールは、説明に「課長印」を含む場合のみ基準マーカーを「課長印」にする', () => {
    const { unmount } = render(
      <ApplicationStageFlow
        scenario={scenarioOf(
          stage('kenetsu', [
            { id: 'p', description: '課長印より下に押す', type: 'position', difficulty: 1, target: 1, tolerance: 1 },
          ]),
        )}
        onComplete={vi.fn()}
        onBack={vi.fn()}
      />,
    );
    expect(screen.getByText('課長印')).toBeInTheDocument();
    expect(screen.queryByText('目標位置')).not.toBeInTheDocument();
    unmount();

    setup(
      scenarioOf(
        stage('kito', [
          { id: 'p', description: '目標位置に合わせる', type: 'position', difficulty: 1, target: 1, tolerance: 1 },
        ]),
      ),
    );
    expect(screen.getByText('目標位置', { selector: 'span' })).toBeInTheDocument();
  });
});

describe('CustomRuleStub', () => {
  it('説明文を表示し、「承知しました」でgood評価のonCompleteを呼ぶ', async () => {
    const onComplete = vi.fn();
    const user = userEvent.setup();
    render(<CustomRuleStub rule={customRule('x', '月齢を考慮してください')} onComplete={onComplete} />);

    expect(screen.getByText('月齢を考慮してください')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '承知しました' }));

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith({ actual: 0, score: 'good' });
  });
});

describe('ApplicationStageFlow: ステージの進行', () => {
  it('ステージ種別と何件目かを表示し、ルールを1件終えるごとに次の件へ進む', async () => {
    const { user } = setup(scenarioOf(stage('kito', [customRule('a'), customRule('b')])));

    expect(screen.getByText('ステージ 1（起票） 1/2件目')).toBeInTheDocument();
    expect(screen.getByText('謎マナーa')).toBeInTheDocument();
    // まだステージの判定は出ない
    expect(screen.queryByText(/合格！|差し戻し！/)).not.toBeInTheDocument();

    await accept(user);

    expect(screen.getByText('ステージ 1（起票） 2/2件目')).toBeInTheDocument();
    expect(screen.getByText('謎マナーb')).toBeInTheDocument();
  });

  it('ステージの全ルールを終えると判定が出る（合格、総合スコア、コメント）', async () => {
    const { user } = setup(scenarioOf(stage('kito', [customRule('a')])));

    await accept(user);

    expect(screen.getByRole('heading', { name: /合格！.*起票.*総合スコア70点/ })).toBeInTheDocument();
    expect(screen.getByText('おおむね問題ありません。')).toBeInTheDocument();
  });

  it('「戻る」ボタンでonBackが呼ばれる', async () => {
    const { user, onBack } = setup(scenarioOf(stage('kito', [customRule('a')])));

    await user.click(screen.getByRole('button', { name: '戻る' }));

    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('合格後、最終でないステージは「次のステージへ進む」で次のステージの1件目へ進む', async () => {
    const { user, onComplete } = setup(
      scenarioOf(stage('kito', [customRule('a')]), stage('saikan', [customRule('b')])),
    );
    await accept(user);

    await user.click(screen.getByRole('button', { name: '次のステージへ進む' }));

    expect(screen.getByText('ステージ 2（再鑑） 1/1件目')).toBeInTheDocument();
    expect(screen.getByText('謎マナーb')).toBeInTheDocument();
    expect(onComplete).not.toHaveBeenCalled();
  });

  it('最終ステージ合格後は「案件をクリアする」で、全ステージ通算の判定を渡してonCompleteが呼ばれる', async () => {
    const { user, onComplete } = setup(
      scenarioOf(stage('kito', [customRule('a')]), stage('kenetsu', [tiltRule('t')])),
    );
    await accept(user); // 起票: good(70点)
    await user.click(screen.getByRole('button', { name: '次のステージへ進む' }));
    await stampTiltPerfectly(user); // 検閲: excellent(100点)

    expect(screen.queryByRole('button', { name: '次のステージへ進む' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '案件をクリアする' }));

    expect(onComplete).toHaveBeenCalledTimes(1);
    // 通算: (70 + 100) / 2 = 85点。お辞儀(tilt)は礼節の指標になる
    expect(onComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        overallScore: 85,
        passed: true,
        metricScores: expect.objectContaining({ 礼節: 100 }),
      }),
    );
  });
});

describe('ApplicationStageFlow: 不合格（差し戻し）とやり直し', () => {
  it('総合スコアが合格ラインに届かないと差し戻され、次へ進むボタンは出ない', async () => {
    const { user, onComplete } = setup(scenarioOf(stage('kito', [tiltRule('t'), customRule('c')])));
    await stampTiltBadly(user); // fail(30点)
    await accept(user); // good(70点) → 平均50点 < 60点

    expect(screen.getByRole('heading', { name: /差し戻し！.*起票.*総合スコア50点/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /次のステージへ進む|案件をクリアする/ })).not.toBeInTheDocument();
    expect(onComplete).not.toHaveBeenCalled();
  });

  it('「このステージをやり直す」で最初のルールからやり直し、前回の結果は引き継がない', async () => {
    const { user, onComplete } = setup(scenarioOf(stage('kito', [tiltRule('t'), customRule('c')])));
    await stampTiltBadly(user);
    await accept(user);

    await user.click(screen.getByRole('button', { name: 'このステージをやり直す' }));

    // 1件目に戻り、ミニゲームも初期状態になっている
    expect(screen.getByText('ステージ 1（起票） 1/2件目')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '捺印する' })).toBeEnabled();

    // やり直しで満点と普通点を取れば、前回(30点)の影響なく平均85点で合格する
    await stampTiltPerfectly(user);
    await accept(user);
    expect(screen.getByRole('heading', { name: /合格！.*総合スコア85点/ })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '案件をクリアする' }));
    expect(onComplete).toHaveBeenCalledWith(expect.objectContaining({ overallScore: 85, passed: true }));
  });
});
