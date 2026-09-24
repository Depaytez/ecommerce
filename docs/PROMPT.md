### AI Agent Prompt for E-Commerce Refactoring & Stripe Migration


# AGENT DIRECTIVE: REBUILD, REFACTOR, & FIX E-COMMERCE PLATFORM

## 1. CORE MISSION & OBJECTIVE

You are tasked with conducting a deep code audit, architectural refactoring, payment gateway migration (Paystack -> Stripe), UI/UX overhaul, and concurrency/security remediation for an existing E-Commerce web application.

Your goal is to transform this codebase into a production-ready, highly maintainable, secure enterprise application adhering to Domain-Driven Design (DDD) and modern web standards.

---

## 2. STRICT STANDARDS & COMPLIANCE

### A. Professional Engineering Principles
You MUST strictly adhere to the following principles across every domain, component, and utility:
* **SOLID**: Single Responsibility, Open-Closed, Liskov Substitution, Interface Segregation, Dependency Inversion.
* **DRY & KISS & YAGNI**: Eliminate code duplication, prevent over-engineering, and purge dead code.
* **Domain-Driven Design (DDD)**: Re-architect the codebase into clean bounded contexts (e.g., `/cart`, `/checkout`, `/catalog`, `/orders`, `/payments`, `/identity`). Decouple core domain logic from framework components and database ORMs using Dependency Injection / Repository Pattern.
* **Concurrency & Security Integrity**:
  * Fix all race conditions (e.g., simultaneous checkout requests, stock depletion anomalies, double-click payments).
  * Eliminate memory leaks, asynchronous unhandled rejections, and stale state mutations.
  * Implement optimistic locking / transactional isolation for inventory and cart checkout flows.
  * Audit and resolve all OWASP Top 10 security vulnerabilities (XSS, CSRF, insecure direct object references, unvalidated input sanitization).

### B. Agent Standards & Secrets Compliance
* **Strict Adherence**: You MUST read and strictly obey all rules defined in `agent-standards.md`.
* **NO Autonomous Git Commits/Pushes**: You are strictly prohibited from executing `git commit` or `git push` on my behalf.
* **Secrets Management**:
  * NEVER hardcode or commit API keys, secrets, or access tokens into source code or Git history.
  * Maintain a comprehensive `.env.example` file containing placeholders for all required environment variables (Stripe Secret/Publishable Keys, Stripe Webhook Signing Secret, Supabase credentials, App Base URLs).
  * Prompt me whenever a new key is required so I can populate `.env.local` safely.
* **Commit Message Specs**: For every completed logical milestone, generate clean, descriptive, conventional commit messages (e.g., `refactor(checkout): implement DDD cart domain with optimistic stock lock`).

### C. UI/UX, Alignment & Design Fidelity
* Fix visual layout glitches, broken responsive breakpoints, misaligned CSS grid/flexbox containers, and poor visual contrast.
* Ensure intuitive micro-interactions, responsive checkout progress indicators, dynamic error handling UI states, and accessible form controls (WCAG AA compliance).

---

## 3. PHASE 0: MANDATORY DEEP AUDIT & MIGRATION STRATEGY

Before writing or refactoring any production code, you MUST execute a complete Codebase Audit:

1. **System & Architecture Audit**: Scan the directory structure, identify spaghetti code, duplicate modules, circular dependencies, and improper coupling between UI and data fetching.
2. **Payment Gateway Audit**: Identify all legacy Paystack dependencies, endpoints, hooks, and database schemas. Map out the full replacement path to **Stripe API** (Stripe Elements / Payment Intents API / Webhooks).
3. **Database & Migration Audit**: Extract inline or loose SQL queries/schemas into a versioned, idempotent `/supabase/migrations` folder (e.g., `20260924000001_initial_schema.sql`). Ensure all tables enforce strict Multi-Tenant Row-Level Security (RLS).
4. **Audit Report Delivery**: Present a concise audit summary and a phased step-by-step refactoring plan. Wait for my explicit approval before creating the first feature branch.

---

## 4. SUPABASE & DATABASE MIGRATION WORKFLOW

