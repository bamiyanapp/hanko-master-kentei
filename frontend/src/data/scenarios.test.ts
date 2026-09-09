import { describe, it, expect } from 'vitest';
import {
  scenarios,
  pcPurchaseScenario,
  paidLeaveScenario,
  officeSuppliesScenario,
  travelExpenseScenario,
  teleworkScenario,
  entertainmentExpenseScenario,
  newServiceScenario,
  getScenarioById,
} from './scenarios';

describe('scenarios', () => {
  it('issue #202・#205の要件通り、案件が2件以上存在する', () => {
    expect(scenarios.length).toBeGreaterThanOrEqual(2);
  });

  it('シナリオ間でidが重複しない', () => {
    const scenarioIds = scenarios.map((scenario) => scenario.id);
    expect(new Set(scenarioIds).size).toBe(scenarioIds.length);
  });

  it('ステージが進むごとにルール数または難易度が上がる（マナーのエスカレーション）', () => {
    for (const scenario of scenarios) {
      const ruleCounts = scenario.stages.map((stage) => stage.rules.length);
      // 起票が最少ルール数であること（issue #191「起票=単一条件」に対応）
      expect(ruleCounts[0]).toBeLessThanOrEqual(ruleCounts[1]);
      expect(ruleCounts[1]).toBeLessThanOrEqual(ruleCounts[2]);

      const maxDifficultyPerStage = scenario.stages.map((stage) =>
        Math.max(...stage.rules.map((rule) => rule.difficulty)),
      );
      // 検閲ステージには最も難易度の高いルール（謎マナー）が含まれること
      expect(maxDifficultyPerStage[2]).toBeGreaterThanOrEqual(maxDifficultyPerStage[0]);
    }
  });

  it('少なくとも1件のcustom型ルール（謎マナー）を含む案件が2件以上ある', () => {
    const scenariosWithCustomRule = scenarios.filter((scenario) =>
      scenario.stages.some((stage) => stage.rules.some((rule) => rule.type === 'custom')),
    );
    expect(scenariosWithCustomRule.length).toBeGreaterThanOrEqual(2);
  });

  it('各シナリオが起票・再鑑・検閲の3ステージを持つ', () => {
    for (const scenario of scenarios) {
      const stageTypes = scenario.stages.map((stage) => stage.type);
      expect(stageTypes).toEqual(['kito', 'saikan', 'kenetsu']);
    }
  });

  it('各ステージが最低1件のルールを持つ', () => {
    for (const scenario of scenarios) {
      for (const stage of scenario.stages) {
        expect(stage.rules.length).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it('シナリオ内でid（scenario/stage/rule）が重複しない', () => {
    for (const scenario of scenarios) {
      const stageIds = scenario.stages.map((stage) => stage.id);
      expect(new Set(stageIds).size).toBe(stageIds.length);

      for (const stage of scenario.stages) {
        const ruleIds = stage.rules.map((rule) => rule.id);
        expect(new Set(ruleIds).size).toBe(ruleIds.length);
      }
    }
  });

  it('getScenarioByIdでidから取得できる', () => {
    expect(getScenarioById('pc-purchase')).toBe(pcPurchaseScenario);
    expect(getScenarioById('paid-leave')).toBe(paidLeaveScenario);
    expect(getScenarioById('office-supplies')).toBe(officeSuppliesScenario);
    expect(getScenarioById('travel-expense')).toBe(travelExpenseScenario);
    expect(getScenarioById('telework')).toBe(teleworkScenario);
    expect(getScenarioById('entertainment-expense')).toBe(entertainmentExpenseScenario);
    expect(getScenarioById('new-service')).toBe(newServiceScenario);
    expect(getScenarioById('not-exist')).toBeUndefined();
  });

  it('issue #191「案件ごとのテーマ」表に掲載された全8案件が実装されている', () => {
    expect(scenarios.length).toBe(8);
  });

  it('requiredRankが0の案件が最低1件あり、初期状態から遊べる', () => {
    expect(scenarios.some((scenario) => scenario.requiredRank === 0)).toBe(true);
  });

  it('issue #205で追加したtilt・moving-tap型ルールを含む案件が存在する', () => {
    const hasTilt = scenarios.some((scenario) =>
      scenario.stages.some((stage) => stage.rules.some((rule) => rule.type === 'tilt')),
    );
    const hasMovingTap = scenarios.some((scenario) =>
      scenario.stages.some((stage) => stage.rules.some((rule) => rule.type === 'moving-tap')),
    );
    expect(hasTilt).toBe(true);
    expect(hasMovingTap).toBe(true);
  });
});
