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

// 「有給休暇申請」案件（issue #202）。#191「案件ごとのテーマ」表の
// 風刺対象は「休暇に対する罪悪感」。起票→再鑑→検閲でマナーのレベルが
// Lv1「ありそう」→Lv3「聞いたことがあるかも」→Lv5「完全に意味不明」へ
// エスカレーションする構成にした。
export const paidLeaveScenario: Scenario = {
  id: 'paid-leave',
  title: '有給休暇申請',
  description:
    '私用のため有給休暇を1日取得したい。理由の記載は任意だが、なるべく申し訳なさそうな理由を添えるのが望ましいとされる。',
  requiredRank: 0,
  stages: [
    {
      id: 'paid-leave-kito',
      type: 'kito',
      rules: [
        {
          id: 'kito-guilty-angle',
          description:
            '休暇取得への気まずさを表すため、通常のお辞儀ハンコよりもやや深く（うつむき気味に）捺印すること。',
          type: 'angle',
          difficulty: 1,
          target: -35,
          tolerance: 15,
        },
      ],
    },
    {
      id: 'paid-leave-saikan',
      type: 'saikan',
      rules: [
        {
          id: 'saikan-guilty-angle',
          description: '起票時と同じ、うつむき気味の角度を維持して再捺印すること。',
          type: 'angle',
          difficulty: 2,
          target: -35,
          tolerance: 12,
        },
        {
          id: 'saikan-remorse-pressure',
          description:
            '印影の濃さで反省の度合いを示すこと。薄すぎると「権利ばかり主張している」、濃すぎると「わざとらしい」と判定される。',
          type: 'pressure',
          difficulty: 2,
          target: 0.6,
          tolerance: 0.2,
        },
      ],
    },
    {
      id: 'paid-leave-kenetsu',
      type: 'kenetsu',
      rules: [
        {
          id: 'kenetsu-guilty-angle',
          description: 'うつむき角度は引き続き維持すること。検閲では許容誤差がさらに狭まる。',
          type: 'angle',
          difficulty: 3,
          target: -35,
          tolerance: 8,
        },
        {
          id: 'kenetsu-days-position',
          description:
            '取得日数（1日）の分だけ、課長印より右にずらして配置し、周囲への配慮を距離で示すこと。',
          type: 'position',
          difficulty: 3,
          target: 0.5,
          tolerance: 0.25,
        },
        {
          id: 'kenetsu-weather-manner',
          description:
            '本日の天気予報を確認し、晴れの場合のみ心持ち深く一礼すること（雨天時との違いは誰も説明できない）。',
          type: 'custom',
          difficulty: 5,
        },
      ],
    },
  ],
};

// 「出張申請」案件（issue #202）。#191「案件ごとのテーマ」表の風刺対象は
// 「経費・承認」。requiredRank: 1（初級以上）とし、案件選択画面（#193）の
// 未解放（🔒）表示・#199の昇格による解放が実際に機能することを示す
// 初めての実データとした。
export const businessTripScenario: Scenario = {
  id: 'business-trip',
  title: '出張申請',
  description:
    '取引先との打ち合わせのため、出張を申請したい。旅費規程上は問題ない範囲だが、承認までにはいくつかの作法が求められる。',
  requiredRank: 1,
  stages: [
    {
      id: 'business-trip-kito',
      type: 'kito',
      rules: [
        {
          id: 'kito-respect-angle',
          description:
            '出張は会社の経費を伴うため、通常よりやや強めに敬意を示すお辞儀ハンコで捺印すること。',
          type: 'angle',
          difficulty: 1,
          target: -25,
          tolerance: 12,
        },
      ],
    },
    {
      id: 'business-trip-saikan',
      type: 'saikan',
      rules: [
        {
          id: 'saikan-respect-angle',
          description: '起票時と同じ角度を維持して再捺印すること。',
          type: 'angle',
          difficulty: 2,
          target: -25,
          tolerance: 10,
        },
        {
          id: 'saikan-budget-timing',
          description:
            '予算規模を意識した押印速度（1.2秒）が求められる。速すぎると「経費感覚が軽率」、遅すぎると「決断力に欠ける」と判定される。',
          type: 'timing',
          difficulty: 2,
          target: 1.2,
          tolerance: 0.2,
        },
      ],
    },
    {
      id: 'business-trip-kenetsu',
      type: 'kenetsu',
      rules: [
        {
          id: 'kenetsu-respect-angle',
          description: '敬意の角度は引き続き維持すること。検閲では許容誤差がさらに狭まる。',
          type: 'angle',
          difficulty: 3,
          target: -25,
          tolerance: 7,
        },
        {
          id: 'kenetsu-destination-position',
          description:
            '出張先が遠方であるほど、部長印から離して配置し、規模の大きさを距離で表現すること。',
          type: 'position',
          difficulty: 3,
          target: 1.0,
          tolerance: 0.3,
        },
        {
          id: 'kenetsu-fortune-manner',
          description:
            '出張先の方角がその日の吉方位と一致する場合のみ、印影をわずかに時計回りへ傾けること（占い担当者以外は誰も検証できない）。',
          type: 'custom',
          difficulty: 5,
        },
      ],
    },
  ],
};

