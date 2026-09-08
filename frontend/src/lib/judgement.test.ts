import { describe, it, expect, vi } from 'vitest';
import { judge, defaultCommentGenerator, PASS_THRESHOLD, type RuleResult } from './judgement';
import type { Rule } from '@/types/scenario';

function makeRule(type: Rule['type'], id = `${type}-rule`): Rule {
  return { id, description: `${type} test rule`, type, difficulty: 1, target: 0, tolerance: 1 };
}

describe('judge', () => {
  it('結果が空の場合、総合スコア0・全指標null・不合格になる', () => {
    const result = judge([]);
    expect(result.overallScore).toBe(0);
    expect(result.passed).toBe(false);
    expect(result.metricScores).toEqual({ 格式: null, 礼節: null, 誠意: null, 精密性: null });
  });

  it('angleルールの結果は礼節指標に反映される', () => {
    const results: RuleResult[] = [{ rule: makeRule('angle'), score: 'excellent' }];
    const result = judge(results);
    expect(result.metricScores.礼節).toBe(100);
    expect(result.metricScores.格式).toBeNull();
    expect(result.metricScores.誠意).toBeNull();
    expect(result.metricScores.精密性).toBeNull();
  });

  it('timingルールの結果は格式指標に反映される', () => {
    const results: RuleResult[] = [{ rule: makeRule('timing'), score: 'good' }];
    const result = judge(results);
    expect(result.metricScores.格式).toBe(70);
  });

  it('pressureルールの結果は誠意指標に反映される', () => {
    const results: RuleResult[] = [{ rule: makeRule('pressure'), score: 'fail' }];
    const result = judge(results);
    expect(result.metricScores.誠意).toBe(30);
  });

  it('positionルールの結果は精密性指標に反映される', () => {
    const results: RuleResult[] = [{ rule: makeRule('position'), score: 'excellent' }];
    const result = judge(results);
    expect(result.metricScores.精密性).toBe(100);
  });

  it('customルールはどの指標にも反映されないが、総合スコアには反映される', () => {
    const results: RuleResult[] = [{ rule: makeRule('custom'), score: 'excellent' }];
    const result = judge(results);
    expect(result.metricScores).toEqual({ 格式: null, 礼節: null, 誠意: null, 精密性: null });
    expect(result.overallScore).toBe(100);
  });

  it('同じ指標に複数ルールがある場合は平均される', () => {
    const results: RuleResult[] = [
      { rule: makeRule('angle', 'angle-1'), score: 'excellent' }, // 100
      { rule: makeRule('angle', 'angle-2'), score: 'fail' }, // 30
    ];
    const result = judge(results);
    expect(result.metricScores.礼節).toBe(65); // (100+30)/2 = 65
  });

  it('総合スコアは全結果の平均', () => {
    const results: RuleResult[] = [
      { rule: makeRule('angle'), score: 'excellent' }, // 100
      { rule: makeRule('position'), score: 'good' }, // 70
      { rule: makeRule('pressure'), score: 'fail' }, // 30
    ];
    const result = judge(results);
    expect(result.overallScore).toBe(67); // round((100+70+30)/3) = 67
  });

  it(`総合スコアが${PASS_THRESHOLD}以上ならpassed=true`, () => {
    const results: RuleResult[] = [{ rule: makeRule('angle'), score: 'good' }]; // 70
    expect(judge(results).passed).toBe(true);
  });

  it(`総合スコアが${PASS_THRESHOLD}未満ならpassed=false`, () => {
    const results: RuleResult[] = [{ rule: makeRule('angle'), score: 'fail' }]; // 30
    expect(judge(results).passed).toBe(false);
  });

  it('commentGeneratorを差し替えられる（Phase 2のAI生成への差し替えポイント）', () => {
    const customGenerator = vi.fn().mockReturnValue('AIが生成したコメント');
    const results: RuleResult[] = [{ rule: makeRule('angle'), score: 'excellent' }];
    const result = judge(results, customGenerator);

    expect(result.comment).toBe('AIが生成したコメント');
    expect(customGenerator).toHaveBeenCalledWith(100, results);
  });
});

describe('defaultCommentGenerator', () => {
  it('90点以上は最上位コメント', () => {
    expect(defaultCommentGenerator(90, [])).toContain('模範的');
    expect(defaultCommentGenerator(100, [])).toContain('模範的');
  });

  it('70〜89点は「おおむね問題ありません」', () => {
    expect(defaultCommentGenerator(70, [])).toBe('おおむね問題ありません。');
    expect(defaultCommentGenerator(89, [])).toBe('おおむね問題ありません。');
  });

  it('40〜69点は「印影から若干の焦りが感じられます」', () => {
    expect(defaultCommentGenerator(40, [])).toContain('焦り');
    expect(defaultCommentGenerator(69, [])).toContain('焦り');
  });

  it('40点未満は再提出を促すコメント', () => {
    expect(defaultCommentGenerator(0, [])).toContain('再提出');
    expect(defaultCommentGenerator(39, [])).toContain('再提出');
  });
});
