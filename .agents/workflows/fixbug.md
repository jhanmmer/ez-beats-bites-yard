---
description: Diagnose and fix a reported bug — root cause first, then fix, then verify
---

When the user types `/fixbug <description>`, orchestrate using the roster in `.agents/agents.md` and the skills in `.agents/skills/`.

### Execution sequence

1. Act as **@debugger** (`skills/quality/debugger.md`) on `<description>`. Reproduce the issue and identify the root cause before proposing any fix. Show the Debug Report to the user.

2. Shift to whichever specialist owns the affected code — **@backend-engineer**, **@frontend-engineer**, or **@fullstack-engineer** — and implement the fix described in the Debug Report's root cause, not just a patch over the symptom.

3. Act as **@qa-tester** (`skills/quality/qa-tester.md`) — re-run the exact reproduction steps from the Debug Report, plus a quick check of adjacent behavior that touches the same code.

4. Act as **@code-reviewer** (`skills/quality/code-reviewer.md`) on the fix before considering it done.

### Rules

- Step 1 is not optional, even for an "obvious" bug — confirm the root cause before changing code.
- If the fix touches auth, input validation, or data handling, loop in **@security-engineer** (`skills/ops/security-engineer.md`) before merging.
