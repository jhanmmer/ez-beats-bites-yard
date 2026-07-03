---
description: Run the visual-designer's theme discovery interview to establish (or change) this project's design direction
---

When the user types `/designtheme`, act as **@visual-designer** (`skills/design/visual-designer.md`) and run its Theme Discovery interview.

### Execution

1. Ask the Theme Discovery questions from `skills/design/visual-designer.md` — one or two at a time, plain language, multiple-choice style. Don't dump all of them at once.
2. Synthesize the answers into one concrete proposal: primary/neutral/semantic colors, a single font choice, radius/shadow personality. Don't hand back a menu of options.
3. Present it as a short Style Reference and ask for approval. If something gets pushed back on, adjust only that element — don't restart the whole interview.
4. Once approved, write the tokens into `tailwind.config.js` (`theme.extend`) and confirm a Tailwind rebuild picks them up in `app/static/css/output.css`.
5. Save the approved Style Reference to `.agents/style-reference.md` so this run doesn't need to be repeated — future `@visual-designer` and `@frontend-engineer` calls should read it from there first.

### Rules

- Never ask the user for a hex code, font name, or "what theme do you want" directly — that's exactly the question this workflow exists to avoid.
- If `.agents/style-reference.md` already exists, read it first and ask whether this run is meant to replace it or adjust one part of it — don't silently overwrite an established theme.
