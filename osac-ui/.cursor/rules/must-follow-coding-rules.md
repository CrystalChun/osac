# Must-follow coding rules (agentic SDLC)

These rules apply when **Dev**, **QA**, or **Review** agents (see `agents/*-agent.md`) touch code or tests, and when **UX Agent** is **explicitly** used for **`ux/`** Storybook artifacts. Treat them as non-negotiable unless a spec or ADR explicitly overrides. The default SDLC **skips** **UX Agent**; **UX/visual design** comes from **planning** (Figma or equivalent).

## Precedence

1. **Acceptance criteria** and in-scope spec (`docs/specs/**/*`)—_what_ must be true.
2. **Architecture docs** (`docs/architecture/`) and **ADRs** (`docs/adr/`)—boundaries and decisions.
3. This file—_how_ to implement and review.
4. Repository-specific additions under `.cursor/rules/` (if present)—win for named concerns when documented.

**Cursor:** This file lives at the repository root `.cursor/rules/` so Cursor loads it for this workspace.

---

## Specs and traceability

- Implement and test only what **documented acceptance criteria** require; use stable IDs (`AC-1`, `AC-2`, …) in PR text and tie tests to ACs (describe blocks or comments).
- If the spec is ambiguous, **do not invent product behavior**—document assumptions in the PR or spec under _Open questions_.
- Out-of-scope items from the spec must not appear as drive-by features.

---

## TypeScript and React (default stack)

- Use **TypeScript** with strict project settings where the repo enables them; prefer **interfaces** over type aliases for public props/APIs; **avoid enums**—use string unions or const maps.
- Prefer **functional components** and declarative patterns; use the `function` keyword for named pure helpers when it improves hoisting and stack traces.
- Prefer **named exports** for components and shared utilities unless the repo already standardizes on default exports for routes/pages.
- **One component per file (avoid long pages):** Do not define **multiple** functional React components in a single page/screen module. Split each meaningful component into **its own file** in the same feature area (follow repo conventions, e.g. `feature-name/SubView.tsx`), and keep the page file focused on **composition, data wiring, and layout**. This limits file length and keeps reviews and agent edits scoped. **Exception:** a **tiny** non-exported helper (not a real UI boundary) may stay in the same file if it stays under a few lines and the file remains short; if the file grows, extract.
- Do not add dependencies without aligning with existing stack and license policy; prefer patterns already present in the target package.

---

## React performance and `memo` (validation)

