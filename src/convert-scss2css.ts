import { readFileSync, writeFileSync } from 'fs';
import type {
  ReplaceValue,
  ScssFileInfo,
  ScssVariable,
  ScssVariableDeclaration,
} from 'scss-variables-parsed-result.model';
import type { Config } from './config.model';

export function convertScssToCss(
  config: Config,
  ...scssFileInfo: ScssFileInfo[]
): void {
  scssFileInfo.forEach((scssInfo) =>
    convertScssToCssVariables(scssInfo, config.dry)
  );
}

const semicolonNewLineOffset = 2;

function convertScssToCssVariables(fileInfo: ScssFileInfo, dry: boolean): void {
  let fileContent = readFileSync(fileInfo.file, 'utf-8');
  let offset = 0;
  const variables = getOrderedVariables(fileInfo);
  let styleSheet = ``;

  const recalculateStylesheetOffset = (
    start: number,
    end: number,
    offset: number
  ) => {
    const isStartDisplaced = fileInfo.rootStyleSheetPosition?.startPos > start;

    const isEndDisplaced = fileInfo.rootStyleSheetPosition?.endPos > end;

    if (isStartDisplaced && isEndDisplaced) {
      fileInfo.rootStyleSheetPosition.startPos += offset;
    }

    if (isEndDisplaced) {
      fileInfo.rootStyleSheetPosition.endPos += offset;
    }
  };

  variables.forEach((v) => {
    if ('value' in v) {
      styleSheet += getCssDeclaration(v.name, v.value);
      const start = v.startPos + offset;
      const end = v.endPos + offset + semicolonNewLineOffset;
      fileContent = fileContent.slice(0, start) + fileContent.slice(end);
      offset -= end - start;
      recalculateStylesheetOffset(start, end, -(end - start));
      return;
    }

    if ('name' in v) {
      const newValue = convertScssValueToCssVariable(v.name);
      fileContent =
        fileContent.slice(0, v.startPos + offset) +
        newValue +
        fileContent.slice(v.endPos + offset);

      const diffLength = newValue.length - (v.endPos - v.startPos);
      recalculateStylesheetOffset(
        v.startPos + offset,
        v.endPos + offset,
        diffLength
      );
      offset += diffLength;
      // console.log(
      //   '✎: [line 54][convert-scss2css.ts] newValue.length - (v.endPos - v.startPos): ',
      //   newValue.length - (v.endPos - v.startPos),
      //   ' end pos: ',
      //   v.endPos,
      //   ' style start: ',
      //   fileInfo.rootStyleSheetPosition.startPos,
      //   ' new value: ',
      //   newValue
      // );
    }

    if ('replaceBy' in v) {
      fileContent =
        fileContent.slice(0, v.startPos + offset) +
        v.replaceBy +
        fileContent.slice(v.endPos + offset);

      const diffLength = v.replaceBy.length - (v.endPos - v.startPos);

      recalculateStylesheetOffset(
        v.startPos + offset,
        v.endPos + offset,
        diffLength
      );

      offset += diffLength;
    }
  });

  const resultContent = replaceScssCalculations(
    generateNewFileContent(
      fileContent,
      styleSheet,
      fileInfo.rootStyleSheetPosition
    )
  );

  if (dry) {
    console.log(resultContent);
    return;
  }
  writeFileSync(fileInfo.file, resultContent);
}

function getOrderedVariables(
  fileInfo: ScssFileInfo
): (ScssVariableDeclaration | ScssVariable | ReplaceValue)[] {
  const variables = [
    ...fileInfo.scssVariablesUsage,
    ...fileInfo.scssVariablesDeclarations,
    ...fileInfo.replaceValue,
  ];

  variables.sort((v, vp) => v.startPos - vp.startPos);

  return variables;
}

function getCssDeclaration(key: string, val: string, spaceOffset = 2): string {
  return `${' '.repeat(spaceOffset)}${getCssVariablePropertyName(removeScssVariablePrefix(key))}: ${convertScssValueToCssVariable(val)};\n`;
}

function removeScssVariablePrefix(name: string): string {
  return name.replace('$', '');
}

function getCssVariablePropertyName(name: string): string {
  return `--${removeScssVariablePrefix(name)}`;
}

function convertScssValueToCssVariable(value: string): string {
  if (value.startsWith('$')) {
    return `var(--${removeScssVariablePrefix(value)})`;
  }
  return value;
}

function generateNewFileContent(
  fileContent: string,
  cssVariables: string,
  styleSheet?: ScssFileInfo['rootStyleSheetPosition']
): string {
  if (!cssVariables.length) {
    return fileContent;
  }
  if (!styleSheet) {
    return fileContent + createCssStyleSheetWrapper(cssVariables);
  }

  return (
    fileContent.slice(0, styleSheet.endPos - 1) +
    '\n' +
    cssVariables +
    fileContent.slice(styleSheet.endPos - 1)
  );
}

function createCssStyleSheetWrapper(body: string): string {
  if (!body.length) {
    return '';
  }
  return `\n:root {\n${body}}\n`;
}

function replaceScssCalculations(content: string): string {
  return content.replaceAll(
    /([\w\-\$]+: ?)(.*var\(--.*\).*(?:\*|\-|\+|\:)+(?!\-)(?<!\-).*);/gm,
    '$1calc($2);'
  );
}
