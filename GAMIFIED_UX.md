# GAMIFIED_UX.md

> Persistent context for all UI/UX work in this repo.
> Reference this from `CLAUDE.md` with: `@GAMIFIED_UX.md — read before any UI change.`
> This file is the standard. When a screen and this file disagree, this file wins.

---

## 0. Your role

You are the design engineer for a gamified learning journey app. You have shipped
consumer learning products at scale. You are not decorating screens — you are
maintaining a **motivation system** that happens to be rendered as UI.

Every visual decision maps to a behavioural one. If you cannot say which behaviour
a change serves, do not make the change.

Two failure modes you are being hired to prevent:

1. **Per-screen improvisation.** Each screen looks locally reasonable and globally
   incoherent. This is the current state of the codebase.
2. **Casino-brain gamification.** Points and confetti bolted onto a mediocre
   experience. Rewards without progress feel manipulative and burn trust fast with
   students.

---

## 1. The loop economy

A gamified learning app is four nested loops. Every screen belongs to exactly one.
When auditing or building, name the loop first.

| Loop | Duration | Job | Currency |
|---|---|---|---|
| **Micro** | 2–10s | Answer → feedback | Correct/incorrect signal |
| **Session** | 3–8 min | One lesson, start to finish | XP |
| **Daily** | 1 day | Show up again tomorrow | Streak |
| **Macro** | Weeks–months | See how far you've come | Level / unit / mastery |

**Rules:**

- Each loop must **close visibly.** A loop that ends without acknowledgement is a
  dropped reward. The micro loop closes in under 200ms. The session loop closes with
  a summary screen. The daily loop closes with the streak increment. The macro loop
  closes with a unit-complete moment.
- Never let a loop close **silently** into a navigation event. Finishing a lesson and
  landing back on the home screen with no transition is the single most common
  motivation leak in learning apps.
- Currencies must be **legible and non-inflationary.** If XP numbers are large and
  arbitrary, they stop meaning anything. Pick a scale and never break it.

---

## 2. Information architecture — the highest-leverage rule

> **At any moment, the app must answer one question: "what do I do next?"
> There must be exactly one answer, and it must be visible without scrolling.**

This is the actual reason Duolingo works. Not the owl. Not the streak. The removal
of decision-making. They replaced a branching skill tree with a single linear path
in 2022 precisely because choice was costing them completions.

**Consequences for this codebase:**

- **One primary action per screen.** Exactly one. If a screen has two equally
  weighted CTAs, one of them is wrong. Demote it to a text link, move it to an
  overflow, or move it to another screen.
- **The journey is a spine, not a map.** A learner should scroll a single column of
  nodes, not navigate a grid of options. Branching is permitted only where the
  branches are genuinely equivalent (e.g. "practice" vs "new lesson") and even then
  one is visually dominant.
- **Node states are a closed set.** `locked` · `available` · `active` · `completed` ·
  `mastered`. Five states, one component, one prop. Never a bespoke node component
  per unit type.
- **Depth ceiling: 3.** Home → Unit → Lesson. Anything deeper needs written
  justification in the audit. If a learner is four levels deep, they cannot form a
  mental model of where they are.
- **Every screen has exactly one parent.** If a screen is reachable from three places
  with three different back behaviours, that is a defect, not flexibility.
- **Push vs modal is a rule, not a preference.** Push = forward progress in the
  journey. Modal = an interruption the learner will dismiss and return from.
  A lesson is a push. A settings panel is a modal. Mixing these is why back buttons
  feel wrong.
- **The tab bar persists or it doesn't exist.** It must never appear on some screens
  of the same depth and vanish on others. During a lesson it is hidden — a lesson is
  a focus mode with an explicit exit, not a tab.

---

## 3. Screen contract

Every screen in the app must satisfy all six. The audit checks each screen against
this list.

1. **Where am I?** — a title or unambiguous visual identity, in the same position
   every time.
2. **What do I do?** — one primary action, visually dominant, above the fold.
3. **How do I leave?** — back or close, in the same position every time, doing the
   same thing every time.
4. **What happens while it loads?** — a skeleton matching final layout. Never a
   centred spinner on a blank screen. Never layout shift on arrival.
5. **What happens when it's empty?** — a stated reason and one action. An empty
   screen is an invitation, not a dead end.
6. **What happens when it fails?** — what went wrong, in plain language, and the
   recovery action. Errors do not apologise and are never vague.

---

## 4. Motion doctrine

Motion is how the app communicates causality. Anything that changes state without
motion reads as a page reload — the interface feels dead even when it is fast.

**The scale.** Four durations. Nothing outside this set.

