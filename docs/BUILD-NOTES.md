# ResAvenue 2026 — Build Notes

A complete record of how the **Lodha HPM · ResAvenue 2026 Table Tennis Tournament** site
was built inside the existing `ResAvenue2026` Turborepo: the starting situation, the key
decision, everything that was created, the infrastructure problems that were solved, and
how the whole thing was verified end-to-end.

- **Stack:** Turborepo (pnpm 9 workspaces) · Strapi v5 (backend) · Next.js 15 / React 19 (frontend) · Tailwind CSS v4 · SQLite (dev) / PostgreSQL (prod)
- **Apps:** `apps/strapi` (`@repo/strapi`) and `apps/web` (`@repo/ui`)
- **Status:** Complete and verified end-to-end (builds, tests, runtime integration).

---

## Table of contents

1. [The starting situation & the critical discovery](#1-the-starting-situation--the-critical-discovery)
2. [The decision](#2-the-decision)
3. [Architecture overview](#3-architecture-overview)
4. [Backend — Strapi v5](#4-backend--strapi-v5)
5. [Frontend — Next.js web app](#5-frontend--nextjs-web-app)
6. [Tournament logic](#6-tournament-logic)
7. [Security model](#7-security-model)
8. [Monorepo & infrastructure fixes](#8-monorepo--infrastructure-fixes)
9. [Verification — how we proved it works](#9-verification--how-we-proved-it-works)
10. [How to run it](#10-how-to-run-it)
11. [Deviations from the original brief](#11-deviations-from-the-original-brief)
12. [Known follow-ups (non-blocking)](#12-known-follow-ups-non-blocking)
13. [File map](#13-file-map)

---

## 1. The starting situation & the critical discovery

The brief was written as if `apps/strapi` and `apps/web` were **empty folders** waiting to be
scaffolded from scratch. The first thing we did was explore the repo — and that assumption was wrong.

The repository was actually the **notum-cz Strapi + Next.js monorepo starter**: a sophisticated,
production-grade template that was already fully built:

- **`apps/strapi`** — a Strapi v5.2 **page-builder CMS** with content types `page`, `navbar`,
  `footer`, `configuration`; a rich component library (hero, carousel, faq, contact-form, SEO
  components…); seeded data (`strapi-export.tar.gz`); Docker; Sentry; config-sync; S3 / Mailgun providers.
- **`apps/ui`** — a Next.js **15** / React **19** app (App Router, `[locale]` i18n via next-intl)
  built **entirely on** the exact libraries the brief forbade: Radix/shadcn, `@tanstack/react-query`,
  react-hook-form, next-auth, Sentry, Tailwind v4.

This created hard conflicts between the brief and reality:

| Brief said                         | Repo reality                                             |
| ---------------------------------- | -------------------------------------------------------- |
| `apps/web`                         | directory was `apps/ui` (package `@repo/ui`)             |
| Next.js 14 / React 18              | Next.js 15 / React 19                                    |
| "No Radix/shadcn, no UI libraries" | UI app built entirely on Radix/shadcn                    |
| `useSWR` for client data           | template used react-query                                |
| Simple bespoke `lib/strapi.ts`     | template had a full Strapi client + generated types      |
| Fresh tournament content types     | Strapi held an unrelated page-builder schema + seed data |

A couple of brief items were already satisfied: `packageManager` was set to pnpm and there was no
`only-allow yarn` preinstall.

**This was surfaced to you rather than guessed at**, because either direction (overwrite a working
template, or gut its stack) is high-cost and hard to reverse.

---

## 2. The decision

You asked which approach fit the requirement — _"It is an event. Not a full-scale product website."_

**Chosen approach: replace the template with minimal, purpose-built apps.** The template is a
content-managed marketing/product platform; its machinery (dynamic-zone page builder, multi-locale
i18n, next-auth, react-query, Sentry, S3) is exactly the "over-engineering" the brief warned
against, and none of it helps with the genuinely hard parts of _this_ job (brackets, leaderboards,
match advancement). A lean app is easier to build coherently and to hand off after one event.
Everything removed is recoverable from git.

**Two pragmatic deviations from the literal brief (approved):**

1. **Keep Next.js 15 / React 19** (what the repo + shared `@repo/typescript-config` already target)
   instead of downgrading to 14/18 — the App Router code is identical, and downgrading would fight
   the monorepo.
2. **Reuse the Strapi v5 install in place** — strip out the page-builder content types/plugins and
   add the tournament ones — rather than a fresh CLI scaffold. This keeps the monorepo wiring,
   Dockerfile, and tsconfig intact while still yielding the clean, minimal Strapi the brief wanted.

The page-builder content types, components, `config/sync`, lifecycle hooks, Czech admin
translations, and the seed tarball were removed. `apps/ui` was deleted and replaced by a fresh
`apps/web` (directory `web`, package name kept as `@repo/ui` so the root scripts and turbo filters
keep working).

---

## 3. Architecture overview

```
ResAvenue2026/
├── apps/
│   ├── strapi/   (@repo/strapi)  — Strapi v5 REST API + admin CMS
│   └── web/      (@repo/ui)      — Next.js 15 App Router site + organizer dashboard
├── packages/     (shared eslint / prettier / typescript configs — untouched)
└── (root configs — minimal, necessary changes only)
```

**Data flow**

- **Public pages** are **React Server Components** that fetch from Strapi at request/ISR time
  (`revalidate: 60`) through a single `lib/strapi.ts` helper. They render with a server-only API
  token and degrade to empty states if Strapi is unreachable.
- **The `/admin` dashboard** is **client components using `useSWR`**. They never talk to Strapi
  directly — they call an **auth-gated proxy** (`/api/strapi/[...path]`) that validates the admin
  session cookie and forwards to Strapi with the token. The token never reaches the browser.
- **Registration** posts to a server route (`/api/register`) that validates input, rate-limits, and
  creates the player server-side (the public Strapi role can read but not write).

**Design system** (the brief's "German public-sector" aesthetic): Inter font, flat surfaces,
structural borders, no shadows, minimal rounding. Palette: `#ffffff` background · `#1a1a1a` text ·
`#1a56db` accent · `#f4f4f5` surface — defined as Tailwind v4 `@theme` tokens in `globals.css`.

---

## 4. Backend — Strapi v5

### Content types (`apps/strapi/src/api/*`)

All use `draftAndPublish: false` (entries are live immediately — no publish step), single locale.

| Type           | Key fields                                                                                                                         | Relations                                                                         |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| **category**   | `name` (string, required, unique)                                                                                                  | → many `players`, `groups`, `matches` (reverse)                                   |
| **player**     | `name`\* , `age` (int), `flatNumber`, `mobile`, `email`, `registeredAt` (datetime)                                                 | `category` (manyToOne), `groups` (manyToMany)                                     |
| **group**      | `name`\*                                                                                                                           | `category` (manyToOne), `players` (manyToMany)                                    |
| **match**      | `phase` (enum: group/quarterfinal/semifinal/final, default group), `score1`/`score2` (int), `scheduledAt`/`completedAt` (datetime) | `category` (manyToOne); `player1`, `player2`, `winner` (three manyToOne → player) |
| **tournament** | `title`\*, `startDate`/`endDate`/`ceremonyDate` (date), `status` (enum: upcoming/ongoing/completed)                                | —                                                                                 |

Each type has the standard `content-types/<name>/schema.json` plus factory-based
`controllers`, `routes`, and `services`.

### Permissions — granted automatically on boot

`apps/strapi/src/index.ts`'s `bootstrap()` grants, idempotently, on every startup:

- **Public role:** `find` + `findOne` on all five content types (so the site is publicly readable).
- **Authenticated role:** full CRUD on all five.

This means the API works out of the box with no manual permission clicking in the admin UI.

### Configuration (minimal)

- **`config/database.ts`** — uses **SQLite** when `DATABASE_URL` is empty (dev) and **PostgreSQL**
  when it's set (prod). `better-sqlite3` was added as a dependency.
- **`config/plugins.ts`** — trimmed to just `users-permissions` + local file upload. Removed the
  template's SEO, config-sync, populate-deep, Sentry, and S3/Mailgun plugins.
- **`config/middlewares.ts`** — simplified security/CSP (dropped the page-builder's Google-Maps CSP cruft).
- **`.env.example`** — reduced to exactly the brief's variables (`HOST`, `PORT`, `APP_KEYS`,
  `API_TOKEN_SALT`, `ADMIN_JWT_SECRET`, `TRANSFER_TOKEN_SALT`, `JWT_SECRET`, `DATABASE_URL`) with
  working dev defaults pre-filled.
- **`package.json`** — dependencies trimmed; scripts set to `dev`/`build`/`start` per the brief.

---

## 5. Frontend — Next.js web app

### Shared code (`apps/web/src/lib`, `types`)

| File                  | Purpose                                                                                                                                                                                                                                                                                               |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `lib/strapi.ts`       | `strapiUrl()` + `strapiFetch<T>()` (the brief's helper, hardened: merges caller headers instead of clobbering them, and omits the `Authorization` header when no token so dev reads via the public role) + typed readers (`getCategories`, `getTournament`, `getMatches`, `getGroups`, `getPlayers`). |
| `lib/tournament.ts`   | Pure tournament logic (see §6).                                                                                                                                                                                                                                                                       |
| `lib/auth.ts`         | Stateless admin auth — SHA-256-derived session token, constant-time compare, `isValidAdminSession()`. Works in both Edge middleware and Node routes.                                                                                                                                                  |
| `lib/admin-client.ts` | Browser helpers for the dashboard: `swrFetcher`, `adminMutate`, `logout` — all routed through the gated proxy.                                                                                                                                                                                        |
| `lib/utils.ts`        | `cn`, `formatDate(Time)`, `slugify`, and `safe()` (resolves a promise to a fallback so public pages render empty states instead of 500-ing).                                                                                                                                                          |
| `lib/config.ts`       | Single-event constants: `EVENT`, `ORGANIZER`, `NAV_LINKS`.                                                                                                                                                                                                                                            |
| `types/index.ts`      | Domain types reflecting Strapi v5's **flat** REST shape (no `attributes` wrapper); `Phase`, `TournamentStatus`, `Standing`, and response wrappers.                                                                                                                                                    |

### UI primitives (`apps/web/src/components/ui`)

`Button` (+ `buttonClass` so links can look like buttons), `Card`, `Badge` (+ `PhaseBadge`),
`Table`, `Navbar` (active-link aware), `Footer`, `Container` (+ `PageHeader`), `Countdown`
(client, hydration-safe). Plus `components/match-line.tsx` — the reusable match presentation used by
schedule, bracket, and admin. No UI libraries; vanilla Tailwind only.

### Public pages

| Route                 | What it does                                                                                                                                          |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`                   | Hero with event name, status badge, tagline, **countdown** to the tournament start, CTAs, quick-link cards, and category chips that link to brackets. |
| `/register`           | Server page loads categories → client form (Name, Age, Flat, Mobile, Email, Category) with success/error states → posts to `/api/register`.           |
| `/schedule`           | All matches grouped **Category → Phase**; shows scores when completed, "TBD"/time otherwise. ISR 60s.                                                 |
| `/bracket/[category]` | Group-stage cards + a knockout column tree (QF → SF → Final) for one category, resolved by slug.                                                      |
| `/leaderboard`        | Standings table per category, computed from matches, sorted by wins then point differential. ISR 60s.                                                 |
| `/gallery`            | Responsive 3-column placeholder grid (easy to swap for real photos).                                                                                  |
| `/contact`            | Hardcoded organizer card (name, role, email, phone, flat).                                                                                            |

### Admin area (`/admin`)

- **`middleware.ts`** guards every `/admin` route except `/admin/login`, redirecting to login when the
  session cookie is missing/invalid.
- **`/admin/login`** — password form → `/api/admin/login`.
- A **`(protected)` route group** holds the shell (nav + logout) and the pages:
  - **`/admin`** — dashboard with links.
  - **`/admin/players`** — registrations table + "create group & assign players" form.
  - **`/admin/matches`** — create fixtures, enter scores, **"Save & Advance"** (auto-creates the next
    round when owed, using the pure logic in §6).
  - **`/admin/bracket`** — read-only overview of every category.

### API routes

| Route                   | Role                                                                                                                                |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/api/register`         | Validates + rate-limits (5/min/IP) + creates a player server-side with the token.                                                   |
| `/api/admin/login`      | Compares password to `ADMIN_SECRET`; sets an httpOnly session cookie.                                                               |
| `/api/admin/logout`     | Clears the cookie.                                                                                                                  |
| `/api/strapi/[...path]` | Auth-gated proxy: validates the admin cookie, restricts to an allowlist of tournament resources, forwards to Strapi with the token. |

---

## 6. Tournament logic

Pure, side-effect-free functions in `lib/tournament.ts`, unit-tested (10 tests):

- **`determineWinner(score1, score2, p1Id, p2Id)`** → the higher-scoring player's id, or `""` for a
  draw/invalid (the admin UI blocks equal scores).
- **`getNextPhase(phase)`** → next rung of `group → quarterfinal → semifinal → final`, or `null`.
- **`shouldCreateNextMatch(phase, completedInPhase, existingNextMatches)`** → whether a next-round
  match is owed. In single elimination, every two completed knockout matches feed one next-round
  match. **The group stage is excluded** — round-robin advancement is by standings, not by pairing
  winners in completion order, so the organizer seeds the knockout round manually.
- **`computeStandings(players, matches)`** → per-player W/L, points for/against, sorted by wins then
  point differential then name (used by the leaderboard).

The admin "Save & Advance" flow calls these _before_ writing to Strapi — keeping the CMS "dumb" and
the rules in one tested place.

---

## 7. Security model

- **No secrets in code.** Dev secrets live in gitignored `.env` files; `.env.example` ships
  placeholders. `ADMIN_SECRET` defaults to a placeholder you must change.
- **Token isolation.** The full-access Strapi token is **server-only**. The browser dashboard talks
  only to `/api/strapi/[...path]`, which validates the admin cookie and forwards with the token. A
  resource allowlist (`players`, `categories`, `groups`, `matches`, `tournaments`) limits blast radius.
- **Admin auth.** Stateless: the cookie value is a SHA-256 hash of `ADMIN_SECRET`, validated in both
  middleware and the proxy with a constant-time comparison. Cookie is `httpOnly`, `sameSite=lax`,
  `secure` in production, 8-hour expiry.
- **Input validation** on registration (name, email format, category, age bounds) and **rate
  limiting** (5/min/IP).
- **Injection / XSS:** Strapi's ORM parameterizes queries; React escapes output; no
  `dangerouslySetInnerHTML`.
- **Error hygiene:** client-facing errors are generic; details are logged server-side.

---

## 8. Monorepo & infrastructure fixes

The pnpm conversion of this template was **incomplete** — it had `pnpm-workspace.yaml` and a pnpm
`packageManager` field but had only ever been installed with yarn (only `yarn.lock` existed). Making
it actually install and build under pnpm required four targeted fixes:

1. **`packageManager: pnpm@9.x.x` → `pnpm@9.15.9`.** The wildcard is an invalid corepack spec and
   blocked _every_ pnpm command. (The brief asked for `9.x.x`; this realizes that intent with a
   concrete, working version.)
2. **Added `.npmrc`** with `link-workspace-packages=true` (pnpm 9 defaults this off, so `@repo/*`
   workspace packages weren't linking and install 404'd against the registry) and
   `engine-strict=false` (the machine runs Node 24; the repo targets 22 — warning, not failure).
3. **Added `pnpm.overrides`** (`@types/react` 19.2.17, `@types/react-dom` 19.2.3) to the root
   `package.json`. Web needs React 19 types; Strapi's `@strapi/design-system` → Radix peers drag in
   React 18 types, which pnpm hoisted and Next's own `.d.ts` files resolved to — producing two
   conflicting global `React` namespaces and breaking the web typecheck/build. This `overrides` block
   is the **pnpm equivalent of the yarn `resolutions` the template originally used** and lost in the
   conversion.
4. **Fixed `apps/strapi/types/index.ts`.** It re-exported deep `@strapi/types/dist/...` internal
   paths that no longer exist in Strapi 5.49, and `export * from "./generated/components"` — which
   breaks because Strapi writes a comment-only (non-module) components file when there are no
   components. Both were removed; the stable `@strapi/strapi` exports and the generated content-type
   types remain.

> These are the only root-level changes, and each was strictly necessary to make the pnpm monorepo
> install and build. They complete the conversion rather than altering the template's design.

---

## 9. Verification — how we proved it works

Everything below was actually run, not assumed:

| Check                                       | Result                                                                                       |
| ------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Web TypeScript (`tsc --noEmit`)             | ✅ clean                                                                                     |
| Unit tests (tournament logic, vitest)       | ✅ 10 / 10 pass                                                                              |
| `next build`                                | ✅ 14 routes, ISR (`revalidate 1m`) applied to `/`, `/schedule`, `/leaderboard`, `/register` |
| `strapi build`                              | ✅ green and stable across repeat builds                                                     |
| Strapi boot (SQLite) + permission bootstrap | ✅ public `GET /api/{categories,matches,tournaments}` → `200`                                |
| Relation writes by `documentId`             | ✅ verified manyToOne, manyToMany, and match's three player relations via a headless script  |
| Public pages vs seeded data                 | ✅ home / schedule / leaderboard / register / bracket all render real data                   |
| Registration round-trip                     | ✅ valid → `201` (player count +1); invalid email → `400`; rate limit → `429` after 5        |
| Admin auth                                  | ✅ correct password → `200` + cookie; wrong → `401`                                          |
| Gated proxy                                 | ✅ no cookie → `401`; with cookie → `200`; disallowed resource (`users`) → `404`             |

To run the integration test, a small dataset and a full-access API token were seeded via a headless
Strapi script, both servers were started, and the pages/flows were exercised over HTTP. (That dev
data lives in the gitignored SQLite DB.)

---

## 10. How to run it

```bash
# 1. Install
pnpm install

# 2. Backend
cp apps/strapi/.env.example apps/strapi/.env     # dev secrets pre-filled
pnpm dev:strapi                                   # http://localhost:1337/admin
#    → create the super-admin account on first run
#    → Settings → API Tokens → create a "Full access" token (copy it)
#    → add a Tournament and some Categories

# 3. Frontend env
#    apps/web/.env.local:
#      NEXT_PUBLIC_STRAPI_URL=http://localhost:1337
#      STRAPI_API_TOKEN=<the Full access token>
#      ADMIN_SECRET=<your chosen /admin password>
pnpm dev:ui                                       # http://localhost:3000

# Tests
pnpm --filter @repo/ui test
```

**Two different "admin" pages:**

- **Strapi CMS** — `http://localhost:1337/admin` — manage content directly, create API tokens.
- **Organizer dashboard** — `http://localhost:3000/admin` — log in with `ADMIN_SECRET` to manage
  players, groups, and matches. (Reads work without a token; _writes_ need `STRAPI_API_TOKEN` set.)

---

## 11. Deviations from the original brief

| Brief                           | What we did                                       | Why                                                                   |
| ------------------------------- | ------------------------------------------------- | --------------------------------------------------------------------- |
| Scaffold fresh empty apps       | Replaced an existing starter template             | The folders weren't empty; surfaced and you chose the minimal rebuild |
| Next.js 14 / React 18           | Next.js 15 / React 19                             | Matches the repo + shared configs; identical App Router code          |
| Directory `apps/web`            | Dir `apps/web`, **package name kept `@repo/ui`**  | Keeps root scripts / turbo filters working                            |
| `packageManager: pnpm@9.x.x`    | `pnpm@9.15.9`                                     | The wildcard is an invalid corepack spec                              |
| `lib/strapi.ts` verbatim        | Same shape, two correctness fixes                 | Header-merge + omit-empty-token so it actually works                  |
| (registration) "POST to Strapi" | POST to a server route that relays with the token | Public role can't create; keeps the token off the browser             |

Everything else follows the brief: pnpm only, no component libraries, no global-state library,
`useSWR` for the dashboard, shared types in `apps/web/types/`, two apps only, complete working files.

---

## 12. Known follow-ups (non-blocking)

- **Stale `yarn.lock`** at the root can be deleted now that `pnpm-lock.yaml` exists.
- **Deployment `Dockerfile`s and `Procfile`** still reference yarn — update to pnpm before deploying.
- **`STRAPI_API_TOKEN`** must be set in `apps/web/.env.local` for the dashboard's write actions
  (and public registration) to work; reads work without it.
- `NEXT_PUBLIC_STRAPI_URL` is inlined at **build** time — set it before `next build` for production.
- Cosmetic: `rounded-[2px]` could be the canonical `rounded-xs` (Tailwind v4 hint).
- Nothing has been committed yet — the work is on the working tree only.

---

## 13. File map

```
apps/strapi/
  src/api/{category,player,group,match,tournament}/   content types (schema + controller + route + service)
  src/index.ts                                        bootstrap: grants public read + authenticated CRUD
  config/{database,plugins,admin,middlewares}.ts      minimal config (SQLite dev / PG prod)
  .env.example                                        brief's variables, dev defaults
  types/index.ts                                      stable type exports (broken internals removed)

apps/web/
  src/app/
    layout.tsx, globals.css                           Inter font + design tokens
    page.tsx                                          home (hero + countdown)
    register/                                         page + client form
    schedule/ leaderboard/ gallery/ contact/          public pages
    bracket/[category]/                               per-category bracket
    admin/login/                                      login page + client form
    admin/(protected)/{,players,matches,bracket}/     gated dashboard
    api/register/                                      validated, rate-limited registration
    api/admin/{login,logout}/                          session cookie
    api/strapi/[...path]/                             auth-gated Strapi proxy
  src/components/ui/*                                  Button, Card, Badge, Table, Navbar, Footer, Container, Countdown
  src/components/match-line.tsx                        reusable match presentation
  src/lib/{strapi,tournament,auth,admin-client,utils,config}.ts
  src/lib/tournament.test.ts                           10 unit tests
  src/types/index.ts                                  domain + Strapi-v5 response types
  src/middleware.ts                                   /admin guard

root/
  .npmrc                                              link-workspace-packages=true
  package.json                                        packageManager pin + pnpm.overrides
  README.md                                           "ResAvenue 2026 – Setup" section appended
  docs/BUILD-NOTES.md                                 this document
```

---

_Generated as a build record for ResAvenue 2026. Backend: Strapi v5. Frontend: Next.js 15 / React 19._
