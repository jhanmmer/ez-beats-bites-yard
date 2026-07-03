# Example 2: Full multi-agent chain — "Add password reset"

This shows how a single feature moves through the agent chain end-to-end, with each agent's output feeding the next, per `workflow.md`.

---

### 1. `problem-analyzer`

> **Problem Brief: Password Reset**
> Users who forget their password currently have no way back into their account except contacting support. **Success criteria:** a logged-out user can request a reset, receive a time-limited link via email, and set a new password without support involvement. **Assumption:** email delivery is already set up in the project. **Open question:** what's the link expiry policy?

### 2. `system-architect`

> **ADR: Password Reset Flow**
> **Options:** (A) time-limited token stored in DB, emailed as a link. (B) short numeric code, emailed, entered in-app.
> **Decision:** Option A — better UX for this app (no second device needed to read a code), and simpler to implement given existing email infrastructure.
> **Components:** reset-token table, email service (existing), reset endpoint, reset form.
> **Risk:** token must be single-use and expire — flagging for `security-engineer` review before ship.

### 3. `task-planner`

> | ID | Task | Depends on | Owner |
> |---|---|---|---|
> | T1 | Design reset-token schema | — | database-architect |
> | T2 | Design request/confirm API contract | — | api-designer |
> | T3 | Implement backend endpoints | T1, T2 | backend-engineer |
> | T4 | Build request + reset UI | T2 | frontend-engineer |
> | T5 | Security review | T3, T4 | security-engineer |
> | T6 | Test full flow | T3, T4 | qa-tester |

### 4. `database-architect` (T1)

> Schema: `password_reset_tokens (id, user_id, token_hash, expires_at, used_at)`. Index on `token_hash`. Token stored hashed, never plaintext — only the plaintext is emailed once.

### 5. `api-designer` (T2)

> `POST /password-reset/request` `{email}` → 200 always (don't reveal whether the email exists). `POST /password-reset/confirm` `{token, new_password}` → 200 or 400 if token invalid/expired/used.

### 6. `backend-engineer` (T3)

> Implemented both endpoints per contract. Token hashed before storage, 30-minute expiry, single-use enforced. **Edge case handled:** requesting reset twice invalidates the first token. **Needs QA coverage for:** expired-token attempt, reused-token attempt.

### 7. `frontend-engineer` (T4)

> Built request form and reset form. **States handled:** loading, success (always shows the same "check your email" message regardless of whether the account exists), error (invalid/expired token shows a clear message with a new "request again" link).

### 8. `security-engineer` (T5)

> Verified: token hashed at rest, single-use enforced server-side, expiry enforced server-side (not just hidden client-side), no user enumeration via timing or response difference. **Verdict:** clear to ship.

### 9. `qa-tester` (T6)

> Tested happy path, expired token, reused token, requesting reset for a nonexistent email (correctly shows generic success message either way), requesting reset twice in a row. **All passed. No blocking bugs.**

### 10. `code-reviewer`

> Reviewed against task list and security review. No blocking issues. **Verdict: Approve.**

### 11. `devops-engineer`

> Deployed behind a feature flag, monitoring added on reset-request rate (spike could indicate abuse). Rollback: disable flag.

---

**Why this is a good example:** notice every handoff carries forward exactly what the next agent needs — the schema design references the security constraint from the ADR, the API contract bakes in the "don't reveal whether email exists" decision before backend even starts, and QA tests the specific edge cases backend flagged rather than reinventing a test plan from scratch.
