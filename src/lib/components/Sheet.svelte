<script lang="ts">
	import type { Snippet } from 'svelte';
	import { useOverlayTheme } from '../theme/context.js';
	import { useModalDialog } from '../actions/modalDialog.svelte.js';

	interface Props {
		/** Open state (two-way bindable). */
		open?: boolean;
		/** Render in the opposite theme polarity (machine ↔ samaritan) for contrast
		 *  against the page. No-op outside a <ThemeProvider>. Default true. */
		invert?: boolean;
		/** Edge the sheet slides in from. */
		side?: 'left' | 'right';
		/** Optional title; when set it labels the sheet (aria-labelledby). */
		title?: string;
		/** Accessible name when no `title` is rendered (e.g. a custom header). */
		'aria-label'?: string;
		/** Called after the sheet closes (Escape, backdrop click, or open=false). */
		onclose?: () => void;
		/** Sheet body. */
		children: Snippet;
		/** Extra class(es) forwarded to the <dialog>. */
		class?: string;
	}

	let {
		open = $bindable(false),
		invert = true,
		side = 'right',
		title,
		'aria-label': ariaLabel,
		onclose,
		children,
		class: className = ''
	}: Props = $props();

	const overlayTheme = useOverlayTheme(() => invert);

	const titleId = $props.id();
	let dialog = $state<HTMLDialogElement | null>(null);

	// Native modal wiring (showModal/close, single-dismissal `close` event, focus
	// save/restore) is shared with <Dialog> — see useModalDialog.
	const { handleClose } = useModalDialog({
		dialog: () => dialog,
		open: () => open,
		setOpen: (v) => (open = v),
		onclose: () => onclose
	});
</script>

<dialog
	bind:this={dialog}
	class="pn-sheet {className}"
	data-theme={overlayTheme.current}
	data-side={side}
	aria-modal="true"
	aria-labelledby={title ? titleId : undefined}
	aria-label={title ? undefined : ariaLabel}
	onclose={handleClose}
	onclick={(e) => {
		// Close natively so the `close` event is the single dismissal path.
		if (e.target === dialog) dialog?.close();
	}}
>
	<div class="pn-sheet__content">
		{#if title}
			<h2 id={titleId} class="pn-sheet__title">{title}</h2>
		{/if}
		{@render children()}
	</div>
</dialog>

<style>
	.pn-sheet {
		margin: 0;
		width: min(90vw, 24rem);
		max-width: 90vw;
		height: 100dvh;
		max-height: 100dvh;
		padding: 0;
		background: var(--pn-surface-base);
		color: var(--pn-ink);
		border: 0;
		border-radius: var(--pn-radius);
	}
	.pn-sheet[data-side='right'] {
		margin-left: auto;
		border-left: var(--pn-hairline-width) solid var(--pn-line);
	}
	.pn-sheet[data-side='left'] {
		margin-right: auto;
		border-right: var(--pn-hairline-width) solid var(--pn-line);
	}
	.pn-sheet::backdrop {
		background: var(--pn-overlay-bg, rgba(0, 0, 0, 0.7));
	}
	.pn-sheet__content {
		height: 100%;
		overflow-y: auto;
		padding: var(--pn-space-5);
	}
	.pn-sheet__title {
		margin: 0 0 var(--pn-space-4);
		color: var(--pn-accent);
		font-family: var(--pn-font-mono);
		font-size: var(--pn-font-size-1);
		text-transform: uppercase;
		letter-spacing: var(--pn-tracking-display);
	}

	/* Slide-in via @starting-style (Chromium); degrades to an instant show elsewhere. */
	.pn-sheet[open] {
		transform: translateX(0);
		transition: transform 0.3s var(--pn-ease);
	}
	@starting-style {
		.pn-sheet[data-side='right'][open] {
			transform: translateX(100%);
		}
		.pn-sheet[data-side='left'][open] {
			transform: translateX(-100%);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.pn-sheet[open] {
			transition: none;
		}
	}
</style>
