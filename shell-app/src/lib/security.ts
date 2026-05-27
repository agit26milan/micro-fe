/**
 * Security Utility
 *
 * Token management, API client dengan auth, dan helper keamanan.
 * Semua komunikasi MFE ke BFF/API harus melalui client ini.
 */

'use client';

import { authManager } from './auth';

// ── Token Management ──

const TOKEN_KEY = 'mfe:token';

/**
 * Simpan token JWT
 */
export function setToken(token: string): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(TOKEN_KEY, token);
  } catch {
    // Storage not available
  }
}

/**
 * Ambil token JWT dari sessionStorage atau authManager
 */
export function getToken(): string | null {
  if (typeof window === 'undefined') return null;

  // Coba dari authManager dulu
  const authState = authManager.getState();
  if (authState.token) return authState.token;

  // Fallback ke sessionStorage
  try {
    return sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

/**
 * Hapus token
 */
export function clearToken(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore
  }
}

// ── API Client ──

export interface ApiClientConfig {
  baseUrl: string;
  headers?: Record<string, string>;
  timeout?: number;
}

export interface ApiResponse<T = unknown> {
  data: T | null;
  error: string | null;
  status: number;
  ok: boolean;
}

/**
 * API Client terpusat dengan:
 * - Authorization header otomatis dari token
 * - Error handling
 * - Timeout
 * - Request/response logging
 */
export function createApiClient(config: ApiClientConfig) {
  const { baseUrl, timeout = 10000 } = config;

  async function request<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<ApiResponse<T>> {
    const url = `${baseUrl}${path}`;
    const token = getToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...config.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
        credentials: 'include', // Kirim cookies untuk SSR
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        // Handle 401 — token expired
        if (response.status === 401) {
          clearToken();
          authManager.logout();
        }

        const errorBody = await response.text().catch(() => 'Unknown error');
        return {
          data: null,
          error: `HTTP ${response.status}: ${errorBody}`,
          status: response.status,
          ok: false,
        };
      }

      const data = await response.json();
      return {
        data: data as T,
        error: null,
        status: response.status,
        ok: true,
      };
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof DOMException && error.name === 'AbortError') {
        return {
          data: null,
          error: 'Request timeout',
          status: 408,
          ok: false,
        };
      }

      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        status: 0,
        ok: false,
      };
    }
  }

  return {
    get: <T>(path: string) => request<T>('GET', path),
    post: <T>(path: string, body: unknown) => request<T>('POST', path, body),
    put: <T>(path: string, body: unknown) => request<T>('PUT', path, body),
    patch: <T>(path: string, body: unknown) => request<T>('PATCH', path, body),
    delete: <T>(path: string) => request<T>('DELETE', path),
  };
}

// ── Security Helpers ──

/**
 * Sanitize user input untuk mencegah XSS
 */
export function sanitizeHTML(input: string): string {
  const map: Record<string, string> = {
    '&': '&',
    '<': '<',
    '>': '>',
    '"': '"',
    "'": '&#x27;',
    '/': '&#x2F;',
  };
  return input.replace(/[&<>"'/]/g, (char) => map[char]);
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Generate CSRF token (sederhana)
 */
export function generateCSRFToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Parse JWT payload tanpa verifikasi (hanya decode)
 */
export function parseJWT(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

/**
 * Check if token is expired
 */
export function isTokenExpired(token: string): boolean {
  const payload = parseJWT(token);
  if (!payload || !payload.exp) return true;
  return Date.now() >= (payload.exp as number) * 1000;
}
