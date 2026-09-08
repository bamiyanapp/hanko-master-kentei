import type { Rule } from '@/types/scenario';

// Rule.target・Rule.toleranceに基づく汎用的な採点（issue #195）。
// 角度（回転印）に限らず、時間（長押し）・距離（位置合わせ）等、target/toleranceを
// 持つ数値型のルール全般で再利用できるよう、特定のミニゲームに依存しない形にしてある。
export type MinigameScore = 'excellent' | 'good' | 'fail';

export function scoreByTargetTolerance(rule: Rule, actual: number): MinigameScore {
  if (rule.target === undefined || rule.tolerance === undefined) return 'fail';
  const diff = Math.abs(actual - rule.target);
  if (diff <= rule.tolerance / 2) return 'excellent';
  if (diff <= rule.tolerance) return 'good';
  return 'fail';
}
