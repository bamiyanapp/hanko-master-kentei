import { describe, it, expect } from 'vitest';
import { scenarios, pcPurchaseScenario, getScenarioById } from './scenarios';

describe('scenarios', () => {
  it('サンプルシナリオが最低1件存在する', () => {
    expect(scenarios.length).toBeGreaterThanOrEqual(1);
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
    expect(getScenarioById('not-exist')).toBeUndefined();
  });
});
