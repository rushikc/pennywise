/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

import {createAppTheme} from './appTheme';
import {brand, DESKTOP_MIN, desktop, phone} from './designTokens';

const fontKeys = ['display', 'h1', 'h2', 'title', 'body', 'subtext', 'caption'] as const;
const growingSpace = ['md', 'lg', 'xl', 'xxl'] as const;

describe('design tokens', () => {
  it('keeps desktop type and space at least as large as phone', () => {
    fontKeys.forEach((key) => {
      expect(desktop.fontSize[key]).toBeGreaterThanOrEqual(phone.fontSize[key]);
    });
    growingSpace.forEach((key) => {
      expect(desktop.space[key]).toBeGreaterThanOrEqual(phone.space[key]);
    });
    expect(desktop.space.xs).toBe(phone.space.xs);
    expect(desktop.space.sm).toBe(phone.space.sm);
    expect(desktop.controlHeight).toBeGreaterThanOrEqual(phone.controlHeight);
  });

  it('maps MUI variants onto the type scale', () => {
    const theme = createAppTheme('light');
    const desktopKey = theme.breakpoints.up(DESKTOP_MIN);
    const h4 = theme.typography.h4 as {fontSize: string} & Record<string, {fontSize: string}>;
    const body2 = theme.typography.body2 as {fontSize: string} & Record<string, {fontSize: string}>;

    expect(theme.palette.primary.main).toBe(brand.primary);
    expect(theme.spacing(1)).toBe('4px');
    expect(theme.shape.borderRadius).toBe(phone.radius.md);
    expect(theme.typography.h4.fontSize).toBe(`${phone.fontSize.h1}px`);
    expect(theme.typography.h5.fontSize).toBe(`${phone.fontSize.h2}px`);
    expect(theme.typography.h6.fontSize).toBe(`${phone.fontSize.title}px`);
    expect(theme.typography.subtitle1.fontSize).toBe(`${phone.fontSize.title}px`);
    expect(theme.typography.body1.fontSize).toBe(`${phone.fontSize.body}px`);
    expect(theme.typography.body2.fontSize).toBe(`${phone.fontSize.subtext}px`);
    expect(theme.typography.caption.fontSize).toBe(`${phone.fontSize.caption}px`);
    expect(h4[desktopKey].fontSize).toBe(`${desktop.fontSize.h1}px`);
    expect(body2[desktopKey].fontSize).toBe(`${desktop.fontSize.subtext}px`);
  });

  it('uses the lighter primary blue in dark mode', () => {
    expect(createAppTheme('dark').palette.primary.main).toBe(brand.primaryOnDark);
  });
});
