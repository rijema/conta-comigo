"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Press-and-hold activation for actions an accidental touch should not
 * trigger (GAIA G28, gaia.wiki.br/interacao-com-tela-sensivel-ao-toque).
 *
 * - Touch / mouse: the action runs only after holding for `durationMs`.
 *   Releasing earlier, or moving the finger (a scroll), cancels it and sets
 *   `hint` so the screen can say "segure para trocar".
 * - Keyboard (Enter / Space produce a click with `detail === 0`) activates
 *   immediately: holding is a pointer safeguard, not a barrier for keyboard
 *   or switch users (WCAG 2.1.1).
 * - With `enabled: false` it behaves like a normal button.
 */
export function useHoldToActivate({
  enabled,
  onActivate,
  durationMs = 600,
  disabled = false,
}: {
  enabled: boolean;
  onActivate: () => void;
  durationMs?: number;
  disabled?: boolean;
}) {
  const [holding, setHolding] = useState(false);
  const [hint, setHint] = useState(false);
  const timer = useRef<number | null>(null);
  const start = useRef<{ x: number; y: number } | null>(null);
  const firedByHold = useRef(false);

  const cancel = useCallback(() => {
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = null;
    start.current = null;
    setHolding(false);
  }, []);

  useEffect(() => cancel, [cancel]);
  useEffect(() => {
    if (!hint) return;
    const t = window.setTimeout(() => setHint(false), 2500);
    return () => window.clearTimeout(t);
  }, [hint]);

  const onPointerDown = (event: React.PointerEvent) => {
    if (!enabled || disabled || event.button !== 0) return;
    firedByHold.current = false;
    start.current = { x: event.clientX, y: event.clientY };
    setHint(false);
    setHolding(true);
    timer.current = window.setTimeout(() => {
      timer.current = null;
      firedByHold.current = true;
      setHolding(false);
      onActivate();
    }, durationMs);
  };

  const onPointerMove = (event: React.PointerEvent) => {
    if (!start.current) return;
    if (Math.hypot(event.clientX - start.current.x, event.clientY - start.current.y) > 10) cancel();
  };

  const onPointerUp = () => {
    if (timer.current !== null) setHint(true); // released too early
    cancel();
  };

  const onClick = (event: React.MouseEvent) => {
    if (disabled) return;
    if (!enabled || event.detail === 0) { onActivate(); return; } // normal button or keyboard
    // Pointer clicks are handled by the hold timer above.
    event.preventDefault();
    firedByHold.current = false;
  };

  return {
    holding,
    hint,
    durationMs,
    handlers: { onPointerDown, onPointerMove, onPointerUp, onPointerLeave: cancel, onPointerCancel: cancel, onClick, onContextMenu: (e: React.MouseEvent) => { if (enabled) e.preventDefault(); } },
  };
}
