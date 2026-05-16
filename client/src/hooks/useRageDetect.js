/**
 * Detects user frustration via two signals:
 *   1. Rage taps — N+ taps within a short window on the same element/screen
 *   2. Repeated invalid input — the same field set to an invalid value twice
 *
 * Returns { containerProps, markInvalidField, dismiss }
 *   - spread `containerProps` onto the root container div
 *   - call `markInvalidField(fieldId)` whenever a field is found invalid
 *   - call `dismiss()` to reset after the popup is handled
 */

import { useCallback, useRef } from 'react';

const RAGE_TAP_COUNT = 5;   // taps needed to trigger
const RAGE_TAP_WINDOW = 900; // ms window
const INVALID_FIELD_THRESHOLD = 2; // times same field invalid before trigger

export function useRageDetect({ onFrustrated } = {}) {
  const tapTimestamps = useRef([]);
  const invalidFieldCounts = useRef({});
  const firedRef = useRef(false);

  const fire = useCallback(() => {
    if (firedRef.current) return;
    firedRef.current = true;
    onFrustrated?.();
    // auto-reset after 8s so it can trigger again if needed
    setTimeout(() => { firedRef.current = false; }, 8000);
  }, [onFrustrated]);

  const handleTap = useCallback(() => {
    const now = Date.now();
    tapTimestamps.current.push(now);
    // keep only taps within the window
    tapTimestamps.current = tapTimestamps.current.filter((t) => now - t <= RAGE_TAP_WINDOW);
    if (tapTimestamps.current.length >= RAGE_TAP_COUNT) {
      tapTimestamps.current = [];
      fire();
    }
  }, [fire]);

  /** Call this whenever a field value is rejected as invalid. */
  const markInvalidField = useCallback((fieldId) => {
    if (!fieldId) return;
    const count = (invalidFieldCounts.current[fieldId] || 0) + 1;
    invalidFieldCounts.current[fieldId] = count;
    if (count >= INVALID_FIELD_THRESHOLD) {
      invalidFieldCounts.current[fieldId] = 0;
      fire();
    }
  }, [fire]);

  /** Reset after the help prompt is handled. */
  const dismiss = useCallback(() => {
    firedRef.current = false;
    tapTimestamps.current = [];
    invalidFieldCounts.current = {};
  }, []);

  const containerProps = {
    onPointerDown: handleTap,
  };

  return { containerProps, markInvalidField, dismiss };
}
