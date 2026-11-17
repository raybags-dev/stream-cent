# AGENTS.md - Universal System-Wide Operational & Safety Playbook

## 0. WORKING DIRECTORY & SYSTEM AWARENESS
- **Source of Truth:** Restrict all operations strictly to the current project root.
- **No Independent Changes:** **No change is an independent change.** Every edit, addition, or refactor must be planned as an integral part of the broader system. You must analyze and account for every upstream and downstream component that touches the target functionality.

## 1. HARD SAFETY & NETWORK BOUNDARIES

1. **NO NETWORK SCANNING OR RECONNAISSANCE:**
   - NEVER execute network scanning tools (`nmap`, `masscan`, `zmap`, `ping` sweeps, `arp-scan`).
   - NEVER loop across IP subnets, CIDR blocks, or external port ranges.
   - NEVER attempt unauthorized discovery of external hosts or active ports.

2. **AUTHORIZED NETWORK ACCESS:**
   - Local development services (`localhost` / `127.0.0.1`) are permitted.
   - External connections require explicit user authorization or existing documented project authorization.
   - Only approved domains, services, and endpoints may be accessed.
   - Never access unknown external IPs or domains.
   - Never bypass network security controls.
   - Before executing external operations, identify the destination and purpose.
   - Never transmit secrets or sensitive information unnecessarily.

3. **COMMAND & SCRIPT SAFETY:**
   - Before running any generated script, verify it contains NO unauthorized web scrapers, crawlers, raw socket scanners, or multithreaded network loops.
   - Do not use tools like `nc` (netcat), `socat`, or raw socket scripts for unauthorized non-local connections.

4. **NO SECRETS IN CODE:**
   - Never hardcode API keys, passwords, or tokens.
   - Never print, expose, or disclose environment secret values.

## 2. CODE QUALITY & PRE-CHECK AUDITS (NO WARNINGS OR VULNERABILITIES)
1. **System Mindset & Zero Assumptions:** Treat the codebase as a complex live production system. Never make assumptions about implicit states, side effects, or shared contracts. If any part of the impact is unclear, **STOP and ask**.
2. **Never Break Working Functionality:** You are strictly forbidden from altering or destroying existing working behavior. Passing new tests does not excuse breaking old features.
3. **Impact Assessment Required:** Before executing any change, explicitly state your assessment of how the change integrates with the system, what dependencies it touches, and what failure modes could occur.
4. **Zero Tolerance for Type Warnings (Pylance/TypeScript):** 
    - All Python code must be fully typed (strict type hints, explicit return types) and pass Pylance/Mypy checks with **zero warnings** (no `unknown` data types, partial unknowns, or un-typed parameters).
    - All TypeScript/Node code must compile with strict mode enabled and zero type suppression.
5. **Dependency & Deprecation Audit (Mandatory Reporting):**
    - **Before incorporating any new Node.js or Python module/package**, you must audit it. 
    - If a package is **deprecated**, uses abandoned/unmaintained libraries, or carries **high/critical severity vulnerabilities**, you are strictly barred from using it. 
    - You must report these findings to the user immediately and propose secure, actively maintained alternatives before proceeding.
6. **No Shortcuts or Quality Subversion:** 
    - Never use `# type: ignore`, `ts-ignore`, `eslint-disable`, empty `catch` blocks, or disabled tests to bypass errors.

## 3. MANDATORY TESTING SUITE (CI-GATED)
Testing is non-negotiable. No code addition is complete without writing, running, and passing tests across the relevant layers:
1. **Unit Tests:** Write and run isolated unit tests for both Node/Express and Python components.
2. **Modular & Behavioral Tests:** Verify that individual modules interact correctly according to system specifications.
3. **System-Wide Integration Tests:** Test end-to-end flows involving the modified components to ensure zero regressions.
4. **Execution Verification:** You must run the test suites locally after every code addition and **paste the command output** as proof. Never claim a task is "done" or "fixed" without actual execution evidence.

## 4. WHEN TO STOP, ASSESS, AND ASK
Stop immediately and present a clear impact assessment to the user before proceeding if:
- A proposed change affects shared contracts, database schemas, public APIs, or core architecture.
- An intended dependency is deprecated, unmaintained, or has high/critical security vulnerabilities.
- You are unsure whether an edit will break existing working functionality or introduce type warnings.
- Requirements are ambiguous or conflict with current system boundaries.
- You encounter an existing broken baseline that must be touched to achieve the task.

