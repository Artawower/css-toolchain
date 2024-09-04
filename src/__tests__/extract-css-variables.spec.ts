import { test, expect } from 'vitest';
import { extractCssVariablesDeclarations } from '../parse-scss-variables';

test('Should extract css variables from file', () => {
  expect(
    extractCssVariablesDeclarations(`$avatar-colors: #b3d5dd, #e0c9d9, #f4e4d1, #e3d0c9, #bbcfe5, #f6d0cd, #c7cbde, #e4c5d9, #c9dde8, #d2c3d9, #f6c3b7,
  #b4d5cf, #d2cbd2, #efc8b3;

:root {
  // Colors
  --text-base-100: rgba(24, 26, 28);
  --text-base-75: rgba(24, 26, 28, 0.75);
  --text-base-50: rgba(24, 26, 28, 0.5);
  --text-base-25: rgba(24, 26, 28, 0.25);

  --main-color-1: #{$main-color-1};
  --main-color-2: #{$main-color-2};
  --main-color-3: #{$main-color-3};
  --main-color-4: #{$main-color-4};
  --main-color-5: #{$main-color-5};
  --main-color-6: #{$main-color-6};
  --main-color-7: #{$main-color-7};
  --main-color-8: #{$main-color-8};
  --main-color-9: #{$main-color-9};
  --main-color-10: #{$main-color-10};
  --main-color-11: #{$main-color-11};
  --main-color-12: #{$main-color-12};
  --main-color-13: #{$main-color-13};
  --main-color-14: #{$main-color-14};
  --main-color-15: #{$main-color-15};
  --main-color-16: #bbd0eb;
  --main-color-17: #dcdcdc;
  --main-color-18: #809cbb;
  --main-color-19: #d4deeb;
  --main-color-20: #{$main-color-20};
  --main-color-21: #999999;
  --main-color-22: #404040;
  --main-color-23: #d3d7db;
  --main-color-24: #7f8a96;
  --main-color-25: #f6f6f6;
  --main-color-26: #5076a5;
  --main-color-27: #e8f0fe;
  --main-color-28: #3f5d83;
  --main-color-29: #6f90b9;
  --main-color-30: #2c588f;
  --main-color-31: #d9d9d9;
  }`)
  ).toMatchInlineSnapshot(`
    [
      "--text-base-100",
      "--text-base-75",
      "--text-base-50",
      "--text-base-25",
      "--main-color-1",
      "--main-color-2",
      "--main-color-3",
      "--main-color-4",
      "--main-color-5",
      "--main-color-6",
      "--main-color-7",
      "--main-color-8",
      "--main-color-9",
      "--main-color-10",
      "--main-color-11",
      "--main-color-12",
      "--main-color-13",
      "--main-color-14",
      "--main-color-15",
      "--main-color-16",
      "--main-color-17",
      "--main-color-18",
      "--main-color-19",
      "--main-color-20",
      "--main-color-21",
      "--main-color-22",
      "--main-color-23",
      "--main-color-24",
      "--main-color-25",
      "--main-color-26",
      "--main-color-27",
      "--main-color-28",
      "--main-color-29",
      "--main-color-30",
      "--main-color-31",
    ]
  `);
});

test('Extract css variables should not have duplicates', () => {
  expect(
    extractCssVariablesDeclarations(`:root {
  // Colors
  --text-base-100: rgba(24, 26, 28);
  --text-base-75: rgba(24, 26, 28, 0.75);
  --text-base-50: rgba(24, 26, 28, 0.5);
  --text-base-25: rgba(24, 26, 28, 0.25);
  --text-base-50: rgba(24, 26, 28, 0.5);
  --text-base-25: rgba(24, 26, 28, 0.25);
  --text-base-50: rgba(24, 26, 28, 0.5);
  --text-base-25: rgba(24, 26, 28, 0.25);



  --main-color-1: #{$main-color-1};
  --main-color-2: #{$main-color-2};
`)
  ).toMatchInlineSnapshot(`
    [
      "--text-base-100",
      "--text-base-75",
      "--text-base-50",
      "--text-base-25",
      "--main-color-1",
      "--main-color-2",
    ]
  `);
});
