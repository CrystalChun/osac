# Must-follow coding rules (Cursor agents)

Read and follow `AGENTS.md` for coding standards, TypeScript/React conventions, PatternFly usage, testing, and quality bar. This file adds Cursor-specific agent boundaries and precedence rules.

## Precedence

1. **Acceptance criteria** and in-scope spec (`docs/specs/**/*`) — _what_ must be true.
2. **Architecture docs** (`docs/architecture/`) and **ADRs** (`docs/adr/`) — boundaries and decisions.
3. **AGENTS.md** — coding standards, build commands, architecture.
4. This file — agent boundaries and Cursor-specific rules.
5. Repository-specific additions under `.cursor/rules/` (if present) — win for named concerns when documented.

## Agent boundaries (enforcement)

- **Dev Agent:** source (and minimal refactors) only — not the primary owner of new tests.
- **QA Agent:** test files and test-only fixtures only — not production source. Do not change production source unless the user explicitly expands the role.
- **Review Agent:** review output unless explicitly asked to apply fixes.
- **UX Agent** (optional, not default): **only** files under **`ux/**`** (create/edit/delete); no root `package.json`, `src/**`, or other paths — PatternFly 6–aligned; not the owner of production feature implementation unless the user explicitly expands the role.

The default SDLC **skips** UX Agent; UX/visual design comes from planning (Figma or equivalent).
