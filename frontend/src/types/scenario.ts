// ゲームルール・シナリオをコードから分離したデータ構造（issue #192）。
// 新しい案件（シナリオ）はこの型に沿ったデータを追加するだけで拡張できる。

export type RuleType = 'angle' | 'timing' | 'position' | 'pressure' | 'custom';

export type Rule = {
  id: string;
  description: string;
  type: RuleType;
  difficulty: number;
  target?: number;
  tolerance?: number;
};

export type StageType = 'kito' | 'saikan' | 'kenetsu';

export type Stage = {
  id: string;
  type: StageType;
  rules: Rule[];
};

export type Scenario = {
  id: string;
  title: string;
  description: string;
  stages: Stage[];
  requiredRank: number;
};
