import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Home from './page';
import { playClickSound, playSuccessSound, playFailureSound } from './sfx';
import { pcPurchaseScenario } from '@/data/scenarios';

// 効果音は外部境界（ブラウザのAudio）のため差し替えて、鳴らし分けだけを検証する。
vi.mock('./sfx', () => ({
  playClickSound: vi.fn(),
  playSuccessSound: vi.fn(),
  playFailureSound: vi.fn(),
}));

// プレイ画面（ステージ進行）は、ApplicationStageFlow.test.tsxで実物のミニゲームごと検証済み。
// ここでは「案件を渡され、完了・戻るを通知してくる」という境界だけを軽い代役にし、
// トップ画面側の配線（画面遷移・URL同期・進捗の保存・昇格演出）に集中する。
vi.mock('@/components/ApplicationStageFlow', async () => {
  const React = await import('react');
  const result = (passed: boolean, overallScore: number) => ({
    overallScore,
    passed,
    comment: passed ? 'おおむね問題ありません。' : '残念ながら基準を満たしていません。',
    metricScores: { 格式: null, 礼節: null, 誠意: null, 精密性: null },
  });
  return {
    default: ({
      scenario,
      onComplete,
      onBack,
    }: {
      scenario: { id: string };
      onComplete: (r: ReturnType<typeof result>) => void;
      onBack: () => void;
    }) =>
      React.createElement(
        'div',
        null,
        React.createElement('p', null, `プレイ中: ${scenario.id}`),
        React.createElement('button', { onClick: () => onComplete(result(true, 100)) }, '満点で完了'),
        React.createElement('button', { onClick: () => onComplete(result(false, 30)) }, '不合格で完了'),
        React.createElement('button', { onClick: onBack }, 'プレイ画面の戻る'),
      ),
  };
});

const STORAGE_KEY = 'hanko-master-kentei:progress';

// 実績ポイントの境界（実装: 基礎10点＋総合スコア/10。満点クリアで+20点）
// 見習い0〜 / 初級10〜 / 中級25〜 / 上級45〜 / 師範70〜 / ハンコマスター100〜
function saveProgress(points: number, clearedScenarioIds: string[] = []) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ points, clearedScenarioIds }));
}

function storedProgress() {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : null;
}

const scenarioButton = () =>
  screen.getByRole('button', { name: (name) => name.includes(pcPurchaseScenario.title) });

async function goToSelection(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: '検定を受ける' }));
}

