export function generateTypesFromCssVariables(
  cssVars: string[],
  flatTypes?: boolean
): string {
  if (flatTypes) {
    cssVars = cssVars.map((v) => v.slice(2));
  }

  cssVars = cssVars.map((v) => `'${v}'`);

  const [first, ...rest] = cssVars;
  const restTypes = rest.map((v) => `  | ${v}`).join('\n');

  return `export type CssVariables = ${first}\n${restTypes};`;
}
