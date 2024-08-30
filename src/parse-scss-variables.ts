import { readFileSync } from 'fs';
import Parser, { SyntaxNode, Tree } from 'tree-sitter';
import ts from 'tree-sitter-scss';
import type { ScssFileInfo } from './scss-variables-parsed-result.model';
import { CSS_ROOT_SELECTOR_NODES } from './constants.js';

type ScssInfo = Omit<ScssFileInfo, 'file'>;

export function extractScssVariables(filePath: string): ScssFileInfo {
  const content = readFileSync(filePath, 'utf-8');

  const t = parse(content);
  const scssVariables = generateScssFileInfo(t);
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
];

function generateScssFileInfo(t: Tree): ScssInfo {
  let scssFileInfo: ScssInfo = {
    scssVariablesDeclarations: [],
    scssVariablesUsage: [],
  };

  for (const node of traverseTree(t)) {
    console.log('[line 33]: nodetype', node, node.text);
    for (const handler of fileInfoHandlers) {
      scssFileInfo = handler(node, scssFileInfo) || scssFileInfo;
    }
  }
  return scssFileInfo;
}

function handleVariableDeclaration(
  node: SyntaxNode,
  scssFileInfo: ScssInfo
): ScssInfo {
  if (node.type !== 'declaration') {
    return;
  }

  const variableName = node.child(0).text;
  if (!variableName.startsWith('$')) {
    return;
  }
  const variableValue = node.child(node.children.length - 2).text;

  scssFileInfo.scssVariablesDeclarations.push({
    name: variableName,
    value: variableValue,
    startPos: node.startIndex,
    endPos: node.endIndex,
    isValueScssVariable: variableValue.startsWith('$'),
  });

  return scssFileInfo;
}

function handleVariableUsageNode(
  node: SyntaxNode,
  scssFileInfo: ScssInfo
): ScssInfo {
  if (node.type !== 'variable') {
    return;
  }

  return {
    ...scssFileInfo,
    scssVariablesUsage: [
      ...scssFileInfo.scssVariablesUsage,
      {
        name: node.text,
        startPos: node.startIndex,
        endPos: node.endIndex,
      },
    ],
  };
}

function handleRootStylesheet(
  node: SyntaxNode,
  scssFileInfo: ScssInfo
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

function* traverseTree(
  tree: Tree,
  parentNode?: SyntaxNode
): IterableIterator<SyntaxNode> {
  const cursor = parentNode?.walk() ?? tree.walk();

  let reachedRoot = false;

  while (!reachedRoot) {
    yield cursor.currentNode;

    if (cursor.gotoFirstChild()) {
      continue;
    }

    if (cursor.gotoNextSibling()) {
      continue;
    }

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
  }
}
