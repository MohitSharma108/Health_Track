# Contributing to Nourish 🥗

Thank you for your interest in contributing to **Nourish**! Nourish is an intelligent, privacy-first nutrition tracking platform engineered with modern full-stack web standards, offline-first PWA resilience, and state-of-the-art AI analysis.

Whether you are fixing bugs, improving documentation, adding new food databases, or refining UI components, your contributions are welcome.

---

## Table of Contents
1. [Code of Conduct](#code-of-conduct)
2. [Project Architecture](#project-architecture)
3. [Getting Started](#getting-started)
   - [Prerequisites](#prerequisites)
   - [Repository Setup](#repository-setup)
   - [Running the Backend](#running-the-backend)
   - [Running the React Client](#running-the-react-client)
   - [Running the Standalone PWA](#running-the-standalone-pwa)
4. [Development Guidelines](#development-guidelines)
   - [Git Commit Conventions](#git-commit-conventions)
   - [Branch Naming](#branch-naming)
   - [Code Quality & Testing](#code-quality--testing)
   - [Multi-File Sync Requirement](#multi-file-sync-requirement)
5. [Submitting a Pull Request](#submitting-a-pull-request)
6. [Questions & Help](#questions--help)

---

## Code of Conduct
We are committed to providing a welcoming, inclusive, and harassment-free environment for everyone. Please be respectful, constructive, and empathetic when interacting with maintainers and other contributors.

---

## Project Architecture

Nourish is structured as a modular full-stack application:

```
nourish-complete/
├── backend/                  # Node.js / Express REST API
│   ├── src/
│   │   ├── routes/           # Auth, meals, profile, and AI endpoints
│   │   ├── services/         # Meal service, AI analysis, Anthropic client
│   │   ├── middleware/       # JWT auth, rate limiters, validation
│   │   └── lib/              # Prisma client with Zero-Config fallback DB
│   ├── tests/                # Jest authorization and unit test suite
│   └── public/               # Served static assets and PWA bundle
├── client/                   # Modern React 19 Frontend
│   ├── src/
│   │   ├── api/              # TanStack Query v5 API hooks
│   │   ├── components/       # UI, dialogs, charts, and layout
│   │   ├── store/            # Zustand global client state
│   │   └── pages/            # Dashboard, Diary, Scanner, Analytics
│   └── package.json          # React 19, Vite, Tailwind CSS v4, Lucide
├── frontend/                 # Offline-First PWA Distribution
│   ├── nourish-selfhosted.html # Monolithic PWA with LocalFallback engine
│   ├── index.html            # Production PWA entry point
│   └── sw.js                 # Service Worker caching (v16+)
└── CONTRIBUTING.md           # Contribution guidelines (this file)
```

---

## Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **Git**: v2.30.0 or higher
- *(Optional)* **Docker & Docker Compose**: For containerized PostgreSQL database

### Repository Setup
1. Fork the repository on GitHub: [https://github.com/MohitSharma108/Health_Track](https://github.com/MohitSharma108/Health_Track)
2. Clone your fork locally:
   ```bash
   git clone https://github.com/MohitSharma108/Health_Track.git
   cd Health_Track
   ```
3. Ensure your git author identity is configured:
   ```bash
   git config user.name "Your Name"
   git config user.email "your-github-email@example.com"
   ```

### Running the Backend
1. Navigate to the backend directory and install dependencies:
   ```bash
   cd backend
   npm install
   ```
2. Configure your environment variables:
   ```bash
   cp .env.example .env
   ```
   *(Optional: set `ANTHROPIC_API_KEY` for live Claude AI analysis; if omitted, the built-in deterministic heuristic analysis engine handles requests automatically).*
3. Run the development server:
   ```bash
   npm run dev
   ```
   The API will listen at `http://localhost:4000/api`.

### Running the React Client
1. Navigate to the client directory and install dependencies:
   ```bash
   cd client
   npm install
   ```
2. Launch Vite development server:
   ```bash
   npm run dev
   ```
   The client runs at `http://localhost:5173`.

### Running the Standalone PWA
Open `frontend/index.html` or `index.html` directly in any modern browser. It automatically detects if a local backend is present; if offline or unauthenticated, it seamlessly activates the local persistent offline fallback storage.

---

## Development Guidelines

### Git Commit Conventions
We use [Conventional Commits](https://www.conventionalcommits.org/) to keep the git history clean and understandable:

- `feat:` Adds a new user-facing feature or enhancement.
  *(Example: `feat(diary): add 1-tap delete button on meal rows`)*
- `fix:` Fixes a bug or unexpected behavior.
  *(Example: `fix(storage): resolve undefined ID preservation in local fallback`)*
- `docs:` Documentation-only changes.
  *(Example: `docs: add comprehensive CONTRIBUTING guide`)*
- `style:` Formatting, UI touchups, sizing fixes that do not change business logic.
  *(Example: `style(ui): scale down onboarding and auth logos to compact 48px`)*
- `refactor:` Code refactoring without changing behavior.
- `test:` Adding or updating unit/integration tests.
  *(Example: `test(backend): add coverage for meal deletion authorization`)*
- `perf:` Performance improvements or cache version bumps.

### Branch Naming
- Features: `feat/meal-pacing-insights`
- Bug fixes: `fix/input-mobile-zoom`
- Documentation: `docs/contributing-guide`

### Code Quality & Testing
Before committing your changes, always verify that all test suites pass and the client builds without errors:

1. **Run backend test suite**:
   ```bash
   cd backend
   npm test
   ```
   *Expected: All Jest test suites must pass (meals authorization, auth flow, macro utils).*

2. **Verify React client build**:
   ```bash
   cd client
   npm run build
   ```
   *Expected: Vite builds successfully with zero compilation errors.*

### Multi-File Sync Requirement
To guarantee seamless deployment across static hosts, Docker containers, and local previews, the standalone PWA exists in multiple target locations.

Whenever you modify `frontend/nourish-selfhosted.html`, ensure all mirror files remain synchronized:
- `frontend/nourish-selfhosted.html` *(primary source)*
- `frontend/index.html`
- `backend/public/nourish-selfhosted.html`
- `backend/public/index.html`
- `index.html`

When updating cached PWA assets, remember to bump the cache version in `frontend/sw.js`, `backend/public/sw.js`, and `sw.js`.

---

## Submitting a Pull Request

1. Push your feature branch to your GitHub fork:
   ```bash
   git push origin feat/your-feature-name
   ```
2. Navigate to [https://github.com/MohitSharma108/Health_Track](https://github.com/MohitSharma108/Health_Track) and open a **New Pull Request**.
3. Fill out the PR template with:
   - Description of the problem solved or feature added.
   - Screenshots/GIFs for any visual UI changes.
   - Confirmation that `npm test` and `npm run build` both pass.
4. Wait for code review feedback from maintainers.

---

## GitHub Contribution Graph Tips
If your pushed commits do not immediately show up on your GitHub contribution graph:
1. **Email Association**: Ensure your git commit email (`git config user.email`) is added and verified under [GitHub Email Settings](https://github.com/settings/emails).
2. **Year View**: Ensure you are viewing the active year on your GitHub profile sidebar.
3. **Graph Caching**: GitHub indexes contribution graphs via an asynchronous background job; changes typically appear within 5 to 15 minutes of pushing to `main`.

---

Thank you for contributing to make Nourish faster, smarter, and more helpful for everyone! 🥗✨
