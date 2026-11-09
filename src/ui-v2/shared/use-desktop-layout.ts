"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(min-width: 1024px)";
function subscribe(onChange: () => void) {
  const media = window.matchMedia(QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}
function snapshot() { return window.matchMedia(QUERY).matches; }

/** Same responsive boundary for Cozy windowing and the Appearance push-rail. */
export function useDesktopLayout() {
  return useSyncExternalStore(subscribe, snapshot, () => false);
}
