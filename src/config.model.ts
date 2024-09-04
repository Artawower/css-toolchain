export interface Config {
  projectPath: string;
  includePatterns?: string[];
  excludePatterns?: string[];
  ignoreScssVariables?: string[];
  dry?: boolean;
  typePath?: string;
  generateFlatTypes?: boolean;
}
