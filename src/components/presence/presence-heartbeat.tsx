"use client";

import { useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

const HEARTBEAT_INTERVAL_MS = 30_000;

/** One foreground-only lease for the whole app, shared by Classic and Cozy.
 * A background tab never signs out another tab; the server expires leases. */
export function PresenceHeartbeat() {
  const profile = useQuery(api.profiles.getMine);
  const heartbeat = useMutation(api.activity.heartbeat);
  const enabled = Boolean(profile?.presencePreferences.onlineStatus || profile?.presencePreferences.lastSeen);

  useEffect(() => {
    if (!enabled || !profile?._id) return;
    function pulse() {
      if (document.visibilityState !== "visible" || !navigator.onLine) return;
      void heartbeat({}).catch(() => { /* offline/revoked session: lease simply expires */ });
    }
    pulse();
    const interval = window.setInterval(pulse, HEARTBEAT_INTERVAL_MS);
    document.addEventListener("visibilitychange", pulse);
    window.addEventListener("focus", pulse);
    window.addEventListener("online", pulse);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", pulse);
      window.removeEventListener("focus", pulse);
      window.removeEventListener("online", pulse);
    };
  }, [enabled, heartbeat, profile?._id]);
  return null;
}
