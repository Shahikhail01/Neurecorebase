import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Vercel monorepo fix for frontend-eaos (D-022 + Phase 10 cleanup).
//
// The `@neurecore/ui` package lives at `../packages/ui/` (one level up
// from this app's root). On Vercel, the build container has
// `rootDirectory: frontend-eaos` set, which means the `file:../packages/ui`
// npm dependency cannot always be resolved cleanly (npm 10 + workspaces
// + `file:` in a shallow clone is brittle).
//
// To make the build robust on both Vercel and local dev, we alias
// `@neurecore/ui` and its subpaths directly to the package source via
// webpack's `resolve.alias` function. This bypasses node_modules +
// package.json `exports` resolution entirely. The `transpilePackages`
// option tells Next.js to compile the TypeScript + JSX source on demand.
//
// TypeScript also sees these paths via `tsconfig.json` `paths`, so type
// checking continues to work.

const uiPackageSrc = path.resolve(__dirname, '../packages/ui/src');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  transpilePackages: ['@neurecore/ui'],
  // Phase 1, Task 1.20: env config for the EAOS API.
  env: {
    NEXT_PUBLIC_API_URL:
      process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1',
  },
  webpack(config) {
    config.resolve = config.resolve || {};
    // Use a function alias so we can route `@neurecore/ui[/<subpath>]`
    // to the corresponding file under `packages/ui/src/`.
    const existingAlias = config.resolve.alias || {};
    config.resolve.alias = Object.assign({}, existingAlias, {
      '@neurecore/ui$': path.join(uiPackageSrc, 'index.ts'),
      '@neurecore/ui/components$': path.join(
        uiPackageSrc,
        'components/index.ts',
      ),
      '@neurecore/ui/components/(.*)': path.join(
        uiPackageSrc,
        'components/$1',
      ),
      '@neurecore/ui/auth$': path.join(uiPackageSrc, 'auth/index.ts'),
      '@neurecore/ui/auth/(.*)': path.join(uiPackageSrc, 'auth/$1'),
      '@neurecore/ui/tokens$': path.join(uiPackageSrc, 'tokens/index.ts'),
      '@neurecore/ui/query$': path.join(uiPackageSrc, 'query/index.ts'),
      '@neurecore/ui/endpoints$': path.join(
        uiPackageSrc,
        'endpoints/index.ts',
      ),
      '@neurecore/ui/lib$': path.join(uiPackageSrc, 'lib/index.ts'),
      '@neurecore/ui/types$': path.join(uiPackageSrc, 'types/index.ts'),
      // Catch-all for any other subpath (e.g. `tokens/colors`):
      '@neurecore/ui/(.*)': path.join(uiPackageSrc, '$1'),
    });
    return config;
  },
};

export default nextConfig;