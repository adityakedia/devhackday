# Project notes

- Initialized a pnpm workspace with `apps/combo` (React + Vite + Cloudflare Workers) and `packages/db` (Neon HTTP client).
- Git remote: `https://github.com/adityakedia/devhackday.git`; initial branch: `main`.
- Combo's `/api/health` needs no credentials. `/api/db` requires the `DATABASE_URL` Worker secret or local `.dev.vars`.
- Cloud resources are not provisioned or deployed. No application schema or migrations have been added.
- Builds, type checks, runtime checks, and tests require explicit user approval before running.
