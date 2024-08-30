export interface ScssVariable {
  startPos: number;
  endPos: number;
  name: string;
}

export interface ScssVariableDeclaration extends ScssVariable {
  value: string;
  isValueScssVariable: boolean;
}

export interface ScssFileInfo {
  file: string;
  scssVariablesDeclarations: ScssVariableDeclaration[];
  scssVariablesUsage: ScssVariable[];
  rootStyleSheetPosition?: {
    startPos: number;
    endPos: number;
  };
}

export type ParsedResult = { [fileName: string]: ScssFileInfo };
