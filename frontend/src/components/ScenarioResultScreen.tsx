import type { Scenario } from '@/types/scenario';
import { METRIC_NAMES, type JudgementResult } from '@/lib/judgement';
import { RANK_NAMES } from '@/lib/rank';

type ScenarioResultScreenProps = {
  scenario: Scenario;
  result: JudgementResult;
  rankUpTo: number | null;
  onBackToSelection: () => void;
  onShowEnding: () => void;
};

const MAX_RANK_INDEX = RANK_NAMES.length - 1;

// 案件クリア後の結果画面（issue #200）。格式・礼節・誠意・精密性の個別
// スコアと総合点・判定コメントを表示し、最高ランク（ハンコマスター）へ
// 昇格した場合のみエンディング（issue #201）への導線を出す。
export default function ScenarioResultScreen({
  scenario,
  result,
  rankUpTo,
  onBackToSelection,
  onShowEnding,
}: ScenarioResultScreenProps) {
  return (
    <main className="d-flex min-vh-100 flex-column align-items-center justify-content-center p-4 p-md-5 bg-light">
      <div className="card w-100 shadow-sm" style={{ maxWidth: '42rem' }}>
        <div className="card-body p-4">
          <h2 className="fs-4 fw-bold mb-3">{scenario.title}：案件クリア</h2>

          {rankUpTo !== null && (
            <div className="alert alert-warning mb-4">
              <h3 className="alert-heading fs-6 fw-bold mb-0">
                🎊 昇格！ 「{RANK_NAMES[rankUpTo]}」に認定されました
              </h3>
            </div>
          )}

          <div className={`alert ${result.passed ? 'alert-success' : 'alert-danger'} mb-4`}>
            <h3 className="alert-heading fs-6 fw-bold mb-1">
              {result.passed ? '🎉 承認されました！' : '❌ 差し戻されました'}（総合スコア
              {result.overallScore}点）
            </h3>
            <p className="small mb-0">{result.comment}</p>
          </div>

          <div className="row row-cols-2 g-3 mb-4">
            {METRIC_NAMES.map((metric) => (
              <div key={metric} className="col">
                <div className="border rounded p-2 text-center">
                  <div className="small text-secondary">{metric}</div>
                  <div className="fs-5 fw-bold">{result.metricScores[metric] ?? '－'}</div>
                </div>
              </div>
            ))}
          </div>

          {rankUpTo === MAX_RANK_INDEX ? (
            <button
              onClick={onShowEnding}
              className="btn btn-warning w-100 py-2 fw-bold shadow-sm"
            >
              エンディングを見る
            </button>
          ) : (
            <button
              onClick={onBackToSelection}
              className="btn btn-success w-100 py-2 fw-bold shadow-sm"
            >
              案件選択へ戻る
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
