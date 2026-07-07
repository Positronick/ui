<script lang="ts">
	import type { Snippet } from 'svelte';
	import { fly, fade } from 'svelte/transition';
	import { reducedMotion } from '../actions/reducedMotion.js';
	import { motionSafe } from '../actions/motion.js';
	import { useOverlayTheme } from '../theme/context.js';
	import { store, remove, type ToastItem } from '../toast/store.svelte.js';

	interface Props {
		/** Render toasts in the opposite theme polarity (machine ↔ samaritan) for
		 *  contrast against the page. Requires the Toaster to be mounted inside a
		 *  <ThemeProvider>; otherwise it no-ops. Default true. */
		invert?: boolean;
		/** Override the close-button icon (defaults to ×). */
		closeIcon?: Snippet;
		/** Override the per-level icon; receives the toast level. */
		icon?: Snippet<[ToastItem['level']]>;
		/** Extra class(es) forwarded to the container. */
		class?: string;
	}

	let { invert = true, closeIcon, icon, class: className = '' }: Props = $props();

	const overlayTheme = useOverlayTheme(() => invert);

	// Motion is opt-out under prefers-reduced-motion.
	const inParams = $derived(motionSafe({ y: -8, duration: 300 }));
	const outParams = $derived(motionSafe({ duration: 300 }));

	// Decorative default glyphs so level is not signalled by color alone (WCAG 1.4.1).
	const glyphs: Record<ToastItem['level'], string> = {
		info: 'i',
		success: '✓',
		warning: '!',
		error: '✕'
	};
</script>

<!-- The container is a persistent polite live region: toasts inserted into a
     region that already exists are announced reliably, whereas a freshly inserted
     role="status" node is not. Errors additionally carry role="alert" so they
     interrupt assertively. -->
<div class="pn-toaster {className}" data-theme={overlayTheme.current} aria-live="polite">
	{#each store.items as item (item.id)}
		<div
			class="pn-toast"
			data-level={item.level}
			role={item.level === 'error' ? 'alert' : undefined}
			aria-atomic="true"
			in:fly={inParams}
			out:fade={outParams}
		>
			<span class="pn-toast__icon" aria-hidden="true">
				{#if icon}{@render icon(item.level)}{:else}{glyphs[item.level]}{/if}
			</span>
			<span class="pn-toast__message">{item.message}</span>
			<button
				class="pn-toast__close"
				type="button"
				aria-label="Dismiss"
				onclick={() => remove(item.id)}
			>
				{#if closeIcon}{@render closeIcon()}{:else}×{/if}
			</button>
			{#if item.duration > 0 && !reducedMotion.current}
				<span
					class="pn-toast__progress"
					style:animation-duration="{item.duration}ms"
					aria-hidden="true"
				></span>
			{/if}
		</div>
	{/each}
</div>

<style>
	.pn-toaster {
		position: fixed;
		top: var(--pn-space-4);
		left: 50%;
		transform: translateX(-50%);
		z-index: 1000;
		display: flex;
		flex-direction: column;
		gap: var(--pn-space-2);
		width: max-content;
		max-width: min(90vw, 28rem);
		pointer-events: none;
	}

	.pn-toast {
		--pn-toast-accent: var(--pn-status-info);
		position: relative;
		overflow: hidden;
		display: flex;
		align-items: flex-start;
		gap: var(--pn-space-2);
		padding: var(--pn-space-2) var(--pn-space-3);
		background: var(--pn-surface-base);
		color: var(--pn-ink);
		border: var(--pn-hairline-width) solid var(--pn-toast-accent);
		border-left-width: 3px;
		border-radius: var(--pn-radius);
		font-size: var(--pn-font-size-2);
		pointer-events: auto;
	}
	.pn-toast[data-level='success'] {
		--pn-toast-accent: var(--pn-status-success);
	}
	.pn-toast[data-level='warning'] {
		--pn-toast-accent: var(--pn-status-warning);
	}
	.pn-toast[data-level='error'] {
		--pn-toast-accent: var(--pn-status-error);
	}

	.pn-toast__icon {
		flex-shrink: 0;
		color: var(--pn-toast-accent);
		font-family: var(--pn-font-mono);
		font-weight: 700;
		line-height: 1.4;
	}
	.pn-toast__message {
		flex: 1;
	}
	.pn-toast__close {
		flex-shrink: 0;
		padding: 0 var(--pn-space-1);
		background: transparent;
		border: 0;
		color: var(--pn-ink-dim);
		font-family: var(--pn-font-mono);
		font-size: var(--pn-font-size-3);
		line-height: 1;
		cursor: pointer;
	}
	.pn-toast__close:hover {
		color: var(--pn-ink);
	}
	.pn-toast__close:focus-visible {
		outline: none;
		box-shadow: var(--pn-focus-ring);
	}

	.pn-toast__progress {
		position: absolute;
		left: 0;
		bottom: 0;
		width: 100%;
		height: 2px;
		background: var(--pn-toast-accent);
		transform-origin: left;
		animation: pn-toast-shrink linear forwards;
	}
	@keyframes pn-toast-shrink {
		from {
			transform: scaleX(1);
		}
		to {
			transform: scaleX(0);
		}
	}
	/* The progress bar isn't rendered at all under reduced motion (gated in JS),
	   so no @media override is needed here. */
</style>
