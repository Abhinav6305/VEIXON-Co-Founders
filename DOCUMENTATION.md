# VEIXON Co‑Founders — Product Documentation

> Your AI Co‑Founder from Day One. Brutal scorecard. 90‑day war plan. Devil's advocate. Decision simulator. Weekly accountability.

VEIXON Co‑Founders is an AI‑powered platform that acts as a brutally honest co‑founder for early‑stage entrepreneurs. A founder submits a raw idea, and the in‑product AI persona **VZN** analyses it against a structured venture curriculum, generates a personalised 90‑day execution plan, and then keeps the founder accountable through weekly check‑ins, decision simulations, a pivot radar, and a VC vault that only unlocks once the founder has proven execution.

---

## Table of contents

1. [What it does](#1-what-it-does)
2. [Core features](#2-core-features)
3. [User journey](#3-user-journey)
4. [Technology stack](#4-technology-stack)
5. [Architecture](#5-architecture)
6. [Project structure](#6-project-structure)
7. [Frontend — pages & design system](#7-frontend--pages--design-system)
8. [API reference](#8-api-reference)
9. [Data model](#9-data-model)
10. [AI gateway](#10-ai-gateway)
11. [Authentication & security](#11-authentication--security)
12. [Setup & installation](#12-setup--installation)
13. [Running & building](#13-running--building)
14. [Known notes & limitations](#14-known-notes--limitations)
15. [Related documents](#15-related-documents)

---

## 1. What it does

VEIXON replaces generic "startup advice" with an opinionated AI co‑founder (**VZN**) whose job is to be *right*, not nice. Every verdict it produces traces back to a specific framework — root‑cause analysis, Jobs‑to‑be‑Done, TAM/SAM/SOM, the "$10M test", competitor whitespace, Lean Canvas — distilled from a six‑module venture curriculum (M1–M6). VZN is direct, challenges lazy thinking, references the founder's actual data, and never sugar‑coats.

The product turns a one‑line idea into:

- a **6‑dimension brutal scorecard** with a failure‑probability estimate,
- a **90‑day, 13‑week war plan** with daily, falsifiable tasks,
- ongoing **execution pressure** (check‑ins, pivot radar, accountability score), and
- a **fundraising path** (VC Vault) that must be *earned* through real progress.

---

## 2. Core features

| Module | What it does |
|---|---|
| **AI Ideation Engine** | 6‑dimension scorecard (problem severity, customer clarity, solution fit, market size, moat, monetisation, scalability), devil's‑advocate objections, failure‑probability estimate, and a Founder DNA profile. |
| **90‑Day War Plan** | 13 weekly missions, each broken into daily execution tasks written so they can be either completed or honestly admitted as dodged. Weeks unlock as the founder progresses. |
| **Decision Simulator** | Models a decision across best / worst / most‑likely scenarios with 30/90/180‑day projections, then gives VZN's recommendation. |
| **Founder DNA** | VZN classifies the founder's profile and traits, with a shareable PNG card. |
| **VC Vault** | 20 India‑focused VCs matched to the founder's execution profile, an AI pitch‑deck generator, and AI‑drafted intro emails. Locked until task‑completion + accountability + traction thresholds are met. |
| **Weekly Check‑ins** | Recurring accountability loop that updates the accountability score and surfaces drift. |
| **Pivot Radar** | Watches weekly patterns and flags risk before the founder realises they're failing (GREEN / AMBER / RED). |
| **Burn Clock** | Runway tracker (burn rate, cash, revenue) with an emergency runway banner. |
| **VZN Chat** | A persistent co‑founder chat available across the app, grounded in the founder's live context (idea, week, tasks, streak, oath). |
| **Builder workspace** | An AI product‑builder workspace where agents generate artifacts the founder reviews/approves. |
| **Share cards** | Branded, downloadable LinkedIn PNG cards for shipped days and Founder DNA. |

---

## 3. User journey

1. **Landing** → the founder describes their idea in one line and gets an instant teaser analysis (free, no signup).
2. **Sign in** (Google) → unlocks the full analysis.
3. **Intake** → answers three precise questions (what / who / what problem).
4. **Results** → the full AI co‑founder report: scorecard, devil's advocate, Founder DNA, and the 90‑day war plan.
5. **Oath** → the founder commits in one sentence ("why will YOU succeed where others failed?").
6. **Dashboard** → the daily command center: stats, this week's tasks, VZN insights, burn clock, recent decisions.
7. **Execution loop** → work the war plan day by day, run check‑ins, simulate decisions, watch the pivot radar.
8. **VC Vault** → once execution is proven, unlock VC matches, generate a deck, and request intros.

---

## 4. Technology stack

- **Framework:** Next.js 14 (App Router) + React 18, TypeScript
- **Styling:** Tailwind CSS + a CSS‑variable design system ("Mission Control" glassmorphism)
- **Animation:** Framer Motion, CSS scroll‑driven animations, Three.js / React‑Three‑Fiber (landing 3D)
- **Auth:** NextAuth (Google OAuth, JWT sessions)
- **Database / ORM:** Prisma — SQLite in development, PostgreSQL as the production target
- **AI:** A custom provider‑agnostic **AI Gateway** over NVIDIA Nemotron (primary), with Anthropic, OpenAI, Groq, Gemini, and Ollama adapters
- **Utilities:** html2canvas (share cards), SWR, Zod, lucide‑react (icons), Recharts
- **Email / payments (scaffolding):** Resend, Stripe (present in deps; used by optional cron/email flows)

> Note: MongoDB packages remain in `package.json` (and the project name is the legacy `nextjs-mongo-template`), but Mongo is **not** used at runtime — the active data layer is Prisma. See [Known notes](#14-known-notes--limitations).

---

## 5. Architecture

```
┌──────────────────────────── Browser ────────────────────────────┐
│  Landing (static 3D HTML, iframed)   │   Inner app (React/Next)  │
└───────────────┬──────────────────────┴───────────┬──────────────┘
                │                                   │
                ▼                                   ▼
        Next.js App Router  ──────────  API route handlers (/api/*)
                                                    │
                ┌───────────────────────────────────┼───────────────────────┐
                ▼                                   ▼                         ▼
        AI Gateway (src/lib/ai)        Data layer (src/lib/data,    NextAuth (src/lib/auth)
   ports → adapters → router           server-store → Prisma)        Google OAuth + JWT
   retry · fallback · breaker · usage          │
                │                              ▼
   NVIDIA · Anthropic · OpenAI · Groq    Prisma (SQLite dev /
   Gemini · Ollama                        Postgres target)
```

Design principles in play: clean separation between the application layer and providers (Dependency Inversion), a strangler‑style migration path (SQLite → Postgres), and provider abstraction so the AI vendor can be swapped via configuration.

---

## 6. Project structure

```
src/
├── app/                      # Next.js App Router
│   ├── page.tsx              # Landing (iframes /public/veixon-home-preview.html)
│   ├── layout.tsx            # Root layout + Providers
│   ├── globals.css           # Design tokens + motion/glass utilities
│   ├── not-found.tsx         # Branded 404
│   ├── auth/ intake/ oath/ dashboard/ decisions/ vault/ settings/ ...
│   ├── results/[id]/         # Full AI report
│   ├── dashboard/warplan/    # War plan list / week / day
│   ├── builder/[workspaceId]/# AI builder workspace
│   └── api/                  # Route handlers (see §8)
├── components/
│   ├── AppShell.tsx          # Glass shell: sidebar + command header + ambient
│   ├── dashboard/            # Sidebar, StatCard, TaskList, AmbientBackdrop, PageReveal, ShareCard …
│   ├── ui/                   # LoadingSpinner, VZNAvatar, ThemeToggle …
│   │   └── motion/           # TiltCard, AnimatedNumber, Skeleton (motion kit)
│   ├── home/ landing/        # Landing React components (also used in preview)
│   └── VZNChat.tsx           # Persistent co‑founder chat
├── lib/
│   ├── ai/                   # AI Gateway (types, providers, gateway, index)
│   ├── data/                 # Repository ports + Prisma adapter
│   ├── curriculum/           # frameworks.ts — VZN persona + curriculum grounding
│   ├── constants/            # ninetyDayPlan (90‑day curriculum seed)
│   ├── server-store.ts       # Prisma data access
│   ├── auth.ts               # NextAuth options
│   ├── anthropic.ts          # Back‑compat shim → AI Gateway
│   └── fallbacks.ts          # Deterministic fallbacks when AI is unavailable
├── prisma/
│   ├── schema.prisma         # SQLite (active)
│   └── schema.postgres.prisma# Postgres target (jsonb, soft delete, RBAC, audit log)
└── public/
    └── veixon-home-preview.html  # The landing experience (3D galaxy/solar)
```

---

## 7. Frontend — pages & design system

### Pages

`(landing)`, `auth`, `intake`, `oath`, `dashboard`, `decisions`, `dashboard/warplan`, `dashboard/warplan/[week]`, `dashboard/warplan/[week]/[day]`, `vault`, `results/[id]`, `settings`, `builder/[workspaceId]`. (`checkins`, `pivot`, `decision`, `decision/[id]`, and `routing` are redirect/utility routes.)

### Design system — "Mission Control"

- **Tokens** (`globals.css`): deep space base (`--bg-primary`), electric‑violet (`--purple`) + cyan (`--teal`) accents, cool text ramp, mono channel for data labels, large radius.
- **Glassmorphism:** the card token (`--card-bg`) is translucent and a single global rule frosts every surface that uses it (`backdrop-filter: blur + saturate`), so all containers read as frosted glass over a faint **blueprint‑grid** ambient backdrop.
- **Shell:** a glass command sidebar (grouped nav with section labels + glowing active state) and a glass command‑bar header with a gradient accent rail; mobile gets a slide‑in drawer + hamburger.
- **Motion kit** (`components/ui/motion`): `TiltCard` (pointer‑reactive 3D tilt + spotlight), `AnimatedNumber` (count‑up on view), `Skeleton` (shimmer loaders).
- **Animation utilities:** `.veixon-lift` (hover lift + glow), `.veixon-rise` (entrance, scroll‑driven via `animation-timeline: view()` where supported), `.veixon-press` (tap feedback), `PageReveal` (route transitions). All respect `prefers-reduced-motion`.
- **Landing** is intentionally separate: a self‑contained 3D experience (cloud → galaxy / solar‑system journey, theme toggle) served from `/public` and iframed; its "Log in" link routes into the app.

---

## 8. API reference

All handlers live under `src/app/api/**/route.ts` (Node runtime). Protected data endpoints derive the user from the session and check ownership.

**AI (`/api/ai/*`)** — `teaser`, `idea-analysis`, `ideation`, `decision`, `decision-autopsy`, `founder-dna`, `market-intelligence`, `pitch-deck`, `pitch-email`, `vc-match`, `generate-card`, `share-card`, `day-brief`, `prep-questions`, `prep-feedback`, `debrief-analysis`, `pattern-analysis`, `task-breakdown`, `task-watchdog`, `checkin`, `monday-missile`.

**Core data** — `dashboard` (session‑scoped), `startups/[id]` (GET/PATCH, ownership‑guarded), `startups/oath`, `decisions/[id]`, `checkins/[id]`, `tasks/complete`, `traction/log`, `day/[id]`, `day/complete`, `vault/check`, `competitors/track`, `competitors/note`, `notifications/register`, `builder/approve`.

**Chat** — `chat/vzn` (plain‑text VZN replies grounded in founder context).

**Auth** — `auth/[...nextauth]` (NextAuth Google handler).

---

## 9. Data model

Prisma entities (`prisma/schema.prisma`):

`User`, `Startup`, `Checkin`, `Decision`, `CompletedTask`, `TaskEdit`, `TractionDetail`, `IntroRequest`, `PivotAlert`, `CompetitorNote`, `DayDebrief`, `WeekAnalysis`, `DecisionFollowUp`, `WeekUnlockStatus`, plus the builder models `Workspace`, `AgentJob`, `Artifact`.

`Startup` is the aggregate root (idea text, scorecard JSON, war‑plan JSON, devil's‑advocate JSON, founder DNA, accountability score, burn/cash/revenue, oath, completed tasks, debriefs, etc.). JSON‑heavy fields are stored as strings in SQLite and as native `jsonb` in the Postgres target. The Postgres schema (`schema.postgres.prisma`) additionally adds soft‑delete (`deletedAt`), optimistic `version`, an `AuditLog`, and RBAC tables.

---

## 10. AI gateway

The gateway (`src/lib/ai/`) is the single entry point the app uses for all LLM calls.

- **`types.ts`** — provider‑agnostic contracts (`ChatRequest`, `ChatResult`, `LlmProvider`, `AiError`, tiers).
- **`providers.ts`** — adapters: OpenAI‑compatible (`openai`, `groq`, `ollama`, `nvidia`), Anthropic Messages API, Gemini `generateContent`. Each reports `configured()` from env.
- **`gateway.ts`** — model routing by tier (`default` / `fast` / `strong`), retry with backoff + jitter, per‑provider **circuit breaker**, optional response cache, and usage metering. `chat()` returns text; `chatJson<T>()` forces + parses JSON.
- **`index.ts`** — public surface (`chat`, `chatJson`, `listConfiguredProviders`).

**Provider chain (default):** NVIDIA Nemotron → OpenAI → Groq → Gemini → Anthropic, filtered to whichever providers have keys configured. If **no** provider is configured (or a call fails), routes fall back to the **deterministic engine** (`fallbacks.ts`) so the app stays fully functional without API keys.

**Grounding:** every AI system prompt is built from `curriculum/frameworks.ts` (`VZN_PERSONA` + `CURRICULUM_GROUNDING`), which also enforces source discipline — VZN must never fabricate precise statistics or attribute them to named reports, and must frame any number it produces as an estimate.

---

## 11. Authentication & security

- **NextAuth** with Google OAuth; sessions are JWT‑based and the canonical user id is `session.user.id`.
- **Route protection:** middleware guards app routes; data endpoints (`/api/dashboard`, `/api/startups/[id]`) derive the user from the session — never from a client‑supplied `userId` — and verify resource ownership before reading or mutating.
- **Headers:** `X-Frame-Options: ALLOWALL` + `frame-ancestors *` are set so the landing document can be iframed.

---

## 12. Setup & installation

### Prerequisites
- Node.js 18+ and npm
- A Google OAuth client (for sign‑in)
- (Optional) an NVIDIA NIM API key for live AI; without it the deterministic fallback runs

### Install
```bash
npm install
npx prisma generate
npx prisma db push      # creates/updates the SQLite database
```

### Environment (`.env.local`)
```bash
# Auth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000

# AI (primary provider). Optional — app falls back to deterministic engine if absent.
NVIDIA_API_KEY=nvapi-...
NVIDIA_MODEL_ID=nvidia/nemotron-3-super-120b-a12b
NVIDIA_BASE_URL=https://integrate.api.nvidia.com/v1
# Optional alternates: ANTHROPIC_API_KEY, OPENAI_API_KEY, GROQ_API_KEY, GEMINI_API_KEY
# Optional routing override: AI_PRIMARY_PROVIDER=nvidia

# Optional integrations
RESEND_API_KEY=...      # Monday Missile emails
CRON_SECRET=...         # cron protection
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

---

## 13. Running & building

```bash
npm run dev      # dev server at http://localhost:3000
npm run build    # production build
npm run start    # serve the production build
```

If you change `.env`, the Prisma schema, or notice stale UI, clear the build cache and restart:

```bash
# Windows PowerShell
Remove-Item -Recurse -Force .next ; npm run dev
```

---

## 14. Known notes & limitations

- **Legacy MongoDB:** Mongo packages and the `nextjs-mongo-template` name are vestigial; the runtime data layer is Prisma. They can be removed in a future cleanup.
- **AI keys optional but recommended:** with no provider key, AI features (analysis, decisions, chat, Founder DNA) return well‑built deterministic results rather than live LLM output. The VZN chat specifically uses a plain‑text call so reasoning‑model replies aren't lost to JSON parsing.
- **Numbers are estimates:** failure‑probability and market figures are directional model estimates (grounded in the framework + founder inputs), not measured statistics — verify before quoting them externally.
- **Postgres is a target, not yet active:** production migration is documented in `MIGRATION-POSTGRES.md`; development runs on SQLite.
- **Scroll‑driven reveals** use `animation-timeline: view()` (modern Chromium); other browsers fall back to on‑load entrance animations.
- **Source of truth for the landing** is `public/veixon-home-preview.html`; the React landing components remain in the repo as an alternate implementation.

---

## 15. Related documents

- `BACKEND-ARCHITECTURE.md` — CTO‑level backend architecture and roadmap
- `MIGRATION-POSTGRES.md` — SQLite → PostgreSQL migration runbook
- `PROJECT-STRUCTURE.md` — directory/structure reference
- `REBUILD_ROADMAP.md` — rebuild roadmap
- `VEIXON-90-Day-Program.md` — the 90‑day curriculum program
- `test_result.md` / `test_reports/` — QA notes and test report

---

*VEIXON Co‑Founders — Decide smarter. Move faster.*
