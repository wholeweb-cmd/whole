import { useEffect } from "react";

import { checkPrivyOrigin } from "@/lib/web3/privyOrigin";

/**
 * Logs a one-line explanation when Privy will reject wallet logins from the
 * current origin.
 *
 * Privy's own modal reports this as "Could not log in with wallet - please try
 * connecting again", which points at the wallet rather than at the allow-list
 * that actually caused it. Console only: the failure is a deployment/config
 * mistake for whoever ships the app, not something to put in a user's face.
 */
export function usePrivyOriginWarning() {
  useEffect(() => {
    let cancelled = false;

    checkPrivyOrigin().then((result) => {
      if (cancelled) return;

      if (result.state === "blocked") {
        console.error(
          `[WHOLE] Privy will reject wallet logins from ${result.origin}.\n` +
            `Registered origins: ${result.allowed.join(", ")}.\n` +
            `Fix: Privy dashboard → your app → Settings → Clients → Allowed origins, add ${result.origin}.`,
        );
      } else if (result.state === "no-app-id") {
        console.error("[WHOLE] VITE_PRIVY_APP_ID is not set - wallet login is disabled.");
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);
}
