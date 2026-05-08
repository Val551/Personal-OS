"use client";

import { useEffect } from "react";
import { updateTimezoneAction } from "@/app/actions/profile";

/**
 * Detects the user's IANA timezone via the browser's Intl API and persists it
 * the first time it's missing. Used by Phase 6's recap-reminder + any other
 * user-local timing.
 */
export function TimezoneSync({ currentTimezone }: { currentTimezone: string | null }) {
  useEffect(() => {
    if (currentTimezone) return;
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz) updateTimezoneAction(tz);
    } catch {
      // ignore — older browsers may not expose timeZone
    }
  }, [currentTimezone]);

  return null;
}
