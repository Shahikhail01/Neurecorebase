/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  // Phase 1, Task 1.20: env config for the EAOS API.
  // - NEXT_PUBLIC_API_URL: backend base URL (e.g. http://localhost:3000/api/v1)
  // - NEXT_PUBLIC_TENANT_SLUG: the {tenantCompanyName} for this deployment
  env: {
    NEXT_PUBLIC_API_URL:
      process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1',
  },
  // Standalone output for Vercel deployment (per D-022 Task 1.26).
  // We do not export `output: 'export'` (full static) because the EAOS
  // workspace requires cookies, dynamic routing, and auth — all of which
  // need a Node.js runtime.
};

export default nextConfig;