Align with the official [`memo` guidance](https://react.dev/reference/react/memo#skipping-re-rendering-when-props-are-unchanged): treat memoization as an **optimization**, not a correctness tool.

- **Do not rely on `memo` to fix broken behavior.** If rendering is wrong without `memo`, fix purity, state placement, or data flow first; only then consider `memo` for speed ([React docs](https://react.dev/reference/react/memo#skipping-re-rendering-when-props-are-unchanged)).
- **Add `memo` only when justified:** the child **re-renders often** with **referentially stable props** and its render work is **measurably expensive**. If there is no perceptible cost, skip `memo`—wrapping everything hurts readability for little gain ([same section](https://react.dev/reference/react/memo#skipping-re-rendering-when-props-are-unchanged)).
- **`memo` does nothing if props are always “new”** (inline objects/arrays/functions created in the parent each render). Prefer **narrower props** (primitives, stable references), **children as JSX** where it fits, and **local state** instead of lifting unnecessarily; use `useMemo` / `useCallback` **only** when profiling shows prop churn is the real issue—not by default ([minimizing prop changes](https://react.dev/reference/react/memo#minimizing-props-changes)).
- **Remember `memo` only skips re-renders for props from the parent.** The component still re-renders when its **own state** or **consumed context** changes ([React docs](https://react.dev/reference/react/memo#skipping-re-rendering-when-props-are-unchanged)).
- **Validate with measurement, not guesswork:** use **React DevTools Profiler** (or equivalent) on a **production build** before and after; reject “optimization” PRs that add `memo`/`useCallback`/`useMemo` without evidence of a hot path ([deep dive in the same page](https://react.dev/reference/react/memo#skipping-re-rendering-when-props-are-unchanged)).
- **Custom `arePropsEqual`:** avoid unless unavoidable; you must account for **every** prop including functions, and **deep equality** is easy to get wrong and slow ([custom comparison pitfalls](https://react.dev/reference/react/memo#specifying-a-custom-comparison-function)).
- **React Compiler:** if the repo enables [React Compiler](https://react.dev/learn/react-compiler), prefer compiler-driven memoization over blanket manual `memo`; do not duplicate patterns the compiler already covers ([note on compiler vs `memo`](https://react.dev/reference/react/memo#react-compiler-memo)).

**Review Agent:** challenge new memoization that lacks profiler notes or that papers over unstable props; **Dev Agent:** prefer structural fixes (state locality, fewer effect-driven render loops, simpler props) before adding `memo`.

---

## UI and accessibility

- **Design system:** Base UI on **[PatternFly 6](https://www.patternfly.org/)**—layout, components, tokens, and patterns documented there. Prefer PatternFly props, variants, and utilities over bespoke markup or ad hoc styling. For **OpenShift / Hybrid Cloud console–aligned** UIs, also follow **latest OpenShift console** practice per [OpenShift Console `STYLEGUIDE.md`](https://github.com/openshift/console/blob/main/STYLEGUIDE.md) and `agents/ux-agent.md`.
- **Styling:** Prefer CSS classes and PatternFly utility classes; avoid **inline styles** (`style={{ ... }}`) except for dynamic values that cannot be expressed in CSS. Avoid **custom CSS files** for routine UI; stay within PatternFly’s supported customization paths (themes, component APIs, layout primitives). When something truly cannot be expressed with PatternFly alone, use **[Emotion](https://emotion.sh/docs/css) `css`** (or the repo’s agreed Emotion pattern) in a **minimal, scoped** way—do not replace PatternFly tokens with arbitrary colors, spacing, or typography.
- Prefer **accessible queries** in tests and implementations: labels, roles, names—avoid relying on implementation details (e.g. arbitrary `data-testid` unless the team standard requires it).
- Meet **keyboard and screen-reader** expectations implied by the spec (focus order, labels, live regions for async errors where specified).

---

## Skeleton UI standards

- Use **TypeScript** for all new app and shared UI code. Avoid plain JavaScript.
- Use **React functional components** and hooks. Do not introduce class components.
- Use **PatternFly 6** components and tokens as the default design system.
- Do not build custom UI primitives when an equivalent PatternFly component exists.
- Avoid inline styles (`style={{ ... }}`) except for dynamic values that cannot be expressed in CSS.
- Prefer CSS classes and PatternFly utility classes for styling and spacing.
- Keep components small and composable; extract reusable logic into hooks/helpers.
- Use explicit interfaces for props and API contracts.
- Favor named exports for components and helpers.
- Keep routing and layout concerns separated from page content concerns.
- Preserve accessibility: semantic HTML, labels for inputs, and meaningful ARIA attributes.
- Do not couple `apps/demo` to business logic from other apps; keep it safe for UX experiments.
- Keep imports clean and use workspace aliases where configured.
- Before adding dependencies, prefer existing workspace packages and PatternFly-first solutions.

---

## Testing (QA Agent and Dev verification)

- **React:** use **React Testing Library**; assert what the user sees and does; cover **happy path**, **loading**, **empty**, and **error** when the spec implies them.
- **Do not** change production source when operating as **QA Agent** unless the user explicitly expands the role.
- Prefer stable, user-facing selectors over brittle DOM structure.

---

## Quality bar

- Match **existing** formatting, import order, file layout, and naming in the touched package.
- No broad refactors unrelated to the current spec; smallest diff that satisfies ACs.
- Run **linters and tests** defined in the repo (`package.json`, Makefile, or harness targets) before considering work done; fix new violations you introduce.

---

## Security and data handling

- No secrets, tokens, or credentials in source or tests; use existing env/config patterns.
- Sanitize or escape user-controlled content per framework norms; validate inputs at trust boundaries when the spec requires it.
- Follow authz semantics described in architecture/specs—do not bypass checks for convenience.

---

## Agent boundaries (enforcement)

- **Dev Agent:** source (and minimal refactors) only—not the primary owner of new tests.
- **QA Agent:** test files and test-only fixtures only—not production source.
- **Review Agent:** review output unless explicitly asked to apply fixes.
- **UX Agent** (optional, not default): **only** files under **`ux/**`** (create/edit/delete); no root `package.json`, `src/\*\*`, or other paths—PatternFly 6–aligned; not the owner of production feature implementation unless the user explicitly expands the role.

---

## Where docs live (this repository)

| Area                                  | Folder               |
| ------------------------------------- | -------------------- |
| Architecture narratives, boundaries   | `docs/architecture/` |
| Architecture Decision Records         | `docs/adr/`          |
| Feature specs and acceptance criteria | `docs/specs/`        |
| Agent playbooks                       | `agents/`            |

Handoffs should name concrete files (e.g. `docs/specs/vmaas-as-service.md`, `docs/architecture/overview.md`).
