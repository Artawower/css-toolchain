import { findScssFiles } from './find-scss-files.js';
import { extractScssVariables } from './parse-scss-variables.js';
import type { Config } from './config.model';
import type { ScssFileInfo } from 'scss-variables-parsed-result.model';
import { convertScssToCss } from './convert-scss2css.js';

export async function migrateScssVariablesToCssVariables(
  config: Config
): Promise<void> {
  const scssFiles = findScssFiles(config, config.projectPath);
  scssFiles.forEach((file) => console.log(file));

  const scssFilesWithVariables = scssFiles.reduce<ScssFileInfo[]>(
    (acc, filePath) => {
      const scssVariables = extractScssVariables(
        filePath,
        config.ignoreScssVariables
      );
      if (!scssVariables) {
        return acc;
      }
      acc.push(scssVariables);
      return acc;
    },
    []
  );

  convertScssToCss(config, ...scssFilesWithVariables);
}
