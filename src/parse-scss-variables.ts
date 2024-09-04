import { readFileSync } from 'fs';
import Parser, { SyntaxNode, Tree } from 'tree-sitter';
import ts from 'tree-sitter-scss';
import type { ScssFileInfo } from './scss-variables-parsed-result.model';
import { CSS_ROOT_SELECTOR_NODES } from './constants.js';

type ScssInfo = Omit<ScssFileInfo, 'file'>;

const skipedTypes = ['for_statement'];
const cssVariablesExtractRegexp = /^ *(--.*):/gm;

export function extractCssVariablesDeclarations(cssContent: string): string[] {
  return Array.from(
    new Set(
      Array.from(cssContent.matchAll(cssVariablesExtractRegexp)).map(
        (m) => m[1]
      )
    )
  );
}

export function extractScssVariables(
  filePath: string,
  ignoreScssVariables?: string[]
): ScssFileInfo {
  const content = readFileSync(filePath, 'utf-8');

  const t = parse(content);
  const scssVariables = generateScssFileInfo(t, ignoreScssVariables);
  const noScssVariablesDetected =
    !scssVariables.scssVariablesUsage.length &&
    !scssVariables.scssVariablesDeclarations.length;

  if (noScssVariablesDetected) {
    return;
  }
  return { ...scssVariables, file: filePath };
}

function parse(sourceCode: string): Tree {
  const parser = new Parser();
  parser.setLanguage(ts);

  const tree = parser.parse(sourceCode);
  return tree;
}

const fileInfoHandlers = [
  handleVariableDeclaration,
  handleVariableUsageNode,
  handleRootStylesheet,
  handleSyntaxError,
];

function generateScssFileInfo(
  t: Tree,
  ignoreScssVariables?: string[]
): ScssInfo {
  let scssFileInfo: ScssInfo = {
    scssVariablesDeclarations: [],
    scssVariablesUsage: [],
    replaceValue: [],
  };

  for (const node of traverseTree(t, skipedTypes)) {
    // console.log('[line 45]: node:', node, ' text: ', node.text);
    for (const handler of fileInfoHandlers) {
      scssFileInfo =
        handler(node, scssFileInfo, ignoreScssVariables) || scssFileInfo;
    }
  }
  return scssFileInfo;
}

function handleVariableDeclaration(
  node: SyntaxNode,
  scssFileInfo: ScssInfo,
  ignoreScssVariables?: string[]
): ScssInfo {
  const variableName = node.child(0)?.text;

  if (
    node.type !== 'declaration' ||
    ignoreScssVariables?.includes(variableName) ||
    !variableName.startsWith('$') ||
    node.children.some((c) => c.type === 'list_value')
  ) {
    return;
  }

  const variableValueNode = node.child(node.children.length - 2);
  const variableValue = variableValueNode.text;

  scssFileInfo.scssVariablesDeclarations.push({
    name: variableName,
    value: variableValue,
    startPos: node.startIndex,
    endPos: variableValueNode.endIndex,
    isValueScssVariable: variableValue.startsWith('$'),
  });

  return scssFileInfo;
}

function handleVariableUsageNode(
  node: SyntaxNode,
  scssFileInfo: ScssInfo,
  ignoreScssVariables?: string[]
): ScssInfo {
  if (
    node.type !== 'variable' ||
    findParentNode(node, 'ERROR') ||
    findDeclarationNode(node)?.child(0)?.text?.startsWith('$') ||
    ignoreScssVariables?.includes(node.text) ||
    isIgnoredByMixinPart(node)
  ) {
    return;
  }

  const isInterpolation = node.parent.type === 'interpolation';
  const startPos = isInterpolation ? node.parent.startIndex : node.startIndex;
  const endPos = isInterpolation ? node.parent.endIndex : node.endIndex;

  return {
    ...scssFileInfo,
    scssVariablesUsage: [
      ...scssFileInfo.scssVariablesUsage,
      {
        name: node.text,
        startPos,
        endPos,
      },
    ],
  };
}

function isIgnoredByMixinPart(node: SyntaxNode): boolean {
  const featureQueryParent = findParentNode(node, 'feature_query');
  const isParameter = findParentNode(node, 'parameters');
  const mixinStatementParent = findParentNode(node, 'mixin_statement');

  // console.log(
  //   '✎: [line 129][parse-scss-variables.ts] featureQueryParent: ',
  //   featureQueryParent,
  //   featureQueryParent?.text,
  //   node.parent.parent,
  //   node.parent.text,
  //   ' is parameter? ',
  //   isParameter,
  //   ' is mixin statement parent? ',
  //   mixinStatementParent
  // )

  if (featureQueryParent || !mixinStatementParent) {
    return false;
  }

  if (isParameter) {
    return true;
  }

  const params = mixinStatementParent
    .child(2)
    .children.filter((n) => n.type === 'parameter');

  const paramsVariables = params.map((p) => p.child(0).text);

  if (paramsVariables.includes(node.text)) {
    return true;
  }

  return false;
}

function findDeclarationNode(node: SyntaxNode): SyntaxNode {
  return findParentNode(node, 'declaration');
}

function findParentNode(node: SyntaxNode, type: string): SyntaxNode {
  if (!node || node.type === type) {
    return node;
  }

  return findParentNode(node?.parent, type);
}

function handleRootStylesheet(
  node: SyntaxNode,
  scssFileInfo: ScssInfo,
  _ignoreScssVariables?: string[]
): ScssInfo {
  const fc = node.child(0);
  if (node.type !== 'rule_set' || !CSS_ROOT_SELECTOR_NODES.includes(fc?.text)) {
    return;
  }

  scssFileInfo.rootStyleSheetPosition = {
    startPos: node.startIndex,
    endPos: node.endIndex,
  };

  return scssFileInfo;
}

function handleSyntaxError(
  node: SyntaxNode,
  scssFileInfo: ScssInfo,
  _ignoreScssVariables?: string[]
): ScssInfo {
  if (node.type !== 'ERROR' || findParentNode(node.parent, 'ERROR')) {
    return;
  }

  const content = node.text;
  const updatedContent = content.replaceAll(/\$([\w-]+)/g, 'var(--$1)');

  if (content === updatedContent) {
    return;
  }

  scssFileInfo.replaceValue.push({
    startPos: node.startIndex,
    endPos: node.endIndex,
    replaceBy: updatedContent,
  });

  return scssFileInfo;
}

function* traverseTree(
  tree: Tree,
  skipTypes?: string[],
  parentNode?: SyntaxNode
): IterableIterator<SyntaxNode> {
  const cursor = parentNode?.walk() ?? tree.walk();

  let reachedRoot = false;

  const retrace = () => {
    let retracing = true;

    while (retracing) {
      if (!cursor.gotoParent() || cursor.currentNode === parentNode) {
        retracing = false;
        reachedRoot = true;
      }

      if (cursor.gotoNextSibling()) {
        retracing = false;
      }
    }
  };

  while (!reachedRoot) {
    if (skipTypes?.includes(cursor.currentNode.type)) {
      retrace();
      continue;
    }

    yield cursor.currentNode;

    if (cursor.gotoFirstChild()) {
      continue;
    }

    if (cursor.gotoNextSibling()) {
      continue;
    }

    retrace();
  }
}
