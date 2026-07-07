import { vi, describe, test, expect, beforeEach } from 'vitest';

// Control the reduced-motion preference the helper reads. `vi.hoisted` builds
// the stub before the (hoisted) mock factory runs so we can flip `.current`
// per test.
const { state } = vi.hoisted(() => ({ state: { current: false } }));
vi.mock('./reducedMotion.js', () => ({ reducedMotion: state }));

import { motionSafe } from './motion.js';

describe('motionSafe', () => {
	beforeEach(() => {
		state.current = false;
	});

	test('passes transition params through unchanged when motion is allowed', () => {
		const params = { y: -8, duration: 300 };
		expect(motionSafe(params)).toBe(params);
	});

	test('collapses to an instant cut under reduced motion — no leftover offsets', () => {
		state.current = true;
		// The whole point: a partial gate (zeroing duration but keeping `y`) would
		// still animate position. motionSafe must drop everything but duration: 0.
		expect(motionSafe({ y: -8, duration: 300 })).toEqual({ duration: 0 });
	});
});
