import { writeFileSync, rmSync, readFileSync } from 'fs';
import { test, expect, afterEach } from 'vitest';
import { migrateScssVariablesToCssVariables } from '../migrate-scss-variables-to-css-variables';
import { randomUUID } from 'crypto';

const fileName = `src/__tests__/test-replace-${randomUUID()}.scss`;

afterEach(async () => {
  try {
    rmSync(fileName);
  } catch (e) {}
});

test('Should replace scss variables by css variables in provided document', async () => {
  writeFileSync(
    fileName,
    `$main-color-2: #e9f1fb;
$main-color-3: #d0e4f8;
$main-color-4: #cdddf0;
$main-color-5: #bfd2ea;
$main-color-6: #94adcc;
$main-color-7: #6487ad;
$main-color-2: #e9f1fb;
$main-color-3: #d0e4f8;
$main-color-4: #cdddf0;
$main-color-5: #bfd2ea;
$main-color-6: #94adcc;
$main-color-7: #6487ad;

.modal-title {
  color: $main-color-6;
}

:root {
  // Colors
  --color-main-14: #ffffff; // white?
  --color-accent: #fab55b;
  --color-semantic-info: #3782f2;
  }`
  );

  await migrateScssVariablesToCssVariables({
    projectPath: './src/__tests__',
  });

  expect(readFileSync(fileName, 'utf-8')).toMatchInlineSnapshot(`
    "
    .modal-title {
      color: var(--main-color-6);
    }

    :root {
      // Colors
      --color-main-14: #ffffff; // white?
      --color-accent: #fab55b;
      --color-semantic-info: #3782f2;
      
      --main-color-2: #e9f1fb;
      --main-color-3: #d0e4f8;
      --main-color-4: #cdddf0;
      --main-color-5: #bfd2ea;
      --main-color-6: #94adcc;
      --main-color-7: #6487ad;
      --main-color-2: #e9f1fb;
      --main-color-3: #d0e4f8;
      --main-color-4: #cdddf0;
      --main-color-5: #bfd2ea;
      --main-color-6: #94adcc;
      --main-color-7: #6487ad;
    }"
  `);
});

test('Should not create :root selector when there are no declaration variables', async () => {
  writeFileSync(
    fileName,
    `.test-class {
    color: $main-color-6;
}`
  );

  await migrateScssVariablesToCssVariables({
    projectPath: './src/__tests__',
  });

  expect(readFileSync(fileName, 'utf-8')).toMatchInlineSnapshot(`
    ".test-class {
        color: var(--main-color-6);
    }"
  `);
});

test('Should create css selector where there are scss variables in the file and no :root selector specified', async () => {
  writeFileSync(
    fileName,
    `$main-color-2: #e9f1fb;
$main-color-3: #d0e4f8;`
  );

  await migrateScssVariablesToCssVariables({
    projectPath: './src/__tests__',
  });

  expect(readFileSync(fileName, 'utf-8')).toMatchInlineSnapshot(`
    "
    :root {
      --main-color-2: #e9f1fb;
      --main-color-3: #d0e4f8;
    }
    "
  `);
});

test('Should replace scss variables in complex block', async () => {
  writeFileSync(
    fileName,
    `app-ui-nav {
    flex: 0 0 250px;
    box-sizing: border-box;
    padding: $space-lg $space-sm $space-lg 0;
    border-right: 1px solid $neutral-light;
  }
`
  );

  await migrateScssVariablesToCssVariables({
    projectPath: './src/__tests__',
  });

  expect(readFileSync(fileName, 'utf-8')).toMatchInlineSnapshot(`
    "app-ui-nav {
        flex: 0 0 250px;
        box-sizing: border-box;
        padding: var(--space-lg) var(--space-sm) var(--space-lg) 0;
        border-right: 1px solid var(--neutral-light);
      }
    "
  `);
});

