import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EndingSequence from './EndingSequence';

describe('EndingSequence', () => {
  it('1コマ目は「認定されました」の文言とタップ案内を表示する', () => {
    render(<EndingSequence onFinish={vi.fn()} />);

    expect(screen.getByText(/認定されました/)).toBeInTheDocument();
    expect(screen.getByText('（タップして次へ）')).toBeInTheDocument();
  });

  it('タップするたびに、暗転を挟んで全コマが順番に表示される', async () => {
    const user = userEvent.setup();
    const onFinish = vi.fn();
    render(<EndingSequence onFinish={onFinish} />);
    const screenArea = screen.getByRole('main');

    // コマ1（暗転）: 文言もタップ案内も出さず、背景が黒になる
    await user.click(screenArea);
    expect(screen.queryByText(/認定されました/)).not.toBeInTheDocument();
    expect(screen.queryByText('（タップして次へ）')).not.toBeInTheDocument();
    expect(screenArea).toHaveClass('bg-black');
    expect(screenArea).toBeEmptyDOMElement();

    await user.click(screenArea);
    expect(screen.getByText('翌月から電子承認システムを導入します。')).toBeInTheDocument();
    expect(screenArea).not.toHaveClass('bg-black');

    await user.click(screenArea);
    expect(screen.getByText('紙の申請書および押印は原則廃止となります。')).toBeInTheDocument();

    await user.click(screenArea);
    expect(screen.getByText('あなたの努力は、決して無駄ではありませんでした。')).toBeInTheDocument();

    // 全コマ表示中は、まだ終了していない
    expect(onFinish).not.toHaveBeenCalled();
    expect(screen.queryByText('GAME CLEAR')).not.toBeInTheDocument();
  });

  it('全コマ終了後はGAME CLEAR画面を表示し、ボタンでonFinishが1回呼ばれる', async () => {
    const user = userEvent.setup();
    const onFinish = vi.fn();
    render(<EndingSequence onFinish={onFinish} />);

    // 全5コマをタップして進める
    for (let i = 0; i < 5; i++) {
      await user.click(screen.getByRole('main'));
    }

    expect(screen.getByRole('heading', { level: 1, name: 'GAME CLEAR' })).toBeInTheDocument();
    expect(onFinish).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'トップ画面へ戻る' }));

    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  it('GAME CLEAR画面では画面全体のタップで先へ進まない（ボタンのみ）', async () => {
    const user = userEvent.setup();
    const onFinish = vi.fn();
    render(<EndingSequence onFinish={onFinish} />);
    for (let i = 0; i < 5; i++) {
      await user.click(screen.getByRole('main'));
    }

    await user.click(screen.getByRole('main'));

    expect(screen.getByText('GAME CLEAR')).toBeInTheDocument();
    expect(onFinish).not.toHaveBeenCalled();
  });
});