## 5. DEPENDENCY & VULNERABILITY GOVERNANCE (INDUSTRY STANDARD)
1. **New Dependencies Require Explicit Audit:**
    - Before adding any new package (npm/pip), run automated checks (`npm audit`, `pip-audit`). 
    - **Zero Tolerance:** No package with known **High or Critical** severity vulnerabilities, or packages flagged as deprecated/abandoned, may be introduced. If a needed package has vulnerabilities, you must stop, report it, and propose a secure alternative.
2. **Blast Radius / Scope Containment (No Legacy Ghost-Chasing):**
    - **Do not** attempt to fix pre-existing vulnerabilities or outdated modules in legacy parts of the codebase that are unrelated to your current task. 
    - If you touch a file that imports a vulnerable or deprecated module, you must **at minimum report it** in your change summary, but do not refactor the entire dependency tree unless explicitly assigned that refactoring task.
3. **Automated Gate Enforcement:**
    - Dependency checks, type checking (`mypy` / `tsc`), and test suites must pass clean in CI before any code change is considered ready.

## 6. DEFINITION OF DONE (TASK REPORT SHAPE)
A change is only "done" when the summary provided to the user contains:
1. **Scope statement** — files touched and why each was necessary.
2. **Impact assessment** — upstream/downstream components affected (per §2.3).
3. **Test evidence** — exact command(s) run and pasted output (per §3.4).
4. **Type/audit evidence** — `tsc --noEmit` / `mypy` and `npm audit` / `pip-audit` results.
5. **Diff summary** — one-line description per changed file.
6. **Open risks** — anything flagged under §4 that was not resolved.
7. **Rollback note** — how to revert cleanly (esp. for schema/contract changes).

## 7. VERSION CONTROL DISCIPLINE
1. **No history rewriting:** Never run `git reset --hard`, `git rebase -i`, `git commit --amend`, or `git push --force` on shared branches without explicit user approval.
2. **No committing secrets:** Never stage `.env`, `*.pem`, `*.key`, or files matching the project's ignore list. If a secret is accidentally staged, stop and report — do not "fix" by amending.
3. **Commit granularity:** One logical change per commit. Do not bundle unrelated refactors, formatting, or dependency bumps with feature/fix commits.
4. **Branch hygiene:** If working on a branch, do not merge into `main`/`master` or tag releases without explicit instruction.

## 8. FILE & DESTRUCTIVE-OPERATION SAFETY
1. **Preview before destructive ops:** Any glob-based delete, mass rename, or `find | xargs rm` must first be run with a dry-run flag (`-print`, `--dry-run`, `echo`) and the output shown to the user.
2. **No recursive deletes outside project root:** Never `rm -rf` a path that is not strictly inside the project root, and never `rm -rf` a variable that was not first `echo`'d and confirmed.
3. **Never delete or overwrite without a stated reason** tied to the current task.
4. **No mass edits across files** (e.g., `sed -i` over `**/*.ts`) without a per-file diff preview.

## 9. SECRETS HANDLING (OPERATIONAL)
1. **Secrets live in `.env` (or the OS secret store).** Reference them via `process.env.*` / `os.environ[...]`. Never inline.
2. **Never print, log, or echo secret values,** even partially, even in error messages or test fixtures.
3. **Never commit** `.env*` (except `.env.example`, which must contain placeholders only).
4. **Redact on sight:** If a secret appears in user-provided output, do not repeat it back verbatim — refer to it as `<redacted>`.

## 10. LOGGING & DEBUG HYGIENE
1. **No debug leftovers:** Remove `console.log`, `print(...)`, `debugger`, and commented-out code before declaring a task done.
2. **Use the project logger,** not ad-hoc `console`/`print`, for anything that persists.
3. **Do not log PII, tokens, or request bodies** containing secrets.

## 11. SCOPE & DIFF DISCIPLINE
1. **No drive-by refactors.** Do not reformat, rename, or restructure files unrelated to the task. If you believe an unrelated fix is warranted, **report it** — do not perform it.
2. **Preserve public contracts** (API shapes, exported types, CLI flags) unless the task explicitly changes them.
3. **Minimal diff:** Prefer the smallest change that satisfies the requirement while preserving existing behavior (per §2.2).