test('Should not corrupt initial indentation in the document', async () => {
  writeFileSync(
    fileName,
    `@import 'variables';

:host {
  min-width: 500px;
  max-width: 630px;
  margin-left: 40px;
}

.select-language {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 32px;
}

.column {
  flex: 0 0 48%;

  &-header {
    margin-bottom: 10px;
    color: $text-base-75;
  }
}
`
  );

  await migrateScssVariablesToCssVariables({
    projectPath: './src/__tests__',
  });

  expect(readFileSync(fileName, 'utf-8')).toMatchInlineSnapshot(`
    "@import 'variables';

    :host {
      min-width: 500px;
      max-width: 630px;
      margin-left: 40px;
    }

    .select-language {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 32px;
    }

    .column {
      flex: 0 0 48%;

      &-header {
        margin-bottom: 10px;
        color: var(--text-base-75);
      }
    }
    "
  `);
});

test('Should ignore variable declarations inside @for loop when replace scss variables', async () => {
  writeFileSync(
    fileName,
    `.org-roles {
  @include fontify(12, 400, $text-base-75);
}

@for $i from 1 through length($avatar-colors) {
  $c: nth($avatar-colors, $i);

  .organization:nth-child(#{$i}) {
    .avatar {
      background-color: $c;
    }
  }
}
`
  );

  await migrateScssVariablesToCssVariables({
    projectPath: './src/__tests__',
  });

  expect(readFileSync(fileName, 'utf-8')).toMatchInlineSnapshot(`
    ".org-roles {
      @include fontify(12, 400, var(--text-base-75));
    }

    @for $i from 1 through length($avatar-colors) {
      $c: nth($avatar-colors, $i);

      .organization:nth-child(#{$i}) {
        .avatar {
          background-color: $c;
        }
      }
    }
    "
  `);
});

test('Should parse block with scss ampersand', async () => {
  writeFileSync(
    fileName,
    `  &.left-arrow {
    margin-left: $triangle-width + 1px;
    border-radius: 0 2px 2px 0;
  }`
  );

  await migrateScssVariablesToCssVariables({
    projectPath: './src/__tests__',
  });

  expect(readFileSync(fileName, 'utf-8')).toMatchInlineSnapshot(`
    "  &.left-arrow {
        margin-left: calc(var(--triangle-width) + 1px);
        border-radius: 0 2px 2px 0;
      }"
  `);
});

test('Should not replace scss variables inside mixins', async () => {
  writeFileSync(
    fileName,
    `@mixin colorfull-placeholder($color, $background: none, $width: auto) {
  &::placeholder {
    background: $background;
    color: $color;
    width: $width;
  }

  &::-webkit-input-placeholder {
    background: $background;
    color: $color;
    width: $width;
  }

  &:-moz-placeholder {
    background: $background;
    color: $color;
    width: $width;
  }

  &::-moz-placeholder {
    background: $background;
    color: $color;
    width: $width;
  }

  &:-ms-input-placeholder {
    background: $background;
    color: $color;
    width: $width;
  }
}
`
  );

  await migrateScssVariablesToCssVariables({
    projectPath: './src/__tests__',
  });

  expect(readFileSync(fileName, 'utf-8')).toMatchInlineSnapshot(`
    "@mixin colorfull-placeholder($color, $background: none, $width: auto) {
      &::placeholder {
        background: $background;
        color: $color;
        width: $width;
      }

      &::-webkit-input-placeholder {
        background: $background;
        color: $color;
        width: $width;
      }

      &:-moz-placeholder {
        background: $background;
        color: $color;
        width: $width;
      }

      &::-moz-placeholder {
        background: $background;
        color: $color;
        width: $width;
      }

      &:-ms-input-placeholder {
        background: $background;
        color: $color;
        width: $width;
      }
    }
    "
  `);
});

