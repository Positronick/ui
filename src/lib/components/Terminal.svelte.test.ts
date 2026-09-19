import { render } from 'vitest-browser-svelte';
import { createRawSnippet } from 'svelte';
import { describe, expect, test, vi } from 'vitest';
import ThemedHarness from '../../test-support/ThemedHarness.svelte';
import Terminal from './Terminal.svelte';

const content = createRawSnippet(() => ({
	render: () => `<span data-testid="term">ACCESS GRANTED</span>`
}));

describe('Terminal', () => {
	test('renders its content and prompt sigil', async () => {
		const screen = render(ThemedHarness, {
			theme: 'machine',
			Comp: Terminal,
			componentProps: { prompt: '$', children: content }
		});
		await expect.element(screen.getByTestId('term')).toBeInTheDocument();
		await expect.element(screen.getByText('$')).toBeInTheDocument();
	});

	test('uses a monospace font and a blinking cursor', () => {
		render(ThemedHarness, {
			theme: 'machine',
			Comp: Terminal,
			componentProps: { children: content }
		});
		const term = getComputedStyle(document.querySelector('.pn-terminal') as HTMLElement);
		expect(term.fontFamily.toLowerCase()).toContain('jetbrains mono');
		const cursor = getComputedStyle(document.querySelector('.pn-terminal__cursor') as HTMLElement);
		expect(cursor.animationName).not.toBe('none');
	});

	test('copies the command text — without the prompt sigil — to the clipboard', async () => {
		// The browser test env is a secure context, so navigator.clipboard exists; spy on it
		// (the spy auto-restores, so no global state leaks into the other tests).
		const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);

		const screen = render(ThemedHarness, {
			theme: 'machine',
			Comp: Terminal,
			componentProps: { prompt: '$', children: content }
		});
		await screen.getByRole('button', { name: 'Copy command' }).click();

		// The copy payload is the command only — the red "$" sigil must never leak in.
		await vi.waitFor(() => expect(writeText).toHaveBeenCalledWith('ACCESS GRANTED'));
		writeText.mockRestore();
	});

	test('shows no copy button when there is no command', () => {
		render(ThemedHarness, {
			theme: 'machine',
			Comp: Terminal,
			componentProps: { prompt: '$' }
		});
		expect(document.querySelector('.pn-terminal__copy')).toBeNull();
	});

	test('omits the cursor when cursor={false}', () => {
		render(ThemedHarness, {
			theme: 'machine',
			Comp: Terminal,
			componentProps: { children: content, cursor: false }
		});
		expect(document.querySelector('.pn-terminal__cursor')).toBeNull();
	});

	test('copy button is a 44x44 minimum tap target', () => {
		render(ThemedHarness, {
			theme: 'machine',
			Comp: Terminal,
			componentProps: { children: content }
		});
		const button = document.querySelector('.pn-terminal__copy') as HTMLElement;
		const rect = button.getBoundingClientRect();
		expect(rect.width).toBeGreaterThanOrEqual(44);
		expect(rect.height).toBeGreaterThanOrEqual(44);
	});

	test('copy button renders a glyph-free inline icon, never the U+29C9 tofu character', () => {
		render(ThemedHarness, {
			theme: 'machine',
			Comp: Terminal,
			componentProps: { children: content }
		});
		const button = document.querySelector('.pn-terminal__copy') as HTMLElement;
		// Fonts without U+29C9 render it as tofu; the button must carry no text glyph at all —
		// only an inline SVG icon, which inherits color via currentColor on fonts and non-fonts alike.
		expect(button.textContent).not.toContain('⧉');
		expect(button.querySelector('svg')).not.toBeNull();
	});

	test('the copied icon swaps to a check mark, still with no text glyph', async () => {
		const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);
		const screen = render(ThemedHarness, {
			theme: 'machine',
			Comp: Terminal,
			componentProps: { children: content }
		});
		const button = screen.getByRole('button', { name: 'Copy command' });
		await button.click();
		await vi.waitFor(() => expect(writeText).toHaveBeenCalled());
		const el = document.querySelector('.pn-terminal__copy[data-copied]') as HTMLElement;
		expect(el).not.toBeNull();
		expect(el.textContent?.trim()).toBe('');
		expect(el.querySelector('svg')).not.toBeNull();
		writeText.mockRestore();
	});
});
