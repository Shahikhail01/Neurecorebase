/**
 * Root layout — Phase 1, Task 1.20.
 *
 * Per `EAOS-NUWS-principles.md` §3.1a, every page must show one of the
 * 6 canonical loading/error/empty states. The Providers wrap everything;
 * pages render inside the (tenantSlug) route group.
 */

import type { Metadata } from 'next';
import { Providers } from './providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'NeureCore EAOS',
  description: 'Enterprise AI Operating System',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-canvas-50 text-canvas-900 dark:bg-canvas-950 dark:text-canvas-50 antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
