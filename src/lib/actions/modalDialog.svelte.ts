/**
 * Shared controller for the native modal `<dialog>` overlays (Dialog, Sheet).
 *
 * Drives a `<dialog>` imperatively from a two-way `open` binding: `showModal()`
 * reflects it into the top layer with a focus trap + inert background, and every
 * dismissal path (Escape, backdrop click, `open=false`) routes through the native
 * `close` event so `handleClose` fires exactly once. Also saves the previously
 * focused element on open and restores it on close or on teardown-while-open
 * (where the native `close` event never fires).
 *
 * Params are getters so the caller stays the single source of truth (mirrors the
 * `useOverlayTheme(invert)` convention). Call during component init.
 */
export function useModalDialog(opts: {
	/** The bound `<dialog>` element, or null before mount. */
	dialog: () => HTMLDialogElement | null;
	/** Current open state. */
	open: () => boolean;
	/** Sync the two-way `open` binding back to the caller. */
	setOpen: (value: boolean) => void;
	/** Optional close callback, read lazily so a late-bound prop is honored. */
	onclose: () => (() => void) | undefined;
}): { handleClose: () => void } {
	let previouslyFocused: HTMLElement | null = null;

	// Never set the `open` attribute in markup; showModal()/close() are the only
	// drivers so the native `close` event stays the single dismissal path.
	$effect(() => {
		const d = opts.dialog();
		if (!d) return;
		if (opts.open() && !d.open) {
			previouslyFocused = document.activeElement as HTMLElement | null;
			d.showModal();
		} else if (!opts.open() && d.open) {
			d.close();
		}
	});

	// If unmounted while still open, the native `close` event never fires, so
	// handleClose() never runs — restore focus on teardown so it isn't stranded
	// on a now-removed element.
	$effect(() => () => {
		if (previouslyFocused?.isConnected) previouslyFocused.focus({ preventScroll: true });
	});

	// The single source of truth for closing is the native `close` event; sync the
	// binding, notify, and restore focus.
	function handleClose() {
		opts.setOpen(false);
		opts.onclose()?.();
		if (previouslyFocused?.isConnected) previouslyFocused.focus({ preventScroll: true });
		previouslyFocused = null;
	}

	return { handleClose };
}
