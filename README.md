# Parcolia

Multi-tenant SaaS for car rental agencies in Morocco. Project rules: [CLAUDE.md](CLAUDE.md) · database: [docs/DATABASE.md](docs/DATABASE.md).

## Run it on your computer

You need **Git**, **Node.js 22**, and **Docker Desktop** (open and running).

```bash
npm install
```

```bash
npx supabase start
```

If `supabase start` stops with "Data limit exceeded", use Docker Hub instead (PowerShell):

```bash
$env:SUPABASE_INTERNAL_IMAGE_REGISTRY="docker.io"; npx supabase start
```

Create `.env.local` from `.env.example`, then paste the two keys printed by `npx supabase status` (`ANON_KEY` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SERVICE_ROLE_KEY` → `SUPABASE_SERVICE_ROLE_KEY`). These local keys are not secret; never commit real production keys.

```bash
npm run dev
```

Open http://localhost:3000 and log in with the demo accounts (local only):

| Role  | Email                 | Password          |
|-------|-----------------------|-------------------|
| admin | admin@demo.parcolia.ma | Demo-Parcolia-2026 |
| staff | staff@demo.parcolia.ma | Demo-Parcolia-2026 |

Emails sent by the app (invitations, password reset, magic links) arrive in the local mailbox: http://127.0.0.1:54324. The database is at http://127.0.0.1:54323 (Supabase Studio).

## Checks (run before saying a task is done)

```bash
npm run lint
```

```bash
npm run typecheck
```

```bash
npm test
```

```bash
npm run db:test
```

```bash
npm run i18n:check
```

```bash
npm run build
```

```bash
npm run test:e2e
```

`test:e2e` runs Playwright at 375 px, 768 px and 1280 px against `npm run start` (build first) and the local Supabase.

## Project layout

- `src/app/[locale]/(auth)` — login, signup (3 steps), password reset, invitation (Parcolia branding)
- `src/app/[locale]/(app)` — inside an agency: dashboard, team, account, billing (agency branding)
- `src/app/auth/confirm` — landing route for links in Supabase emails
- `src/proxy.ts` — locale prefix, session refresh, login redirects (Next.js 16 "proxy" = old middleware)
- `src/lib/auth` — `getActiveAgency()`, `requireUser/requireAgency/requireRole`, server-action guard
- `src/components/ui` — shadcn/ui-style components (Radix): buttons, fields (date, time, MAD, matricule, phone), Oui/Non, dialogs
- `src/components/app` — Parcolia components: shell (sidebar / rail / bottom nav), ResponsiveList, UrgencyGroups, StatTile, EmptyState, Stepper, SearchBar, `<Ltr>`
- `/dev/ui` — every shared component in one page (development only, or with `PARCOLIA_DEV_UI=1`)
- `messages/{fr,ar,en}.json` — all texts; `supabase/` — migrations, seed, email templates, pgTAP tests
