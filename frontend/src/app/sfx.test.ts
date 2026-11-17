import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// basePathはモジュール読み込み時に環境変数から決まるため、テストごとに読み込み直す。
async function loadSfx() {
  vi.resetModules();
  return import('./sfx');
}

describe('sfx（効果音の再生）', () => {
  let play: ReturnType<typeof vi.fn>;
  let AudioMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    play = vi.fn(() => Promise.resolve());
    // `new Audio(src)`で呼ばれるため、アロー関数ではなくfunctionで実装する
    AudioMock = vi.fn(function (this: { src: string; play: typeof play }, src: string) {
      this.src = src;
      this.play = play;
    });
    vi.stubGlobal('Audio', AudioMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it.each([
    { name: 'playClickSound', file: 'click.mp3' },
    { name: 'playSuccessSound', file: 'success.mp3' },
    { name: 'playFailureSound', file: 'failure.mp3' },
  ] as const)('$name は /sfx/$file を再生する', async ({ name, file }) => {
    const sfx = await loadSfx();

    sfx[name]();

    expect(AudioMock).toHaveBeenCalledTimes(1);
    expect(AudioMock).toHaveBeenCalledWith(`/sfx/${file}`);
    expect(play).toHaveBeenCalledTimes(1);
  });

  it('NEXT_PUBLIC_BASE_PATHが設定されていれば、その配下の音声を再生する（GitHub Pages配信）', async () => {
    vi.stubEnv('NEXT_PUBLIC_BASE_PATH', '/hanko-master-kentei');
    const sfx = await loadSfx();

    sfx.playClickSound();

    expect(AudioMock).toHaveBeenCalledWith('/hanko-master-kentei/sfx/click.mp3');
  });

  it('再生が拒否されても（自動再生ポリシー等）、例外を投げず、未処理のPromise拒否も残さない', async () => {
    // vitestは未処理の拒否を握りつぶされたテストを失敗にしないため、Nodeのイベントを直接監視する
    const unhandled = vi.fn();
    process.on('unhandledRejection', unhandled);
    try {
      // vi.fnは戻り値のPromiseに内部で処理を付けてしまい未処理にならないため、素の関数で拒否を返す
      vi.stubGlobal('Audio', function (this: { play: () => Promise<void> }) {
        this.play = () => Promise.reject(new Error('NotAllowedError'));
      });
      const sfx = await loadSfx();

      expect(() => sfx.playSuccessSound()).not.toThrow();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(unhandled).not.toHaveBeenCalled();
    } finally {
      process.off('unhandledRejection', unhandled);
    }
  });

  it('Audio APIが無い環境（SSR・未対応ブラウザ）では、何もせず例外も投げない', async () => {
    vi.stubGlobal('Audio', undefined);
    const sfx = await loadSfx();

    expect(() => sfx.playClickSound()).not.toThrow();
    expect(AudioMock).not.toHaveBeenCalled();
  });
});