test('Should not migrate ignored scss variables', async () => {
  writeFileSync(
    fileName,
    `$text-base: rgba(24, 26, 28);
$text-base-75: rgba(24, 26, 28, 0.75);
$text-base-50: rgba(24, 26, 28, 0.5);
$text-base-25: rgba(24, 26, 28, 0.25);

$avatar-colors: #b3d5dd, #e0c9d9, #f4e4d1, #e3d0c9, #bbcfe5, #f6d0cd, #c7cbde, #e4c5d9, #c9dde8, #d2c3d9, #f6c3b7,
  #b4d5cf, #d2cbd2, #efc8b3;
`
  );

  await migrateScssVariablesToCssVariables({
    projectPath: './src/__tests__',
    ignoreScssVariables: ['$avatar-colors'],
  });

  expect(readFileSync(fileName, 'utf-8')).toMatchInlineSnapshot(`
    "
    $avatar-colors: #b3d5dd, #e0c9d9, #f4e4d1, #e3d0c9, #bbcfe5, #f6d0cd, #c7cbde, #e4c5d9, #c9dde8, #d2c3d9, #f6c3b7,
      #b4d5cf, #d2cbd2, #efc8b3;

    :root {
      --text-base: rgba(24, 26, 28);
      --text-base-75: rgba(24, 26, 28, 0.75);
      --text-base-50: rgba(24, 26, 28, 0.5);
      --text-base-25: rgba(24, 26, 28, 0.25);
    }
    "
  `);
});

test('Should replace escaped scss variables inside mixin default values', async () => {
  writeFileSync(
    fileName,
    `@mixin tablet-only {
  @media (max-width: #{$tablet-width}) {
    @content;
  }
}`
  );

  await migrateScssVariablesToCssVariables({
    projectPath: './src/__tests__',
  });

  expect(readFileSync(fileName, 'utf-8')).toMatchInlineSnapshot(`
    "@mixin tablet-only {
      @media (max-width: var(--tablet-width)) {
        @content;
      }
    }"
  `);
});

test('Should replace scss variables inside mixin when there are no variables in the feature query', async () => {
  writeFileSync(
    fileName,
    `@mixin color-with-highligh-hover {
  &:hover,
  &.selected {
    border-color: $tag-color-with-errors-hover;
    background-color: $tag-color-with-errors-hover;
  }
}
`
  );

  await migrateScssVariablesToCssVariables({
    projectPath: './src/__tests__',
  });

  expect(readFileSync(fileName, 'utf-8')).toMatchInlineSnapshot(`
    "@mixin color-with-highligh-hover {
      &:hover,
      &.selected {
        border-color: var(--tag-color-with-errors-hover);
        background-color: var(--tag-color-with-errors-hover);
      }
    }
    "
  `);
});

test('Should insert scss variables inside :host selector', async () => {
  writeFileSync(
    fileName,
    `@import 'variables';

$popover-background: rgb(0, 0, 0);
$popover-text-color: rgb(255, 255, 255);
$popover-caret-size: 10px;
$popover-caret-gap: 2px;
$popover-border-radius: 6px;

:host {
  // Triangle caret pointing to anchor element
}

:host-context(.popover-after.popover-center) .caret {
  left: $popover-caret-size;
}
  `
  );

  await migrateScssVariablesToCssVariables({
    projectPath: './src/__tests__',
  });

  expect(readFileSync(fileName, 'utf-8')).toMatchInlineSnapshot(`
    "@import 'variables';


    :host {
      // Triangle caret pointing to anchor element

      --popover-background: rgb(0, 0, 0);
      --popover-text-color: rgb(255, 255, 255);
      --popover-caret-size: 10px;
      --popover-caret-gap: 2px;
      --popover-border-radius: 6px;
    }

    :host-context(.popover-after.popover-center) .caret {
      left: var(--popover-caret-size);
    }
      "
  `);
});

test('Should convert variable name with !important flag', async () => {
  writeFileSync(
    fileName,
    `.settings-action::ng-deep {
  app-ui-icon {
    color: $primary !important;
  }
}`
  );

  await migrateScssVariablesToCssVariables({
    projectPath: './src/__tests__',
  });

  expect(readFileSync(fileName, 'utf-8')).toMatchInlineSnapshot(`
    ".settings-action::ng-deep {
      app-ui-icon {
        color: var(--primary) !important;
      }
    }"
  `);
});

test('Should convert mathematic operation from provided css rule', async () => {
  writeFileSync(
    fileName,
    `.test{
  height: $input-height - 2 * $input-border;
}`
  );

  await migrateScssVariablesToCssVariables({
    projectPath: './src/__tests__',
  });

  expect(readFileSync(fileName, 'utf-8')).toMatchInlineSnapshot(`
    ".test{
      height: calc(var(--input-height) - 2 * var(--input-border));
    }"
  `);
});

