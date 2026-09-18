"use client";

import { useSwipeGesture } from "@/lib/useSwipeGesture";
import { drawerState } from "@/lib/drawerState";

export function SwipeHandler() {
  useSwipeGesture({
    onSwipeRight: () => drawerState.open(),   // swipe right from left edge → open drawer
    onSwipeLeft:  () => drawerState.close(),  // swipe left anywhere → close drawer
    edgeOnly: false, // right open is guarded by edgeOnly logic inside hook
    edgeWidth: 32,
    threshold: 55,
  });
  return null;
}
