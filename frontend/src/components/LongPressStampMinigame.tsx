'use client';

import { useEffect, useState } from 'react';
import type { Rule } from '@/types/scenario';
import { scoreByTargetTolerance, type MinigameScore } from '@/lib/scoring';

const TICK_INTERVAL_MS = 100;
// 印影の濃さ（opacity）を視覚的にフィードバックするための上限。実際の合否判定は
// Rule.target・Rule.toleranceに基づく（issue #196の「短すぎる/適正/長すぎる」判定）。
const MAX_VISUAL_PRESS_MS = 2000;
const MIN_OPACITY = 0.2;

export type LongPressStampResult = {
  actual: number; // 長押しした時間（秒）
  score: MinigameScore;
};

type LongPressStampMinigameProps = {
  rule: Rule;
  onComplete: (result: LongPressStampResult) => void;
};

// 短すぎる（fail・目標未満）→「軽率です」、適正（excellent/good）→「誠意を感じます」、
// 長すぎる（fail・目標超過）→「押しが強すぎます」（issue #196の判定文言）
export function describePressureFeedback(score: MinigameScore, actual: number, rule: Rule): string {
  if (score !== 'fail') return '誠意を感じます';
  const target = rule.target ?? 0;
  return actual < target ? '軽率です' : '押しが強すぎます';
}

// タップしている時間を計測し、印影の濃さに変換するミニゲーム（issue #196
// 「長押し捺印」）。押している間は`pressElapsedMs`を一定間隔で更新して
// 印影の濃さをリアルタイムに反映し、指を離した時点の時間をRule.target・
// Rule.toleranceで採点する。
export default function LongPressStampMinigame({ rule, onComplete }: LongPressStampMinigameProps) {
  const [pressing, setPressing] = useState(false);
  const [pressStartTime, setPressStartTime] = useState<number | null>(null);
  const [pressElapsedMs, setPressElapsedMs] = useState(0);
  const [result, setResult] = useState<LongPressStampResult | null>(null);

  useEffect(() => {
    if (!pressing || pressStartTime === null) return;
    const timer = setInterval(() => {
      setPressElapsedMs(Date.now() - pressStartTime);
    }, TICK_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [pressing, pressStartTime]);

  const handlePressStart = () => {
    if (result) return;
    setPressStartTime(Date.now());
    setPressElapsedMs(0);
    setPressing(true);
  };

  const handlePressEnd = () => {
    if (!pressing || pressStartTime === null) return;
    const durationSec = (Date.now() - pressStartTime) / 1000;
    setPressStartTime(null);
    setPressing(false);

    const score = scoreByTargetTolerance(rule, durationSec);
    const nextResult: LongPressStampResult = { actual: durationSec, score };
    setResult(nextResult);
    onComplete(nextResult);
  };

  const opacity = Math.min(1, MIN_OPACITY + (pressElapsedMs / MAX_VISUAL_PRESS_MS) * (1 - MIN_OPACITY));

  return (
    <div className="d-flex flex-column align-items-center gap-3">
      <div
        style={{
          opacity: result ? 1 : opacity,
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
        onMouseDown={handlePressStart}
        onMouseUp={handlePressEnd}
        onMouseLeave={handlePressEnd}
        onTouchStart={handlePressStart}
        onTouchEnd={handlePressEnd}
        disabled={!!result}
        className="btn btn-danger px-4 py-2 fw-bold shadow-sm"
      >
        押し続ける
      </button>
    </div>
  );
}
