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

// 「交通費精算」案件（issue #205、Phase 2）。#191「案件ごとのテーマ」表の
// 風刺対象は「細かすぎるルール」。requiredRank: 1とし、出張申請と同時期に
// 挑戦できる案件とした。
export const travelExpenseScenario: Scenario = {
  id: 'travel-expense',
  title: '交通費精算',
  description:
    '客先訪問にかかった電車代380円を精算したい。金額はごくわずかだが、1円単位の正確さが求められる。',
  requiredRank: 1,
  stages: [
    {
      id: 'travel-expense-kito',
      type: 'kito',
      rules: [
        {
          id: 'kito-fare-position',
          description:
            '運賃表の該当区間欄からずれないよう、ちょうど基準位置に捺印すること。',
          type: 'position',
          difficulty: 1,
          target: 0.3,
          tolerance: 0.3,
        },
      ],
    },
    {
      id: 'travel-expense-saikan',
      type: 'saikan',
      rules: [
        {
          id: 'saikan-fare-position',
          description: '起票時と同じ位置を維持して再捺印すること。許容誤差はさらに狭まる。',
          type: 'position',
          difficulty: 2,
          target: 0.3,
          tolerance: 0.2,
        },
        {
          id: 'saikan-fare-timing',
          description:
            '1円単位の精算には0.5秒という「正確さの押印速度」が存在するとされる。速すぎても遅すぎても「概算で済ませようとしている」と判定される。',
          type: 'timing',
          difficulty: 2,
          target: 0.5,
          tolerance: 0.12,
        },
      ],
    },
    {
      id: 'travel-expense-kenetsu',
      type: 'kenetsu',
      rules: [
        {
          id: 'kenetsu-fare-position',
          description: '正確な位置は引き続き維持すること。検閲では許容誤差がさらに狭まる。',
          type: 'position',
          difficulty: 3,
          target: 0.3,
          tolerance: 0.12,
        },
        {
          id: 'kenetsu-fare-pressure',
          description:
              '380円という半端な金額への「几帳面さ」を印影の濃さで示すこと。薄すぎると「どんぶり勘定」、濃すぎると「神経質」と判定される。',
          type: 'pressure',
          difficulty: 3,
          target: 0.5,
          tolerance: 0.15,
        },
        {
          id: 'kenetsu-receipt-manner',
          description:
            '領収書の折り目の数と、電車の乗換回数が一致していることを確認した上で捺印すること（一致していない場合の対処法は誰も知らない）。',
          type: 'custom',
          difficulty: 5,
        },
      ],
    },
  ],
};

// 「テレワーク申請」案件（issue #205、Phase 2）。#191「案件ごとのテーマ」表の
// 風刺対象は「出社信仰」。requiredRank: 3（上級以上）とし、上級以降で
// 解放される最初の案件とした。
export const teleworkScenario: Scenario = {
  id: 'telework',
  title: 'テレワーク申請',
  description:
    '体調不良のため、明日1日だけ自宅で勤務したい。制度上は届出のみで可能なはずだが、実際には相応の作法が求められる。',
  requiredRank: 3,
  stages: [
    {
      id: 'telework-kito',
      type: 'kito',
      rules: [
        {
          id: 'kito-remote-angle',
          description:
            '出社しないことへの引け目を示すため、通常よりも深いお辞儀ハンコで捺印すること。',
          type: 'angle',
          difficulty: 2,
          target: -40,
          tolerance: 15,
        },
      ],
    },
    {
      id: 'telework-saikan',
      type: 'saikan',
      rules: [
        {
          id: 'saikan-remote-angle',
          description: '起票時と同じ、深いお辞儀角度を維持して再捺印すること。',
          type: 'angle',
          difficulty: 3,
          target: -40,
          tolerance: 12,
        },
        {
          id: 'saikan-remote-tap',
          description:
            '画面内を移動する印鑑を、上司が「まだ出社していないか」と気にし始める直前のタイミングで捺印すること。早すぎると「機先を制しすぎ」、遅すぎると「危機感が無い」と判定される。',
          type: 'moving-tap',
          difficulty: 3,
          target: 40,
          tolerance: 10,
        },
      ],
    },
    {
      id: 'telework-kenetsu',
      type: 'kenetsu',
      rules: [
        {
          id: 'kenetsu-remote-angle',
          description: '深いお辞儀角度は引き続き維持すること。検閲では許容誤差がさらに狭まる。',
          type: 'angle',
          difficulty: 4,
          target: -40,
          tolerance: 8,
        },
        {
          id: 'kenetsu-remote-position',
          description:
            '出社している同僚全員分の印影から均等に距離を取り、「浮いていない」ことを座標で示すこと。',
          type: 'position',
          difficulty: 4,
          target: 0.9,
          tolerance: 0.25,
        },
        {
          id: 'kenetsu-attendance-manner',
          description:
            '自宅の椅子がオフィスの椅子と同じ硬さであることを自己申告した上で捺印すること（測定方法・基準は非公開）。',
          type: 'custom',
          difficulty: 5,
        },
      ],
    },
  ],
};

