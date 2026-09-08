import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getRankIndex, getProgress, recordScenarioClear } from './rank';
import type { JudgementResult } from './judgement';

// 本テストファイル専用のインメモリlocalStorageモック（vitestはデフォルトで
// isolate: trueのためファイル単位でプロセスが分かれ、他テストファイルの
// globalへは影響しない）。
class MemoryStorage {
  private store = new Map<string, string>();
  getItem(key: string): string | null {
    return this.store.has(key) ? (this.store.get(key) as string) : null;
  }
  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }
  removeItem(key: string): void {
    this.store.delete(key);
  }
  clear(): void {
    this.store.clear();
  }
}

type MockWindow = { localStorage: MemoryStorage } | undefined;
function setMockWindow(value: MockWindow): void {
  Reflect.set(globalThis, 'window', value);
}
function getMockWindow(): MockWindow {
  return Reflect.get(globalThis, 'window') as unknown as MockWindow;
}
const originalWindow = getMockWindow();

function makeJudgement(overrides: Partial<JudgementResult> = {}): JudgementResult {
  return {
    overallScore: 100,
    metricScores: { 格式: null, 礼節: 100, 誠意: null, 精密性: null },
    passed: true,
    comment: 'ok',
    ...overrides,
  };
}

describe('rank', () => {
  beforeEach(() => {
    setMockWindow({ localStorage: new MemoryStorage() });
  });

  afterEach(() => {
    setMockWindow(originalWindow);
  });

  it('getRankIndexは累計ポイントに応じたランクを返す', () => {
    expect(getRankIndex(0)).toBe(0); // 見習い
    expect(getRankIndex(9)).toBe(0);
    expect(getRankIndex(10)).toBe(1); // 初級
    expect(getRankIndex(24)).toBe(1);
    expect(getRankIndex(25)).toBe(2); // 中級
    expect(getRankIndex(45)).toBe(3); // 上級
    expect(getRankIndex(70)).toBe(4); // 師範
    expect(getRankIndex(100)).toBe(5); // ハンコマスター
    expect(getRankIndex(9999)).toBe(5); // 上限を超えても最高ランクのまま
  });

  it('windowが無い場合（SSR相当）は初期状態を返す', () => {
    setMockWindow(undefined);
    expect(getProgress()).toEqual({ rankIndex: 0, points: 0, clearedScenarioIds: [] });
  });

  it('初期状態はポイント0・クリア済みなし', () => {
    expect(getProgress()).toEqual({ rankIndex: 0, points: 0, clearedScenarioIds: [] });
  });

  it('合格時にrecordScenarioClearでポイントが加算されクリア済みに記録される', () => {
    const result = recordScenarioClear('pc-purchase', makeJudgement({ overallScore: 100 }));

    // 基礎10点 + round(100/10) = 20点
    expect(result.points).toBe(20);
    expect(result.clearedScenarioIds).toEqual(['pc-purchase']);
    expect(getProgress()).toEqual(result);
  });

  it('不合格時はrecordScenarioClearを呼んでも状態が変化しない', () => {
    recordScenarioClear('pc-purchase', makeJudgement({ passed: false, overallScore: 30 }));

    expect(getProgress()).toEqual({ rankIndex: 0, points: 0, clearedScenarioIds: [] });
  });

  it('同じ案件を複数回クリアしてもclearedScenarioIdsは重複しないが、ポイントは加算され続ける', () => {
    recordScenarioClear('pc-purchase', makeJudgement({ overallScore: 100 })); // +20
    const result = recordScenarioClear('pc-purchase', makeJudgement({ overallScore: 70 })); // +17

    expect(result.points).toBe(37);
    expect(result.clearedScenarioIds).toEqual(['pc-purchase']);
  });

  it('累計ポイントが閾値を超えるとrankIndexが上がる', () => {
    recordScenarioClear('a', makeJudgement({ overallScore: 100 })); // 20
    const result = recordScenarioClear('b', makeJudgement({ overallScore: 100 })); // 40

    expect(result.points).toBe(40);
    expect(result.rankIndex).toBe(2); // 25以上45未満 -> 中級
  });

  it('破損したlocalStorageデータは初期状態として扱う', () => {
    getMockWindow()?.localStorage.setItem('hanko-master-kentei:progress', 'not-json');
    expect(getProgress()).toEqual({ rankIndex: 0, points: 0, clearedScenarioIds: [] });
  });
});
