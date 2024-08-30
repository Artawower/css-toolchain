import { Command } from 'commander';
import { parseConfigFile } from './config-file-reader.js';
import { findScssFiles } from './find-scss-files.js';
import { extractScssVariables } from './parse-scss-variables.js';

(async (): Promise<void> => {
  const program = new Command();
  program.option('-c, --config <path>', 'Path for config file');
  program.option(
    '-m, --migrate-scss-variables',
    'Migrate scss variables to css variables'
  );
  program.parse(process.argv);

  const options = program.opts<{
    config: string;
    migrateScssVariables: boolean;
  }>();

  if (!options.config) {
    throw new Error('Config file is not specified');
  }

  console.log('✎: [line 27][index.ts<3>] options.config: ', options.config);

  console.log(
    '[line 25]: options.migration -scss',
    options.migrateScssVariables
  );

  const config = parseConfigFile(options.config);

  if (options.migrateScssVariables) {
    await migrateScssVariablesToCssVariables(config);
  }
})();

async function migrateScssVariablesToCssVariables(
  config: Config
): Promise<void> {
  const scssFiles = findScssFiles(config, config.projectPath);
  const scssVariables = extractScssVariables(
    '/Users/darkawower/projects/pet/css-toolchain/miscellaneous/test.scss'
  );
  console.log('✎: [line 38][index.ts<3>] scssVariables: ', scssVariables);
}
