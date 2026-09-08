import type { Scenario } from '@/types/scenario';

// サンプルシナリオ（issue #192）。
// 「パソコン購入申請」案件を起票・再鑑・検閲の3ステージで構成し、
// 各ステージのルール数・種類を段階的にエスカレーションさせることで
// #191の「謎マナーシステム」（曖昧なルールが徐々に理不尽化する）を表現する。
// 実際のミニゲームUI・判定ロジックは別issue（#193〜#198等）で本データを参照して実装する。
export const pcPurchaseScenario: Scenario = {
  id: 'pc-purchase',
  title: 'パソコン購入稟議',
  description:
    '開発用ハイスペックPCの新規調達を稟議にかける。現行PCのスペック不足によりビルド・デバッグに支障が出ているための申請。',
  requiredRank: 0,
  stages: [
    {
      id: 'pc-purchase-kito',
      type: 'kito',
      rules: [
        {
          id: 'kito-bow-angle',
          description:
            '上司（課長）に向かってお辞儀をするように、左に少し傾けて（お辞儀ハンコ）捺印すること。',
          type: 'angle',
          difficulty: 1,
          target: -22.5,
          tolerance: 12.5,
        },
      ],
    },
    {
      id: 'pc-purchase-saikan',
      type: 'saikan',
      rules: [
        {
          id: 'saikan-bow-angle',
          description: '起票時と同じお辞儀角度を維持して再捺印すること。',
          type: 'angle',
          difficulty: 2,
          target: -22.5,
          tolerance: 10,
        },
        {
          id: 'saikan-press-timing',
          description:
            '押印速度0.87秒が最も格式高いとされる。長すぎても短すぎても「誠意不足」と判定される。',
          type: 'timing',
          difficulty: 2,
          target: 0.87,
          tolerance: 0.15,
        },
      ],
    },
    {
      id: 'pc-purchase-kenetsu',
      type: 'kenetsu',
      rules: [
        {
          id: 'kenetsu-bow-angle',
          description: 'お辞儀角度は引き続き維持すること。検閲では許容誤差がさらに狭まる。',
          type: 'angle',
          difficulty: 3,
          target: -22.5,
          tolerance: 7.5,
        },
        {
          id: 'kenetsu-relative-position',
          description: '課長印より0.8mm下に配置し、上司への敬意を距離で示すこと。',
          type: 'position',
          difficulty: 3,
          target: 0.8,
          tolerance: 0.3,
        },
        {
          id: 'kenetsu-moon-phase',
          description: '本日の月齢を考慮した上で捺印すること（理由は誰も説明できない）。',
          type: 'custom',
          difficulty: 5,
        },
      ],
    },
  ],
};

// 案件（シナリオ）一覧。新しい案件を追加する場合はここに追加するだけでよい。
export const scenarios: Scenario[] = [pcPurchaseScenario];

export function getScenarioById(id: string): Scenario | undefined {
  return scenarios.find((scenario) => scenario.id === id);
}
