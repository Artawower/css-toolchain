import { readdirSync, statSync } from 'fs';
import { join } from 'path';
import { Config } from './config.model';

export function findScssFiles(config: Config, dir: string): string[] {
  if (statSync(dir).isFile()) {
    return [dir];
  }
  const files = readdirSync(dir);

  const scssFiles: string[] = [];

  for (const file of files) {
    const excludePath = config.excludePatterns?.some((p) =>
      new RegExp(p).test(file)
    );

    if (excludePath) {
      console.log('[line 33]: EXCLUDE', file);
      continue;
    }

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

    scssFiles.push(...findScssFiles(config, path));
  }

  return scssFiles;
}
