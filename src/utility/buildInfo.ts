/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

import {buildInfo as generatedBuildInfo} from 'virtual:build-info';

export interface BuildInfo {
  version: string;
  buildTime: string;
  buildTimestamp: number;
}

export const buildInfo: BuildInfo = generatedBuildInfo;

export const getBuildInfo = (): BuildInfo => buildInfo;
