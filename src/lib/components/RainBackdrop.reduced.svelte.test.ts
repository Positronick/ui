import { vi } from 'vitest';

// Force the reduced-motion branch: a single static frame, no animation loop.
vi.mock('../actions/reducedMotion.js', () => ({ reducedMotion: { current: true } }));

import { render } from 'vitest-browser-svelte';
import { createRawSnippet } from 'svelte';
import { describe, expect, test } from 'vitest';
import ThemedHarness from '../../test-support/ThemedHarness.svelte';
import RainBackdrop from './RainBackdrop.svelte';

const body = createRawSnippet(() => ({
	render: () => `<p data-testid="rain-body">STILL</p>`
}));

function canvas(): HTMLCanvasElement {
	const el = document.querySelector<HTMLCanvasElement>('.pn-rain-backdrop__canvas');
	if (!el) throw new Error('.pn-rain-backdrop__canvas not found');
	return el;
}

function hasInk(): boolean {
	const c = canvas();
	if (c.width === 0 || c.height === 0) return false;
	const ctx = c.getContext('2d');
	if (!ctx) return false;
	const data = ctx.getImageData(0, 0, c.width, c.height).data;
	for (let i = 3; i < data.length; i += 4) if (data[i] > 0) return true;
	return false;
}

describe('RainBackdrop (reduced motion)', () => {
	test('paints a single static frame that never changes', async () => {
		render(ThemedHarness, {
			theme: 'machine',
			Comp: RainBackdrop,
			componentProps: { children: body, intensity: 1 }
		});
		await expect.poll(hasInk, { timeout: 3000 }).toBe(true);
		const frame = canvas().toDataURL();
		// If the rAF loop were running, drops would have moved well within 250ms.
		await new Promise((r) => setTimeout(r, 250));
		expect(canvas().toDataURL()).toBe(frame);
	});
});
