# AI Dev Team — Antigravity Setup

Same agent library, wired into Antigravity's native `.agents/` convention. Antigravity recognizes this folder automatically once it's in your project root — no extra configuration needed.

## What's here

- `agents.md` — the team roster: who exists, what each one does, plus your project's stack/folder context and global rules
- `rules/` — **always-on** baseline standard (`flask-senior-engineer.md`) that applies to every request in this workspace, even freeform ones that don't invoke a specific `@agent` or `/workflow`. This is your "default behavior" — Python/Flask conventions, security defaults, code-quality bar.
- `skills/` — the detailed persona files (role, process, output format) that each `@agent` follows, organized the same way as the original kit: `core/`, `engineering/`, `data/`, `design/`, `quality/`, `ops/`
- `workflows/` — slash commands that chain agents together automatically:
  - `/buildfeature <description>` — full pipeline for a new feature, with approval gates at the architecture stage
  - `/fixbug <description>` — diagnose-then-fix pipeline for a reported bug
  - `/designtheme` — runs the visual-designer's plain-language theme interview and turns your answers into actual color/type/spacing decisions — use this first if the project has no visual direction yet
- `examples/` — two worked examples of the agent chain in action (single-agent, and full multi-agent)

## Activate the always-on rule

`rules/flask-senior-engineer.md` ships with just a `description` — Antigravity needs to be told to apply it automatically:

1. Open the **Customizations** panel (the `...` dropdown at the top of the Agent panel) → **Rules**.
2. Find `flask-senior-engineer` under Workspace Rules (it's auto-detected from `.agents/rules/`).
3. Set its activation mode to **Always On**.

Once set, every agent — whether invoked via `@mention`, `/workflow`, or just a plain freeform request — writes Flask/Python code to this standard by default, without you having to ask for it each time.

## Install

Drop this `.agents` folder directly into your Flask project root, next to `app/`, `instance/`, and `run.py`. It's a hidden folder (starts with a dot) — your file explorer may need "show hidden files" turned on to see it, but Antigravity itself will pick it up automatically.

## Quick start

In the Antigravity Agent Manager chat, type `/` to see the workflow menu:

```
/buildfeature "let a user mark a task complete via AJAX, no page reload"
```

This runs problem-analyzer → system-architect (pausing for your approval at each of those two steps) → task-planner → the right engineering specialist(s) → qa-tester → code-reviewer → security-engineer (if relevant) → devops-engineer.

For a bug:

```
/fixbug "clicking submit twice creates two records"
```

## Calling one agent directly

You don't need a workflow for everything — `@mention` any persona directly:

```
@backend-engineer add a route in app/routes/tasks.py that toggles a task's
completed status, calling into app/service/tasks.py, returning the project's
standard JSON envelope
```

Antigravity reads the matching file under `skills/` and follows that persona's process and output format.

## Customizing

- Update the **Project context** block at the top of `agents.md` if the stack or conventions change.
- Edit any file under `skills/` directly — plain markdown, YAML frontmatter at the top is optional metadata only.
- Add a new workflow by creating a `.md` file in `workflows/`, following the pattern in `buildfeature.md`.
