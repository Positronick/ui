import { render } from 'vitest-browser-svelte';
import { createRawSnippet } from 'svelte';
import { describe, expect, test } from 'vitest';
import ThemedHarness from '../../test-support/ThemedHarness.svelte';
import Dialog from './Dialog.svelte';

const body = createRawSnippet(() => ({ render: () => `<p>Designation: POI-2187</p>` }));

describe('Dialog', () => {
	test('opens modally and is labelled by its title', async () => {
		const screen = render(ThemedHarness, {
			theme: 'machine',
			Comp: Dialog,
			componentProps: { open: true, title: 'Subject dossier', children: body }
		});
		const el = document.querySelector('dialog.pn-dialog') as HTMLDialogElement;
		expect(el.open).toBe(true);
		await expect
			.element(screen.getByRole('dialog', { name: 'Subject dossier' }))
			.toBeInTheDocument();
	});

	test('Escape/close reports onclose and flips open to false', async () => {
		let closed = 0;
		render(ThemedHarness, {
			theme: 'machine',
			Comp: Dialog,
			componentProps: { open: true, title: 'T', onclose: () => (closed += 1), children: body }
		});
		const el = document.querySelector('dialog.pn-dialog') as HTMLDialogElement;
		el.close(); // native close — same path Escape takes
		await expect.poll(() => closed).toBe(1);
		expect(el.open).toBe(false);
	});

	test('clicking the backdrop closes it and reports onclose exactly once', async () => {
		let closed = 0;
		render(ThemedHarness, {
			theme: 'machine',
			Comp: Dialog,
			componentProps: { open: true, title: 'T', onclose: () => (closed += 1), children: body }
		});
		const el = document.querySelector('dialog.pn-dialog') as HTMLDialogElement;
		el.dispatchEvent(new MouseEvent('click', { bubbles: true })); // target === dialog
		await expect.poll(() => el.open).toBe(false);
		// Wait for any queued $effect to flush, then assert onclose did NOT re-fire
		// (regression guard: backdrop click used to fire onclose twice).
		await new Promise((r) => setTimeout(r, 50));
		expect(closed).toBe(1);
	});

	// Focus save/restore lives in the shared useModalDialog controller (Dialog and
	// Sheet both delegate to it), so pinning it via one overlay guards both — the
	// a11y branches the dedup exists to protect.
	//
	// The close path below locks the end-to-end contract, but note Chromium's native
	// modal-<dialog> already returns focus to the opener on close(), so it also passes
	// if the helper's own restore is removed. The teardown test is the one that
	// isolates helper-only logic: on unmount-while-open the native `close` never fires,
	// so *only* the $effect cleanup can restore focus.
	test('restores focus to the opener when it closes', async () => {
		const opener = document.createElement('button');
		document.body.appendChild(opener);
		opener.focus();
		expect(document.activeElement).toBe(opener); // captured as previouslyFocused on open

		render(ThemedHarness, {
			theme: 'machine',
			Comp: Dialog,
			componentProps: { open: true, title: 'T', children: body }
		});
		const el = document.querySelector('dialog.pn-dialog') as HTMLDialogElement;
		expect(el.open).toBe(true); // showModal() moved focus into the dialog

		el.close(); // native close — same path Escape/backdrop take
		await expect.poll(() => document.activeElement).toBe(opener);

		opener.remove();
	});

	test('restores focus when unmounted while still open (teardown branch)', async () => {
		const opener = document.createElement('button');
		document.body.appendChild(opener);
		opener.focus();
		expect(document.activeElement).toBe(opener);

		const { unmount } = render(ThemedHarness, {
			theme: 'machine',
			Comp: Dialog,
			componentProps: { open: true, title: 'T', children: body }
		});
		const el = document.querySelector('dialog.pn-dialog') as HTMLDialogElement;
		expect(el.open).toBe(true); // still open — native `close` never fires on teardown

		await unmount(); // $effect cleanup restores focus in lieu of handleClose
		await expect.poll(() => document.activeElement).toBe(opener);

		opener.remove();
	});

	test('a titleless dialog is named by aria-label', async () => {
		const screen = render(ThemedHarness, {
			theme: 'machine',
			Comp: Dialog,
			componentProps: { open: true, 'aria-label': 'Subject dossier', children: body }
		});
		await expect
			.element(screen.getByRole('dialog', { name: 'Subject dossier' }))
			.toBeInTheDocument();
	});

	test('exposes the overlay token on the theme root', () => {
		render(ThemedHarness, {
			theme: 'machine',
			Comp: Dialog,
			componentProps: { open: true, title: 'T', children: body }
		});
		const root = document.querySelector('.pn-root') as HTMLElement;
		expect(getComputedStyle(root).getPropertyValue('--pn-overlay-bg').trim()).toBe(
			'rgba(0, 0, 0, 0.7)'
		);
	});

	test('inverts to the opposite theme polarity by default', () => {
		render(ThemedHarness, {
			theme: 'machine',
			Comp: Dialog,
			componentProps: { open: true, title: 'T', children: body }
		});
		expect(document.querySelector('dialog.pn-dialog')!.getAttribute('data-theme')).toBe(
			'samaritan'
		);
	});

	test('invert={false} keeps the surrounding theme', () => {
		render(ThemedHarness, {
			theme: 'machine',
			Comp: Dialog,
			componentProps: { open: true, invert: false, title: 'T', children: body }
		});
		expect(document.querySelector('dialog.pn-dialog')!.getAttribute('data-theme')).toBeNull();
	});

	test('outside a ThemeProvider it mounts with no inversion (no crash)', () => {
		render(Dialog, { open: true, title: 'T', children: body });
		expect(document.querySelector('dialog.pn-dialog')!.getAttribute('data-theme')).toBeNull();
	});

	// --- Focus save/restore (owned by useModalDialog, shared with Sheet) ---
	// Pinned here per POS-75: the a11y-critical focus logic was centralized so a
	// future fix can't land in one component and not the other — that guarantee
	// only holds if the centralized behavior is test-pinned. Render closed and open
	// via rerender so the controller captures a real opener as document.activeElement
	// (rendering open from the start would capture <body>, not an opener).

	test('restores focus to the opener when closed', async () => {
		const opener = document.createElement('button');
		document.body.appendChild(opener);
		opener.focus();
		expect(document.activeElement).toBe(opener);

		const screen = render(Dialog, { open: false, title: 'T', children: body });
		await screen.rerender({ open: true, title: 'T', children: body });

		const el = document.querySelector('dialog.pn-dialog') as HTMLDialogElement;
		await expect.poll(() => el.open).toBe(true);
		// showModal() pulls focus into the top layer, off the opener…
		expect(document.activeElement).not.toBe(opener);

		el.close(); // native close — the single dismissal path
		// …and the close handler returns focus to whoever opened the overlay.
		await expect.poll(() => document.activeElement).toBe(opener);
		opener.remove();
	});

	test('restores focus on teardown while still open (native close never fires)', async () => {
		const opener = document.createElement('button');
		document.body.appendChild(opener);
		opener.focus();

		const screen = render(Dialog, { open: false, title: 'T', children: body });
		await screen.rerender({ open: true, title: 'T', children: body });

		const el = document.querySelector('dialog.pn-dialog') as HTMLDialogElement;
		await expect.poll(() => el.open).toBe(true);
		expect(document.activeElement).not.toBe(opener);

		// Unmounting an open <dialog> never fires the native `close` event, so focus
		// restore must come from the $effect cleanup branch — assert it still runs.
		await screen.unmount();
		await expect.poll(() => document.activeElement).toBe(opener);
		opener.remove();
	});

	// Polarity inversion alone is the dialog's figure-ground cue — no neon glow,
	// even when the inverted surface is Machine-themed.
	test('no glow in either polarity', () => {
		for (const theme of ['samaritan', 'machine'] as const) {
			render(ThemedHarness, {
				theme,
				Comp: Dialog,
				componentProps: { open: true, title: 'T', children: body }
			});
			expect(getComputedStyle(document.querySelector('.pn-dialog') as HTMLElement).boxShadow).toBe(
				'none'
			);
			document.querySelector('.pn-root')?.remove();
		}
	});
});
