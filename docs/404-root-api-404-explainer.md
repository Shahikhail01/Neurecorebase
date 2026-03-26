Title: Fixing 404 at GET /api — Analysis and Fix Applied

Summary

During local production testing, requests to GET http://localhost:3000/api returned HTTP 404 Not Found. The backend is a NestJS application with a global prefix set to "api" and versioning enabled. The request to the base API path returned 404 because there was no route registered on the exact path `/api` (the app exposed multiple versioned routes such as `/api/health`, `/api/v1/...`, etc.).

Root cause analysis

- Global prefix & versioning:
  - `app.setGlobalPrefix('api')` was configured in `src/main.ts` and the application enabled URI versioning (`app.enableVersioning({ type: VersioningType.URI })`). This means most controllers are served under paths like `/api` plus version segments and controller paths (for example `/api/v1/health`).
  - The code did not register a route explicitly for the base `/api` path, so a GET to `/api` had no matching route and Nest returned 404.

- Expected developer behavior:
  - Many tools and frontends expect a base API path (`/api`) to return simple service info for health checks, browser checks, or human-readable confirmation. Without an explicit handler, the base path is unhandled.

- Additional factors that could cause 404s (not triggered here but relevant):
  - Misconfigured global prefix (typo or environment override). In this case the prefix was correct.
  - CORS, host binding, or reverse proxy rewrites intercepting or rewriting the path. Not applicable here — the server was local and listening on port 3000.

Fix implemented

I added a lightweight GET handler for `/api` directly on the underlying HTTP adapter before the application starts listening. Implementation details:

- File modified: `backend/src/main.ts`.
- Code added (conceptually):
  - Retrieve the HTTP adapter instance via `app.getHttpAdapter().getInstance()`.
  - Register an Express `GET('/api', handler)` to return a small JSON payload containing `{ status: 'ok', api: 'NeureCore Backend', endpoints: [...] }`.
  - The handler is wrapped in a `try/catch` to be defensive if the adapter isn't available or isn't Express.

Why this fix works

- The explicit route ensures the base `/api` path has a handler and will return 200 with JSON instead of 404.
- It is minimal, non-invasive, and does not change controller routing or versioning behavior. Existing routes such as `/api/v1/health` remain unchanged.
- Because the adapter-level route is added before the app listens, it is available immediately when the server starts.

Alternatives considered

1. Add a Nest controller with a route mapped to the root API path (e.g., `@Controller('')` or dedicated `RootController` registered under the global prefix). Pros: idiomatic Nest approach; testable and injectable. Cons: small extra file, requires module wiring.

2. Add a redirect from `/api` to a canonical endpoint like `/api/health` using the adapter or middleware. Pros: keeps single source of truth for health endpoint. Cons: a redirect may be undesired for API clients.

3. Configure a longer-running API gateway or reverse proxy rule to respond to `/api`. Pros: centralized routing, useful for staged environments; Cons: requires external infra changes.

Why I chose adapter-level GET

- Fastest, lowest friction fix during local testing.
- Avoids adding new modules or modifying DI wiring.
- Easy to convert to a controller later if desired.

Testing performed

- Rebuilt (`pnpm run build`) and restarted the backend (`pnpm run start:prod`).
- Verified the process is listening on port 3000.
- Confirmed GET /api returns JSON status (200) locally.
- Confirmed existing health endpoints (e.g., `/api/health`, `/api/health/ready`) remained available.

Suggested follow-ups

- If you prefer an idiomatic Nest approach, create a small `RootController` that returns the same JSON and add it to `AppModule`.
- Add an automated integration test that requests `/api` and asserts 200 and basic JSON keys to prevent regressions.
- Add an entry to the repository `docs` (this file) and the project memory bank (see below) for future reference.

Vercel-specific notes (if you see the same 404 in Vercel)

- Check `vercel.json` rewrites and routes: Vercel can rewrite or route `/api` to a serverless function or handler path. Ensure there are no rewrites that route `/api` elsewhere or that would prevent the base `/api` path from reaching your runtime. Example: prefer a rewrite that directs `/api` to an explicit handler or allow the runtime to handle `/api`.

- Verify build output and runtime type: on Vercel your Nest app may be deployed as serverless functions or as an external server. If serverless, ensure the server exports the expected handler and that Vercel built the functions under the `api/` folder as configured. Missing or misnamed function files can produce 404s.

- Use `vercel dev` locally to replicate platform routing: `vercel dev` will honor `vercel.json` and show whether `/api` is handled the same way as in production. This helps reproduce routing problems locally.

- Check environment variables in Vercel: production envs may change `NODE_ENV` or `API_PREFIX`. If a different prefix is used in production, `/api` may not be the base path. Use `vercel env pull` to inspect or `VERCEL` dashboard to confirm env values.

- Inspect Vercel logs for 404 details: run `vercel logs <deployment-url>` (or view in the Vercel dashboard). The logs often show which function path was invoked and whether a 404 came from the platform or from the app.

- Fix options on Vercel:
  - Add the same adapter-level or a `RootController` route in the app so `/api` is explicitly handled regardless of host routing.
  - Add a Vercel `rewrites` entry to rewrite `/api` to a canonical endpoint (for example `/api/health` or `/api/handler`) if that fits your infra.
  - If using a serverless adapter for Nest, ensure the adapter mounts the application under the expected path and that the serverless entrypoint file name matches Vercel's expectations.

- Final check: deploy a small smoke deployment that returns a simple JSON from `/api` (or run `vercel dev`) and confirm the platform routes the request to your function or server before promoting the change to production.

---

Document created: 2026-03-24
Author: GitHub Copilot (assistant)
