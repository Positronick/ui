<script lang="ts">
	import type { Snippet } from 'svelte';
	import { reducedMotion } from '../actions/reducedMotion.js';

	interface Props {
		/**
		 * Page content rendered above the rain.
		 *
		 * Page-level: a drop-in alternative to `<Backdrop>` — wrap your whole app
		 * in a single `<RainBackdrop>` (inside a `<ThemeProvider>`). It fills the
		 * viewport and animates falling rain behind everything; the "ground" where
		 * drops splash is the bottom of the (scrollable) page.
		 */
		children: Snippet;
		/** Rain amount, 0–1 (clamped). 0 disables the rain entirely. */
		intensity?: number;
		/** Fraction of drops tinted with the theme accent red, 0–1 (clamped). 0 disables. */
		accentRatio?: number;
		/** Fall-speed multiplier (floored at 0.05 — use `intensity={0}` to disable the rain). */
		speed?: number;
		/** Burst of impact particles when a drop hits the bottom edge. */
		splash?: boolean;
	}

	let { children, intensity = 0.5, accentRatio = 0.03, speed = 1, splash = true }: Props = $props();

	let wrapper: HTMLDivElement;
	let canvas: HTMLCanvasElement;

	interface Drop {
		x: number;
		y: number;
		vy: number;
		len: number;
		w: number;
		alpha: number;
		accent: boolean;
	}

	interface Particle {
		x: number;
		y: number;
		vx: number;
		vy: number;
		life: number;
		ttl: number;
		accent: boolean;
	}

	const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

	$effect(() => {
		// Read every reactive input up front so any change restarts the effect.
		const density = clamp01(intensity);
		const accents = clamp01(accentRatio);
		const fall = Math.max(0.05, speed);
		const bursts = splash;
		const reduced = reducedMotion.current;

		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		let w = 0;
		let h = 0;
		let inkColor = '#fff';
		let accentColor = '#f00';

		const readColors = () => {
			const cs = getComputedStyle(wrapper);
			inkColor = cs.getPropertyValue('--pn-ink').trim() || '#fff';
			accentColor = cs.getPropertyValue('--pn-accent').trim() || '#f00';
		};

		const drops: Drop[] = [];
		// Fixed pool with a rotating cursor: emitting overwrites the oldest particle,
		// so impacts never allocate mid-frame.
		const particles: Particle[] = Array.from({ length: 200 }, () => ({
			x: 0,
			y: 0,
			vx: 0,
			vy: 0,
			life: 0,
			ttl: 1,
			accent: false
		}));
		let cursor = 0;

		const spawn = (d: Drop, initial: boolean) => {
			// v0 is the pre-multiplier speed; length and alpha derive from it so the
			// depth illusion (faster = longer + brighter) holds at any `speed`.
			const v0 = 700 + Math.random() * 700;
			d.x = Math.random() * w;
			d.y = initial ? Math.random() * h : -10 - Math.random() * 30;
			d.vy = v0 * fall;
			d.len = 10 + ((v0 - 700) / 700) * 18;
			d.w = Math.random() < 0.15 ? 2 : 1;
			d.alpha = 0.25 + ((v0 - 700) / 700) * 0.5;
			d.accent = Math.random() < accents;
		};

		// Capped: on a very tall page an uncapped count would simulate and stroke
		// thousands of drops per frame, ~all of them outside the visible viewport.
		const targetCount = () => Math.min(Math.round(((w * h) / 10_000) * 2.4 * density), 1500);

		const retarget = () => {
			const target = targetCount();
			while (drops.length < target) {
				const d = {} as Drop;
				spawn(d, true);
				drops.push(d);
			}
			drops.length = Math.min(drops.length, target);
			for (const d of drops) if (d.x > w) d.x = Math.random() * w;
		};

		const resize = () => {
			w = wrapper.clientWidth;
			h = wrapper.clientHeight;
			// Bound the backing store, not just the DPR: the layer spans the full page
			// height, and browsers silently draw NOTHING past per-dimension canvas
			// limits (~32k physical px) — while memory grows with area long before
			// that. On very tall pages the rain degrades in resolution instead of
			// vanishing. (2x DPR cap: 3x buys nothing visible on 1px streaks.)
			const scale = Math.min(
				window.devicePixelRatio || 1,
				2,
				16_384 / Math.max(w, 1),
				16_384 / Math.max(h, 1),
				Math.sqrt(48_000_000 / Math.max(w * h, 1))
			);
			canvas.width = Math.max(1, Math.round(w * scale));
			canvas.height = Math.max(1, Math.round(h * scale));
			// Setting width/height wiped all context state — restore it.
			ctx.setTransform(scale, 0, 0, scale, 0, 0);
			ctx.lineCap = 'round';
			retarget();
		};

		const emit = (x: number, accent: boolean) => {
			const n = 3 + Math.floor(Math.random() * 4);
			for (let i = 0; i < n; i += 1) {
				const p = particles[cursor];
				cursor = (cursor + 1) % particles.length;
				p.x = x;
				p.y = h;
				p.vx = (Math.random() - 0.5) * 160;
				p.vy = -(60 + Math.random() * 140);
				p.ttl = 0.3 + Math.random() * 0.15;
				p.life = p.ttl;
				p.accent = accent;
			}
		};

		const drawDrop = (d: Drop, alphaScale: number) => {
			ctx.globalAlpha = (d.accent ? 0.9 : d.alpha) * alphaScale;
			ctx.strokeStyle = d.accent ? accentColor : inkColor;
			ctx.lineWidth = d.w;
			ctx.beginPath();
			ctx.moveTo(d.x, d.y - d.len);
			ctx.lineTo(d.x, d.y);
			ctx.stroke();
		};

		// Reduced motion: a sparse frozen frame instead of the animation.
		const drawStatic = () => {
			ctx.clearRect(0, 0, w, h);
			for (let i = 0; i < drops.length; i += 7) drawDrop(drops[i], 0.5);
			ctx.globalAlpha = 1;
		};

		const frame = (now: number) => {
			// Clamp dt: ≤50ms so a background-tab wakeup doesn't teleport every drop,
			// ≥0 because the first vsync-aligned rAF timestamp can precede the
			// performance.now() captured when the loop started.
			const dt = Math.min(Math.max(now - prev, 0) / 1000, 0.05);
			prev = now;
			ctx.clearRect(0, 0, w, h);
			for (const d of drops) {
				d.y += d.vy * dt;
				if (d.y - d.len > h) {
					if (bursts) emit(d.x, d.accent);
					spawn(d, false);
					continue;
				}
				drawDrop(d, 1);
			}
			for (const p of particles) {
				if (p.life <= 0) continue;
				p.life -= dt;
				p.vy += 900 * dt;
				p.x += p.vx * dt;
				p.y += p.vy * dt;
				if (p.life <= 0) continue;
				ctx.globalAlpha = (p.life / p.ttl) * 0.9;
				ctx.strokeStyle = p.accent ? accentColor : inkColor;
				ctx.lineWidth = 1;
				ctx.beginPath();
				ctx.moveTo(p.x, p.y);
				// Short tail against the velocity — reads as flying spray.
				ctx.lineTo(p.x - p.vx * 0.016, p.y - p.vy * 0.016);
				ctx.stroke();
			}
			ctx.globalAlpha = 1;
			raf = requestAnimationFrame(frame);
		};

		readColors();
		resize();

		// Observe the wrapper: its height tracks page content, not just the viewport.
		const ro = new ResizeObserver(() => {
			resize();
			if (reduced) drawStatic();
		});
		ro.observe(wrapper);

		// ThemeProvider swaps data-theme in place (no remount) — re-read the ink and
		// accent when it does, instead of paying getComputedStyle every frame.
		const themeRoot = wrapper.closest('[data-theme]');
		const mo = new MutationObserver(() => {
			readColors();
			if (reduced) drawStatic();
		});
		if (themeRoot) mo.observe(themeRoot, { attributes: true, attributeFilter: ['data-theme'] });

		let raf = 0;
		let prev = performance.now();
		if (reduced) {
			drawStatic();
		} else {
			raf = requestAnimationFrame(frame);
		}

		return () => {
			cancelAnimationFrame(raf);
			ro.disconnect();
			mo.disconnect();
		};
	});
