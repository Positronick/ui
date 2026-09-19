<script lang="ts" generics="T extends string">
	import { tick } from 'svelte';
	import Chip from './Chip.svelte';

	interface Props {
		/** Selected value, or null for "no filter" (two-way bindable). */
		value: T | null;
		/** Selectable options. */
		options: { value: T; label: string }[];
		/** Trigger label (e.g. "Framework"). */
		label: string;
		/** Accessible name for the trigger (defaults to `label`). */
		ariaLabel?: string;
		/** Menu edge alignment relative to the trigger. `'end'` (default) grows the
		 *  menu leftward from the trigger's right edge — the original behaviour.
		 *  `'start'` grows it rightward from the trigger's left edge, for triggers
		 *  near a container's right-hand clip edge. */
		align?: 'start' | 'end';
		/** Extra class(es) forwarded to the wrapper. */
		class?: string;
	}

	let {
		value = $bindable(),
		options,
		label,
		ariaLabel,
		align = 'end',
		class: className = ''
	}: Props = $props();

	let open = $state(false);
	let root = $state<HTMLDivElement>();
	const menuId = $props.id();

	const selectedLabel = $derived(options.find((o) => o.value === value)?.label);

	const trigger = () => root?.querySelector<HTMLButtonElement>('button.pn-chip');

	// Honest disclosure focus contract: focus lands on the first option when the
	// popup opens, and returns to the trigger on keyboard close or selection.
	async function toggle() {
		open = !open;
		if (open) {
			await tick();
			root?.querySelector<HTMLElement>('.pn-dropdown__item')?.focus();
		}
	}

	function choose(v: T | null) {
		value = v;
		open = false;
		trigger()?.focus();
	}

	$effect(() => {
		if (!open) return;
		const onPointer = (e: MouseEvent) => {
			if (root && !root.contains(e.target as Node)) open = false;
		};
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				open = false;
				trigger()?.focus();
			}
		};
		// Capture phase so an outside click closes before other handlers run.
		window.addEventListener('click', onPointer, true);
		window.addEventListener('keydown', onKey);
		return () => {
			window.removeEventListener('click', onPointer, true);
			window.removeEventListener('keydown', onKey);
		};
	});
</script>

<div class="pn-dropdown {className}" bind:this={root}>
	<Chip
		pressed={value !== null}
		expanded={open}
		ariaControls={open ? menuId : undefined}
		ariaLabel={ariaLabel ?? label}
		onclick={toggle}
	>
		{label}{#if selectedLabel}: {selectedLabel}{/if}<span
			class="pn-dropdown__caret"
			aria-hidden="true">▾</span
		>
	</Chip>

	{#if open}
		<div class="pn-dropdown__menu" class:pn-dropdown__menu--start={align === 'start'} id={menuId}>
			<button
				type="button"
				class="pn-dropdown__item"
				data-active={value === null || undefined}
				onclick={() => choose(null)}
			>
				All
			</button>
			{#each options as o (o.value)}
				<button
					type="button"
					class="pn-dropdown__item"
					data-active={value === o.value || undefined}
					onclick={() => choose(o.value)}
				>
					{o.label}
				</button>
			{/each}
		</div>
	{/if}
</div>

<style>
	.pn-dropdown {
		position: relative;
		display: inline-flex;
	}
	.pn-dropdown__caret {
		font-size: 0.85em;
	}
	.pn-dropdown__menu {
		position: absolute;
		top: calc(100% + var(--pn-space-1));
		right: 0;
		z-index: 50;
		min-width: 9rem;
		display: flex;
		flex-direction: column;
		background: var(--pn-surface-base);
		border: var(--pn-hairline-width) solid var(--pn-line);
		border-radius: var(--pn-radius);
	}
	.pn-dropdown__menu--start {
		left: 0;
		right: auto;
	}
	.pn-dropdown__item {
		padding: var(--pn-space-2) var(--pn-space-3);
		background: transparent;
		color: var(--pn-ink);
		border: none;
		text-align: left;
		font-family: var(--pn-font-display);
		font-size: var(--pn-font-size-1);
		text-transform: uppercase;
		letter-spacing: var(--pn-tracking-display);
		cursor: pointer;
		transition:
			color 0.12s var(--pn-ease),
			background 0.12s var(--pn-ease);
	}
	.pn-dropdown__item:not(:first-child) {
		border-top: var(--pn-hairline-width) solid var(--pn-line);
	}
	.pn-dropdown__item:hover {
		color: var(--pn-accent);
	}
	.pn-dropdown__item[data-active] {
		color: var(--pn-surface-base);
		background: var(--pn-accent);
	}
	.pn-dropdown__item:focus-visible {
		outline: none;
		box-shadow: var(--pn-focus-ring);
	}

	@media (prefers-reduced-motion: reduce) {
		.pn-dropdown__item {
			transition: none;
		}
	}
</style>
