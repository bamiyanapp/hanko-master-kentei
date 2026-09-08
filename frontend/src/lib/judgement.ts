import type { Rule, RuleType } from '@/types/scenario';
import type { MinigameScore } from './scoring';

// #191「10. 結果画面」・issue #198に基づく判定エンジン。各ミニゲームの結果
// （Rule＋そのRuleに対するMinigameScore）から「格式」「礼節」「誠意」「精密性」の
// 4指標＋総合スコア・判定コメントを算出する。

export type MetricName = '格式' | '礼節' | '誠意' | '精密性';

export const METRIC_NAMES: MetricName[] = ['格式', '礼節', '誠意', '精密性'];

export type RuleResult = {
  rule: Rule;
  score: MinigameScore;
};

export type MetricScores = Record<MetricName, number | null>;

export type JudgementResult = {
  overallScore: number; // 0〜100
  metricScores: MetricScores;
  passed: boolean;
  comment: string;
};

const SCORE_POINTS: Record<MinigameScore, number> = {
  excellent: 100,
  good: 70,
  fail: 30,
};

// Rule.typeから対応する指標への割り当て。#192のRule型定義・各ミニゲームissue
// （#195〜197）には指標との対応関係が明記されていないため、本issueの実装として
// 以下のように定めた（見直しが必要な場合は本コメントとあわせて更新する）。
// - angle（お辞儀角度等）    → 礼節（上司への敬意の表れとされるため）
// - timing（押印速度等）     → 格式（手続きの様式美・作法とされるため）
// - pressure（印影濃度）     → 誠意（力の込め方＝誠意の表れとされるため）
// - position（位置合わせ）   → 精密性（座標の正確さそのものであるため）
// - tilt（お辞儀捺印の傾き） → 礼節（angleと同じくお辞儀の一種であるため、issue #205）
// - moving-tap（飛び回る印鑑）→ 格式（timingと同じくタイミングの巧拙であるため、issue #205）
// - custom（謎マナー全般）   → 特定の指標に紐付けず、総合スコアにのみ反映する
const METRIC_BY_RULE_TYPE: Partial<Record<RuleType, MetricName>> = {
  angle: '礼節',
  timing: '格式',
  pressure: '誠意',
  position: '精密性',
  tilt: '礼節',
  'moving-tap': '格式',
};

// 合格とみなす総合スコアの閾値。#200（結果画面・再提出フロー）が本値に基づき
// 再提出フローへ分岐するかを判断する想定。
export const PASS_THRESHOLD = 60;

export type CommentGenerator = (overallScore: number, results: RuleResult[]) => string;

// MVPでは固定の判定文言テーブルで実装する（issue #198）。Phase 2のAIマナー
// 講師issueでAI生成へ差し替える際は、judge()の第2引数に別実装の
// CommentGeneratorを渡すことで置き換えられる。
export const defaultCommentGenerator: CommentGenerator = (overallScore) => {
  if (overallScore >= 90) return '非常に模範的な捺印です。文句のつけようがありません。';
  if (overallScore >= 70) return 'おおむね問題ありません。';
  if (overallScore >= 40) return '印影から若干の焦りが感じられます。';
  return '残念ながら基準を満たしていません。再提出をお願いします。';
};

function average(values: number[]): number {
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

export function judge(
  results: RuleResult[],
  commentGenerator: CommentGenerator = defaultCommentGenerator,
): JudgementResult {
  const metricPoints: Record<MetricName, number[]> = {
    格式: [],
    礼節: [],
    誠意: [],
    精密性: [],
  };

  for (const { rule, score } of results) {
    const metric = METRIC_BY_RULE_TYPE[rule.type];
    if (metric) {
      metricPoints[metric].push(SCORE_POINTS[score]);
    }
  }

  const metricScores = Object.fromEntries(
    METRIC_NAMES.map((metric) => [
      metric,
      metricPoints[metric].length > 0 ? average(metricPoints[metric]) : null,
    ]),
  ) as MetricScores;

  const overallScore =
    results.length > 0 ? average(results.map(({ score }) => SCORE_POINTS[score])) : 0;

  return {
    overallScore,
    metricScores,
    passed: overallScore >= PASS_THRESHOLD,
    comment: commentGenerator(overallScore, results),
  };
}
