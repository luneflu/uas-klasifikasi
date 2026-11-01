<script lang="ts">
	import { appState } from '$lib/state/app.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { mode, toggleMode } from 'mode-watcher';
	import DatabaseIcon from '@lucide/svelte/icons/database';
	import CpuIcon from '@lucide/svelte/icons/cpu';
	import AwardIcon from '@lucide/svelte/icons/award';
	import BarChart3Icon from '@lucide/svelte/icons/chart-bar';
	import SunIcon from '@lucide/svelte/icons/sun';
	import MoonIcon from '@lucide/svelte/icons/moon';

	const navItems = [
		{ id: 'data', label: '1. Data', icon: DatabaseIcon },
		{ id: 'klasifikasi', label: '2. Proses Klasifikasi', icon: CpuIcon },
		{ id: 'hasil', label: '3. Hasil & Prediksi', icon: AwardIcon },
		{ id: 'grafik', label: '4. Grafik', icon: BarChart3Icon }
	] as const;
</script>

<header class="border-b border-border bg-card text-card-foreground sticky top-0 z-50 shadow-xs">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
		<div class="flex items-center justify-between h-16">
			<!-- Title & Topic -->
			<div class="flex items-center gap-3">
				<div class="size-9 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow-inner">
					DM
				</div>
				<div>
					<h1 class="text-base font-semibold leading-tight tracking-tight text-foreground">
						Data Mining — Player Engagement
					</h1>
					<p class="text-xs text-muted-foreground">
						Gaussian & Categorical Naive Bayes vs KNN
					</p>
				</div>
			</div>

			<!-- Status Badges & Mode Toggle -->
			<div class="flex items-center gap-2">
				<div class="hidden md:flex items-center gap-2">
					<Badge variant="outline" class="border-border text-muted-foreground">
						Dataset: {appState.totalRows} baris
					</Badge>
					<Badge
						variant="outline"
						class={appState.isTrained
							? 'border-emerald-600/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
							: 'border-amber-600/40 bg-amber-500/10 text-amber-600 dark:text-amber-400'}
					>
						{appState.isTrained
							? `Model: ${appState.algorithm === 'naive_bayes' ? 'Naive Bayes' : `KNN (K=${appState.knnK})`}`
							: 'Belum Dilatih'}
					</Badge>
				</div>

				<Button
					variant="ghost"
					size="sm"
					onclick={toggleMode}
					class="size-8 p-0 text-muted-foreground hover:text-foreground cursor-pointer"
					aria-label="Ganti Tema Gelap / Terang"
				>
					{#if mode.current === 'dark'}
						<SunIcon class="size-4" />
					{:else}
						<MoonIcon class="size-4" />
					{/if}
				</Button>
			</div>
		</div>

		<!-- Academic Tab Navigation Bar -->
		<nav class="flex border-t border-border -mb-px overflow-x-auto">
			{#each navItems as item}
				{@const Icon = item.icon}
				{@const isActive = appState.activeTab === item.id}
				<button
					type="button"
					onclick={() => appState.activeTab = item.id}
					class="flex items-center gap-2 py-3 px-4 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap transition-colors {isActive
						? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-muted/40 font-semibold'
						: 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'}"
				>
					<Icon class="size-4" />
					<span>{item.label}</span>
				</button>
			{/each}
		</nav>
	</div>
</header>