// 「接待交際費」案件（issue #205、Phase 2）。#191「案件ごとのテーマ」表の
// 風刺対象は「過剰な形式」。tiltルール（お辞儀捺印）を中心に構成し、
// 「形式への傾倒」というテーマを角度そのもので表現した。requiredRank: 4。
export const entertainmentExpenseScenario: Scenario = {
  id: 'entertainment-expense',
  title: '接待交際費',
  description:
    '取引先との会食にかかった費用を計上したい。金額自体は規程内だが、接待という行為の性質上、通常以上の形式美が求められる。',
  requiredRank: 4,
  stages: [
    {
      id: 'entertainment-expense-kito',
      type: 'kito',
      rules: [
        {
          id: 'kito-hospitality-tilt',
          description:
            '取引先への敬意を最大限に示すため、印影を深く傾けて捺印すること。',
          type: 'tilt',
          difficulty: 3,
          target: 30,
          tolerance: 10,
        },
      ],
    },
    {
      id: 'entertainment-expense-saikan',
      type: 'saikan',
      rules: [
        {
          id: 'saikan-hospitality-tilt',
          description: '起票時と同じ深い傾きを維持して再捺印すること。',
          type: 'tilt',
          difficulty: 4,
          target: 30,
          tolerance: 8,
        },
        {
          id: 'saikan-hospitality-timing',
          description:
            '接待の格式に見合った押印速度（1.5秒）が求められる。速すぎると「事務的すぎる」、遅すぎると「未練がましい」と判定される。',
          type: 'timing',
          difficulty: 4,
          target: 1.5,
          tolerance: 0.2,
        },
      ],
    },
    {
      id: 'entertainment-expense-kenetsu',
      type: 'kenetsu',
      rules: [
        {
          id: 'kenetsu-hospitality-tilt',
          description: '深い傾きは引き続き維持すること。検閲では許容誤差がさらに狭まる。',
          type: 'tilt',
          difficulty: 5,
          target: 30,
          tolerance: 5,
        },
        {
          id: 'kenetsu-hospitality-pressure',
          description:
            '相手への「誠意」を印影の濃さで示すこと。薄すぎると「儀礼的」、濃すぎると「下心が見える」と判定される。',
          type: 'pressure',
          difficulty: 5,
          target: 0.7,
          tolerance: 0.15,
        },
        {
          id: 'kenetsu-hospitality-manner',
          description:
            '会食した店の暖簾をくぐった回数と、印鑑を押し直した回数が同数であることを確認した上で捺印すること（初回で成功した場合の扱いは規定されていない）。',
          type: 'custom',
          difficulty: 5,
        },
      ],
    },
  ],
};

// 「新規サービス導入」案件（issue #205、Phase 2）。#191「案件ごとのテーマ」表の
// 風刺対象は「根回し・合意形成」。requiredRank: 5（最高ランク「ハンコマスター」）
// とし、全案件中もっとも遅く解放される最終案件とした。
export const newServiceScenario: Scenario = {
  id: 'new-service',
  title: '新規サービス導入',
  description:
    '業務効率化のため、新しいSaaSツールの導入を提案したい。内容自体は誰も反対しないはずだが、決裁に至るまでの「根回し」の作法が最も複雑とされる。',
  requiredRank: 5,
  stages: [
    {
      id: 'new-service-kito',
      type: 'kito',
      rules: [
        {
          id: 'kito-consensus-angle',
          description:
            '関係者全員への事前説明を済ませた体で、慎重かつ丁寧な角度で捺印すること。',
          type: 'angle',
          difficulty: 3,
          target: -30,
          tolerance: 10,
        },
      ],
    },
    {
      id: 'new-service-saikan',
      type: 'saikan',
      rules: [
        {
          id: 'saikan-consensus-angle',
          description: '起票時と同じ、慎重な角度を維持して再捺印すること。',
          type: 'angle',
          difficulty: 4,
          target: -30,
          tolerance: 8,
        },
        {
          id: 'saikan-consensus-tap',
          description:
            '画面内を移動する印鑑を、全関係者の合意が揃った瞬間（画面中央）で捺印すること。早すぎると「独断専行」、遅すぎると「決断力不足」と判定される。',
          type: 'moving-tap',
          difficulty: 4,
          target: 50,
          tolerance: 8,
        },
      ],
    },
    {
      id: 'new-service-kenetsu',
      type: 'kenetsu',
      rules: [
        {
          id: 'kenetsu-consensus-angle',
          description: '慎重な角度は引き続き維持すること。検閲では許容誤差がさらに狭まる。',
          type: 'angle',
          difficulty: 5,
          target: -30,
          tolerance: 5,
        },
        {
          id: 'kenetsu-consensus-position',
          description:
            '関係する全部署の印影から等距離になるよう配置し、「特定の部署に肩入れしていない」ことを座標で示すこと。',
          type: 'position',
          difficulty: 5,
          target: 1.2,
          tolerance: 0.3,
        },
        {
          id: 'kenetsu-nemawashi-manner',
          description:
            '本件について過去に交わされた雑談・立ち話・廊下ですれ違った際の会釈のすべてを「事前調整」として計上した上で捺印すること（集計方法は担当者の記憶に依存する）。',
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
  travelExpenseScenario,
  officeSuppliesScenario,
  teleworkScenario,
  entertainmentExpenseScenario,
  newServiceScenario,
];

export function getScenarioById(id: string): Scenario | undefined {
  return scenarios.find((scenario) => scenario.id === id);
}
