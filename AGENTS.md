# AGENTS.md

## Project Purpose

`api-companion` is a Visual Studio Code extension that provides a Postman-like interface for creating, managing, and executing API requests from file-based definitions inside VS Code.

The extension currently supports `.api.json` request files, a custom request editor, an API Workbench webview, environment variable substitution from sibling `.env` files, and user-triggered HTTP execution through the extension host.

## Architecture Overview

This repository is a TypeScript VS Code extension bundled with esbuild.

- VS Code loads the extension from `dist/extension.js`.
- The source entry point is `src/extension.ts`.
- `src/extension.ts` exports `activate` and `deactivate`.
- Commands are contributed in `package.json` and implemented through VS Code's command API.
- Request parsing, environment resolution, and request execution live under `src/request/`.
- Shared low-level helpers live under `src/shared/`.
- Webview panel/editor code lives under `src/webview/`.
- Tests are TypeScript Mocha tests in `test/`, compiled to `out/test/`, and run with `vscode-test`.
- Bundling is handled by `esbuild.js`.

There is not yet a persistent storage layer beyond workspace files, a broader domain model, or a separate frontend framework for Webviews.

## Important Files and Folders

- `package.json`: VS Code extension manifest, contributed commands, npm scripts, and dev dependencies.
- `src/extension.ts`: Extension activation entry point and command registration.
- `src/request/types.ts`: Request/response types and supported HTTP method helpers.
- `src/request/requestFile.ts`: `.api.json` request parser and validation.
- `src/request/environment.ts`: `.env` parsing and `{{VARIABLE}}` substitution.
- `src/request/requestRunner.ts`: User-triggered HTTP execution through `fetch`.
- `src/shared/object.ts`: Shared object and string-record type guards.
- `src/webview/requestEditorProvider.ts`: Custom text editor provider for `.api.json` files.
- `src/webview/requestPanel.ts`: Singleton API Workbench panel.
- `src/webview/requestWebview.ts`: Webview message handling and environment-aware request execution.
- `src/webview/getWebviewHtml.ts`: Generated Webview HTML, CSS, and client-side script.
- `test/`: TypeScript Mocha tests compiled to `out/test/`.
- `esbuild.js`: esbuild bundling configuration for the extension runtime.
- `tsconfig.json`: TypeScript compiler settings.
- `eslint.config.mjs`: ESLint configuration.
- `.vscode/launch.json`: Debug launch configuration for the Extension Host.
- `.vscode/tasks.json`: VS Code build/watch tasks.
- `.vscode-test.mjs`: VS Code test runner configuration.
- `.vscodeignore`: Files excluded from packaged extension output.
- `README.md`: User-facing project documentation.
- `CHANGELOG.md`: Release notes.

## Install Dependencies

Use the existing lockfile:

```sh
npm install
```

## Build

Available build-related commands from `package.json`:

```sh
npm run compile
npm run check-types
npm run lint
npm run package
```

`npm run compile` runs type checking, linting, and esbuild.

`npm run package` runs type checking, linting, and a production esbuild bundle.

For watch mode:

```sh
npm run watch
npm run watch:esbuild
npm run watch:tsc
```

## Run Tests

Available test commands from `package.json`:

```sh
npm run compile-tests
npm run watch-tests
npm test
```

`npm test` uses `vscode-test`. The `pretest` script runs `compile-tests`, `compile`, and `lint` first.

Tests live outside `src` in the top-level `test/` folder. Imports from tests should reference source modules through `../src/...`.

## Launch and Debug

Use VS Code's `Run Extension` launch configuration in `.vscode/launch.json`.

The launch configuration:

- Starts an Extension Host.
- Uses the repository as `--extensionDevelopmentPath`.
- Reads generated JavaScript from `dist/**/*.js`.
- Runs the default build task before launch.

The default build task is `watch`, defined in `.vscode/tasks.json`, and it runs:

- `npm: watch:tsc`
- `npm: watch:esbuild`

## Coding Style Expectations

- Write TypeScript with `strict` compiler settings in mind.
- Keep extension activation lightweight.
- Register disposables with `context.subscriptions`.
- Prefer small, focused modules and keep request logic separate from activation and Webview plumbing.
- Keep command IDs namespaced under `api-companion`.
- Use VS Code APIs instead of Node-only behavior when interacting with workspace files where possible.
- Keep user-facing errors clear and actionable.
- Add or update tests when adding behavior that can be validated without manual Extension Host testing.
- Follow the existing ESLint rules:
  - Import names should be camelCase or PascalCase.
  - Use curly braces for control flow.
  - Use strict equality.
  - Do not throw literals.
  - Use semicolons.

## Rules for Webview Code

- Keep Webview-specific code separate from extension activation and request execution logic.
- Do not inline large UI implementations into `src/extension.ts`.
- Use VS Code Webview security practices:
  - Restrict `localResourceRoots`.
  - Use a strict Content Security Policy.
  - Use nonces for scripts.
  - Avoid enabling scripts unless the view needs them.
- Treat all messages from the Webview as untrusted input.
- Validate message shapes before acting on them.
- Keep request execution in the extension host, not directly in the Webview.
- Use message passing for UI actions and results.
- Avoid hard-coded absolute local paths in generated Webview HTML.

## Rules for VS Code Extension APIs

- Keep `activate` fast and defer expensive work until a command or view needs it.
- Register commands in code only when they are also contributed in `package.json`, unless they are intentionally internal.
- Dispose subscriptions through `context.subscriptions`.
- Prefer `vscode.workspace.fs` and `vscode.Uri` for workspace file operations.
- Use `vscode.window.showErrorMessage`, `showWarningMessage`, or `showInformationMessage` for user-visible feedback where appropriate.
- Do not assume there is always an open workspace folder.
- Do not assume there is always an active editor.
- Avoid long-running synchronous work in the extension host.
- Keep command behavior deterministic and testable outside VS Code APIs where possible by extracting pure logic.

## Request File Structure

- Requests should be file-based and stored in the workspace.
- Request definitions should be human-readable and version-control friendly.
- The current canonical file extension is `.api.json`.
- Request files currently support:
  - `name`: non-empty string
  - `method`: one of `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `HEAD`, or `OPTIONS`
  - `url`: `http` or `https` URL
  - `headers`: object with string values
  - `body`: any JSON value, stored as `null` when absent in the editor
- Environment references use `{{VARIABLE_NAME}}` syntax and are resolved from a `.env` file in the same directory as the request file when sending a request.

Do not change the request file format without updating examples, parser behavior, tests, and user-facing documentation.

## What Not To Change Without Asking

- Do not rename the extension, publisher metadata, or command namespace without asking.
- Do not replace the build system or test runner without asking.
- Do not introduce a frontend framework for Webviews without asking.
- Do not add runtime dependencies for HTTP clients, parsers, state management, or UI without asking.
- Do not change the request file format without asking.
- Do not add network execution behavior that sends real HTTP requests without clear user-triggered action.
- Do not remove generated scaffold files such as `README.md`, `CHANGELOG.md`, or VS Code config unless the user asks for cleanup.
- Do not commit, push, publish, or package a `.vsix` unless explicitly requested.

## TODO

- Document the current `.api.json` format and environment variable behavior in `README.md`.
- Add broader extension tests for activation and command registration.
- Split `src/webview/getWebviewHtml.ts` into smaller assets/modules when doing a planned Webview cleanup.
- Add request execution cancellation or timeout handling if long-running requests become a problem.
- Update `README.md` with actual usage once features exist.