describe('Home（トップ画面）', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.history.replaceState(null, '', '/');
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('トップ画面', () => {
    it('初期状態は「見習い・0点」で、未実装の導線は押せない', async () => {
      render(<Home />);

      expect(screen.getByRole('heading', { level: 1, name: 'ハンコマスター検定' })).toBeInTheDocument();
      expect(await screen.findByText('見習い')).toBeInTheDocument();
      expect(screen.getByText('0点')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '検定を受ける' })).toBeEnabled();
      expect(screen.getByRole('button', { name: /実績/ })).toBeDisabled();
      expect(screen.getByRole('button', { name: /ランキング/ })).toBeDisabled();
    });

    it('保存済みの進捗（実績ポイントとそれに応じた階級）を復元して表示する', async () => {
      saveProgress(45);

      render(<Home />);

      expect(await screen.findByText('上級')).toBeInTheDocument();
      expect(screen.getByText('45点')).toBeInTheDocument();
    });

    it('保存データが壊れていても、初期状態として扱い落ちない', async () => {
      window.localStorage.setItem(STORAGE_KEY, 'これはJSONではない');

      render(<Home />);

      expect(await screen.findByText('見習い')).toBeInTheDocument();
      expect(screen.getByText('0点')).toBeInTheDocument();
    });

    it('ビルド情報が未設定なら「開発版」、設定されていればバージョン・コミット・日時を表示する', () => {
      const { unmount } = render(<Home />);
      expect(screen.getByText('開発版')).toBeInTheDocument();
      unmount();

      vi.stubEnv('NEXT_PUBLIC_APP_VERSION', '1.2.3');
      vi.stubEnv('NEXT_PUBLIC_APP_BUILD_SHA', 'abc1234');
      vi.stubEnv('NEXT_PUBLIC_APP_BUILD_TIME', '2026-11-17T00:00:00Z');
      render(<Home />);

      expect(screen.getByText('v1.2.3 / abc1234 / 2026-11-17T00:00:00Z')).toBeInTheDocument();
    });
  });

  describe('画面遷移とURL同期', () => {
    it('「検定を受ける」で案件選択へ進み、URLに反映され、クリック音が鳴る', async () => {
      const user = userEvent.setup();
      render(<Home />);

      await goToSelection(user);

      expect(screen.getByRole('heading', { name: '案件を選択してください' })).toBeInTheDocument();
      expect(window.location.search).toBe('?screen=selection');
      expect(playClickSound).toHaveBeenCalledTimes(1);
    });

    it('案件選択の「戻る」でトップへ戻り、URLからクエリが消える', async () => {
      const user = userEvent.setup();
      render(<Home />);
      await goToSelection(user);

      await user.click(screen.getByRole('button', { name: '戻る' }));

      expect(screen.getByRole('heading', { level: 1, name: 'ハンコマスター検定' })).toBeInTheDocument();
      expect(window.location.search).toBe('');
    });

    it('案件を選ぶとプレイ画面へ進み、案件名・案件idがURLに反映される', async () => {
      const user = userEvent.setup();
      render(<Home />);
      await goToSelection(user);

      await user.click(scenarioButton());

      expect(screen.getByRole('heading', { name: pcPurchaseScenario.title })).toBeInTheDocument();
      expect(screen.getByText(`プレイ中: ${pcPurchaseScenario.id}`)).toBeInTheDocument();
      expect(window.location.search).toBe(`?screen=game&scenario=${pcPurchaseScenario.id}`);
    });

    it('プレイ画面の「戻る」で案件選択へ戻る', async () => {
      const user = userEvent.setup();
      render(<Home />);
      await goToSelection(user);
      await user.click(scenarioButton());

      await user.click(screen.getByRole('button', { name: 'プレイ画面の戻る' }));

      expect(screen.getByRole('heading', { name: '案件を選択してください' })).toBeInTheDocument();
      expect(window.location.search).toBe('?screen=selection');
    });

    it('URLの指定（案件選択）から画面を復元する', async () => {
      window.history.replaceState(null, '', '/?screen=selection');

      render(<Home />);

      expect(await screen.findByRole('heading', { name: '案件を選択してください' })).toBeInTheDocument();
    });

    it('URLの指定（プレイ画面と案件id）から該当の案件のプレイ画面を復元する', async () => {
      window.history.replaceState(null, '', `/?screen=game&scenario=${pcPurchaseScenario.id}`);

      render(<Home />);

      expect(await screen.findByText(`プレイ中: ${pcPurchaseScenario.id}`)).toBeInTheDocument();
    });

    it('URLが存在しない案件idを指していても、トップ画面のままで落ちない', async () => {
      window.history.replaceState(null, '', '/?screen=game&scenario=no-such-scenario');

      render(<Home />);

      expect(screen.getByRole('heading', { level: 1, name: 'ハンコマスター検定' })).toBeInTheDocument();
      expect(screen.queryByText(/プレイ中:/)).not.toBeInTheDocument();
    });
  });

  describe('案件クリアと進捗', () => {
    async function playAndComplete(user: ReturnType<typeof userEvent.setup>, buttonName: string) {
      await goToSelection(user);
      await user.click(scenarioButton());
      await user.click(screen.getByRole('button', { name: buttonName }));
    }

    it('合格すると結果画面へ進み、成功音が鳴り、実績ポイントとクリア済み案件が保存され、昇格が表示される', async () => {
      const user = userEvent.setup();
      render(<Home />);

      await playAndComplete(user, '満点で完了');

      expect(screen.getByRole('heading', { name: `${pcPurchaseScenario.title}：案件クリア` })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /昇格.*「初級」に認定されました/ })).toBeInTheDocument();
      expect(playSuccessSound).toHaveBeenCalledTimes(1);
      expect(playFailureSound).not.toHaveBeenCalled();
      // 基礎10点 + 満点100/10 = 20点
      expect(storedProgress()).toEqual({ points: 20, clearedScenarioIds: [pcPurchaseScenario.id] });
      expect(window.location.search).toBe(`?screen=result&scenario=${pcPurchaseScenario.id}`);
    });

    it('クリア後に案件選択へ戻ると、その案件が「クリア済み」になり、トップの階級・点数にも反映される', async () => {
      const user = userEvent.setup();
      render(<Home />);
      await playAndComplete(user, '満点で完了');

      await user.click(screen.getByRole('button', { name: '案件選択へ戻る' }));
      expect(scenarioButton()).toHaveTextContent('✓');

      await user.click(screen.getByRole('button', { name: '戻る' }));
      expect(screen.getByText('初級')).toBeInTheDocument();
      expect(screen.getByText('20点')).toBeInTheDocument();
    });

    it('不合格だと失敗音が鳴り、差し戻しの結果になり、進捗は保存されず昇格もしない', async () => {
      const user = userEvent.setup();
      render(<Home />);

      await playAndComplete(user, '不合格で完了');

      expect(screen.getByRole('heading', { name: /差し戻されました/ })).toBeInTheDocument();
      expect(screen.queryByText(/昇格/)).not.toBeInTheDocument();
      expect(playFailureSound).toHaveBeenCalledTimes(1);
      expect(playSuccessSound).not.toHaveBeenCalled();
      expect(storedProgress()).toBeNull();
    });

    it('合格しても階級が上がらない場合は、昇格を表示しない', async () => {
      saveProgress(45); // 上級。+20点で65点でも上級のまま
      const user = userEvent.setup();
      render(<Home />);
      await screen.findByText('上級');

      await playAndComplete(user, '満点で完了');

      expect(screen.getByRole('heading', { name: /承認されました/ })).toBeInTheDocument();
      expect(screen.queryByText(/昇格/)).not.toBeInTheDocument();
      expect(storedProgress()).toEqual({ points: 65, clearedScenarioIds: [pcPurchaseScenario.id] });
    });

    it('最高ランク（ハンコマスター）へ昇格すると、エンディングを最後まで見てトップへ戻れる', async () => {
      saveProgress(85); // 師範。+20点で105点 = ハンコマスター
      const user = userEvent.setup();
      render(<Home />);
      await screen.findByText('師範');

      await playAndComplete(user, '満点で完了');
      expect(screen.getByRole('heading', { name: /昇格.*「ハンコマスター」に認定されました/ })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: '案件選択へ戻る' })).not.toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'エンディングを見る' }));
      expect(window.location.search).toBe('?screen=ending');
      for (let i = 0; i < 5; i++) {
        await user.click(screen.getByRole('main'));
      }
      expect(screen.getByRole('heading', { name: 'GAME CLEAR' })).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'トップ画面へ戻る' }));

      expect(screen.getByRole('heading', { level: 1, name: 'ハンコマスター検定' })).toBeInTheDocument();
      expect(screen.getByText('ハンコマスター')).toBeInTheDocument();
      expect(screen.getByText('105点')).toBeInTheDocument();
      expect(window.location.search).toBe('');
    });
  });
});
