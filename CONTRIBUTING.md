# Contributing to PDF Textract

First of all, thank you for considering contributing to PDF Textract!

We welcome contributions from developers, researchers, designers, and documentation writers who want to improve the platform. Whether you're fixing bugs, improving performance, enhancing the UI, or contributing to the extraction pipeline, your efforts are appreciated.

Please read this guide before submitting any contributions.

---

# Table of Contents

* Code of Conduct
* Getting Started
* Development Workflow
* Reporting Issues
* Pull Request Process
* Coding Standards
* Commit Message Convention
* Testing & Validation
* Areas for Contribution
* Contribution Restrictions
* Security Reporting
* Maintainers

---

# Code of Conduct

Be respectful and constructive in all interactions.

We expect contributors to:

* Be professional and courteous
* Provide constructive feedback
* Respect differing viewpoints
* Focus on improving the project

Harassment, discrimination, or abusive behavior will not be tolerated.

---

# Getting Started

## Fork the Repository

Create your own fork of the repository and clone it locally.

## Install Dependencies

Using npm:

```bash
npm install
```

Using yarn:

```bash
yarn install
```

Using pnpm:

```bash
pnpm install
```

---

# Development Workflow

PDF Textract follows a GitHub Flow-based workflow.

## Branch Strategy

* `main` → Stable production branch
* `dev` → Active development branch

All contributions must target the `dev` branch.

## Create a Feature Branch

Before starting work:

```bash
git checkout dev
git pull origin dev
git checkout -b feature/your-feature-name
```

Examples:

```bash
feature/ocr-progress-indicator
feature/search-improvements
fix/export-bug
docs/update-readme
```

---

# Reporting Issues

Before opening a Pull Request, creating an issue is required.

Supported issue types:

* Bug Report
* Feature Request
* Documentation Improvement
* Performance Issue

When creating an issue, include:

* Clear problem description
* Reproduction steps
* Expected behavior
* Actual behavior
* Environment details
* Screenshots (if applicable)

---

# Pull Request Process

## Before Creating a Pull Request

Please ensure the following commands complete successfully:

```bash
npm run lint
npm run test
npm run build
npm run electron:build
```

## Pull Request Requirements

Every Pull Request should include:

* Clear description of changes
* Linked issue
* Screenshots for UI changes
* Successful build validation
* Passing tests (if applicable)

Example:

```text
Closes #123

Summary:
- Added OCR processing progress indicator
- Improved extraction dashboard responsiveness

Screenshots:
- Included in PR description
```

---

# Commit Message Convention

Please follow Conventional Commit style.

## Examples

```text
feat: add OCR progress tracking
fix: resolve memory leak in extraction queue
docs: update installation guide
refactor: simplify dashboard state management
perf: optimize event stream rendering
chore: update build configuration
```

## Recommended Types

| Type     | Description              |
| -------- | ------------------------ |
| feat     | New feature              |
| fix      | Bug fix                  |
| docs     | Documentation updates    |
| refactor | Code restructuring       |
| perf     | Performance improvements |
| test     | Testing updates          |
| chore    | Maintenance tasks        |

---

# Squash Commits

We prefer a clean Git history.

Please:

* Focus on one issue per Pull Request
* Keep commits logically grouped
* Squash unnecessary work-in-progress commits before merge

Example:

Good:

```text
feat: add extraction pause functionality
```

Avoid:

```text
fix
fix again
another fix
test
final fix
```

---

# Coding Standards

## Formatting

This project uses:

* ESLint
* Prettier

Please ensure code is formatted before submission.

## TypeScript

* Prefer strict typing
* Avoid unnecessary `any`
* Use descriptive interfaces and types

## React

* Prefer functional components
* Use hooks where appropriate
* Keep components focused and reusable

## State Management

* Use Zustand for application state
* Avoid introducing additional state libraries without discussion

---

# Testing & Validation

There is currently no dedicated testing framework configured.

However:

* Manual validation is expected
* Test coverage for new features is preferred
* Contributors should verify that their changes do not break existing functionality

Future automated testing contributions are welcome.

---

# Areas for Contribution

We especially welcome contributions in the following areas:

## UI / UX Improvements

* Accessibility improvements
* Dashboard enhancements
* Workflow simplification
* Visual consistency

## Electron Optimizations

* Startup performance
* Memory optimization
* Packaging improvements

## Documentation

* Tutorials
* Setup guides
* Architecture explanations
* Developer onboarding

---

# Contribution Restrictions

To maintain project stability, please discuss the following before implementation:

## Large Dependency Changes

Avoid introducing:

* Large framework replacements
* Significant dependency additions
* Major dependency upgrades

without prior discussion.

## Breaking Changes

Do not submit Pull Requests that:

* Break public APIs
* Introduce incompatible configuration changes
* Require significant migration effort

without approval.

## Architecture Changes

Major architectural changes require discussion and approval before implementation.

Examples:

* State management replacement
* IPC communication redesign
* Build system replacement
* Extraction pipeline redesign

---

# Continuous Integration

All Pull Requests are automatically validated.

Contributors should ensure:

* Builds succeed
* Lint checks pass
* CI pipelines complete successfully

before requesting review.

---

# Security Reporting

Security vulnerabilities should be reported through a Gitlab Issue.

When reporting:

* Provide a clear description
* Include reproduction steps if applicable
* Describe potential impact

Please avoid publishing sensitive information unnecessarily.

---

# Maintainers

Pull Requests are reviewed by multiple maintainers.

## Core Maintainers

* [@gurung](https://gitlab.uni-marburg.de/gurung)
* [@silpakar](https://gitlab.uni-marburg.de/silpakar)

---

# Thank You

Every contribution helps improve PDF Textract for researchers, analysts, and enterprise users.

Thank you for helping make the project better.
