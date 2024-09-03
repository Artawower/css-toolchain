import { Command } from 'commander';
import { parseConfigFile } from './config-file-reader.js';
import { migrateScssVariablesToCssVariables } from './migrate-scss-variables-to-css-variables.js';

(async (): Promise<void> => {
  const program = new Command();
  program.option('-c, --config <path>', 'Path for config file');
  program.option(
    '-m, --migrate-scss-variables',
    'Migrate scss variables to css variables'
  );

  program.option('-d, --dry', 'Run CLI without any changes');
  program.parse(process.argv);

  const options = program.opts<{
    config: string;
    migrateScssVariables: boolean;
    dry?: boolean;
  }>();

  if (!options.config) {
    throw new Error('Config file is not specified');
  }

  const config = parseConfigFile(options.config);
  config.dry = options.dry;

  if (options.migrateScssVariables) {
    await migrateScssVariablesToCssVariables(config);
  }
})();
