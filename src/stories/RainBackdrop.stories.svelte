<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import {
		ThemeProvider,
		RainBackdrop,
		StatusRow,
		DesignationTag,
		ThemeToggle
	} from '$lib/index.js';

	const { Story } = defineMeta({
		title: 'Components/RainBackdrop',
		component: RainBackdrop,
		tags: ['autodocs'],
		// Render edge-to-edge: RainBackdrop is a page-level wrapper that fills the viewport.
		parameters: { layout: 'fullscreen' },
		argTypes: {
			intensity: {
				control: { type: 'range', min: 0, max: 1, step: 0.05 },
				description: 'Rain amount, 0–1'
			},
			accentRatio: {
				control: { type: 'range', min: 0, max: 0.2, step: 0.01 },
				description: 'Fraction of drops tinted accent red'
			},
			speed: {
				control: { type: 'range', min: 0.25, max: 3, step: 0.25 },
				description: 'Fall-speed multiplier'
			},
			splash: {
				control: 'boolean',
				description: 'Impact particles at the bottom edge'
			}
		},
		args: { intensity: 0.5, accentRatio: 0.03, speed: 1, splash: true }
	});
</script>

{#snippet content()}
	<div style="padding: 3rem; display: grid; gap: 1rem; max-width: 420px;">
		<DesignationTag label="New York, NY" />
		<StatusRow label="Weather" value="RAIN" />
		<StatusRow label="Surveillance" value="ACTIVE" />
	</div>
{/snippet}

<Story name="The Machine" asChild>
	<ThemeProvider theme="machine">
		<RainBackdrop>{@render content()}</RainBackdrop>
	</ThemeProvider>
</Story>

<Story name="Samaritan" asChild>
	<ThemeProvider theme="samaritan">
		<RainBackdrop>{@render content()}</RainBackdrop>
	</ThemeProvider>
</Story>

<!-- Live controls for the rain; the in-page toggle flips the theme without a
     remount, showing the rain recolor (white ink ↔ black ink) on the fly. -->
<Story name="Playground">
	{#snippet template(args)}
		<ThemeProvider theme="machine">
			<RainBackdrop
				intensity={args.intensity}
				accentRatio={args.accentRatio}
				speed={args.speed}
				splash={args.splash}
			>
				<div style="padding: 3rem 3rem 0;"><ThemeToggle /></div>
				{@render content()}
			</RainBackdrop>
		</ThemeProvider>
	{/snippet}
</Story>
