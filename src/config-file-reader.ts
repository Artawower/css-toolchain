import { readFileSync } from 'fs';
import { Config } from './config.model';

export const parseConfigFile = (path: string): Config => {
  const textConfig = readFileSync(path, 'utf-8');
  const config = JSON.parse(textConfig) as Config;

  return config;
};
