/**
 * Auth seam — intentionally unused.
 *
 * The Advocate Contracts API is a single-tenant internal tool with no auth.
 * When authentication is introduced, implement this module and inject
 * `getAuthHeaders()` into the fetch wrapper in lib/api-client.ts — no call
 * sites (hooks, components) should need to change.
 */

export interface Session {
  userId: string;
  email: string;
  accessToken: string;
  expiresAt: string;
}

/** Returns the active session, or null when signed out. Always null today. */
export async function getSession(): Promise<Session | null> {
  return null;
}

/** Headers to attach to every API request. Empty today. */
export function getAuthHeaders(): Record<string, string> {
  return {};
}