// 「備品購入申請」案件（issue #205、Phase 2）。#191「案件ごとのテーマ」表の
// 風刺対象は「前例主義」。issue #205で追加した2種の捺印ミニゲーム
// （tilt: お辞儀捺印、moving-tap: 飛び回る印鑑）を初めて使う案件とした。
// requiredRank: 2（中級以上）とし、MVPの3案件よりもさらに先の解放条件が
// 実際に機能することを示す。
export const officeSuppliesScenario: Scenario = {
  id: 'office-supplies',
  title: '備品購入申請',
  description:
    'モニターアームを1つ購入したい。金額はごく小さいが、過去の決裁例と寸分違わぬ体裁を踏襲することが求められる。',
  requiredRank: 2,
  stages: [
    {
      id: 'office-supplies-kito',
      type: 'kito',
      rules: [
        {
          id: 'kito-precedent-tilt',
          description:
            '3年前の同種申請（モニターアーム）の決裁書と寸分違わぬ角度になるよう、印影を傾けて捺印すること。',
          type: 'tilt',
          difficulty: 2,
          target: 10,
          tolerance: 5,
        },
      ],
    },
    {
      id: 'office-supplies-saikan',
      type: 'saikan',
      rules: [
        {
          id: 'saikan-precedent-tilt',
          description: '起票時と同じ、前例通りの傾きを維持して再捺印すること。',
          type: 'tilt',
          difficulty: 3,
          target: 10,
          tolerance: 4,
        },
        {
          id: 'saikan-precedent-timing',
          description:
            '画面内を移動する印鑑を、前例の決裁が行われた「タイミング」（画面中央付近）で捺印すること。早すぎても遅すぎても「前例と異なる」と判定される。',
          type: 'moving-tap',
          difficulty: 3,
          target: 50,
          tolerance: 12,
        },
      ],
    },
    {
      id: 'office-supplies-kenetsu',
      type: 'kenetsu',
      rules: [
        {
          id: 'kenetsu-precedent-tilt',
          description: '前例通りの傾きは引き続き維持すること。検閲では許容誤差がさらに狭まる。',
          type: 'tilt',
          difficulty: 4,
          target: 10,
          tolerance: 3,
        },
        {
          id: 'kenetsu-precedent-position',
          description:
            '前例の決裁書と同じく、課長印から0.6mm離して配置すること。1mmでも異なると「前例逸脱」とみなされる。',
          type: 'position',
          difficulty: 4,
          target: 0.6,
          tolerance: 0.2,
        },
        {
          id: 'kenetsu-precedent-manner',
          description:
            '3年前の決裁時に在籍していた総務担当者の在職期間が現在も続いているものとみなし、その担当者の当時の心境を推し量った上で捺印すること（当時の担当者は既に退職している）。',
          type: 'custom',
          difficulty: 5,
        },
      ],
    },
  ],
};

// 案件（シナリオ）一覧。新しい案件を追加する場合はここに追加するだけでよい。
export const scenarios: Scenario[] = [
  pcPurchaseScenario,
  paidLeaveScenario,
  businessTripScenario,
  officeSuppliesScenario,
];

export function getScenarioById(id: string): Scenario | undefined {
  return scenarios.find((scenario) => scenario.id === id);
}
