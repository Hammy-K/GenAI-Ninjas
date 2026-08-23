---
name: Student session navigation
description: How student sessions survive navigation between mission URLs and the dashboard.
---

Student identity must be available at the site root before navigating Home. Legacy mission sessions can have a route-scoped cookie that the dashboard cannot read, so promote it to the shared storage/cookie path during navigation.

**Why:** A learner could be recognized inside a mission yet be asked for their email again after returning to the dashboard because the original cookie was inaccessible at `/`.

**How to apply:** Keep student session reads and writes centralized in the shared auth utility, and call its session read before any mission-to-home navigation. Do not introduce route-specific cookie writes.