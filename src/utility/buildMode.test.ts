/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

import {IS_DEMO_BUILD} from './buildMode';

describe('buildMode', () => {
  it('is false in the default (non-demo) vitest graph', () => {
    expect(IS_DEMO_BUILD).toBe(false);
    expect(IS_DEMO_BUILD).toBe(__DEMO_BUILD__);
  });
});