1. **Migration Folder Organization**:
   * Move all raw or disparate DB scripts into structured, versioned SQL migration files under `/supabase/migrations`.
   * Include Foreign Keys, Indexes on frequently queried fields, Triggers (`updated_at`), and custom Enum types.
2. **Database CLI Operations**:
   * Use the Supabase CLI (`npx supabase db push` or `npx supabase migration up`) to push migration scripts and schema changes to the connected Supabase instance using `.env.local` credentials.
3. **Row Level Security (RLS)**:
   * Enable RLS on **EVERY** table created or updated in Supabase.
   * Enforce strict isolation policies so users can only access their own cart items, order histories, and payment profiles.

---

## 5. GIT BRANCHING & DEVELOPMENT WORKFLOW

You must strictly follow an isolated, feature-branch-driven release workflow:


```

[main] ---------(Production-Ready Stable Releases Only)---------
^
[staging] ------(Integrated Feature Testing Branch)-------------
^
[feature/task-name] ----(Your Active Working Branch)--------

```

1. **Branch Isolation**: Create a dedicated feature branch off `staging` for each milestone (e.g., `feature/stripe-checkout`, `feature/cart-ddd-refactor`, `feature/supabase-migrations`).
2. **Local Verification**: Run universal test suite (`npm test`), static type-check (`npx tsc --noEmit`), and linting before completing any task.
3. **User Review Request**: Stop and ask me to review, execute manual testing, and perform the git commit and push to the feature branch.
4. **Merge to Staging**: Guide me through merging the feature branch into `staging`.
5. **Main Release**: The `main` branch is strictly reserved for production releases manually merged when fully satisfied.

---

## 6. AUTOMATED TESTING & VERIFICATION MANDATE

* **Single Universal Test Command**: Automate all tests (Unit, Integration, API Endpoints, Stripe Webhook Handlers, Order State Machine calculations) under a single command: `npm test`.
* **Pre-Task Completion Proof**: Before marking any sub-task as finished or asking me to merge into `staging`, you MUST:
  1. Run `npm test` and output 100% passing test results to the console.
  2. Test and display endpoint response payload benchmarks and database query performance.
  3. Verify zero console errors, zero layout shifts, and zero visual bugs during UI component renders.

---

## 7. CORE REFACTORING & REBUILD SCOPE

1. **Architecture & DDD Restructuring**:
   * Re-organize directory structure into domain modules (`/catalog`, `/cart`, `/checkout`, `/orders`, `/payments`).
   * Decouple API calls from components using custom hooks and repository interfaces.
2. **Stripe Payment Gateway Rebuild**:
   * Completely purge Paystack imports and replace with **Stripe Elements & Payment Intents API**.
   * Construct robust Stripe Webhook Handlers (`payment_intent.succeeded`, `payment_intent.payment_failed`) to safely transition order statuses in Supabase.
   * Handle edge cases: card declines, 3D Secure authentication, double submissions, network timeouts.
3. **Checkout Flow & Inventory Concurrency Fix**:
   * Rebuild checkout UI flow into a seamless, multi-step or single-page experience.
   * Implement stock reservation locks during payment processing to prevent overselling due to race conditions.
4. **UI/UX & Visual Overhaul**:
   * Fix visual layout inconsistencies, responsive breakpoints, spacing bugs, and broken form validation feedback.
5. **Supabase Schema & Migrations**:
   * Organize database schemas into versioned `/supabase/migrations`.
   * Enable RLS policies across all tables.

---

## 8. INITIATION INSTRUCTIONS

Acknowledge that you have fully ingested these directives and rules. Confirm your understanding of:
1. Conducting Phase 0 (Deep Codebase Audit) before modifying code.
2. Migrating payments strictly from Paystack to Stripe with Webhook handling.
3. Structuring database updates into `/supabase/migrations` and executing Supabase DB pushes.
4. The `.env.example` template rule and no-commit/no-push enforcement.
5. The branch workflow (`feature/*` -> `staging` -> `main`) and single `npm test` verification protocol.

Once confirmed, start Phase 0 by auditing the current codebase and presenting your initial audit report.
