/**
 * Class-name utility — combines clsx + tailwind-merge.
 *
 * Per `EAOS-NUWS-principles.md` §7.5.2, no arbitrary spacing/color/font
 * values are allowed. Every Tailwind class comes from the design token
 * set in `tailwind.config.ts`. This helper ensures conflicting Tailwind
 * classes are resolved correctly.
 */
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
