<script lang="ts">
	import type { Snippet } from 'svelte';
	import { useOverlayTheme } from '../theme/context.js';
	import { useModalDialog } from '../actions/modalDialog.svelte.js';

	interface Props {
		/** Open state (two-way bindable). */
		open?: boolean;
		/** Render in the opposite theme polarity (machine ↔ samaritan) for contrast
		 *  against the page — the UI is flat, so polarity is its depth cue. No-op
		 *  outside a <ThemeProvider>. A dialog nested inside another overlay's content
		 *  still inverts relative to the app theme (never double-inverts); pass
		 *  `invert={false}` to match the surroundings instead. Default true. */
		invert?: boolean;
		/** Optional title; when set it labels the dialog (aria-labelledby). */
		title?: string;
		/** Accessible name when no `title` is rendered (e.g. a custom header). */
		'aria-label'?: string;
		/** Called after the dialog closes (Escape, backdrop click, or open=false). */
		onclose?: () => void;
		/** Dialog body. */
		children: Snippet;
		/** Extra class(es) forwarded to the <dialog>. */
		class?: string;
	}

	let {
		open = $bindable(false),
		invert = true,
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
	// save/restore) is shared with <Sheet> — see useModalDialog.
	const { handleClose } = useModalDialog({
		dialog: () => dialog,
		open: () => open,
		setOpen: (v) => (open = v),
		onclose: () => onclose
	});
</script>

<dialog
	bind:this={dialog}
	class="pn-dialog {className}"
	data-theme={overlayTheme.current}
	aria-modal="true"
	aria-labelledby={title ? titleId : undefined}
	aria-label={title ? undefined : ariaLabel}
	onclose={handleClose}
	onclick={(e) => {
		// Clicks on the dialog element itself = the backdrop region (content is a child).
		// Close natively so the `close` event stays the single dismissal path
		// (calling handleClose() directly would double-fire via the effect).
		if (e.target === dialog) dialog?.close();
	}}
>
	<div class="pn-dialog__content">
		{#if title}
			<h2 id={titleId} class="pn-dialog__title">{title}</h2>
		{/if}
		{@render children()}
	</div>
</dialog>

<style>
	.pn-dialog {
		margin: auto;
		max-width: min(90vw, 32rem);
		padding: 0;
		background: var(--pn-surface-base);
		color: var(--pn-ink);
		border: var(--pn-hairline-width) solid var(--pn-line);
		border-radius: var(--pn-radius);
	}
	/* Fallback literal covers browsers where ::backdrop doesn't inherit the custom property. */
	.pn-dialog::backdrop {
		background: var(--pn-overlay-bg, rgba(0, 0, 0, 0.7));
	}
	.pn-dialog__content {
		padding: var(--pn-space-5);
	}
	.pn-dialog__title {
		margin: 0 0 var(--pn-space-4);
		color: var(--pn-accent);
		font-family: var(--pn-font-mono);
		font-size: var(--pn-font-size-1);
		text-transform: uppercase;
		letter-spacing: var(--pn-tracking-display);
	}
</style>
