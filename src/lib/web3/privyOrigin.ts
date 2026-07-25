// ---------------------------------------------------------------------------
// Privy origin preflight.
//
// Privy authenticates against a fixed allow-list of origins registered on the
// app. A request from anywhere else is rejected before the signature is ever
// checked:
//
//   POST https://auth.privy.io/api/v1/siwe/init
//   403 {"error":"Origin not allowed","code":"invalid_origin"}
//
// Privy's modal renders that as a generic "Could not log in with wallet -
// please try connecting again", which is indistinguishable from a rejected
// signature or a flaky wallet, so it sends people hunting through their wallet
// instead of their dashboard. This reads the app's own public config and says
// which origin is missing.
// ---------------------------------------------------------------------------

const APP_ID = import.meta.env.VITE_PRIVY_APP_ID as string | undefined;

export type OriginCheck =
  | { state: "ok" }
  | { state: "no-app-id" }
  | { state: "blocked"; origin: string; allowed: string[] };

/**
 * Does `entry` (as registered in the Privy dashboard) cover `origin`?
 *
 * Entries are stored in several shapes - full origin, bare host, or a
 * wildcard subdomain - so each is checked rather than assuming one format.
 */
function covers(entry: string, url: URL): boolean {
  const clean = entry.trim().toLowerCase().replace(/\/+$/, "");
  if (!clean) return false;

  // "http://localhost:8080"
  if (clean === url.origin.toLowerCase()) return true;

  // "localhost:8080" / "app.example.com"
  if (clean === url.host.toLowerCase() || clean === url.hostname.toLowerCase()) return true;

  // "*.example.com" / "https://*.example.com"
  const wildcard = clean.replace(/^https?:\/\//, "");
  if (wildcard.startsWith("*.")) {
    const suffix = wildcard.slice(1); // ".example.com"
    if (url.hostname.toLowerCase().endsWith(suffix)) return true;
  }

  return false;
}

let cached: Promise<OriginCheck> | null = null;

/**
 * Whether Privy will accept a wallet login from the current origin. Resolves
 * to "ok" whenever the answer isn't a confident no - an unreachable config
 * endpoint must not produce a scary banner over a working app.
 */
export function checkPrivyOrigin(): Promise<OriginCheck> {
  if (cached) return cached;

  cached = (async (): Promise<OriginCheck> => {
    if (!APP_ID) return { state: "no-app-id" };
    if (typeof window === "undefined") return { state: "ok" };

    try {
      const res = await fetch(`https://auth.privy.io/api/v1/apps/${APP_ID}`, {
        headers: { "privy-app-id": APP_ID },
      });
      if (!res.ok) return { state: "ok" };

      const app = (await res.json()) as { allowed_domains?: string[] };
      const allowed = app.allowed_domains ?? [];

      // An empty list means the app hasn't restricted origins at all.
      if (allowed.length === 0) return { state: "ok" };

      const url = new URL(window.location.href);
      if (allowed.some((entry) => covers(entry, url))) return { state: "ok" };

      return { state: "blocked", origin: url.origin, allowed };
    } catch {
      return { state: "ok" };
    }
  })();

  return cached;
}
