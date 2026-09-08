'use client';

import { useEffect, useState } from 'react';
import type { Rule } from '@/types/scenario';
import { scoreByTargetTolerance, type MinigameScore } from '@/lib/scoring';

const POSITION_STEP = 4;
const TICK_INTERVAL_MS = 60;
const MIN_POSITION = 0;
const MAX_POSITION = 100;

export type MovingStampTapResult = {
  actual: number; // タップ時点の印鑑の位置（0〜100）
  score: MinigameScore;
};

type MovingStampTapMinigameProps = {
  rule: Rule;
  onComplete: (result: MovingStampTapResult) => void;
};

// 左右に往復移動する印鑑を、適切なタイミングでタップして止めるミニゲーム
// （issue #205「飛び回る印鑑」）。停止（タップ）時点の位置をRule.target・
// Rule.toleranceで採点するため、早すぎる/遅すぎるタップは目標位置から
// 外れた場所で止まる結果としてfail判定に反映される。位置と移動方向を
// 1つのstateにまとめているのは、両者を同時に更新する必要があり、
// 別々のuseStateだと片方の更新用コールバック内でもう片方のsetterを
// 呼ぶ不純な更新関数になってしまうのを避けるため。
type MovingState = { position: number; direction: 1 | -1 };

export default function MovingStampTapMinigame({ rule, onComplete }: MovingStampTapMinigameProps) {
  const [moving, setMoving] = useState<MovingState>({ position: MIN_POSITION, direction: 1 });
  const [stopped, setStopped] = useState(false);

  useEffect(() => {
    if (stopped) return;
    const timer = setInterval(() => {
      setMoving((prev) => {
        let next = prev.position + POSITION_STEP * prev.direction;
        let direction = prev.direction;
        if (next >= MAX_POSITION) {
          next = MAX_POSITION;
          direction = -1;
        } else if (next <= MIN_POSITION) {
          next = MIN_POSITION;
          direction = 1;
        }
        return { position: next, direction };
      });
    }, TICK_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [stopped]);

  const handleTap = () => {
    setStopped(true);
    const score = scoreByTargetTolerance(rule, moving.position);
    onComplete({ actual: moving.position, score });
  };

  return (
    <div className="d-flex flex-column align-items-center gap-3 w-100">
      <div className="position-relative border rounded bg-white w-100" style={{ height: '4rem' }}>
        <div
          style={{
            position: 'absolute',
            left: `${moving.position}%`,
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: '3rem',
            height: '3rem',
          }}
          className="rounded-circle border border-2 border-danger d-flex align-items-center justify-content-center text-danger fw-bold user-select-none"
        >
          <span className="small d-block" style={{ letterSpacing: '0.2em', lineHeight: 1 }}>
            鈴木
          </span>
        </div>
      </div>
      <p className="small text-secondary mb-0 text-center">{rule.description}</p>
      <button
        type="button"
        onClick={handleTap}
        disabled={stopped}
        className="btn btn-danger px-4 py-2 fw-bold shadow-sm"
      >
        スタンプ！
      </button>
    </div>
  );
}
