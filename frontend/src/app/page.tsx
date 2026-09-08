'use client';

import React, { useState } from 'react';

import { useEffect } from 'react';
import { playClickSound, playSuccessSound, playFailureSound } from './sfx';
import { scenarios, pcPurchaseScenario } from '@/data/scenarios';
import ScenarioSelectionScreen from '@/components/ScenarioSelectionScreen';
import RotatingStampMinigame, {
  type RotatingStampResult,
} from '@/components/RotatingStampMinigame';
import type { MinigameScore } from '@/lib/scoring';
import type { Rule } from '@/types/scenario';

type Screen = 'top' | 'selection' | 'game';

// 現在ランク・認定スコア・案件クリア状況は、判定エンジン（#198）・昇格ランク
// システム（#199）・結果画面（#200）で実装される永続化の仕組みに依存するため、
// MVPのトップ画面・案件選択画面（#193）では固定値のプレースホルダーとする。
const RANK_NAMES = ['見習い', '初級', '中級', '上級', '師範', 'ハンコマスター'];
const CURRENT_RANK = 0;
const CERTIFICATION_SCORE = 0;
const CLEARED_SCENARIO_IDS: string[] = [];

// MVPでは案件を1件のみサンプル実装しているため、案件選択に関わらず起票ステージの
// 単一ルールで固定のデモとする。案件ごとの複数ステージ進行は#194で実装する。
const DEMO_STAGE = pcPurchaseScenario.stages[0];
const DEMO_RULE = DEMO_STAGE.rules[0];

const isValidScore = (value: string | null): value is MinigameScore =>
  value === 'excellent' || value === 'good' || value === 'fail';

export default function Home() {
  const [screen, setScreen] = useState<Screen>('top');
  const [minigameResult, setMinigameResult] = useState<RotatingStampResult | null>(null);

  // URLパラメータと状態の同期用関数
  const updateUrl = (currentScreen: Screen, result: RotatingStampResult | null) => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams();
    if (currentScreen !== 'top') {
      params.set('screen', currentScreen);
      if (currentScreen === 'game' && result) {
        params.set('actual', result.actual.toString());
        params.set('score', result.score);
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
    const actualParam = params.get('actual');
    const scoreParam = params.get('score');

    if (screenParam === 'selection' || screenParam === 'game') {
      setScreen(screenParam);
    }
    if (actualParam !== null && isValidScore(scoreParam)) {
      setMinigameResult({ actual: Number(actualParam), score: scoreParam });
    }
  }, []);

  const handleGoToSelection = () => {
    playClickSound();
    setScreen('selection');
    updateUrl('selection', null);
  };

  const handleSelectScenario = () => {
    playClickSound();
    setScreen('game');
    setMinigameResult(null);
    updateUrl('game', null);
  };

  const handleMinigameComplete = (result: RotatingStampResult) => {
    setMinigameResult(result);
    updateUrl('game', result);
    if (result.score === 'fail') {
      playFailureSound();
    } else {
      playSuccessSound();
    }
  };

  const handleRetry = () => {
    playClickSound();
    setMinigameResult(null);
    updateUrl('game', null);
  };

  const handleBackToTop = () => {
    playClickSound();
    setScreen('top');
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

  if (screen === 'game') {
    return (
      <main className="d-flex min-vh-100 flex-column align-items-center justify-content-center p-4 p-md-5 bg-light">
        <div className="card w-100 shadow-sm" style={{ maxWidth: '42rem' }}>
          <div className="card-body p-4">
            <div className="d-flex justify-content-between align-items-center border-bottom pb-3 mb-4">
              <div>
                <span className="badge bg-danger-subtle text-danger-emphasis">
                  ステージ 1（起票）
                </span>
                <h2 className="fs-4 fw-bold mt-1">{pcPurchaseScenario.title}</h2>
              </div>
              <button
                onClick={handleGoToSelection}
                className="btn btn-link btn-sm text-secondary text-decoration-none p-0"
              >
                戻る
              </button>
            </div>

            <div className="alert alert-warning mb-4">
              <h3 className="alert-heading fs-6 fw-semibold mb-1">
                ミッション
              </h3>
              <p className="small mb-0">{pcPurchaseScenario.description}</p>
            </div>

            {/* 判定結果の表示 */}
            {minigameResult && (
              <div
                className={`alert ${minigameResult.score !== 'fail' ? 'alert-success' : 'alert-danger'} mb-4`}
              >
                <h4 className="alert-heading fs-6 fw-bold mb-1">
                  {formatResultHeading(minigameResult.score)}
                </h4>
                <p className="small mb-0">{getFlavorMessage(minigameResult, DEMO_RULE)}</p>
              </div>
            )}

            {/* コントロールパネル */}
            {!minigameResult ? (
              <RotatingStampMinigame rule={DEMO_RULE} onComplete={handleMinigameComplete} />
            ) : (
              <div className="d-flex gap-3">
                <button
                  onClick={handleRetry}
                  className="btn btn-outline-secondary flex-fill py-2 fw-bold"
                >
                  もう一度調整する
                </button>
                {minigameResult.score !== 'fail' && (
                  <button
                    onClick={handleGoToSelection}
                    className="btn btn-success flex-fill py-2 fw-bold shadow-sm"
                  >
                    案件選択へ戻る
                  </button>
                )}
              </div>
            )}
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
            onClick={handleGoToSelection}
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

export function formatResultHeading(score: MinigameScore): string {
  if (score === 'excellent') return '🎉 合格（Excellent）！';
  if (score === 'good') return '🎉 合格（Good）';
  return '❌ 差し戻し！';
}

// 課長の評（issue #191の風刺トーンを、汎用スコア（excellent/good/fail）に
// マッピングする形で維持する）。案件・ルールごとの本格的な文言整備は
// #202「初期案件コンテンツ整備」で行う想定のため、ここでは最小限のバリエーションに
// とどめる。
export function getFlavorMessage(result: RotatingStampResult, rule: Rule): string {
  if (result.score === 'excellent') {
    return '課長「うむ、実に見事な捺印だ！上司への敬意が痛いほど伝わってくる。これぞ一流の社会人だな！」';
  }
  if (result.score === 'good') {
    return '課長「まあ、及第点というやつだな。もう少し研ぎ澄ませば一流に近づくだろう。」';
  }
  const target = rule.target ?? 0;
  if (result.actual > target) {
    return '課長「バカ者！上司への敬意が感じられんぞ！あまりに不誠実だ、すぐに押し直したまえ！」';
  }
  return '課長「いくら何でもやりすぎだ。ほどほどにしたまえ。」';
}
