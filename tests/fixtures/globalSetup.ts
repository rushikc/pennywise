/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

import {seedAll} from './seedEmulator.ts';

export default async function globalSetup(): Promise<void> {
  await seedAll();
}