</script>

<div class="pn-rain-backdrop" bind:this={wrapper}>
	<div class="pn-rain-backdrop__layer" aria-hidden="true">
		<canvas class="pn-rain-backdrop__canvas" bind:this={canvas}></canvas>
	</div>
	<div class="pn-rain-backdrop__content">{@render children()}</div>
</div>

<style>
	.pn-rain-backdrop {
		position: relative;
		/* Own stacking context so the __layer/__content z-indexes (0/1) stay scoped
		   here and never compete with app chrome (portals, toasts) mounted elsewhere. */
		isolation: isolate;
		/* Fill the viewport so wrapping the whole app in one <RainBackdrop> covers
		   the page. Viewport-relative (not 100%) so it works regardless of ancestor
		   height — .pn-root has none. Grows past the viewport with tall content;
		   the absolute __layer then extends the rain down the full page. */
		min-height: 100vh; /* fallback for UAs without dvh support */
		min-height: 100dvh;
		width: 100%;
		background-color: var(--pn-surface-base);
		color: var(--pn-ink);
	}

	.pn-rain-backdrop__layer {
		position: absolute;
		inset: 0;
		overflow: hidden;
		pointer-events: none;
		z-index: 0;
	}

	.pn-rain-backdrop__canvas {
		display: block;
		width: 100%;
		height: 100%;
	}

	.pn-rain-backdrop__content {
		position: relative;
		z-index: 1;
	}
</style>
