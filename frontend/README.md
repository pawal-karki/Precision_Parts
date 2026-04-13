# Frontend Documentation

This directory contains the frontend application for Precision Parts, built with React and Vite, and managed exclusively with [Bun](https://bun.sh/).

## Prerequisites

- Ensure you have [Bun](https://bun.sh/) installed on your machine.
- Open your terminal and navigate to the `frontend` directory.

## Project Setup and Rules

This project strictly uses Bun for package management and script execution.

### Important Rules

- **No npm or yarn**: Do not use `npm install` or `yarn install`. Always use `bun install` or `bun add <package>` to install dependencies.
- **Lockfile**: Do not rely on `package-lock.json` or `yarn.lock`. The `bun.lock` (or `bun.lockb`) file ensures consistent installations across environments.
- **Scripts**: Run all scripts using `bun run <script-name>`.

### Common Commands

**1. Install Dependencies**

```bash
bun install
```

**2. Start Development Server**
Runs the Vite development server with hot module replacement (HMR).

```bash
bun run dev
```

**3. Build for Production**
Builds the app for production to the `dist` folder.

```bash
bun run build
```

**4. Preview Production Build**
Locally preview the production build.

```bash
bun run preview
```

**5. Run Linter**
Check for ESLint errors.

```bash
bun run lint
```
