"use client";

import { useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { activePresenceSessionId } from "@/lib/presence/session";

// Keep one foreground lease per tab. Convex already pushes query updates.
const HEARTBEAT_INTERVAL_MS = 40_000;
const HEARTBEAT_MIN_LOCAL_MS = 25_000;

export function PresenceHeartbeat() {
  const profile = useQuery(api.profiles.getMine);
  const heartbeat = useMutation(api.activity.heartbeat);
  const endSession = useMutation(api.activity.endSession);
  const enabled = Boolean(profile?.presencePreferences.onlineStatus || profile?.presencePreferences.lastSeen);

  useEffect(() => {
    if (!enabled || !profile?._id) return;
    const sessionId = activePresenceSessionId();
    let active = false;
    let lastPulseAt = 0;
    function stop() {
      if (!active) return;
      active = false;
      lastPulseAt = 0;
      // Best effort: a force-closed tab may not deliver this; the lease expires.
      void endSession({ sessionId }).catch(() => {});
    }
    function heartbeatIfVisible() {
      if (document.visibilityState !== "visible" || !navigator.onLine) return;
      const now = Date.now();
      if (active && now - lastPulseAt < HEARTBEAT_MIN_LOCAL_MS) return;
      active = true;
      lastPulseAt = now;
      void heartbeat({ sessionId }).catch(() => {});
    }
    function visibilityChanged() {
      if (document.visibilityState === "visible") heartbeatIfVisible();
      else stop();
    }
    heartbeatIfVisible();
    const interval = window.setInterval(heartbeatIfVisible, HEARTBEAT_INTERVAL_MS);
    document.addEventListener("visibilitychange", visibilityChanged);
    window.addEventListener("focus", heartbeatIfVisible);
    window.addEventListener("online", heartbeatIfVisible);
    window.addEventListener("pagehide", stop);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", visibilityChanged);
      window.removeEventListener("focus", heartbeatIfVisible);
      window.removeEventListener("online", heartbeatIfVisible);
      window.removeEventListener("pagehide", stop);
      stop();
    };
  }, [enabled, heartbeat, endSession, profile?._id]);
  return null;
}
