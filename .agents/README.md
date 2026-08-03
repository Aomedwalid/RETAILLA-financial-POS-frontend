# `.agents/` — AI Knowledge Base

This directory is the machine-readable brain of the **Retaila Dashboard**
repository. Every AI agent working here MUST read the root `AGENTS.md` first,
which loads and references this tree.

## Layout

```
.agents/
  README.md            This index
  context/             Broad, stable facts about the project
    project-overview.md      What it is, stack, key facts, directory map
    frontend-architecture.md Layering model, feature module pattern, registries
  domains/             Business domain knowledge
    glossary.md               Ubiquitous language / shared terms (single source of truth)
    business-domain.md        Money model, reports, budgets, reconciliation, store credit
  rules/               Binding conventions for writing code
    api-integration.md        Envelope, api.*, errors, pagination, exports
    authentication.md         Cookie-refresh auth, AuthContext, route protection
    routing.md                Route groups, URL-driven state, new route checklist
    state-management.md       React Query, queryKeys, contexts, local state
    ui-conventions.md         Design tokens, RTL, Material icons, core patterns
    components.md             Component structure, performance, a11y, responsive
    forms-validation.md       Hand-rolled validators, form flow, server errors
    feature-design.md         Feature module contract, new-feature checklist
    performance.md            Waterfalls, bundle, re-renders (Vercel skill pinned)
    testing.md                No harness yet; verification commands; future setup
    debugging-refactoring-review.md  Process for bugs, refactors, reviews
    git-workflow.md           Conventional commits, branch naming, hygiene
    documentation-i18n.md     Docs + Arabic i18n conventions
    common-pitfalls.md        18 recurring mistakes to avoid
  skills/              Installed agent skills (managed by `npx skills`)
```

## Reading order for an agent starting a task

1. Root `AGENTS.md` — mandatory entry point.
2. `context/project-overview.md` — what/where/stack.
3. The specific `rules/` file for the work type (UI, API, auth, state, forms...).
4. `domains/` when the task touches a business concept.
5. The matching installed skill for deep guidance.

## Installed skills (see `skills-lock.json`)

| Skill | Source | Domain it enforces |
|---|---|---|
| nextjs-app-router-patterns | wshobson/agents | App Router conventions |
| react-state-management | wshobson/agents | Client/server state decisions |
| responsive-design | wshobson/agents | Layouts, breakpoints |
| vercel-react-best-practices | vercel-labs/agent-skills | React/Next performance (70 rules) |
| webapp-testing | anthropics/skills | Playwright browser verification |
| accessibility | addyosmani/web-quality-skills | WCAG 2.2 a11y |
| code-review | mattpocock/skills | Two-axis diff review |
| clean-code | sickn33/antigravity-awesome-skills | Refactoring/readability |
| systematic-debugging | obra/superpowers | Bug investigation process |
| git-commit | github/awesome-copilot | Conventional commits |
| find-skills | vercel-labs/skills | Skill discovery |

## Keeping this tree accurate

- Docs describe the code that exists; update them in the same change that changes
  the code.
- Glossary additions are mandatory when introducing a new domain concept.
- `AGENTS.md` must always list every doc here (it is the index that agents load).
