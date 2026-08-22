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
  /** True once Clerk has finished initializing (session restored). */
  loaded?: boolean;
  /** Starts/finishes initialization; safe to call when already in-flight. */
  load?: () => Promise<void>;
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

/**
 * ClerkProvider injects and initializes `window.Clerk` asynchronously — right
 * after the sign-in redirect the singleton can be missing or still loading
 * while the dashboard already fires its first API requests. Waiting here keeps
 * those first requests from going out without a token and bouncing with a
 * 401 (which TanStack Query deliberately never retries).
 *
 * A single shared promise means concurrent first requests all await the same
 * initialization instead of polling independently.
 */
const CLERK_READY_TIMEOUT_MS = 10_000;
const CLERK_POLL_INTERVAL_MS = 50;

let clerkReadyPromise: Promise<ClerkBrowser | undefined> | null = null;

function waitForClerk(): Promise<ClerkBrowser | undefined> {
  if (typeof window === "undefined") return Promise.resolve(undefined);
  if (clerkReadyPromise) return clerkReadyPromise;

  clerkReadyPromise = new Promise<ClerkBrowser | undefined>((resolve) => {
    const deadline = Date.now() + CLERK_READY_TIMEOUT_MS;

    const check = () => {
      const clerk = getClerk();
      if (clerk) {
        if (typeof clerk.load === "function" && !clerk.loaded) {
          clerk
            .load()
            .catch(() => undefined)
            .then(() => resolve(clerk));
        } else {
          resolve(clerk);
        }
      } else if (Date.now() >= deadline) {
        // Clerk never appeared (script blocked?) — treat as signed out.
        resolve(undefined);
      } else {
        setTimeout(check, CLERK_POLL_INTERVAL_MS);
      }
    };

    check();
  }).then((clerk) => {
    // On timeout, clear the cache so the next call can try again instead of
    // reusing a stale "no Clerk" result forever.
    if (!clerk) clerkReadyPromise = null;
    return clerk;
  });

  return clerkReadyPromise;
}

/** Returns the active session, or null when signed out. */
export async function getSession(): Promise<Session | null> {
  const clerk = await waitForClerk();
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
  const clerk = await waitForClerk();
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
  void waitForClerk().then((clerk) => {
    if (!clerk?.session) {
      void clerk?.redirectToSignIn?.();
    }
  });
}