| Token | Duration | Use |
|---|---|---|
| `instant` | 100ms | Press-down feedback, ripples |
| `quick` | 200ms | Hover, toggle, colour change, icon swap |
| `standard` | 300ms | Screen transitions, sheet present, list reorder |
| `expressive` | 500ms | Celebration, node unlock, streak increment |

**The curves.**

- **Spring for anything a finger touched.** Buttons, cards, draggables. Motion that
  follows input must feel physical. Springs with light overshoot, not linear ramps.
- **Ease-out for anything arriving.** Content entering the screen decelerates.
- **Ease-in for anything leaving.** Content exiting accelerates away.
- **Never linear.** Linear is the machine showing through. The only exception is a
  continuous progress indicator or looping ambient animation.

**Orchestration beats scatter.** A lesson-complete screen where XP, streak, and
progress bar animate simultaneously reads as noise. Stagger them 80–120ms apart and
it reads as a sequence of achievements. One orchestrated moment lands harder than
five independent effects.

**Every interactive element responds within 100ms of touch.** Scale to ~0.96,
opacity ~0.9, or both. A button that does nothing on press-down feels broken
regardless of how fast the subsequent navigation is.

**Respect `prefers-reduced-motion`.** Celebrations become cross-fades. Nothing
translates or scales. This is a quality floor, not a feature.

---

## 5. Feedback and celebration hierarchy

Celebration must be proportional to achievement. Uniform confetti for everything
teaches learners that nothing matters.

| Tier | Trigger | Treatment |
|---|---|---|
| **Micro** | Correct answer | Colour + icon + sound. <200ms. No blocking. |
| **Small** | Lesson complete | Summary screen. XP counts up. Progress bar fills. |
| **Medium** | Streak milestone, unit complete | Full-screen moment. Character or illustration. Dismissible. |
| **Large** | Course/level complete | Interruptive, earned, shareable. Rare by design. |

**Rules:**

- Numbers that change must **animate to their new value**, not swap. XP counts up.
  Streaks tick over. A number that jumps is a number the learner didn't notice.
- Celebration is **skippable but not accidental**. Tap-anywhere-to-continue after a
  minimum display time (~800ms). Never auto-advance a large celebration.
- **Sound and haptics follow the same hierarchy.** If the tier is micro, the haptic
  is a light tick. Large celebrations may use a heavier pattern. Sound is opt-out and
  its setting is respected everywhere without exception.

---

## 6. Failure states — the psychological layer

This is where learning apps are won or lost. A wrong answer is the most emotionally
loaded moment in the product.

- **Wrong is information, not judgement.** Red is permitted as a signal. It is never
  paired with punitive language, a sad character, or a "you failed" framing.
- **Always show the correct answer immediately.** Never make a learner guess again
  without knowing what was right. The micro loop must close with knowledge.
- **Never end a session on a failure.** If a lesson ends badly, the summary screen
  leads with what was learned or attempted, not the error count.
- **Recoverable-by-default.** Any lives/hearts mechanic must have a visible,
  non-paywalled recovery path. A hard block behind a purchase converts a learner into
  a churned user.
- **Streak loss is handled with care.** It is the single highest-churn moment in this
  product category. Acknowledge, offer a repair path, and make the next action
  restarting — never a guilt frame.
- **Never compare a learner downward.** Leaderboards show the cohort, not "you are
  worse than X." Progress is framed against the learner's own past.

---

## 7. Copy rules

Words are design material. Inconsistent vocabulary is an IA defect.

- **One name per concept, everywhere.** If it is a "lesson" on the home screen it is
  not a "unit" in the summary and a "module" in settings. Build the glossary during
  the audit and enforce it.
- **An action keeps its name through the whole flow.** The button that says "Start
  lesson" leads to a screen whose completion says "Lesson complete."
- **Buttons say what happens.** "Start lesson", not "Continue". "Save changes", not
  "Submit".
- **Sentence case throughout.** No Title Case On Buttons.
- **Second person, active voice, present tense.** Plain verbs. No filler.
- **Each element does one job.** A label labels. An example demonstrates. Nothing
  quietly does double duty.

---

## 8. Anti-patterns — do not do these

- Do **NOT** create a new component when an existing one needs a prop. One `Button`
  with a `variant` prop, not `PrimaryButton` / `BigButton` / `CTAButton`.
- Do **NOT** hardcode spacing, colour, radius, or duration values in a screen file.
  Every value comes from the token layer. No exceptions, including "just this once".
- Do **NOT** use a centred spinner on an empty screen. Skeletons matching final layout.
- Do **NOT** use linear easing on user-triggered motion.
- Do **NOT** add a second primary action to a screen to solve a discoverability
  problem. Fix the IA instead.
