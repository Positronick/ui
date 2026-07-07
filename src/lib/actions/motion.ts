import { reducedMotion } from './reducedMotion.js';

/** Every Svelte transition params object accepts an optional `duration` (ms). */
type MotionParams = { duration?: number };

/**
 * Gate a Svelte transition's params on `prefers-reduced-motion`.
 *
 * Returns `{ duration: 0 }` (an instant cut — no travel, no fade) when the user
 * has requested reduced motion, otherwise `params` unchanged. This keeps the
 * reduced-motion contract in one place instead of each animated component
 * re-deriving `reducedMotion.current ? { duration: 0 } : …` (and risking a
 * partial gate, e.g. zeroing `duration` but leaving a `y` offset).
 *
 * Call inside a `$derived` so it re-runs when the preference changes:
 *
 * ```svelte
 * const params = $derived(motionSafe({ y: -8, duration: 300 }));
 * // <div in:fly={params} …>
 * ```
 */
export function motionSafe<T extends MotionParams>(params: T): T | { duration: 0 } {
	return reducedMotion.current ? { duration: 0 } : params;
}
