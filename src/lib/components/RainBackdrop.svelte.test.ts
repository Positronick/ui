import { render } from 'vitest-browser-svelte';
import { createRawSnippet } from 'svelte';
import { describe, expect, test } from 'vitest';
import ThemedHarness from '../../test-support/ThemedHarness.svelte';
import RainBackdrop from './RainBackdrop.svelte';

const body = createRawSnippet(() => ({
	render: () => `<p data-testid="rain-body">IT'S RAINING</p>`
}));

function canvas(): HTMLCanvasElement {
	const el = document.querySelector<HTMLCanvasElement>('.pn-rain-backdrop__canvas');
	if (!el) throw new Error('.pn-rain-backdrop__canvas not found');
	return el;
}

function layer(): HTMLElement {
	const el = document.querySelector<HTMLElement>('.pn-rain-backdrop__layer');
	if (!el) throw new Error('.pn-rain-backdrop__layer not found');
	return el;
}

/** True once the animation has painted anything onto the (transparent) canvas. */
function hasInk(): boolean {
	const c = canvas();
	if (c.width === 0 || c.height === 0) return false;
	const ctx = c.getContext('2d');
	if (!ctx) return false;
	const data = ctx.getImageData(0, 0, c.width, c.height).data;
	for (let i = 3; i < data.length; i += 4) if (data[i] > 0) return true;
	return false;
}

/** Finds a painted pixel and reports whether it is light (white ink) or dark (black ink). */
function inkShade(): 'light' | 'dark' | null {
	const c = canvas();
	const ctx = c.getContext('2d');
	if (!ctx) return null;
	const data = ctx.getImageData(0, 0, c.width, c.height).data;
	for (let i = 0; i < data.length; i += 4) {
		if (data[i + 3] > 50) return data[i] > 200 ? 'light' : data[i] < 60 ? 'dark' : null;
	}
	return null;
}

describe('RainBackdrop', () => {
	test('renders content above the rain layer, layer is decorative and non-interactive', async () => {
		const screen = render(ThemedHarness, {
			theme: 'machine',
			Comp: RainBackdrop,
			componentProps: { children: body }
		});
		await expect.element(screen.getByTestId('rain-body')).toBeInTheDocument();
		expect(document.querySelector('.pn-rain-backdrop__content')).not.toBeNull();
		expect(layer().getAttribute('aria-hidden')).toBe('true');
		expect(getComputedStyle(layer()).pointerEvents).toBe('none');
	});

	test('fills the viewport (does not collapse to content height)', () => {
		render(ThemedHarness, {
			theme: 'machine',
			Comp: RainBackdrop,
			componentProps: { children: body }
		});
		const root = document.querySelector<HTMLElement>('.pn-rain-backdrop');
		if (!root) throw new Error('.pn-rain-backdrop not found');
		expect(root.getBoundingClientRect().height).toBeGreaterThanOrEqual(window.innerHeight);
	});

	test('sizes the canvas backing store to the layer at (capped) devicePixelRatio', async () => {
		render(ThemedHarness, {
			theme: 'machine',
			Comp: RainBackdrop,
			componentProps: { children: body }
		});
		const dpr = Math.min(window.devicePixelRatio || 1, 2);
		await expect.poll(() => canvas().width).toBe(Math.round(layer().clientWidth * dpr));
		expect(canvas().height).toBe(Math.round(layer().clientHeight * dpr));
	});

	test('rain animates: frames are painted and change over time', async () => {
		render(ThemedHarness, {
			theme: 'machine',
			Comp: RainBackdrop,
			componentProps: { children: body, intensity: 1 }
		});
		await expect.poll(hasInk, { timeout: 3000 }).toBe(true);
		const first = canvas().toDataURL();
		await expect.poll(() => canvas().toDataURL() !== first, { timeout: 3000 }).toBe(true);
	});

	test('rain uses the theme ink: white on The Machine, recolors to black when the theme flips', async () => {
		render(ThemedHarness, {
			theme: 'machine',
			Comp: RainBackdrop,
			// High speed exercises bottom impacts (splash bursts) while we watch colors.
			componentProps: { children: body, intensity: 1, speed: 3 }
		});
		await expect.poll(() => inkShade(), { timeout: 3000 }).toBe('light');
		// ThemeProvider swaps data-theme in place (no remount) — the rain must follow.
		document.querySelector('.pn-root')?.setAttribute('data-theme', 'samaritan');
		await expect.poll(() => inkShade(), { timeout: 3000 }).toBe('dark');
	});

	test('intensity 0 paints no rain', async () => {
		render(ThemedHarness, {
			theme: 'machine',
			Comp: RainBackdrop,
			componentProps: { children: body, intensity: 0 }
		});
		const dpr = Math.min(window.devicePixelRatio || 1, 2);
		await expect.poll(() => canvas().width).toBe(Math.round(layer().clientWidth * dpr));
		// Give the loop a few frames, then confirm the canvas is still blank.
		await new Promise((r) => setTimeout(r, 200));
		expect(hasInk()).toBe(false);
	});

	test('edge props render and animate without error', async () => {
		render(ThemedHarness, {
			theme: 'samaritan',
			Comp: RainBackdrop,
			componentProps: { children: body, intensity: 1, accentRatio: 1, speed: 5, splash: false }
		});
		await expect.poll(hasInk, { timeout: 3000 }).toBe(true);
	});
});
