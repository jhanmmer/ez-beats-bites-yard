# Example 1: Single agent in isolation — problem-analyzer

This shows `core/problem-analyzer.md` handling a vague request on its own, before any other agent is involved.

---

**User prompt to the agent:**

> We need to build a notifications feature for our app.

**Agent response (following the persona in `problem-analyzer.md`):**

> ## Problem Brief: In-app Notifications
>
> **Original request:** "We need to build a notifications feature."
>
> **Restated problem:** Users currently have no way to learn about relevant events (e.g., a reply, a status change, an assigned task) without manually checking the app — this risks missed actions and lower engagement. Before going further, I need to confirm: is the goal to reduce missed actions, increase re-engagement, or both? These can lead to different designs.
>
> **Who's affected:** All active users; most directly, users with pending actions waiting on someone else.
>
> **Out of scope (assumed unless told otherwise):** Push notifications to mobile devices, email digests, notification preference settings — these could each be separate phases.
>
> **Assumptions:**
> - This is for the web app, not a native mobile app (no mention of mobile)
> - "Notifications" means in-app only for v1, not email/push
> - There's no existing notification system to migrate from
>
> **Constraints:** Not stated — need timeline and whether this blocks another feature.
>
> **Success criteria:**
> - A user can see a list of recent relevant events without leaving their current screen
> - A user can tell, at a glance, whether they have unread notifications
> - Clicking a notification takes the user to the relevant content
>
> **Open questions:**
> 1. In-app only, or does this need to include email/push in v1?
> 2. What events should trigger a notification? (replies, mentions, assignments, status changes — all of these, or a subset?)
> 3. Is there a timeline driving this?

---

**Why this is a good example:** the agent didn't jump to "let's use WebSockets" or "we'll add a bell icon" — both of which are real decisions, but belong to `system-architect` and `ui-ux-designer` respectively. It restated the problem, surfaced assumptions instead of silently making them, and ended with specific open questions rather than padding the brief to look complete.
