# Frontend EAOS — Engineering Notes

**Last updated:** 2026-06-29 (post first successful deploy)
**Stack:** Next.js 16.2.9 (App Router) + Turbopack + React 19 + Tailwind 3.4 + TanStack Query 5
**Vercel project:** `frontend-eaos` (id: `prj_2Xi6mqsvUwGOsQhFqQHthsCs91ru`)
**Live URL:** https://frontend-eaos-shahisoftai-7053s-projects.vercel.app

> **Full Vercel operations guide:** see `../../memory-bank/vercel-operations.md` §12 (Frontend-EAOS Notes). This file is a quick-reference; the memory-bank is the source of truth.

---

## DO

1. **Build locally first** before pushing:
   ```bash
   cd frontend-eaos
   npx next build   # must show "Compiled successfully" with route table
   ```
2. **Deploy via `git push origin main`** from repo root. Never `vercel deploy` (rootDirectory bug).
3. **Watch the deploy** after push:
   ```bash
   cd frontend-eaos && npx vercel ls | head -3
   ```
4. **Smoke-test the URL** with curl + grep for `EAOS` or `NeureCore` in the response body (NOT just HTTP 200 — see §Pitfalls).
5. **Commit `package-lock.json`** when adding deps. Vercel uses `npm install` (not `npm ci`).
6. **Use `@/ui/*` imports** for vendored components in `src/ui/`.
7. **Keep `turbopack.root` unset** in `next.config.mjs`.
8. **Read memory-bank first** if anything breaks — it has the actual error and fix for every known issue.

## DON'T

1. ❌ **Don't add `vercel.json` at repo root** — conflicts with `rootDirectory: frontend-eaos`.
2. ❌ **Don't add `package.json` at repo root** — Vercel picks it up and ignores `frontend-eaos/package.json`.
3. ❌ **Don't add `pages/` directory at repo root** — Vercel tries to build it instead of `src/app/`.
4. ❌ **Don't reference `@neurecore/ui/*`** — that package was deleted. Use `@/ui/*`.
5. ❌ **Don't enable Sentry** without `npm install @sentry/nextjs` first — build will fail.
6. ❌ **Don't set `turbopack.root: '.'`** — causes Vercel warnings and path issues.
7. ❌ **Don't trust HTTP 200 alone** — Vercel Auth (`ssoProtection`) shows its own login page with 200. Verify content with `curl | grep EAOS`.
8. ❌ **Don't use `vercel deploy --prod` from inside `frontend-eaos/`** — rootDirectory bug. Use `git push`.
9. ❌ **Don't put runtime tools in `devDependencies`** without `--include=dev` in install command (Vercel strips devDeps in build phase).
10. ❌ **Don't fight the CLI** — if `vercel ls`/`vercel inspect` don't give you what you need, hit the Vercel REST API directly with the token from `~/.local/share/com.vercel.cli/auth.json`.

---

## Quick Reference: Vercel API

```bash
# Get token
TOKEN=$(cat ~/.local/share/com.vercel.cli/auth.json | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

# Get project config
curl -s "https://api.vercel.com/v9/projects/prj_2Xi6mqsvUwGOsQhFqQHthsCs91ru" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool

# Get deployment build logs (find error messages)
curl -s "https://api.vercel.com/v2/deployments/<DEPLOYMENT_ID>/events" \
  -H "Authorization: Bearer $TOKEN" > /tmp/logs.json

# Patch install command (fix devDeps issue)
curl -s -X PATCH "https://api.vercel.com/v9/projects/prj_2Xi6mqsvUwGOsQhFqQHthsCs91ru" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"installCommand": "npm install --legacy-peer-deps --include=dev"}'

# Disable Vercel Auth (fix "Log in to Vercel" page)
curl -s -X PATCH "https://api.vercel.com/v9/projects/prj_2Xi6mqsvUwGOsQhFqQHthsCs91ru" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"ssoProtection": null}'
```

---

## Pitfalls (Real Ones From This Project)

| Pitfall | Symptom | Real Fix |
|---|---|---|
| Vercel Auth on | Shows "Log in to Vercel" page with 200 | `ssoProtection: null` via API |
| devDeps stripped | "Cannot find module 'tailwindcss'" | `--include=dev` in installCommand |
| Wrong rootDirectory | Builds empty or shows old `_error` route | Set `rootDirectory: frontend-eaos` in dashboard |
| Stale Sentry config | Build fails looking for `@sentry/nextjs` | Strip Sentry wrapper from `next.config.mjs` |
| Turbopack.root warning | "Both `outputFileTracingRoot` and `turbopack.root` are set" | Remove `turbopack: { root: '.' }` from config |
| Repo root `pages/` exists | Vercel builds it, not `src/app/` | Delete `pages/` from repo root |
| Repo root `package.json` exists | Vercel picks it up | Delete it (move any deps to `frontend-eaos/package.json`) |
