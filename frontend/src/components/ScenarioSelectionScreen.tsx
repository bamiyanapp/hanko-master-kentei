import type { Scenario } from '@/types/scenario';

type ScenarioSelectionScreenProps = {
  scenarios: Scenario[];
  currentRank: number;
  clearedScenarioIds: string[];
  onSelect: (scenarioId: string) => void;
  onBack: () => void;
};

export default function ScenarioSelectionScreen({
  scenarios,
  currentRank,
  clearedScenarioIds,
  onSelect,
  onBack,
}: ScenarioSelectionScreenProps) {
  return (
    <main className="d-flex min-vh-100 flex-column align-items-center p-4 p-md-5 bg-light">
      <div className="w-100" style={{ maxWidth: '42rem' }}>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="fs-4 fw-bold mb-0">案件を選択してください</h2>
          <button
            onClick={onBack}
            className="btn btn-link btn-sm text-secondary text-decoration-none p-0"
          >
            戻る
          </button>
        </div>

        <div className="d-flex flex-column gap-3">
          {scenarios.map((scenario) => {
            const isLocked = currentRank < scenario.requiredRank;
            const isCleared = clearedScenarioIds.includes(scenario.id);
            let statusLabel = '';
            let statusIcon = '';
            if (isCleared) {
              statusLabel = 'クリア済み';
              statusIcon = '✓';
            } else if (isLocked) {
              statusLabel = '未解放';
              statusIcon = '🔒';
            }

            return (
              <button
                key={scenario.id}
                type="button"
                onClick={() => {
                  if (!isLocked) onSelect(scenario.id);
                }}
                disabled={isLocked}
                className={`btn text-start p-3 shadow-sm ${
                  isLocked ? 'btn-outline-secondary disabled' : 'btn-outline-danger'
                }`}
              >
                <div className="d-flex justify-content-between align-items-center">
                  <span className="fw-bold">{scenario.title}</span>
                  {statusIcon && <span aria-label={statusLabel}>{statusIcon}</span>}
                </div>
                <p className="small text-secondary mb-0 mt-1">
                  {isLocked
                    ? `解放条件: ランク${scenario.requiredRank}以上`
                    : scenario.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </main>
  );
}
