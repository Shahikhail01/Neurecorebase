const ACCESS_TOKEN_COOKIE = '__Host-nc_at';
const REFRESH_TOKEN_COOKIE = '__Host-nc_rt';
const CSRF_COOKIE = '__Host-nc_csrf';

export interface CookieOptions {
  secure?: boolean;
  sameSite?: 'Strict' | 'Lax' | 'None';
  maxAge?: number;
  path?: string;
}

export class CookieManager {
  getAccessToken(): string | null {
    if (typeof document === 'undefined') return null;
    return this.getCookie(ACCESS_TOKEN_COOKIE);
  }

  getRefreshToken(): string | null {
    if (typeof document === 'undefined') return null;
    return this.getCookie(REFRESH_TOKEN_COOKIE);
  }

  getCsrfToken(): string | null {
    if (typeof document === 'undefined') return null;
    return this.getCookie(CSRF_COOKIE);
  }

  hasAuthCookies(): boolean {
    if (typeof document === 'undefined') return false;
    // httpOnly cookies (nc_at, nc_rt) are invisible to JS. Check the CSRF cookie
    // (not httpOnly) as the signal that the backend set the auth cookie set.
    return this.getCookie(CSRF_COOKIE) !== null;
  }

  clearAuthCookies(): void {
    this.deleteCookie(ACCESS_TOKEN_COOKIE);
    this.deleteCookie(REFRESH_TOKEN_COOKIE);
    this.deleteCookie(CSRF_COOKIE);
  }

  private getCookie(name: string): string | null {
    if (typeof document === 'undefined') return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      return parts.pop()?.split(';').shift() || null;
    }
    return null;
  }

  private deleteCookie(name: string): void {
    if (typeof document === 'undefined') return;
    document.cookie = `${name}=; Max-Age=0; path=/; SameSite=Strict`;
  }
}

export const cookieManager = new CookieManager();
