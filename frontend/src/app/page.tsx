'use client';

import React, { useState } from 'react';

import { useEffect } from 'react';
import { playClickSound, playSuccessSound, playFailureSound } from './sfx';
import { scenarios, getScenarioById } from '@/data/scenarios';
import type { Scenario } from '@/types/scenario';
import ScenarioSelectionScreen from '@/components/ScenarioSelectionScreen';
import ApplicationStageFlow from '@/components/ApplicationStageFlow';
import EndingSequence from '@/components/EndingSequence';
import ScenarioResultScreen from '@/components/ScenarioResultScreen';
import type { JudgementResult } from '@/lib/judgement';
import { RANK_NAMES, getProgress, recordScenarioClear, type Progress } from '@/lib/rank';

type Screen = 'top' | 'selection' | 'game' | 'result' | 'ending';

const INITIAL_PROGRESS: Progress = { rankIndex: 0, points: 0, clearedScenarioIds: [] };

export default function Home() {
  const [screen, setScreen] = useState<Screen>('top');
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  const [scenarioResult, setScenarioResult] = useState<JudgementResult | null>(null);
  // 現在ランク・実績ポイント・案件クリア状況は昇格ランクシステム（#199）が
  // localStorageへ永続化する。SSR時・マウント直後はプレースホルダーの初期値
  // （見習い・0点・未クリア）を表示し、マウント後のuseEffectで実際の保存内容へ
  // 差し替える（ブラウザAPIに依存するため、既存のURL復元と同じパターン）。
  const [progress, setProgress] = useState<Progress>(INITIAL_PROGRESS);
  // 案件クリアの結果として実際に昇格した場合のみ非nullとなり、結果画面
  // （#200）で昇格演出を表示する。昇格していなければnullのまま
  // （issue #200「合格時は次ステージ・次案件、または昇格判定へ進む」に対応）。
  const [rankUpTo, setRankUpTo] = useState<number | null>(null);

  // URLパラメータと状態の同期用関数。ApplicationStageFlow内部のステージ・
  // ルール進行状況はコンポーネント自身が状態を持つ設計（#194）のため、
  // ここでは画面単位・選択中の案件idまでを同期対象とする。
  const updateUrl = (currentScreen: Screen, scenarioId: string | null) => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams();
    if (currentScreen !== 'top') {
      params.set('screen', currentScreen);
      if (scenarioId) {
        params.set('scenario', scenarioId);
      }
    }
    const newSearch = params.toString();
    const queryString = newSearch ? `?${newSearch}` : '';
    const newUrl = `${window.location.pathname}${queryString}`;
    window.history.pushState(null, '', newUrl);
  };

  // マウント時にURLパラメータから状態を復元
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);

    const screenParam = params.get('screen');
    const scenarioIdParam = params.get('scenario');

    if (screenParam === 'selection') {
      setScreen('selection');
    } else if (screenParam === 'game' && scenarioIdParam) {
      const scenario = getScenarioById(scenarioIdParam);
      if (scenario) {
        setSelectedScenario(scenario);
        setScreen('game');
      }
    }
  }, []);

  // マウント時にlocalStorageから昇格ランク・実績ポイント・クリア済み案件を復元
  useEffect(() => {
    setProgress(getProgress());
  }, []);

  const handleGoToSelection = () => {
    playClickSound();
    setScreen('selection');
    setSelectedScenario(null);
    setScenarioResult(null);
    setRankUpTo(null);
    updateUrl('selection', null);
  };

  const handleStartExam = () => {
    playClickSound();
    setScreen('selection');
    updateUrl('selection', null);
  };

  const handleSelectScenario = (scenarioId: string) => {
    const scenario = getScenarioById(scenarioId);
    if (!scenario) return;
    playClickSound();
    setSelectedScenario(scenario);
    setScreen('game');
    updateUrl('game', scenarioId);
  };

  const handleScenarioComplete = (result: JudgementResult) => {
    setScenarioResult(result);
    setScreen('result');
    updateUrl('result', selectedScenario?.id ?? null);
    if (result.passed) {
      playSuccessSound();
      if (selectedScenario) {
        const previousRankIndex = progress.rankIndex;
        const updatedProgress = recordScenarioClear(selectedScenario.id, result);
        setProgress(updatedProgress);
        setRankUpTo(updatedProgress.rankIndex > previousRankIndex ? updatedProgress.rankIndex : null);
      }
    } else {
      playFailureSound();
    }
  };

  const handleBackToTop = () => {
    playClickSound();
    setScreen('top');
    setSelectedScenario(null);
    setScenarioResult(null);
    setRankUpTo(null);
    updateUrl('top', null);
  };

  const handleShowEnding = () => {
    playClickSound();
    setScreen('ending');
    updateUrl('ending', null);
  };

  if (screen === 'ending') {
    return <EndingSequence onFinish={handleBackToTop} />;
  }

  if (screen === 'selection') {
    return (
      <ScenarioSelectionScreen
        scenarios={scenarios}
        currentRank={progress.rankIndex}
        clearedScenarioIds={progress.clearedScenarioIds}
        onSelect={handleSelectScenario}
        onBack={handleBackToTop}
      />
    );
  }

  if (screen === 'game' && selectedScenario) {
    return (
      <main className="d-flex min-vh-100 flex-column align-items-center justify-content-center p-4 p-md-5 bg-light">
        <div className="card w-100 shadow-sm" style={{ maxWidth: '42rem' }}>
          <div className="card-body p-4">
            <h2 className="fs-4 fw-bold mb-3">{selectedScenario.title}</h2>
            <ApplicationStageFlow
              scenario={selectedScenario}
              onComplete={handleScenarioComplete}
              onBack={handleGoToSelection}
            />
          </div>
        </div>
      </main>
    );
  }

  if (screen === 'result' && scenarioResult && selectedScenario) {
    return (
      <ScenarioResultScreen
        scenario={selectedScenario}
        result={scenarioResult}
        rankUpTo={rankUpTo}
        onBackToSelection={handleGoToSelection}
        onShowEnding={handleShowEnding}
      />
    );
  }

  return (
    <main className="d-flex min-vh-100 flex-column align-items-center justify-content-center p-4 p-md-5 hero-gradient">
      <div className="text-center mx-auto" style={{ maxWidth: '36rem' }}>
        <div className="d-inline-block bg-danger-subtle border border-danger-subtle rounded-circle p-2 mb-4 shadow-sm">
          <span className="fs-2">💮</span>
        </div>
        <h1 className="display-5 fw-bold">
          ハンコマスター検定
        </h1>
        <p className="mt-3 fs-5 text-secondary">
          誠意ある捺印こそが、社会人の基本です。
          あなたの「捺印マナー力」を今こそ証明しましょう。
        </p>

        <div className="d-flex justify-content-center gap-4 mt-4 small text-secondary">
          <span>
            現在の階級: <strong className="text-body">{RANK_NAMES[progress.rankIndex]}</strong>
          </span>
          <span>
            認定スコア: <strong className="text-body">{progress.points}点</strong>
          </span>
        </div>

        <div className="d-flex flex-column gap-2 mx-auto mt-5" style={{ maxWidth: '20rem' }}>
          <button
            onClick={handleStartExam}
            className="btn btn-danger btn-lg px-4 py-3 fw-bold shadow"
          >
            検定を受ける
          </button>
          <button className="btn btn-outline-secondary" disabled>
            実績（Coming soon）
          </button>
          <button className="btn btn-outline-secondary" disabled>
            ランキング（Coming soon）
          </button>
        </div>

        <p className="mt-4 mb-0 text-secondary" style={{ fontSize: '0.75rem' }}>
          {formatBuildInfo()}
        </p>
      </div>
    </main>
  );
}

// デプロイ済みビルドのバージョン・更新日時をトップ画面に表示する（issue #248）。
// CD実行時（cd.ymlの「ビルド情報を環境変数へ設定」ステップ）にのみ
// NEXT_PUBLIC_APP_*が設定されるため、ローカル開発時は未設定フォールバックになる。
function formatBuildInfo(): string {
  const version = process.env.NEXT_PUBLIC_APP_VERSION;
  const sha = process.env.NEXT_PUBLIC_APP_BUILD_SHA;
  const time = process.env.NEXT_PUBLIC_APP_BUILD_TIME;
  if (!version && !sha && !time) return '開発版';
  return [version && `v${version}`, sha, time].filter(Boolean).join(' / ');
}
