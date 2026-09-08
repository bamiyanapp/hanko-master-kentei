import type { JudgementResult } from './judgement';

// #191「4. 昇格システム」・issue #199に基づく昇格・ランクシステム。
// DBを持たないMVP構成のため、ブラウザのlocalStorageへ実績ポイント・
// クリア済み案件idを永続化する（issue「ランク状態の永続化方法をMVP範囲で
// 検討する」に対応）。

export const RANK_NAMES = ['見習い', '初級', '中級', '上級', '師範', 'ハンコマスター'];

const STORAGE_KEY = 'hanko-master-kentei:progress';

type StoredProgress = {
  points: number;
  clearedScenarioIds: string[];
};

const EMPTY_PROGRESS: StoredProgress = { points: 0, clearedScenarioIds: [] };

function loadProgress(): StoredProgress {
  if (typeof window === 'undefined' || !window.localStorage) return EMPTY_PROGRESS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_PROGRESS;
    const parsed = JSON.parse(raw);
    return {
      points: typeof parsed.points === 'number' ? parsed.points : 0,
      clearedScenarioIds: Array.isArray(parsed.clearedScenarioIds) ? parsed.clearedScenarioIds : [],
    };
  } catch {
    // 破損したデータ・プライベートブラウズ等でのアクセス拒否は初期状態として扱う
    return EMPTY_PROGRESS;
  }
}

function saveProgress(progress: StoredProgress): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // ストレージ容量超過・プライベートブラウズ等での書き込み拒否は黙って諦める
    // （進捗が保存されないだけで、ゲーム自体は引き続きプレイ可能なため）
  }
}

// クリア1件につき基礎点＋総合スコアに応じた加点を実績ポイントとして加算する
// （issue「クリア数だけでなく...総合スコアを組み合わせて判定」に対応）。
// 具体的な配点・ランク境界値は現時点でプレイテストデータが無いための
// 暫定値であり、#202での案件追加・実際のプレイ結果を踏まえて調整する
// 想定のプレースホルダーである。
const BASE_POINTS_PER_CLEAR = 10;

function calculateEarnedPoints(judgement: JudgementResult): number {
  return BASE_POINTS_PER_CLEAR + Math.round(judgement.overallScore / 10);
}

// ランクごとの到達に必要な累計実績ポイント（RANK_NAMESと同じ並び）
const RANK_THRESHOLDS = [0, 10, 25, 45, 70, 100];

export function getRankIndex(points: number): number {
  let rankIndex = 0;
  for (let i = 0; i < RANK_THRESHOLDS.length; i++) {
    if (points >= RANK_THRESHOLDS[i]) rankIndex = i;
  }
  return rankIndex;
}

export type Progress = {
  rankIndex: number;
  points: number;
  clearedScenarioIds: string[];
};

export function getProgress(): Progress {
  const progress = loadProgress();
  return { rankIndex: getRankIndex(progress.points), ...progress };
}

// 案件クリア（合格）を記録し、実績ポイントを加算する。不合格時の呼び出しは
// 無視する（#200の再提出フローで不合格時はそもそも案件クリア扱いにならない
// ため、防御的に判定する）。
export function recordScenarioClear(scenarioId: string, judgement: JudgementResult): Progress {
  if (!judgement.passed) return getProgress();

  const progress = loadProgress();
  const earnedPoints = calculateEarnedPoints(judgement);
  const clearedScenarioIds = progress.clearedScenarioIds.includes(scenarioId)
    ? progress.clearedScenarioIds
    : [...progress.clearedScenarioIds, scenarioId];
  const nextProgress: StoredProgress = { points: progress.points + earnedPoints, clearedScenarioIds };
  saveProgress(nextProgress);
  return { rankIndex: getRankIndex(nextProgress.points), ...nextProgress };
}
