'use client';

import React, { useState } from 'react';

import { useEffect } from 'react';
import { playClickSound, playSuccessSound, playFailureSound } from './sfx';
import { scenarios, getScenarioById } from '@/data/scenarios';
import type { Scenario } from '@/types/scenario';
import ScenarioSelectionScreen from '@/components/ScenarioSelectionScreen';
import ApplicationStageFlow from '@/components/ApplicationStageFlow';
import { METRIC_NAMES, type JudgementResult } from '@/lib/judgement';

type Screen = 'top' | 'selection' | 'game' | 'result';

// 現在ランク・認定スコア・案件クリア状況は、昇格ランクシステム（#199）で
// 実装される永続化の仕組みに依存するため、MVPのトップ画面・案件選択画面
// （#193）では固定値のプレースホルダーとする。
const RANK_NAMES = ['見習い', '初級', '中級', '上級', '師範', 'ハンコマスター'];
const CURRENT_RANK = 0;
const CERTIFICATION_SCORE = 0;
const CLEARED_SCENARIO_IDS: string[] = [];

export default function Home() {
  const [screen, setScreen] = useState<Screen>('top');
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  const [scenarioResult, setScenarioResult] = useState<JudgementResult | null>(null);

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

  const handleGoToSelection = () => {
    playClickSound();
    setScreen('selection');
    setSelectedScenario(null);
    setScenarioResult(null);
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
    } else {
      playFailureSound();
    }
  };

  const handleBackToTop = () => {
    playClickSound();
    setScreen('top');
    setSelectedScenario(null);
    setScenarioResult(null);
    updateUrl('top', null);
  };

  if (screen === 'selection') {
    return (
      <ScenarioSelectionScreen
        scenarios={scenarios}
        currentRank={CURRENT_RANK}
        clearedScenarioIds={CLEARED_SCENARIO_IDS}
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
      <main className="d-flex min-vh-100 flex-column align-items-center justify-content-center p-4 p-md-5 bg-light">
        <div className="card w-100 shadow-sm" style={{ maxWidth: '42rem' }}>
          <div className="card-body p-4">
            <h2 className="fs-4 fw-bold mb-3">{selectedScenario.title}：案件クリア</h2>
            <div className={`alert ${scenarioResult.passed ? 'alert-success' : 'alert-danger'} mb-4`}>
              <h3 className="alert-heading fs-6 fw-bold mb-1">
                {scenarioResult.passed ? '🎉 承認されました！' : '❌ 差し戻されました'}（総合スコア
                {scenarioResult.overallScore}点）
              </h3>
              <p className="small mb-0">{scenarioResult.comment}</p>
            </div>

            <div className="row row-cols-2 g-3 mb-4">
              {METRIC_NAMES.map((metric) => (
                <div key={metric} className="col">
                  <div className="border rounded p-2 text-center">
                    <div className="small text-secondary">{metric}</div>
                    <div className="fs-5 fw-bold">
                      {scenarioResult.metricScores[metric] ?? '－'}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleGoToSelection}
              className="btn btn-success w-100 py-2 fw-bold shadow-sm"
            >
              案件選択へ戻る
            </button>
          </div>
        </div>
      </main>
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
            現在の階級: <strong className="text-body">{RANK_NAMES[CURRENT_RANK]}</strong>
          </span>
          <span>
            認定スコア: <strong className="text-body">{CERTIFICATION_SCORE}点</strong>
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
