/**
 * Auth seam — Clerk implementation.
 *
 * The API client (`lib/api-client.ts`) attaches `getAuthHeaders()` to every
 * request, so no hook or component call sites need to know about auth. Uses
 * the Clerk browser singleton (`window.Clerk`) instead of React hooks so this
 * module also works outside component render functions.
 */

export interface Session {
  userId: string;
  email: string;
  accessToken: string;
  expiresAt: string;
}

/** Minimal structural type for the Clerk browser singleton. */
interface ClerkBrowser {
  session?: {
    userId?: string;
    expireAt?: Date | string;
    getToken: () => Promise<string | null>;
  } | null;
  user?: {
    primaryEmailAddress?: { emailAddress?: string } | null;
  } | null;
  redirectToSignIn?: () => Promise<void> | void;
}

function getClerk(): ClerkBrowser | undefined {
  if (typeof window === "undefined") return undefined;
  return (window as { Clerk?: ClerkBrowser }).Clerk;
}

/** Returns the active session, or null when signed out. */
export async function getSession(): Promise<Session | null> {
  const clerk = getClerk();
  if (!clerk?.session) return null;

  const accessToken = await clerk.session.getToken();
  if (!accessToken) return null;

  const expireAt = clerk.session.expireAt;
  return {
    userId: clerk.session.userId ?? "",
    email: clerk.user?.primaryEmailAddress?.emailAddress ?? "",
    accessToken,
    expiresAt: expireAt ? new Date(expireAt).toISOString() : "",
  };
}

/**
 * Headers to attach to every API request. `getToken()` returns the cached
 * session token or refreshes it when expired — call it per request and never
 * cache the result.
 */
export async function getAuthHeaders(): Promise<Record<string, string>> {
  const clerk = getClerk();
  if (!clerk?.session) return {};

  const token = await clerk.session.getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Handles an API 401: sends signed-out users to Clerk's sign-in page. A
 * signed-in user's 401 means a token/backend mismatch, so we surface the
 * error instead of redirect-looping.
 */
export function handleUnauthorized(): void {
  const clerk = getClerk();
  if (!clerk?.session) {
    void clerk?.redirectToSignIn?.();
  }
}

