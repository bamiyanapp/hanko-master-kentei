'use client';

import { useState } from 'react';
import type { Rule, Scenario, StageType } from '@/types/scenario';
import type { MinigameScore } from '@/lib/scoring';
import { judge, type JudgementResult, type RuleResult } from '@/lib/judgement';
import RotatingStampMinigame from './RotatingStampMinigame';
import LongPressStampMinigame from './LongPressStampMinigame';
import DragDropStampMinigame from './DragDropStampMinigame';

type MinigameResult = { actual: number; score: MinigameScore };

const STAGE_LABELS: Record<StageType, string> = {
  kito: '起票',
  saikan: '再鑑',
  kenetsu: '検閲',
};

// 謎マナー（Rule.type: "custom"）専用のミニゲームは未実装（issue #196〜197の
// 対象外）のため、暫定的に「承知する」操作のみで常にgood評価とするスタブを
// 用意する。理由を検証しようがない謎マナーを、形式上受理してしまう
// 官僚主義的な滑稽さ自体が#191の風刺と噛み合うため、この挙動は意図的な
// 割り切りとした。より作り込んだ演出は将来のissueで対応する。
export function CustomRuleStub({
  rule,
  onComplete,
}: {
  rule: Rule;
  onComplete: (result: MinigameResult) => void;
}) {
  return (
    <div className="d-flex flex-column align-items-center gap-3">
      <p className="small text-secondary mb-0 text-center">{rule.description}</p>
      <button
        type="button"
        onClick={() => onComplete({ actual: 0, score: 'good' })}
        className="btn btn-danger px-4 py-2 fw-bold shadow-sm"
      >
        承知しました
      </button>
    </div>
  );
}

function renderRuleMinigame(rule: Rule, onComplete: (result: MinigameResult) => void) {
  switch (rule.type) {
    case 'angle':
      return <RotatingStampMinigame rule={rule} onComplete={onComplete} />;
    // timing（押印速度等）とpressure（印影濃度）はいずれも「押している時間を
    // 測る」という同一の操作で表現できるため、同じミニゲームを再利用する
    // （#196のissue本文が定義する操作自体はpressure専用ではなく、target/
    // toleranceに基づく汎用の長押し計測のため）。
    case 'timing':
    case 'pressure':
      return <LongPressStampMinigame rule={rule} onComplete={onComplete} />;
    case 'position':
      return (
        <DragDropStampMinigame
          rule={rule}
          referenceLabel={rule.description.includes('課長印') ? '課長印' : '目標位置'}
          onComplete={onComplete}
        />
      );
    case 'custom':
    default:
      return <CustomRuleStub rule={rule} onComplete={onComplete} />;
  }
}

type ApplicationStageFlowProps = {
  scenario: Scenario;
  onComplete: (result: JudgementResult) => void;
  onBack: () => void;
};

// 1案件を「起票→再鑑→検閲」の3ステージで進行させるゲームエンジン部分
// （issue #194）。各ステージの`Stage.rules`を順に適用してミニゲームへ渡し、
// ステージの全ルール完了時点で判定エンジン（#198の`judge()`）を呼び出して
// 合否を決定する。不合格の場合は同じステージを最初のルールからやり直す
// （再提出）。全ステージ合格で案件クリアとなり、`onComplete`へ全ステージ
// 通算の判定結果を渡す。
export default function ApplicationStageFlow({
  scenario,
  onComplete,
  onBack,
}: ApplicationStageFlowProps) {
  const [stageIndex, setStageIndex] = useState(0);
  const [ruleIndex, setRuleIndex] = useState(0);
  const [stageResults, setStageResults] = useState<RuleResult[]>([]);
  const [allResults, setAllResults] = useState<RuleResult[]>([]);
  const [stageJudgement, setStageJudgement] = useState<JudgementResult | null>(null);

  const stage = scenario.stages[stageIndex];
  const rule = stage.rules[ruleIndex];
  const isLastStage = stageIndex === scenario.stages.length - 1;

  const handleRuleComplete = (result: MinigameResult) => {
    const nextStageResults = [...stageResults, { rule, score: result.score }];

    if (ruleIndex + 1 < stage.rules.length) {
      setStageResults(nextStageResults);
      setRuleIndex(ruleIndex + 1);
      return;
    }

    setStageResults(nextStageResults);
    setStageJudgement(judge(nextStageResults));
  };

  const handleRetryStage = () => {
    setRuleIndex(0);
    setStageResults([]);
    setStageJudgement(null);
  };

  const handleAdvance = () => {
    const nextAllResults = [...allResults, ...stageResults];

    if (isLastStage) {
      onComplete(judge(nextAllResults));
      return;
    }

    setAllResults(nextAllResults);
    setStageIndex(stageIndex + 1);
    setRuleIndex(0);
    setStageResults([]);
    setStageJudgement(null);
  };

  if (stageJudgement) {
    return (
      <div className="d-flex flex-column gap-3">
        <div className={`alert ${stageJudgement.passed ? 'alert-success' : 'alert-danger'} mb-0`}>
          <h4 className="alert-heading fs-6 fw-bold mb-1">
            {stageJudgement.passed ? '🎉 合格！' : '❌ 差し戻し！'}（
            {STAGE_LABELS[stage.type]}・総合スコア{stageJudgement.overallScore}点）
          </h4>
          <p className="small mb-0">{stageJudgement.comment}</p>
        </div>
        {stageJudgement.passed ? (
          <button
            onClick={handleAdvance}
            className="btn btn-success py-2 fw-bold shadow-sm"
          >
            {isLastStage ? '案件をクリアする' : '次のステージへ進む'}
          </button>
        ) : (
          <button
            onClick={handleRetryStage}
            className="btn btn-outline-secondary py-2 fw-bold"
          >
            このステージをやり直す
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="d-flex flex-column gap-3">
      <div className="d-flex justify-content-between align-items-center">
        <span className="badge bg-danger-subtle text-danger-emphasis">
          ステージ {stageIndex + 1}（{STAGE_LABELS[stage.type]}） {ruleIndex + 1}/
          {stage.rules.length}件目
        </span>
        <button
          onClick={onBack}
          className="btn btn-link btn-sm text-secondary text-decoration-none p-0"
        >
          戻る
        </button>
      </div>
      {renderRuleMinigame(rule, handleRuleComplete)}
    </div>
  );
}