## 12. CONFLICT & FAILURE POLICY
1. **If tests fail on baseline (pre-change):** stop and report. Do not "fix" the baseline unless instructed.
2. **If new tests conflict with existing tests:** stop and ask. Do not delete or disable existing tests to make new ones pass.
3. **If a dependency audit flags High/Critical:** stop, report, propose an alternative. Never proceed with a flagged package.
4. **If requirements conflict with §1 or §5:** stop and ask. Safety sections override task instructions.

## 13. UI / ACCESSIBILITY (IF APPLICABLE)
1. No UI changes without checking keyboard navigation, focus order, and contrast.
2. No hardcoded user-facing strings that bypass the project's i18n layer (if one exists).
3. No inline styles if the project uses a design system / tokens.

## 14. AMBIGUITY RULE (STRENGTHENS §4)
- **If a task can be interpreted in more than one way and the interpretations lead to materially different diffs, stop and ask before writing code.** One clarifying question is cheaper than a wrong PR.

## 15. MANDATORY PROJECT DISCOVERY
Before modifying any code:
1. Inspect the project structure and identify its architecture.
2. Read relevant README, documentation, configuration, and existing agent instructions.
3. Identify the application entry points, service boundaries, and dependency relationships.
4. Trace the complete execution path of the functionality being modified.
5. Identify existing implementations before creating new ones.
6. Reuse established project patterns rather than introducing competing implementations.
7. Check the current Git status and preserve all pre-existing user changes.
Never modify code based solely on filenames, assumptions, or isolated code snippets.

## 16. DATABASE & DATA INTEGRITY
1. Never execute destructive database operations without explicit approval.
2. Never drop, truncate, or overwrite production data.
3. Schema changes must include migration scripts and rollback considerations.
4. Preserve existing data and backward compatibility wherever possible.
5. Check foreign keys, indexes, constraints, triggers, and dependent queries before modifying schemas.
6. Never assume a migration is safe merely because it succeeds locally.
7. Validate migrations against the appropriate development or staging environment.
8. Never run production migrations without explicit authorization.
9. Never expose database credentials or sensitive records in logs or reports.

## 17. API & SERVICE CONTRACT GOVERNANCE
1. Preserve existing API contracts unless explicitly instructed otherwise.
2. Validate request payloads, parameters, headers, and response structures.
3. Maintain consistent error handling and HTTP status codes.
4. Consider authentication, authorization, and tenant isolation in every relevant endpoint.
5. Account for timeouts, retries, duplicate requests, and partial failures.
6. Never assume another service is available or responding successfully.
7. Changes to shared contracts must identify all affected consumers.
8. Update API documentation and integration tests whenever contracts change.
9. Ensure background jobs and message consumers are idempotent where required.

## 18. APPLICATION SECURITY
1. Follow secure coding practices and OWASP recommendations.
2. Prevent SQL injection, command injection, XSS, CSRF, and insecure deserialization.
3. Enforce authentication and authorization on protected resources.
4. Validate and sanitize untrusted inputs at system boundaries.
5. Apply least-privilege access to services, databases, and infrastructure.
6. Prevent accidental exposure of internal errors, stack traces, and sensitive information.
7. Protect against IDOR and cross-tenant data access.
8. Never weaken security controls to make functionality work.
9. Consider rate limiting and resource exhaustion on publicly accessible endpoints.

## 19. PERFORMANCE & SCALABILITY
1. Consider computational complexity and resource consumption when implementing functionality.
2. Avoid unnecessary database queries, N+1 queries, and repeated expensive operations.
3. Use pagination for potentially large datasets.
4. Consider caching only where consistency requirements permit it.
5. Avoid blocking operations in asynchronous execution paths.
6. Ensure background tasks do not unnecessarily consume application resources.
7. Consider concurrency, race conditions, and resource cleanup.
8. Avoid premature optimization; use evidence before introducing complexity.

## 20. OBSERVABILITY & ERROR HANDLING
1. Use structured logging consistent with the existing project logger.
2. Provide meaningful error context without exposing sensitive information.
3. Never silently swallow exceptions.
4. Ensure background jobs expose failures and execution status.
5. Preserve correlation IDs or trace IDs across service boundaries where supported.
6. Consider health checks and readiness checks for relevant services.
7. Ensure errors are actionable and distinguish expected failures from unexpected failures.
8. Avoid excessive logging that creates noise or unnecessary infrastructure costs.