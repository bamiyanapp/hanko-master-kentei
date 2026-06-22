'use client';

import React, { useState } from 'react';

import { useEffect } from 'react';

export default function Home() {
  const [isStarted, setIsStarted] = useState(false);
  const [angle, setAngle] = useState(0); // 角度（度数法：-180 〜 180）
  const [judged, setJudged] = useState(false);
  const [resultMessage, setResultMessage] = useState('');
  const [isPassed, setIsPassed] = useState(false);

  // 既存の定義順序を保つため、PVP用のstateはここに定義する
  const [isPvP, setIsPvP] = useState(false);
  const [pvpStep, setPvpStep] = useState<'p1_turn' | 'p2_turn' | 'result'>('p1_turn');
  const [p1Angle, setP1Angle] = useState(0);
  const [p2Angle, setP2Angle] = useState(0);

  // URLパラメータと状態の同期用関数
  const updateUrl = (
    started: boolean,
    currentAngle: number,
    currentJudged: boolean,
    pvp: boolean = false,
    step: string = 'p1_turn',
    p1A: number = 0,
    p2A: number = 0
  ) => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams();
    if (started) {
      params.set('started', 'true');
      if (pvp) {
        params.set('mode', 'pvp');
        params.set('step', step);
        if (p1A !== 0) params.set('p1Angle', p1A.toString());
        if (p2A !== 0) params.set('p2Angle', p2A.toString());
      } else {
        if (currentAngle !== 0) {
          params.set('angle', currentAngle.toString());
        }
        if (currentJudged) {
          params.set('judged', 'true');
        }
      }
    }
    const newSearch = params.toString();
    const newUrl = `${window.location.pathname}${newSearch ? `?${newSearch}` : ''}`;
    window.history.pushState(null, '', newUrl);
  };

  // マウント時にURLパラメータから状態を復元
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    
    const startedParam = params.get('started') === 'true';
    const modeParam = params.get('mode');
    
    if (startedParam) {
      setIsStarted(true);
      if (modeParam === 'pvp') {
        setIsPvP(true);
        const stepParam = (params.get('step') || 'p1_turn') as 'p1_turn' | 'p2_turn' | 'result';
        const p1AParam = Number(params.get('p1Angle') || 0);
        const p2AParam = Number(params.get('p2Angle') || 0);
        setPvpStep(stepParam);
        setP1Angle(p1AParam);
        setP2Angle(p2AParam);
        
        if (stepParam === 'result') {
          const res = judgePvP(p1AParam, p2AParam);
          setResultMessage(res.message);
        }
      } else {
        const angleParam = Number(params.get('angle') || 0);
        const judgedParam = params.get('judged') === 'true';
        if (angleParam !== 0) {
          setAngle(angleParam);
        }
        if (judgedParam) {
          setJudged(true);
          const result = judgeHankoAngle(angleParam);
          setIsPassed(result.isPassed);
          setResultMessage(result.message);
        }
      }
    }
  }, []);

  const handleStart = () => {
    setIsStarted(true);
    setIsPvP(false);
    setAngle(0);
    setJudged(false);
    setResultMessage('');
    setIsPassed(false);
    updateUrl(true, 0, false);
  };

  const handleStartPvP = () => {
    setIsStarted(true);
    setIsPvP(true);
    setPvpStep('p1_turn');
    setP1Angle(0);
    setP2Angle(0);
    setResultMessage('');
    updateUrl(true, 0, false, true, 'p1_turn', 0, 0);
  };

  const handleJudge = () => {
    setJudged(true);
    const result = judgeHankoAngle(angle);
    setIsPassed(result.isPassed);
    setResultMessage(result.message);
    updateUrl(isStarted, angle, true);
  };

  const handleP1Submit = () => {
    setPvpStep('p2_turn');
    updateUrl(true, 0, false, true, 'p2_turn', p1Angle, 0);
  };

  const handleP2Submit = () => {
    setPvpStep('result');
    const res = judgePvP(p1Angle, p2Angle);
    setResultMessage(res.message);
    updateUrl(true, 0, false, true, 'result', p1Angle, p2Angle);
  };

  const handleReset = () => {
    setAngle(0);
    setJudged(false);
    setResultMessage('');
    setIsPassed(false);
    updateUrl(isStarted, 0, false);
  };

  const handlePvPReset = () => {
    setPvpStep('p1_turn');
    setP1Angle(0);
    setP2Angle(0);
    setResultMessage('');
    updateUrl(true, 0, false, true, 'p1_turn', 0, 0);
  };

  const handleBackToTop = () => {
    setIsStarted(false);
    setIsPvP(false);
    updateUrl(false, 0, false);
  };

  if (isStarted) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-24 bg-gray-50">
            <div className="w-full max-w-2xl bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex justify-between items-center border-b pb-4 mb-6">
            <div>
              <span className="bg-red-100 text-red-800 text-xs font-semibold px-2.5 py-0.5 rounded">
                {isPvP ? '対戦モード' : 'ステージ 1'}
              </span>
              <h2 className="text-2xl font-bold text-gray-800 mt-1">
                {isPvP ? '誠意の限界捺印バトル（2人対戦）' : '課長承認：はじめてのお辞儀ハンコ'}
              </h2>
            </div>
            <button
              onClick={handleBackToTop}
              className="text-gray-500 hover:text-gray-700 text-sm font-medium"
            >
              戻る
            </button>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-amber-900 mb-1">
              ミッション
            </h3>
            <p className="text-sm text-amber-800">
              {isPvP ? (
                <span>
                  稟議書（有給休暇申請）に、プレイヤー1とプレイヤー2が順番に捺印しなさい。
                  ただし、上司に向かって最も誠意の伝わるお辞儀角度（<strong>理想は-22度</strong>）で捺印できたプレイヤーが勝者となります。
                </span>
              ) : (
                <span>
                  稟議書（パソコン購入申請）に捺印しなさい。
                  ただし、日本企業の伝統マナーに基づき、
                  <strong>上司（課長）に向かってお辞儀をするように、左に少し傾けて（お辞儀ハンコ）</strong>
                  捺印すること。
                </span>
              )}
            </p>
          </div>

          {/* 稟議書風のプレビュー領域 */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 bg-white mb-6 relative overflow-hidden min-h-[250px] flex flex-col justify-between">
            <div className="text-center">
              <h3 className="text-xl font-bold border-b-2 border-double border-gray-800 pb-2 inline-block text-gray-800">
                {isPvP ? '有給休暇取得申請書' : 'パソコン購入稟議書'}
              </h3>
            </div>

            <div className="my-6 text-sm text-gray-700 space-y-2">
              {isPvP ? (
                <>
                  <p>
                    <strong>申請内容：</strong> リフレッシュのための有給休暇取得（5日間）
                  </p>
                  <p>
                    <strong>理由：</strong> 連日のハンコ捺印業務による心身の疲弊を癒やし、社畜としてのパフォーマンスを維持・向上させるため。
                  </p>
                </>
              ) : (
                <>
                  <p>
                    <strong>件名：</strong> 開発用ハイスペックPC of 新規調達
                  </p>
                  <p>
                    <strong>理由：</strong> 現行のPCスペック不足により、ビルドおよびデバッグに著しい支障が出ているため。
                  </p>
                </>
              )}
            </div>

            {/* 捺印欄 */}
            <div className="flex justify-end mt-4">
              <div className="flex border border-gray-800 text-center">
                {isPvP ? (
                  <>
                    <div className="w-20 border-r border-gray-800">
                      <div className="bg-gray-100 text-xs py-1 border-b border-gray-800 text-gray-800">
                        課長（上司）
                      </div>
                      <div className="h-16 flex items-center justify-center text-gray-300 text-xs select-none">
                        （審査員）
                      </div>
                    </div>
                    <div className="w-20 border-r border-gray-800 bg-red-50/10 relative">
                      <div className="bg-gray-100 text-xs py-1 border-b border-gray-800 text-gray-800">
                        P1（鈴木）
                      </div>
                      <div className="h-16 flex items-center justify-center">
                        <div
                          style={{
                            transform: `rotate(${p1Angle}deg)`,
                            transition: pvpStep !== 'p1_turn' ? 'transform 0.5s ease' : 'none',
                          }}
                    className={`w-12 h-12 rounded-full border-2 border-red-500 flex items-center justify-center text-red-500 font-bold select-none ${
                      pvpStep !== 'p1_turn' ? 'opacity-100' : 'opacity-60 animate-pulse'
                    }`}
                        >
                          <span className="text-sm tracking-widest leading-none block transform scale-90">
                            鈴木
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="w-20">
                      <div className="bg-gray-100 text-xs py-1 border-b border-gray-800 text-gray-800">
                        P2（佐藤）
                      </div>
                      <div className="h-16 flex items-center justify-center">
                        {pvpStep !== 'p1_turn' ? (
                          <div
                            style={{
                              transform: `rotate(${p2Angle}deg)`,
                              transition: pvpStep === 'result' ? 'transform 0.5s ease' : 'none',
                            }}
                            className={`w-12 h-12 rounded-full border-2 border-red-500 flex items-center justify-center text-red-500 font-bold select-none ${
                              pvpStep === 'result' ? 'opacity-100' : 'opacity-60 animate-pulse'
                            }`}
                          >
                            <span className="text-sm tracking-widest leading-none block transform scale-90">
                              佐藤
                            </span>
                          </div>
                        ) : (
                          <div className="text-gray-300 text-xs select-none">（未捺印）</div>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-20 border-r border-gray-800">
                      <div className="bg-gray-100 text-xs py-1 border-b border-gray-800 text-gray-800">
                        部長
                      </div>
                      <div className="h-16 flex items-center justify-center text-gray-300 text-xs select-none">
                        （未承認）
                      </div>
                    </div>
                    <div className="w-20 border-r border-gray-800 bg-red-50/10 relative">
                      <div className="bg-gray-100 text-xs py-1 border-b border-gray-800 text-gray-800">
                        課長
                      </div>
                      <div className="h-16 flex items-center justify-center">
                        {/* 捺印される印影 */}
                        <div
                          style={{
                            transform: `rotate(${angle}deg)`,
                            transition: judged ? 'transform 0.5s ease' : 'none',
                          }}
                          className={`w-12 h-12 rounded-full border-2 border-red-500 flex items-center justify-center text-red-500 font-bold select-none ${
                            judged ? 'opacity-100' : 'opacity-60 animate-pulse'
                          }`}
                        >
                          <span className="text-sm tracking-widest leading-none block transform scale-90">
                            鈴木
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="w-20">
                      <div className="bg-gray-100 text-xs py-1 border-b border-gray-800 text-gray-800">
                        起案者
                      </div>
                      <div className="h-16 flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full border-2 border-red-400 flex items-center justify-center text-red-400 font-semibold text-xs select-none">
                          鈴木
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* 判定結果の表示 */}
          {((!isPvP && judged) || (isPvP && pvpStep === 'result')) && (
            <div
              className={`p-4 rounded-lg mb-6 border ${
                (!isPvP && isPassed) || (isPvP && resultMessage.includes('勝利'))
                  ? 'bg-green-50 border-green-200 text-green-900'
                  : 'bg-red-50 border-red-200 text-red-900'
              }`}
            >
              <h4 className="font-bold mb-1">
                {isPvP ? '🏆 対戦結果！' : isPassed ? '🎉 合格！' : '❌ 差し戻し！'}
              </h4>
              <p className="text-sm leading-relaxed">{resultMessage}</p>
            </div>
          )}

          {/* コントロールパネル */}
          {isPvP ? (
            <div className="space-y-4">
              {pvpStep === 'p1_turn' && (
                <div>
                  <label className="flex justify-between text-sm font-medium text-gray-700 mb-1">
                    <span className="text-red-600 font-bold">【プレイヤー1（鈴木）の番】 お辞儀角度: {p1Angle}度</span>
                    <span className="text-xs text-gray-500">※理想は -22度</span>
                  </label>
                  <input
                    type="range"
                    min="-90"
                    max="90"
                    value={p1Angle}
                    onChange={(e) => {
                      const newAngle = Number(e.target.value);
                      setP1Angle(newAngle);
                      updateUrl(isStarted, 0, false, true, 'p1_turn', newAngle, p2Angle);
                    }}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-red-600"
                  />
                  <div className="flex justify-between text-xs text-gray-600 px-1 mt-1">
                    <span>← 左に深くお辞儀 (-90度)</span>
                    <span>真っ直ぐ (0度)</span>
                    <span>右にのけぞる (+90度) →</span>
                  </div>
                  <button
                    onClick={handleP1Submit}
                    className="w-full py-3 mt-4 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors shadow-sm"
                  >
                    プレイヤー1が捺印を決定
                  </button>
                </div>
              )}

              {pvpStep === 'p2_turn' && (
                <div>
                  <label className="flex justify-between text-sm font-medium text-gray-700 mb-1">
                    <span className="text-amber-600 font-bold">【プレイヤー2（佐藤）の番】 お辞儀角度: {p2Angle}度</span>
                    <span className="text-xs text-gray-500">※理想は -22度</span>
                  </label>
                  <input
                    type="range"
                    min="-90"
                    max="90"
                    value={p2Angle}
                    onChange={(e) => {
                      const newAngle = Number(e.target.value);
                      setP2Angle(newAngle);
                      updateUrl(isStarted, 0, false, true, 'p2_turn', p1Angle, newAngle);
                    }}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
                  />
                  <div className="flex justify-between text-xs text-gray-600 px-1 mt-1">
                    <span>← 左に深くお辞儀 (-90度)</span>
                    <span>真っ直ぐ (0度)</span>
                    <span>右にのけぞる (+90度) →</span>
                  </div>
                  <button
                    onClick={handleP2Submit}
                    className="w-full py-3 mt-4 bg-amber-600 text-white font-bold rounded-lg hover:bg-amber-700 transition-colors shadow-sm"
                  >
                    プレイヤー2が捺印を決定
                  </button>
                </div>
              )}

              {pvpStep === 'result' && (
                <div className="flex gap-4">
                  <button
                    onClick={handlePvPReset}
                    className="flex-1 py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg transition-colors shadow-sm"
                  >
                    もう一度対戦する
                  </button>
                  <button
                    onClick={handleBackToTop}
                    className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg transition-colors border border-gray-300"
                  >
                    メイン画面へ戻る
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {!judged ? (
                <div>
                  <div>
                    <label className="flex justify-between text-sm font-medium text-gray-700 mb-1">
                      <span>お辞儀角度の調整: {angle}度</span>
                      <span className="text-xs text-gray-500">
                        ※左へ傾けるほどマイナス
                      </span>
                    </label>
                    <input
                      type="range"
                      min="-90"
                      max="90"
                      value={angle}
                      onChange={(e) => {
                        const newAngle = Number(e.target.value);
                        setAngle(newAngle);
                        updateUrl(isStarted, newAngle, judged);
                      }}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-red-600"
                    />
                    <div className="flex justify-between text-xs text-gray-600 px-1 mt-1">
                      <span>← 左に深くお辞儀 (-90度)</span>
                      <span>真っ直ぐ (0度)</span>
                      <span>右にのけぞる (+90度) →</span>
                    </div>
                  </div>

                  <button
                    onClick={handleJudge}
                    className="w-full py-3 mt-4 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors shadow-sm"
                  >
                    これで捺印を申請する
                  </button>
                </div>
              ) : (
                <div className="flex gap-4">
                  <button
                    onClick={handleReset}
                    className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg transition-colors border border-gray-300"
                  >
                    もう一度調整する
                  </button>
                  {isPassed && (
                    <button
                      onClick={handleBackToTop}
                      className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors shadow-sm"
                    >
                      メイン画面へ戻る
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-24 bg-gradient-to-b from-red-50 to-white">
      <div className="text-center max-w-xl">
        <div className="inline-block bg-red-100 border border-red-200 rounded-full p-2 mb-6 shadow-sm">
          <span className="text-3xl">💮</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900">
          ハンコマスター検定
        </h1>
        <p className="mt-4 text-lg md:text-xl text-gray-600 leading-relaxed">
          誠意ある捺印こそが、社会人の基本です。
          あなたの「捺印マナー力」を今こそ証明しましょう。
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={handleStart}
            className="px-8 py-4 bg-red-600 text-white text-lg font-bold rounded-xl hover:bg-red-700 hover:scale-105 active:scale-95 transition-all duration-200 shadow-md hover:shadow-red-100"
          >
            検定を開始する (1人)
          </button>
          <button
            onClick={handleStartPvP}
            className="px-8 py-4 bg-amber-600 text-white text-lg font-bold rounded-xl hover:bg-amber-700 hover:scale-105 active:scale-95 transition-all duration-200 shadow-md hover:shadow-amber-100"
          >
            対戦モードを開始する (2人)
          </button>
        </div>
      </div>
    </main>
  );
}

export function judgeHankoAngle(angle: number): { isPassed: boolean; message: string } {
  // マナー判定：お辞儀ハンコは、左（反時計回り）に少し傾けるのが正解とされる。
  // 反時計回り（左に傾く）をマイナスの角度とする。
  // 理想的なお辞儀角度は -35度 〜 -10度 とする。
  if (angle >= -35 && angle <= -10) {
    return {
      isPassed: true,
      message: '【合格】 課長「うむ、鈴木くん。この左に少し傾いた絶妙なお辞儀角度…実に見事な誠意だ！上司への敬意が痛いほど伝わってくる。これぞ一流の社会人の捺印だな！」',
    };
  } else if (angle === 0) {
    return {
      isPassed: false,
      message: '【差し戻し】 課長「なんだねこの直立不動なハンコは！上司に対してペコペコとお辞儀をする気持ちがこれっぽっちも感じられん！態度が硬すぎる、やり直し！」',
    };
  } else if (angle > 0) {
    return {
      isPassed: false,
      message: '【差し戻し】 課長「バカ者！ハンコが右にのけぞっているではないか！上司を見下して威嚇しているのか！？あまりに無礼千万、すぐに押し直したまえ！」',
    };
  } else {
    return {
      isPassed: false,
      message: '【差し戻し】 課長「鈴木くん、いくら何でも傾けすぎだ。これではお辞儀というより、もはや地面にひれ伏して土下座しているか、転んでいるように見えるぞ。ほどほどにしたまえ。」',
    };
  }
}

export interface PvPResult {
  p1Score: number;
  p2Score: number;
  winner: 'p1' | 'p2' | 'draw';
  p1Passed: boolean;
  p2Passed: boolean;
  message: string;
}

export function judgePvP(p1Angle: number, p2Angle: number): PvPResult {
  const p1Passed = p1Angle >= -35 && p1Angle <= -10;
  const p2Passed = p2Angle >= -35 && p2Angle <= -10;

  // 理想の角度は -22度（または-22.5度だが、およそ -22度を基準とする）
  const idealAngle = -22;
  
  // 誠意度（スコア）の計算
  // 合格：100点から理想角度（-22度）との差の絶対値引く
  // 不合格：0点
  const p1Score = p1Passed ? Math.max(0, 100 - Math.abs(p1Angle - idealAngle) * 4) : 0;
  const p2Score = p2Passed ? Math.max(0, 100 - Math.abs(p2Angle - idealAngle) * 4) : 0;

  let winner: 'p1' | 'p2' | 'draw';
  let message: string;

  if (p1Passed && !p2Passed) {
    winner = 'p1';
    message = `【プレイヤー1（鈴木）の勝利！】 課長「プレイヤー1の美しいお辞儀ハンコ（${p1Angle}度）からは、社会人としての風格を感じるぞ！プレイヤー2は差し戻しだ、もっと上司を敬いたまえ！」`;
  } else if (!p1Passed && p2Passed) {
    winner = 'p2';
    message = `【プレイヤー2（佐藤）の勝利！】 課長「プレイヤー2の見事なお辞儀ハンコ（${p2Angle}度）からは、計り知れない敬意が伝わってくる！プレイヤー1は差し戻しだ、反省したまえ！」`;
  } else if (p1Passed && p2Passed) {
    if (p1Score > p2Score) {
      winner = 'p1';
      message = `【プレイヤー1（鈴木）の勝利！】 課長「素晴らしい！二人とも合格点（お辞儀ハンコ）だが、プレイヤー1（誠意度: ${Math.round(p1Score)}%）のほうが、理想のお辞儀（-22度）に近く、より深い誠意を感じるぞ！」`;
    } else if (p2Score > p1Score) {
      winner = 'p2';
      message = `【プレイヤー2（佐藤）の勝利！】 課長「素晴らしい！二人とも合格点だが、プレイヤー2（誠意度: ${Math.round(p2Score)}%）のほうが、理想のお辞儀（-22度）に近く、より深い誠意を感じるぞ！」`;
    } else {
      winner = 'draw';
      message = `【引き分け！】 課長「ううむ、二人ともまったく同じ角度（${p1Angle}度、誠意度: ${Math.round(p1Score)}%）の美しいお辞儀ハンコだ！甲乙つけがたい完璧な社畜精神。両者合格！」`;
    }
  } else {
    // 両者不合格
    winner = 'draw';
    message = `【両者差し戻し（引き分け）】 課長「なんだねこれは！二人とも上司をお辞儀で見下す、または土下座するような極端なハンコを押しおって！社会人失格だ、二人ともやり直し！」`;
  }

  return { p1Score, p2Score, winner, p1Passed, p2Passed, message };
}
