import { describe, it, expect } from 'vitest';
import { scoreByTargetTolerance } from './scoring';
import type { Rule } from '@/types/scenario';

const rule: Rule = {
  id: 'r1',
  description: 'test rule',
  type: 'angle',
  difficulty: 1,
  target: 90,
  tolerance: 10,
};

describe('scoreByTargetTolerance', () => {
  it('目標との誤差が許容誤差の半分以内ならexcellent', () => {
    expect(scoreByTargetTolerance(rule, 90)).toBe('excellent');
    expect(scoreByTargetTolerance(rule, 88.7)).toBe('excellent');
    expect(scoreByTargetTolerance(rule, 95)).toBe('excellent'); // ちょうど半分（5）
  });

  it('誤差が許容誤差の半分を超え許容誤差以内ならgood', () => {
    expect(scoreByTargetTolerance(rule, 99)).toBe('good');
    expect(scoreByTargetTolerance(rule, 100)).toBe('good'); // ちょうど許容誤差（10）
  });

  it('誤差が許容誤差を超えたらfail', () => {
    expect(scoreByTargetTolerance(rule, 101)).toBe('fail');
    expect(scoreByTargetTolerance(rule, 0)).toBe('fail');
  });

  it('target・toleranceが未定義のルールは常にfail', () => {
    const customRule: Rule = { id: 'r2', description: 'custom', type: 'custom', difficulty: 5 };
    expect(scoreByTargetTolerance(customRule, 0)).toBe('fail');
  });
});
