// Shared "elastic edge" physics for card content: when a scrollable area is
// pulled past its top or bottom edge, content gives a little and springs back
// once the finger lifts. One set of constants/helpers for the whole app so
// every screen feels the same — nothing here is tuned per screen or device.

/** Raw drag distance (px) considered a "full" pull before the effect maxes out. */
export const ELASTIC_PULL_CAP = 90;

/** Fraction of the raw drag distance that becomes felt resistance (rubber-band). */
export const ELASTIC_RESISTANCE = 0.55;

/** Max extra scale at a full pull — kept small so long lists never look distorted. */
export const ELASTIC_MAX_SCALE = 0.014;

/** Spring-back duration/easing, matching the rest of the app's motion language. */
export const ELASTIC_SNAP_MS = 220;
export const ELASTIC_SNAP_EASE = 'cubic-bezier(0.16, 1, 0.3, 1)';

/** Minimum raw drag (px) before we commit to treating this as an edge pull. */
export const ELASTIC_ENGAGE_THRESHOLD = 6;

/**
 * Converts a raw vertical drag distance into a damped 0..1 progress value,
 * with diminishing returns near the cap (a real rubber band gets stiffer).
 */
export function elasticProgress(rawDelta: number): number {
  const damped = Math.min(Math.abs(rawDelta) * ELASTIC_RESISTANCE, ELASTIC_PULL_CAP);
  return damped / ELASTIC_PULL_CAP;
}

/** Progress (0..1) -> a CSS scale() value for the stretched content. */
export function elasticScaleFor(progress: number): number {
  return 1 + Math.min(Math.max(progress, 0), 1) * ELASTIC_MAX_SCALE;
}
