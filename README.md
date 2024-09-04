# css-toolchain

**Version**: 0.0.11

## Description

`css-toolchain` is a CLI tool designed to manipulate CSS files, migrate SCSS variables to CSS variables, and generate types based on found CSS variables. This tool aims to streamline the workflow of managing stylesheets in a project.

## Installation

To install `css-toolchain`, use npm:

```bash
npm install -g css-toolchain

# Usage

The css-toolchain CLI provides several commands to manage and manipulate your CSS files. Below are the available options:
• -c, --config <path>: Specify the path to the configuration file.
• -m, --migrate-scss-variables: Migrate SCSS variables to CSS variables.
• -t, --generate-types: Generate TypeScript types based on found CSS variables.
• -d, --dry: Run the CLI without making any changes (dry run).
    
# Example

To migrate SCSS variables to CSS variables:

```bash
css-toolchain --config ./config.json --migrate-scss-variables
```

To generate types based on found CSS variables:

```bash
css-toolchain --config ./config.json --generate-types
```

Configuration example

```json
{
  "excludePatterns": [
    "node_modules",
    "node_modules/*",
    "/grid.component.scss",
    "/theme.scss"
  ],
  "projectPath": "/Users/me/projects/ui",
  "ignoreScssVariables": ["$avatar-colors"],
  "typePath": "/Users/me/projects/ui/src/app/core/models/css-variables.model.ts",
  "generateFlatTypes": true
}
```
