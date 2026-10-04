# DevHackDay

A pnpm monorepo for React apps hosted on Cloudflare Workers, with Neon serverless PostgreSQL.

## Workspace

- `apps/combo`: the first app, using React, TypeScript, Vite, and a Cloudflare Worker API.
- `packages/db`: shared Neon HTTP database client, for server code only.
- `tsconfig.base.json`: shared TypeScript settings.

## Local development

Use Node.js 22.12+ and pnpm 10.34.5. Run all dependency installs from the workspace root:

```sh
pnpm install
pnpm dev
```

The frontend and Worker API run together through the Cloudflare Vite plugin. Combo's home page and `/api/health` work without a database connection.

## Neon configuration

Create a Neon database and copy its PostgreSQL connection string. For local development:

```sh
cp apps/combo/.dev.vars.example apps/combo/.dev.vars
```

Set `DATABASE_URL` in `apps/combo/.dev.vars` to your connection string. `/api/db` runs `SELECT 1` through the shared Neon client and requires this setting. No tables or migrations are needed for the starter.

Keep database credentials in Worker secrets and `.dev.vars`; never use a `VITE_` variable for them. `.dev.vars` and `.env` files are ignored by Git.

## Commands

```sh
pnpm dev             # Develop Combo
pnpm build           # Build workspace apps
pnpm typecheck       # Check app, Worker, config, and shared package types
pnpm deploy:combo    # Build and deploy Combo to Cloudflare
```

## Cloudflare deployment

When ready to deploy, log into your Cloudflare account and set the Neon connection string as a Worker secret:

```sh
pnpm --filter @devhackday/combo exec wrangler login
pnpm --filter @devhackday/combo exec wrangler secret put DATABASE_URL
pnpm deploy:combo
```

Combo uses the Worker name `devhackday-combo`. Vite builds the frontend assets and Worker together; Wrangler deploys the generated configuration. No deployment or cloud resource provisioning is performed by repository initialization.

## Adding apps

Place additional apps in `apps/` and shared packages in `packages/`. Give each app a unique package name and Cloudflare Worker name. Use `workspace:*` for internal dependencies, then run `pnpm install` from the root.

## References

- [Cloudflare React SPA and Worker API setup](https://developers.cloudflare.com/workers/vite-plugin/tutorial/)
- [Neon on Cloudflare Workers](https://developers.cloudflare.com/workers/databases/third-party-integrations/neon/)
