// positronick-ui — public entry point.

// Theme
export { default as ThemeProvider } from './theme/ThemeProvider.svelte';
export {
	useTheme,
	oppositeTheme,
	type PositronickTheme,
	type ThemeContext
} from './theme/context.js';
export {
	MACHINE_DESIGNATIONS,
	SAMARITAN_DESIGNATIONS,
	type Designation,
	type MachineDesignation,
	type SamaritanDesignation
} from './theme/designations.js';

// Components
export { default as Backdrop } from './components/Backdrop.svelte';
export { default as Banner } from './components/Banner.svelte';
export { default as Block } from './components/Block.svelte';
export { default as Box } from './components/Box.svelte';
export { default as Button } from './components/Button.svelte';
export { default as Card } from './components/Card.svelte';
export { default as Chip } from './components/Chip.svelte';
export { default as ChipGroup } from './components/ChipGroup.svelte';
export { default as DesignationTag } from './components/DesignationTag.svelte';
export { default as Dialog } from './components/Dialog.svelte';
export { default as Dropdown } from './components/Dropdown.svelte';
export { default as FilterToolbar } from './components/FilterToolbar.svelte';
export { default as Input } from './components/Input.svelte';
export { default as Loading } from './components/Loading.svelte';
export { default as PositronickMark } from './components/PositronickMark.svelte';
export { default as ProgressBar } from './components/ProgressBar.svelte';
export { default as Prose } from './components/Prose.svelte';
export { default as ProviderIcon } from './components/ProviderIcon.svelte';
export { default as RainBackdrop } from './components/RainBackdrop.svelte';
export { default as RecDot } from './components/RecDot.svelte';
export { default as ScrollTopButton } from './components/ScrollTopButton.svelte';
export { default as SectionNav } from './components/SectionNav.svelte';
export type { SectionNavItem } from './components/SectionNav.svelte';
export { default as SegmentedControl } from './components/SegmentedControl.svelte';
export { default as Separator } from './components/Separator.svelte';
export { default as Sheet } from './components/Sheet.svelte';
export { default as Skeleton } from './components/Skeleton.svelte';
export { default as SortControl } from './components/SortControl.svelte';
/** Sort direction used by SortControl. */
export type SortDir = 'asc' | 'desc';
export { default as StatusRow } from './components/StatusRow.svelte';
export { default as SubjectFrame } from './components/SubjectFrame.svelte';
export { default as Terminal } from './components/Terminal.svelte';
export { default as ThemeToggle } from './components/ThemeToggle.svelte';
export { default as Toaster } from './components/Toaster.svelte';
export { default as Tooltip } from './components/Tooltip.svelte';
export { default as UserAvatar } from './components/UserAvatar.svelte';
export { default as VerifiedBadge } from './components/VerifiedBadge.svelte';
export { default as Window } from './components/Window.svelte';

// Toast
export { toast, dismiss, type ToastLevel, type ToastOptions } from './toast/index.js';

// Motion
export { reducedMotion } from './actions/reducedMotion.js';
