import { findScssFiles } from './find-scss-files.js';
import type { Config } from './config.model';
import { readFileSync, writeFileSync } from 'fs';
import { extractCssVariablesDeclarations } from './parse-scss-variables.js';
import { generateTypesFromCssVariables } from './generate-types-from-css-variables.js';

export async function generateTypes(config: Config): Promise<void> {
  const scssFiles = findScssFiles(config, config.projectPath);

  const cssVariables = findCssVariables(scssFiles);

  if (!cssVariables.length) {
    return;
  }

  const generatedTypes = generateTypesFromCssVariables(
    cssVariables,
    config.generateFlatTypes
  );

  if (config.dry) {
    console.log(generatedTypes);
  }

  writeFileSync(config.typePath, generatedTypes);
}

function findCssVariables(filePaths: string[]): string[] {
  const variables = Array.from(
    new Set(
      filePaths.reduce((acc, path) => {
        const fileContent = readFileSync(path, 'utf-8');
        const variables = extractCssVariablesDeclarations(fileContent);
        return [...acc, ...variables];
      }, [])
    )
  );

  return variables;
}