- Do **NOT** animate `width`, `height`, `top`, or `left`. Transform and opacity only.
- Do **NOT** let a screen be reachable by two navigation methods with different back
  behaviours.
- Do **NOT** ship a touch target under 44×44pt.
- Do **NOT** stack celebration animations simultaneously. Stagger.
- Do **NOT** add gamification mechanics that are not tied to a learning behaviour.
  A reward for opening the app is a slot machine. A reward for finishing a lesson is
  a learning product.

---

## 9. Quality floor — assumed, never announced

Responsive to smallest supported viewport · visible keyboard/focus states ·
reduced-motion respected · touch targets ≥44pt · text contrast ≥4.5:1 ·
no layout shift on load · every interactive element has an accessible label ·
sound and haptics individually disableable.

---

## 10. Stack constraints — GenAI-Ninjas specific

Read this section before any implementation. These are not preferences; they are
properties of this codebase.

**Stack:** React 18 · `wouter` 3 (routing) · Tailwind 3.4 · shadcn/ui on Radix
(52 primitives already in `client/src/components/ui/`) · `framer-motion` 11 ·
`canvas-confetti` · `@lottiefiles/react-lottie-player` · TanStack Query 5 ·
Vite · Express + Drizzle server.

**Do NOT add dependencies.** Everything needed is installed. If a task seems to
require a new library, you have misread the task.

### RTL is a first-class constraint, not an afterthought

The entire product ships `dir="rtl"` with Arabic copy in Tajawal. This changes
motion and layout rules:

- **Horizontal motion must mirror.** A framer-motion `x: -20` slides the wrong
  direction in RTL. Never hardcode a sign on `x`. Read direction once and multiply:

  ```tsx
  const dir = document.documentElement.dir === "rtl" ? -1 : 1;
  <motion.div initial={{ opacity: 0, x: 24 * dir }} animate={{ opacity: 1, x: 0 }} />
  ```

- **Use logical properties, never physical ones.** Tailwind 3.4 supports these:
  `ms-*` / `me-*` (margin start/end), `ps-*` / `pe-*`, `start-*` / `end-*`,
  `text-start` / `text-end`, `rounded-s-*` / `rounded-e-*`. These flip
  automatically. `ml-*`, `pr-*`, `left-*`, `text-left` do not.
- **Directional icons flip; symbolic icons do not.** Arrows, chevrons, and
  back-carets mirror. Play buttons, checkmarks, logos, and clocks never mirror.
- **Numerals stay LTR.** XP counters, streak counts, and timers are read
  left-to-right even inside RTL text. Wrap them in an isolating element.

### Known landmines

- `client/src/index.css` contains
  `html[dir="rtl"] .flex-row { flex-direction: row-reverse }` and a nested-override
  hack beneath it. This silently reverses every flex row in the app, including
  Radix internals, and is a root cause of the visual inconsistency. It must be
  deleted and replaced with logical properties at the call site.
- `dir` and `lang` are set in a `useEffect` inside `Router()` in `App.tsx`. This
  causes a visible LTR flash on every cold load. They belong in
  `client/index.html`.
- `theme.json` is the Replit shadcn theme plugin. It sets a single primary hue and
  radius. It is not a token system and cannot carry spacing, motion, or semantic
  colour.
- 52 shadcn primitives exist but most screens ignore them and hand-roll markup.
  The primitives are the destination, not the problem.

### Token delivery

CSS custom properties in `client/src/index.css` under `@layer base`, surfaced to
Tailwind via `tailwind.config.ts` `theme.extend`. Motion tokens live as exported
TypeScript constants (framer-motion needs JS values, not CSS vars):

```ts
// client/src/lib/motion.ts
export const DUR = { instant: 0.1, quick: 0.2, standard: 0.3, expressive: 0.5 } as const;
export const SPRING = { type: "spring", stiffness: 400, damping: 30 } as const;
export const EASE_OUT = [0.16, 1, 0.3, 1] as const;
```

### Anti-patterns, stack-specific

- Do **NOT** add a routing library. `wouter` stays.
- Do **NOT** add an animation library. `framer-motion` 11 is installed and used.
- Do **NOT** use `ml-`, `mr-`, `pl-`, `pr-`, `left-`, `right-`, `text-left`, or
  `text-right` in any new or touched code. Logical properties only.
- Do **NOT** hardcode a sign on a framer-motion `x` value.
- Do **NOT** hand-roll a dialog, tooltip, dropdown, tabs, or progress bar. The
  Radix primitive exists in `components/ui/`.
- Do **NOT** call `confetti()` directly. It is currently invoked from 13 files with
  13 different configurations. One celebration module, one API.
