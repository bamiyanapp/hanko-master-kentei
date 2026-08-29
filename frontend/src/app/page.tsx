'use client';

import React, { useState } from 'react';

import { useEffect } from 'react';
import { playClickSound, playSuccessSound, playFailureSound } from './sfx';

export default function Home() {
  const [isStarted, setIsStarted] = useState(false);
  const [angle, setAngle] = useState(0); // 角度（度数法：-180 〜 180）
  const [judged, setJudged] = useState(false);
  const [resultMessage, setResultMessage] = useState('');
  const [isPassed, setIsPassed] = useState(false);

  // URLパラメータと状態の同期用関数
  const updateUrl = (started: boolean, currentAngle: number, currentJudged: boolean) => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams();
    if (started) {
      params.set('started', 'true');
      if (currentAngle !== 0) {
        params.set('angle', currentAngle.toString());
      }
      if (currentJudged) {
        params.set('judged', 'true');
      }
    }
    const newSearch = params.toString();
    const queryString = newSearch ? `?${newSearch}` : '';
    const newUrl = `${window.location.pathname}${queryString}`;
    window.history.pushState(null, '', newUrl);
  };

  // マウント時にURLパラメータから状態を復元
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    
    const startedParam = params.get('started') === 'true';
    const angleParam = Number(params.get('angle') || 0);
    const judgedParam = params.get('judged') === 'true';
    
    if (startedParam) {
      setIsStarted(true);
    }
    if (angleParam !== 0) {
      setAngle(angleParam);
    }
    if (judgedParam) {
      setJudged(true);
      const result = judgeHankoAngle(angleParam);
      setIsPassed(result.isPassed);
      setResultMessage(result.message);
    }
  }, []);

  const handleStart = () => {
    playClickSound();
    setIsStarted(true);
    setAngle(0);
    setJudged(false);
    setResultMessage('');
    setIsPassed(false);
    updateUrl(true, 0, false);
  };

  const handleJudge = () => {
    setJudged(true);
    const result = judgeHankoAngle(angle);
    setIsPassed(result.isPassed);
    setResultMessage(result.message);
    updateUrl(isStarted, angle, true);
    if (result.isPassed) {
      playSuccessSound();
    } else {
      playFailureSound();
    }
  };

  const handleReset = () => {
    playClickSound();
    setAngle(0);
    setJudged(false);
    setResultMessage('');
    setIsPassed(false);
    updateUrl(isStarted, 0, false);
  };

  const handleBackToTop = () => {
    playClickSound();
    setIsStarted(false);
    updateUrl(false, 0, false);
  };

  if (isStarted) {
    return (
      <main className="d-flex min-vh-100 flex-column align-items-center justify-content-center p-4 p-md-5 bg-light">
        <div className="card w-100 shadow-sm" style={{ maxWidth: '42rem' }}>
          <div className="card-body p-4">
            <div className="d-flex justify-content-between align-items-center border-bottom pb-3 mb-4">
              <div>
                <span className="badge bg-danger-subtle text-danger-emphasis">
                  ステージ 1
                </span>
                <h2 className="fs-4 fw-bold mt-1">
                  課長承認：はじめてのお辞儀ハンコ
                </h2>
              </div>
              <button
                onClick={handleBackToTop}
                className="btn btn-link btn-sm text-secondary text-decoration-none p-0"
              >
                戻る
              </button>
            </div>

            <div className="alert alert-warning mb-4">
              <h3 className="alert-heading fs-6 fw-semibold mb-1">
                ミッション
              </h3>
              <p className="small mb-0">
                稟議書（パソコン購入申請）に捺印しなさい。
                ただし、日本企業の伝統マナーに基づき、
                <strong>上司（課長）に向かってお辞儀をするように、左に少し傾けて（お辞儀ハンコ）</strong>
                捺印すること。
              </p>
            </div>

            {/* 稟議書風のプレビュー領域 */}
            <div className="doc-preview p-4 p-md-5 bg-white mb-4 position-relative overflow-hidden d-flex flex-column justify-content-between">
              <div className="text-center">
                <h3 className="fs-4 fw-bold border-bottom border-2 pb-2 d-inline-block">
                  パソコン購入稟議書
                </h3>
              </div>

              <div className="my-4 small text-secondary">
                <p>
                  <strong>件名：</strong> 開発用ハイスペックPCの新規調達
                </p>
                <p>
                  <strong>理由：</strong> 現行のPCスペック不足により、ビルドおよびデバッグに著しい支障が出ているため。
                </p>
              </div>

              {/* 捺印欄 */}
              <div className="d-flex justify-content-end mt-3">
                <div className="d-flex border border-dark text-center">
                  <div className="border-end border-dark" style={{ width: '5rem' }}>
                    <div className="bg-body-secondary small py-1 border-bottom border-dark">
                      部長
                    </div>
                    <div
                      className="d-flex align-items-center justify-content-center text-body-tertiary small user-select-none"
                      style={{ height: '4rem' }}
                    >
                      （未承認）
                    </div>
                  </div>
                  <div className="border-end border-dark position-relative" style={{ width: '5rem' }}>
                    <div className="bg-body-secondary small py-1 border-bottom border-dark">
                      課長
                    </div>
                    <div
                      className="d-flex align-items-center justify-content-center"
                      style={{ height: '4rem' }}
                    >
                      {/* 捺印される印影 */}
                      <div
                        style={{
                          transform: `rotate(${angle}deg)`,
                          transition: judged ? 'transform 0.5s ease' : 'none',
                          width: '3rem',
                          height: '3rem',
                        }}
                        className={`rounded-circle border border-2 border-danger d-flex align-items-center justify-content-center text-danger fw-bold user-select-none ${
                          judged ? 'opacity-100' : 'opacity-50'
                        }`}
                      >
                        <span className="small d-block" style={{ letterSpacing: '0.2em', lineHeight: 1 }}>
                          鈴木
                        </span>
                      </div>
                    </div>
                  </div>
                  <div style={{ width: '5rem' }}>
                    <div className="bg-body-secondary small py-1 border-bottom border-dark">
                      起案者
                    </div>
                    <div
                      className="d-flex align-items-center justify-content-center"
                      style={{ height: '4rem' }}
                    >
                      <div
                        className="rounded-circle border border-2 border-danger d-flex align-items-center justify-content-center text-danger small fw-semibold user-select-none"
                        style={{ width: '3rem', height: '3rem' }}
                      >
                        鈴木
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 判定結果の表示 */}
            {judged && (
              <div className={`alert ${isPassed ? 'alert-success' : 'alert-danger'} mb-4`}>
                <h4 className="alert-heading fs-6 fw-bold mb-1">
                  {isPassed ? '🎉 合格！' : '❌ 差し戻し！'}
                </h4>
                <p className="small mb-0">{resultMessage}</p>
              </div>
            )}

            {/* コントロールパネル */}
            {!judged ? (
              <div className="d-flex flex-column gap-3">
                <div>
                  <label className="d-flex justify-content-between small fw-semibold mb-1">
                    <span>お辞儀角度の調整: {angle}度</span>
                    <span className="small text-secondary">
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
                    className="form-range"
                    style={{ accentColor: 'var(--bs-danger)' }}
                  />
                  <div className="d-flex justify-content-between small text-secondary px-1 mt-1">
                    <span>← 左に深くお辞儀 (-90度)</span>
                    <span>真っ直ぐ (0度)</span>
                    <span>右にのけぞる (+90度) →</span>
                  </div>
                </div>

                <button
                  onClick={handleJudge}
                  className="btn btn-danger w-100 py-2 fw-bold shadow-sm"
                >
                  これで捺印を申請する
                </button>
              </div>
            ) : (
              <div className="d-flex gap-3">
                <button
                  onClick={handleReset}
                  className="btn btn-outline-secondary flex-fill py-2 fw-bold"
                >
                  もう一度調整する
                </button>
                {isPassed && (
                  <button
                    onClick={handleBackToTop}
                    className="btn btn-success flex-fill py-2 fw-bold shadow-sm"
                  >
                    メイン画面へ戻る
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="d-flex min-vh-100 flex-column align-items-center justify-content-center p-4 p-md-5 hero-gradient">
      <div className="text-center mx-auto" style={{ maxWidth: '36rem' }}>
        <div className="d-inline-block bg-danger-subtle border border-danger-subtle rounded-circle p-2 mb-4 shadow-sm">
          <span className="fs-2">💮</span>
        </div>
        <h1 className="display-5 fw-bold">
          ハンコマスター検定
        </h1>
        <p className="mt-3 fs-5 text-secondary">
          誠意ある捺印こそが、社会人の基本です。
          あなたの「捺印マナー力」を今こそ証明しましょう。
        </p>
        <button
          onClick={handleStart}
          className="btn btn-danger btn-lg mt-5 px-4 py-3 fw-bold shadow"
        >
          検定を開始する
        </button>
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
