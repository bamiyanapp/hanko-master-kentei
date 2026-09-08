'use client';

import { useState } from 'react';
import type { Rule } from '@/types/scenario';
import { scoreByTargetTolerance, type MinigameScore } from '@/lib/scoring';

const DEG_PER_PIXEL = 0.5;
const MAX_TILT_DEG = 90;

export type TiltStampResult = {
  actual: number; // 傾き角度（度、右傾きが正）
  score: MinigameScore;
};

type TiltStampMinigameProps = {
  rule: Rule;
  onComplete: (result: TiltStampResult) => void;
};

// 印影を左右へドラッグして傾け、指定角度で捺印するミニゲーム（issue #205
// 「お辞儀捺印」）。RotatingStampMinigameが「連続回転を止める」という間接
// 操作なのに対し、本ミニゲームはドラッグによる直接操作で角度そのものを
// 作る点が異なる。捺印確定時の角度をRule.target・Rule.toleranceで採点する。
export default function TiltStampMinigame({ rule, onComplete }: TiltStampMinigameProps) {
  const [dragging, setDragging] = useState(false);
  const [startX, setStartX] = useState<number | null>(null);
  const [tiltDeg, setTiltDeg] = useState(0);
  const [result, setResult] = useState<TiltStampResult | null>(null);

  const handleDragStart = (clientX: number) => {
    if (result) return;
    setDragging(true);
    setStartX(clientX);
  };

  const handleDragMove = (clientX: number) => {
    if (!dragging || startX === null) return;
    const rawDeg = (clientX - startX) * DEG_PER_PIXEL;
    setTiltDeg(Math.max(-MAX_TILT_DEG, Math.min(MAX_TILT_DEG, rawDeg)));
  };

  const handleDragEnd = () => {
    if (!dragging) return;
    setDragging(false);
    setStartX(null);
  };

  const handleConfirm = () => {
    const score = scoreByTargetTolerance(rule, tiltDeg);
    const nextResult: TiltStampResult = { actual: tiltDeg, score };
    setResult(nextResult);
    onComplete(nextResult);
  };

  return (
    <div
      className="d-flex flex-column align-items-center gap-3 w-100"
      style={{ touchAction: 'none' }}
      onMouseMove={(e) => handleDragMove(e.clientX)}
      onMouseUp={handleDragEnd}
      onMouseLeave={handleDragEnd}
      onTouchMove={(e) => handleDragMove(e.touches[0].clientX)}
      onTouchEnd={handleDragEnd}
    >
      <div
        role="button"
        tabIndex={0}
        onMouseDown={(e) => handleDragStart(e.clientX)}
        onTouchStart={(e) => handleDragStart(e.touches[0].clientX)}
        style={{
          transform: `rotate(${tiltDeg}deg)`,
          width: '4rem',
          height: '4rem',
          cursor: result ? 'default' : 'grab',
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
        onClick={handleConfirm}
        disabled={!!result}
        className="btn btn-danger px-4 py-2 fw-bold shadow-sm"
      >
        捺印する
      </button>
    </div>
  );
}
