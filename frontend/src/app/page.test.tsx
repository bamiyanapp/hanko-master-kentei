import { describe, it, expect, vi } from 'vitest';
import Home, { judgeHankoAngle } from './page';
import React from 'react';

// useStateを使用するクライアントコンポーネントを直接テストするため、useStateをモック化します。
vi.mock('react', async () => {
  const actual = await vi.importActual<typeof import('react')>('react');
  return {
    ...actual,
    useState: (initialValue: unknown) => {
      return [initialValue, vi.fn()];
    },
  };
});

// ReactElementツリーを再帰的に走査して、指定したタイプの要素を探すヘルパー関数
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function findType(element: any, type: string): any {
  if (!element) return undefined;
  if (element.type === type) return element;
  if (element.props && element.props.children) {
    if (Array.isArray(element.props.children)) {
      for (const child of element.props.children) {
        const found = findType(child, type);
        if (found) return found;
      }
    } else {
      return findType(element.props.children, type);
    }
  }
  return undefined;
}

describe('Home Component', () => {
  it('should render main wrapper and title', () => {
    const result = Home() as React.ReactElement;
    expect(result.type).toBe('main');
    
    // 子要素を探索してタイトルを確認するユニットテスト
    const h1 = findType(result, 'h1') as React.ReactElement<{ children: string }> | undefined;
    expect(h1).toBeDefined();
    expect(h1?.props.children).toBe('ハンコマスター検定');
  });

  it('should render description paragraph', () => {
    const result = Home() as React.ReactElement;
    const p = findType(result, 'p') as React.ReactElement<{ children: string }> | undefined;
    expect(p).toBeDefined();
    expect(p?.props.children).toContain('誠意ある捺印こそが、社会人の基本です。');
  });

  it('should render start button', () => {
    const result = Home() as React.ReactElement;
    const button = findType(result, 'button') as React.ReactElement<{ children: string }> | undefined;
    expect(button).toBeDefined();
    expect(button?.props.children).toBe('検定を開始する');
  });
});

describe('judgeHankoAngle', () => {
  it('should return isPassed true and pass message for ideal angle (e.g. -20)', () => {
    const result = judgeHankoAngle(-20);
    expect(result.isPassed).toBe(true);
    expect(result.message).toContain('合格');
  });

  it('should return isPassed false and straight message for 0 angle', () => {
    const result = judgeHankoAngle(0);
    expect(result.isPassed).toBe(false);
    expect(result.message).toContain('直立不動');
  });

  it('should return isPassed false and backward message for positive angle (e.g. 10)', () => {
    const result = judgeHankoAngle(10);
    expect(result.isPassed).toBe(false);
    expect(result.message).toContain('のけぞっている');
  });

  it('should return isPassed false and over-angled message for deep negative angle (e.g. -50)', () => {
    const result = judgeHankoAngle(-50);
    expect(result.isPassed).toBe(false);
    expect(result.message).toContain('傾けすぎ');
  });
});