test('Should handle nodes with syntax error', async () => {
  writeFileSync(
    fileName,
    `  .editor {
    display: block;
    width: calc(100% - #{$space-xl + $toolbar-width});
    border: 1px solid $primary-medium;
}`
  );

  await migrateScssVariablesToCssVariables({
    projectPath: './src/__tests__',
  });

  expect(readFileSync(fileName, 'utf-8')).toMatchInlineSnapshot(`
    "  .editor {
        display: block;
        width: calc(100% - #{$space-xl + $toolbar-width});
        border: 1px solid $primary-medium;
    }"
  `);
});

test('Should replace scss calc option with css variables', async () => {
  writeFileSync(
    fileName,
    `:host {
  position: relative;
  display: block;

  max-width: 500px;

  // margin to create gap between caret and anchor element
  margin: $popover-caret-size*0.5 + $popover-caret-gap;
}`
  );

  await migrateScssVariablesToCssVariables({
    projectPath: './src/__tests__',
  });

  expect(readFileSync(fileName, 'utf-8')).toMatchInlineSnapshot(`
    ":host {
      position: relative;
      display: block;

      max-width: 500px;

      // margin to create gap between caret and anchor element
      margin: calc(var(--popover-caret-size)*0.5 + var(--popover-caret-gap));
    }"
  `);
});

test('Should replace scss calc option with css variables 2', async () => {
  writeFileSync(
    fileName,
    `.input-container {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-content: center;
  align-items: center;
  justify-content: space-between;

  height: $input-height - 2 * $input-border;
}`
  );

  await migrateScssVariablesToCssVariables({
    projectPath: './src/__tests__',
  });

  expect(readFileSync(fileName, 'utf-8')).toMatchInlineSnapshot(`
    ".input-container {
      display: flex;
      flex-direction: row;
      flex-wrap: nowrap;
      align-content: center;
      align-items: center;
      justify-content: space-between;

      height: calc(var(--input-height) - 2 * var(--input-border));
    }"
  `);
});

test('Should parse with changed host', async () => {
  writeFileSync(
    fileName,
    `$chip-height: 24px;
$chip-border-radius: 16px;
$chip-icon-padding: 8px;

:host {
  max-width: 100%;
  height: $chip-height;
}`
  );

  await migrateScssVariablesToCssVariables({
    projectPath: './src/__tests__',
  });

  expect(readFileSync(fileName, 'utf-8')).toMatchInlineSnapshot(`
    "
    :host {
      max-width: 100%;
      height: var(--chip-height);

      --chip-height: 24px;
      --chip-border-radius: 16px;
      --chip-icon-padding: 8px;
    }"
  `);
});

test('Should replace scss calc option with css variables', async () => {
  writeFileSync(
    fileName,
    ` $main-color-2: #e9f1fb;

:root {
  --border-neutral: 1px solid #{$neutral-light};
  --border-neutral-lightest: 1px solid var(--neutral-lightest);
}`
  );

  await migrateScssVariablesToCssVariables({
    projectPath: './src/__tests__',
    ignoreScssVariables: ['$avatar-colors'],
  });

  expect(readFileSync(fileName, 'utf-8')).toMatchInlineSnapshot(`
    " 
    :root {
      --border-neutral: 1px solid #{var(--neutral-light)};
      --border-neutral-lightest: 1px solid var(--neutral-lightest);

      --main-color-2: #e9f1fb;
    }"
  `);
});

test.skip('Should replace complex variable', async () => {
  writeFileSync(
    fileName,
    `$mat-verifika-primary: (
  A200: $main-color-12,
    
  ),
);
`
  );

  await migrateScssVariablesToCssVariables({
    projectPath: './src/__tests__',
    ignoreScssVariables: ['$avatar-colors'],
  });

  expect(readFileSync(fileName, 'utf-8')).toMatchInlineSnapshot(`
    "$mat-verifika-primary: (
      A200: $main-color-12,
        A700: $main-color-15,
        
      contrast: (
        50: rgba(black, 0.87),
        100: rgba(black, 0.87),
        200: rgba(black, 0.87),
        300: rgba(black, 0.87),
        400: rgba(black, 0.87),
        500: white,
      ),
    );
    "
  `);
});
