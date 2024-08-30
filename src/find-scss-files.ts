import { readdirSync, statSync } from 'fs';
import { join } from 'path';
import { Config } from './config.model';

export function findScssFiles(config: Config, dir: string): string[] {
  const files = readdirSync(dir);

  const scssFiles: string[] = [];

  for (const file of files) {
    const path = join(dir, file);

    const stat = statSync(path);
    const isFile = stat.isFile();

    if (isFile && file.endsWith('.scss')) {
      scssFiles.push(path);
      continue;
    }

    if (isFile) {
      continue;
    }

    const excludedDir = config.excludePatterns?.some((p) =>
      new RegExp(p).test(file)
    );

    if (excludedDir) {
      continue;
    }

    scssFiles.push(...findScssFiles(config, path));
  }

  return scssFiles;
}
