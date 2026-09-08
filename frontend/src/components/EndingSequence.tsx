'use client';

import { useState } from 'react';

type EndingStep = {
  text: string;
  blackout?: boolean;
};

// #191「17. エンディング」・issue #201記載の演出フローそのまま
// （最高ランク・ハンコマスター到達時の専用エンディング）。
const ENDING_STEPS: EndingStep[] = [
  { text: 'おめでとうございます！\nあなたは一級ハンコマスターに認定されました。' },
  { text: '', blackout: true },
  { text: '翌月から電子承認システムを導入します。' },
  { text: '紙の申請書および押印は原則廃止となります。' },
  { text: 'あなたの努力は、決して無駄ではありませんでした。' },
];

type EndingSequenceProps = {
  onFinish: () => void;
};

// 1コマずつクリックで進める簡易な紙芝居形式の演出。issue「風刺のオチが
// 伝わる演出・テンポにする」に対応し、プレイヤー自身のペースで読み進め
// られるようにした（自動タイマー送りは離脱を招きやすいため採用しなかった）。
export default function EndingSequence({ onFinish }: EndingSequenceProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const isGameClear = stepIndex >= ENDING_STEPS.length;

  const handleAdvance = () => {
    setStepIndex(stepIndex + 1);
  };

  if (isGameClear) {
    return (
      <main className="d-flex min-vh-100 flex-column align-items-center justify-content-center p-4 bg-dark text-white text-center">
        <h1 className="display-4 fw-bold mb-4">GAME CLEAR</h1>
        <button onClick={onFinish} className="btn btn-light btn-lg px-4 py-2 fw-bold">
          トップ画面へ戻る
        </button>
      </main>
    );
  }

  const step = ENDING_STEPS[stepIndex];

  return (
    <main
      onClick={handleAdvance}
      className={`d-flex min-vh-100 flex-column align-items-center justify-content-center p-4 text-center ${
        step.blackout ? 'bg-black' : 'bg-dark'
      }`}
      style={{ cursor: 'pointer' }}
    >
      {!step.blackout && (
        <p className="fs-4 text-white" style={{ whiteSpace: 'pre-line' }}>
          {step.text}
        </p>
      )}
      {!step.blackout && (
        <p className="small text-white-50 mt-4">（タップして次へ）</p>
      )}
    </main>
  );
}
