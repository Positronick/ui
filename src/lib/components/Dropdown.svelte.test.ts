import { render } from 'vitest-browser-svelte';
import { describe, expect, test } from 'vitest';
import ThemedHarness from '../../test-support/ThemedHarness.svelte';
import Dropdown from './Dropdown.svelte';

const options = [
	{ value: 'svelte', label: 'Svelte' },
	{ value: 'react', label: 'React' }
];

const props = (value: string | null = null) => ({ value, options, label: 'Framework' });

describe('Dropdown', () => {
	test('is a collapsed disclosure trigger with no menu shown', () => {
		render(ThemedHarness, { theme: 'machine', Comp: Dropdown, componentProps: props() });
		const trigger = document.querySelector('.pn-dropdown .pn-chip') as HTMLElement;
		// Honest disclosure: the popup contains plain buttons, not menuitems, so the
		// trigger must not claim aria-haspopup="menu".
		expect(trigger.getAttribute('aria-haspopup')).toBeNull();
		expect(trigger.getAttribute('aria-expanded')).toBe('false');
		expect(trigger.getAttribute('aria-controls')).toBeNull();
		expect(document.querySelector('.pn-dropdown__menu')).toBeNull();
	});

	test('opens the menu on trigger click', async () => {
		const screen = render(ThemedHarness, {
			theme: 'machine',
			Comp: Dropdown,
			componentProps: props()
		});
		await screen.getByRole('button', { name: 'Framework' }).click();
		await expect.poll(() => document.querySelector('.pn-dropdown__menu')).not.toBeNull();
		expect(
			(document.querySelector('.pn-dropdown .pn-chip') as HTMLElement).getAttribute('aria-expanded')
		).toBe('true');
	});

	test('selecting an option sets the value and closes', async () => {
		const screen = render(ThemedHarness, {
			theme: 'machine',
			Comp: Dropdown,
			componentProps: props()
		});
		await screen.getByRole('button', { name: 'Framework' }).click();
		await screen.getByRole('button', { name: 'Svelte' }).click();
		await expect.poll(() => document.querySelector('.pn-dropdown__menu')).toBeNull();
		const trigger = document.querySelector('.pn-dropdown .pn-chip') as HTMLElement;
		expect(trigger.textContent).toContain('Svelte');
		expect(trigger.getAttribute('data-active')).toBe('true'); // a value is held
	});

	test('closes on outside click', async () => {
		const screen = render(ThemedHarness, {
			theme: 'machine',
			Comp: Dropdown,
			componentProps: props()
		});
		await screen.getByRole('button', { name: 'Framework' }).click();
		await expect.poll(() => document.querySelector('.pn-dropdown__menu')).not.toBeNull();
		document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));
		await expect.poll(() => document.querySelector('.pn-dropdown__menu')).toBeNull();
	});

	test('closes on Escape', async () => {
		const screen = render(ThemedHarness, {
			theme: 'machine',
			Comp: Dropdown,
			componentProps: props()
		});
		await screen.getByRole('button', { name: 'Framework' }).click();
		await expect.poll(() => document.querySelector('.pn-dropdown__menu')).not.toBeNull();
		window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
		await expect.poll(() => document.querySelector('.pn-dropdown__menu')).toBeNull();
	});

	test('the open trigger is wired to the menu via aria-controls', async () => {
		const screen = render(ThemedHarness, {
			theme: 'machine',
			Comp: Dropdown,
			componentProps: props()
		});
		await screen.getByRole('button', { name: 'Framework' }).click();
		await expect.poll(() => document.querySelector('.pn-dropdown__menu')).not.toBeNull();
		const trigger = document.querySelector('.pn-dropdown .pn-chip') as HTMLElement;
		const menu = document.querySelector('.pn-dropdown__menu') as HTMLElement;
		expect(menu.id).not.toBe('');
		expect(trigger.getAttribute('aria-controls')).toBe(menu.id);
	});

	test('focuses the first option on open', async () => {
		const screen = render(ThemedHarness, {
			theme: 'machine',
			Comp: Dropdown,
			componentProps: props()
		});
		await screen.getByRole('button', { name: 'Framework' }).click();
		// Keyboard users land in the popup, not stranded on the trigger.
		await expect
			.poll(() => (document.activeElement as HTMLElement | null)?.className)
			.toContain('pn-dropdown__item');
	});

	test('Escape returns focus to the trigger', async () => {
		const screen = render(ThemedHarness, {
			theme: 'machine',
			Comp: Dropdown,
			componentProps: props()
		});
		await screen.getByRole('button', { name: 'Framework' }).click();
		await expect.poll(() => document.querySelector('.pn-dropdown__menu')).not.toBeNull();
		window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
		await expect.poll(() => document.querySelector('.pn-dropdown__menu')).toBeNull();
		expect(document.activeElement).toBe(document.querySelector('.pn-dropdown .pn-chip'));
	});

	test('selecting an option returns focus to the trigger', async () => {
		const screen = render(ThemedHarness, {
			theme: 'machine',
			Comp: Dropdown,
			componentProps: props()
		});
		await screen.getByRole('button', { name: 'Framework' }).click();
		await screen.getByRole('button', { name: 'Svelte' }).click();
		await expect.poll(() => document.querySelector('.pn-dropdown__menu')).toBeNull();
		expect(document.activeElement).toBe(document.querySelector('.pn-dropdown .pn-chip'));
	});

	test('defaults to right-aligned (align="end"), unchanged from prior behaviour', async () => {
		const screen = render(ThemedHarness, {
			theme: 'machine',
			Comp: Dropdown,
			componentProps: props()
		});
		await screen.getByRole('button', { name: 'Framework' }).click();
		// Right-aligned: the menu's right edge sits flush with the trigger's right edge,
		// so the menu grows LEFTWARD from the trigger.
		const trigger = document.querySelector('.pn-dropdown .pn-chip') as HTMLElement;
		const menu = document.querySelector('.pn-dropdown__menu') as HTMLElement;
		expect(menu.getBoundingClientRect().right).toBeCloseTo(
			trigger.getBoundingClientRect().right,
			0
		);
	});

	test('align="start" opens the menu from the left edge, not the right', async () => {
		const screen = render(ThemedHarness, {
			theme: 'machine',
			Comp: Dropdown,
			componentProps: { ...props(), align: 'start' }
		});
		await screen.getByRole('button', { name: 'Framework' }).click();
		// Left-aligned: the menu's left edge sits flush with the trigger's left edge,
		// so the menu grows RIGHTWARD from the trigger — reachable inside a scroll
		// container that clips inline-start overflow (see brand.css consumer note).
		const trigger = document.querySelector('.pn-dropdown .pn-chip') as HTMLElement;
		const menu = document.querySelector('.pn-dropdown__menu') as HTMLElement;
		expect(menu.getBoundingClientRect().left).toBeCloseTo(trigger.getBoundingClientRect().left, 0);
	});
});
