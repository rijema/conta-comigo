"use client";

import { useEffect } from "react";

/**
 * Touch browsers (iPad/Android tablets) do not fire HTML5 drag events
 * (dragstart/dragover/drop) from a finger, so minigames built on the native
 * `draggable` API were unusable on tablets. This polyfill translates touch
 * gestures into those drag events. dnd-kit components are unaffected because
 * they don't use the `draggable` attribute.
 */
export function TouchDragPolyfill() {
  useEffect(() => {
    if (typeof document === "undefined" || !("ontouchstart" in document)) return;
    void import("drag-drop-touch");
  }, []);

  return null;
}
