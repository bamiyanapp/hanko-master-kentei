'use client';

import { useEffect, useState } from 'react';
import type { Rule } from '@/types/scenario';
import { scoreByTargetTolerance, type MinigameScore } from '@/lib/scoring';

const ROTATION_DEG_PER_TICK = 6;
const TICK_INTERVAL_MS = 100;

export type RotatingStampResult = {
  actual: number;
  score: MinigameScore;
};

type RotatingStampMinigameProps = {
  rule: Rule;
  onComplete: (result: RotatingStampResult) => void;
};

// 印鑑を回転させ続け、プレイヤーのタップ（クリック）で停止させるミニゲーム
// （issue #195「回転印」）。停止時の角度をRule.target・Rule.toleranceで採点する。
export default function RotatingStampMinigame({ rule, onComplete }: RotatingStampMinigameProps) {
  const [angle, setAngle] = useState(0);
  const [stopped, setStopped] = useState(false);

  useEffect(() => {
    if (stopped) return;
    const timer = setInterval(() => {
      setAngle((prev) => (prev + ROTATION_DEG_PER_TICK) % 360);
    }, TICK_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [stopped]);

  const handleStop = () => {
    setStopped(true);
    // 表示・アニメーション用の`angle`は0〜354の範囲で単調増加させ続けるが
    // （スムーズな連続回転のため）、採点はお辞儀角度等の符号付きルール
    // （例: 左傾きを負の角度とする`target: -22.5`）と一致するよう、
    // -180〜180の範囲へ正規化した値で行う（issue #194で発覚: 正規化前は
    // angleが常に0以上のため、負のtargetを持つルールが理論上クリア不可能
    // だった）。
    const normalizedAngle = angle > 180 ? angle - 360 : angle;
    const score = scoreByTargetTolerance(rule, normalizedAngle);
    onComplete({ actual: normalizedAngle, score });
  };

  return (
    <div className="d-flex flex-column align-items-center gap-3">
      <div
        style={{
          transform: `rotate(${angle}deg)`,
          transition: stopped ? 'none' : `transform ${TICK_INTERVAL_MS}ms linear`,
          width: '4rem',
          height: '4rem',
        }}
        className="rounded-circle border border-2 border-danger d-flex align-items-center justify-content-center text-danger fw-bold user-select-none"
      >
        <span className="small d-block" style={{ letterSpacing: '0.2em', lineHeight: 1 }}>
          鈴木
        </span>
      </div>
      <p className="small text-secondary mb-0 text-center">{rule.description}</p>
      <button
        type="button"
        onClick={handleStop}
        disabled={stopped}
        className="btn btn-danger px-4 py-2 fw-bold shadow-sm"
      >
        止める
      </button>
    </div>
  );
}
