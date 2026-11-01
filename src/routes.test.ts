/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

import {routes} from './routes';

describe('routes', () => {
  it('marks every route protected', () => {
    expect(routes.length).toBeGreaterThan(0);
    expect(routes.every((route) => route.isProtected)).toBe(true);
  });
});
