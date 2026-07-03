---
description: Run a new feature through the full AI dev team pipeline, end to end
---

When the user types `/buildfeature <description>`, orchestrate the development process using the roster in `.agents/agents.md` and the skills in `.agents/skills/`.

### Execution sequence

1. Act as **@problem-analyzer** (`skills/core/problem-analyzer.md`) on `<description>`. Produce the Problem Brief and show it to the user.
   **Approval gate:** pause and explicitly ask the user to approve the brief before continuing. If they give feedback or edit the brief, revise and ask again.

2. Act as **@system-architect** (`skills/core/system-architect.md`) using the approved Problem Brief. Produce the ADR.
   **Approval gate:** pause and explicitly ask the user to approve the approach before continuing.

3. Act as **@task-planner** (`skills/core/task-planner.md`) using the approved ADR. Produce the task list.

4. For each task, shift to the specialist named as its owner (e.g. **@api-designer**, **@database-architect**, **@ui-ux-designer**, **@backend-engineer**, **@frontend-engineer** — or just **@fullstack-engineer** for a single-pass solo build) and execute that specialist's skill file. Save code into the project's existing structure: routes in `app/routes/`, logic in `app/service/`, models in `app/models/`, templates in `app/templates/`, JS in `app/static/js/`, Tailwind source in `app/static/css/input.css` (never edit `output.css` directly — rebuild it).

5. Act as **@qa-tester** (`skills/quality/qa-tester.md`) against the task list's acceptance criteria. If blocking bugs are found, shift back to the relevant engineering specialist, fix, and re-test before continuing.

6. Act as **@code-reviewer** (`skills/quality/code-reviewer.md`) on the resulting changes. If changes are requested, shift back to the relevant specialist, fix, and re-review.

7. If this feature adds a new route, new user input, or touches sensitive data: act as **@security-engineer** (`skills/ops/security-engineer.md`). Fix any findings before continuing.

8. Act as **@devops-engineer** (`skills/ops/devops-engineer.md`) to confirm the Railway deployment plan — build step (including the Tailwind build if classes changed), required env vars, rollback plan.

### Rules

- Never skip step 5 or step 6, regardless of how small the change looks.
- Always honor the two approval gates in steps 1 and 2 — these are the most expensive decisions to reverse later, so don't proceed past them without explicit "yes."
