'use client';

import { useState } from 'react';
import type { Rule } from '@/types/scenario';
import { scoreByTargetTolerance, type MinigameScore } from '@/lib/scoring';

// 1「距離単位」（Rule.target・toleranceと同じ単位）あたりの見た目上のピクセル数
const PIXELS_PER_UNIT = 40;

export type DragDropStampResult = {
  actual: number; // 基準位置からの距離（Rule.target・toleranceと同じ単位、下方向が正）
  score: MinigameScore;
};

type DragDropStampMinigameProps = {
  rule: Rule;
  // 基準マーカーのラベル。序盤（絶対座標ベース）は目標位置そのもの、
  // 検閲ステージ（相対位置制約）は既存の印影（例:「課長印」）を表す
  // （issue #197「後半: 他要素（既存の印影）との相対位置制約」）。
  referenceLabel?: string;
  onComplete: (result: DragDropStampResult) => void;
};

// ドラッグ&ドロップで印鑑を基準位置へ合わせるミニゲーム（issue #197
// 「捺印位置合わせ」）。基準マーカーからの縦方向のずれをRule.target・
// Rule.toleranceで採点する。同じ実装で「固定の目標位置に合わせる」
// （序盤）・「既存の印影から一定距離離す」（検閲、相対位置制約）の
// 両方を表現できる。
export default function DragDropStampMinigame({
  rule,
  referenceLabel = '目標位置',
  onComplete,
}: DragDropStampMinigameProps) {
  const [dragging, setDragging] = useState(false);
  const [startY, setStartY] = useState<number | null>(null);
  const [offsetUnits, setOffsetUnits] = useState(0);
  const [result, setResult] = useState<DragDropStampResult | null>(null);

  const handleDragStart = (clientY: number) => {
    if (result) return;
    setDragging(true);
    setStartY(clientY);
  };

  const handleDragMove = (clientY: number) => {
    if (!dragging || startY === null) return;
    setOffsetUnits((clientY - startY) / PIXELS_PER_UNIT);
  };

  const handleDragEnd = () => {
    if (!dragging) return;
    setDragging(false);
    setStartY(null);

    const score = scoreByTargetTolerance(rule, offsetUnits);
    const nextResult: DragDropStampResult = { actual: offsetUnits, score };
    setResult(nextResult);
    onComplete(nextResult);
  };

  return (
    <div className="d-flex flex-column align-items-center gap-3 w-100">
      <div
        className="position-relative border rounded bg-white w-100"
        style={{ height: '10rem', touchAction: 'none' }}
        onMouseMove={(e) => handleDragMove(e.clientY)}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
        onTouchMove={(e) => handleDragMove(e.touches[0].clientY)}
        onTouchEnd={handleDragEnd}
      >
        {/* 基準マーカー */}
        <div
          className="position-absolute start-50 translate-middle-x text-center small text-secondary"
          style={{ top: '1rem' }}
        >
          <div
            className="rounded-circle border border-secondary mx-auto"
            style={{ width: '2rem', height: '2rem' }}
          />
          <span>{referenceLabel}</span>
        </div>

        {/* プレイヤーが動かす印影 */}
        <div
          role="button"
          tabIndex={0}
          onMouseDown={(e) => handleDragStart(e.clientY)}
          onTouchStart={(e) => handleDragStart(e.touches[0].clientY)}
          className="position-absolute start-50 translate-middle-x rounded-circle border border-2 border-danger d-flex align-items-center justify-content-center text-danger fw-bold user-select-none"
          style={{
            width: '3rem',
            height: '3rem',
            top: `calc(4rem + ${offsetUnits * PIXELS_PER_UNIT}px)`,
            cursor: result ? 'default' : 'grab',
          }}
        >
          <span className="small d-block" style={{ letterSpacing: '0.2em', lineHeight: 1 }}>
            鈴木
          </span>
        </div>
      </div>
      <p className="small text-secondary mb-0 text-center">{rule.description}</p>
    </div>
  );
}
