# Contributing to ris-mcp-ts

Thank you for your interest in contributing to the RIS MCP Server! This guide will help you get started.

## Prerequisites

- [Node.js](https://nodejs.org/) >= 20.0.0
- npm (comes with Node.js)

## Getting Started

1. Fork the repository and clone your fork:

   ```bash
   git clone https://github.com/<your-username>/ris-mcp-ts.git
   cd ris-mcp-ts
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Build the project:

   ```bash
   npm run build
   ```

4. Verify everything works:

   ```bash
   npm run check
   ```

## Development Workflow

| Command | Description |
|---------|-------------|
| `npm run dev` | Start with hot reload (tsx) |
| `npm run build` | Compile TypeScript |
| `npm start` | Run compiled version |
| `npm run check` | Run typecheck + lint + format check + tests |
| `npm run inspect` | Test with MCP Inspector |

### Useful shortcuts

- **`npm run dev`** — Fastest way to test changes during development
- **`npm run check`** — Run this before committing to catch all issues at once

## Code Style

This project uses **Prettier** for formatting and **ESLint** for linting. Pre-commit hooks via **Husky** and **lint-staged** run both automatically on staged files.

| Command | Description |
|---------|-------------|
| `npm run format` | Format all source files with Prettier |
| `npm run lint` | Run ESLint on source files |
| `npm run lint:fix` | Run ESLint with auto-fix |
| `npm run format:check` | Check formatting without modifying files |

You don't need to run these manually before committing — the pre-commit hook handles it. But they're useful if you want to fix issues across the codebase.

## Writing Tests

Tests use [Vitest](https://vitest.dev/) and are located in `src/__tests__/`.

| Command | Description |
|---------|-------------|
| `npm test` | Run all tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run test:integration` | Run integration tests (requires network) |

### Guidelines

- Place test files in `src/__tests__/` with the naming pattern `*.test.ts`
- Co-locate tests with the module they cover (e.g., `client.test.ts` tests `client.ts`)
- Use descriptive test names that explain the expected behavior
- Mock external HTTP calls — avoid hitting the real RIS API in unit tests

## Submitting Changes

1. Create a feature branch from `main`:

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes and ensure all checks pass:

   ```bash
   npm run check
   ```

3. Commit your changes with a clear, descriptive message.

4. Push to your fork and open a Pull Request against `main`.

### Pull Request guidelines

- Keep PRs focused on a single change
- Include a description of what changed and why
- Ensure all CI checks pass
- Add or update tests for new functionality

## Reporting Issues

Found a bug or have a feature request? Please [open an issue](../../issues) using one of the available templates:

- **Bug Report** — For reporting bugs with reproduction steps
- **Feature Request** — For suggesting new features or improvements

## Questions?

If you have questions about the codebase or need guidance on a contribution, feel free to open a discussion or reach out via an issue.
