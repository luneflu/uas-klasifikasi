<script lang="ts">
	import { appState } from '$lib/state/app.svelte';
	import { exportToCSV, NUMERICAL_FEATURES, CATEGORICAL_FEATURES } from '$lib/data/dataset';
	import * as Card from '$lib/components/ui/card';
	import * as Table from '$lib/components/ui/table';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import UploadIcon from '@lucide/svelte/icons/upload';
	import DownloadIcon from '@lucide/svelte/icons/download';
	import RotateCcwIcon from '@lucide/svelte/icons/rotate-ccw';
	import FileTextIcon from '@lucide/svelte/icons/file-text';
	import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';

	let currentPage = $state(1);
	const pageSize = 10;
	let uploadMessage = $state<string | null>(null);
	let uploadError = $state<boolean>(false);

	const totalPages = $derived(Math.max(1, Math.ceil(appState.dataset.length / pageSize)));
	const paginatedData = $derived(
		appState.dataset.slice((currentPage - 1) * pageSize, currentPage * pageSize)
	);

	function handleFileUpload(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = (e) => {
			const text = e.target?.result as string;
			const success = appState.loadCustomData(text);
			if (success) {
				uploadMessage = `Berhasil mengimpor ${appState.totalRows} baris data!`;
				uploadError = false;
				currentPage = 1;
			} else {
				uploadMessage = 'Format CSV tidak valid atau kolom EngagementLevel hilang.';
				uploadError = true;
			}
			setTimeout(() => (uploadMessage = null), 4000);
		};
		reader.readAsText(file);
	}

	function downloadCSV() {
		const csv = exportToCSV(appState.dataset);
		const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = 'gaming_engagement_dataset.csv';
		a.click();
		URL.revokeObjectURL(url);
	}

	function resetData() {
		appState.resetDefaultData();
		currentPage = 1;
		uploadMessage = 'Dataset default berhasil dipulihkan.';
		uploadError = false;
		setTimeout(() => (uploadMessage = null), 3000);
	}
</script>

<div class="flex flex-col gap-6">
	<!-- Summary Cards -->
	<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
		<Card.Root>
			<Card.Header class="pb-2">
				<Card.Description>Total Sampel</Card.Description>
				<Card.Title class="text-2xl font-bold text-foreground">{appState.totalRows}</Card.Title>
			</Card.Header>
			<Card.Content>
				<p class="text-xs text-muted-foreground">Baris observasi pemain game</p>
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Header class="pb-2">
				<Card.Description>Jumlah Fitur</Card.Description>
				<Card.Title class="text-2xl font-bold text-foreground">11 Fitur</Card.Title>
			</Card.Header>
			<Card.Content>
				<p class="text-xs text-muted-foreground">7 Numerik &bull; 4 Kategorikal</p>
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Header class="pb-2">
				<Card.Description>Distribusi Kelas Target</Card.Description>
				<Card.Title class="text-sm font-semibold flex items-center gap-2 pt-1">
					<span class="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded text-xs border border-emerald-500/20">
						L: {appState.classDistribution.Low}
					</span>
					<span class="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded text-xs border border-amber-500/20">
						M: {appState.classDistribution.Medium}
					</span>
					<span class="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded text-xs border border-indigo-500/20">
						H: {appState.classDistribution.High}
					</span>
				</Card.Title>
			</Card.Header>
			<Card.Content>
				<p class="text-xs text-muted-foreground">EngagementLevel (Low / Med / High)</p>
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Header class="pb-2">
				<Card.Description>Aksi Data</Card.Description>
				<Card.Title class="flex items-center gap-2 pt-1">
					<Button variant="outline" size="sm" onclick={downloadCSV} class="h-8 text-xs">
						<DownloadIcon class="size-3.5" data-icon="inline-start" />
						Export
					</Button>
					<Button variant="outline" size="sm" onclick={resetData} class="h-8 text-xs">
						<RotateCcwIcon class="size-3.5" data-icon="inline-start" />
						Reset
					</Button>
				</Card.Title>
			</Card.Header>
			<Card.Content>
				<label class="inline-flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 cursor-pointer font-medium">
					<UploadIcon class="size-3" />
					<span>Upload CSV Baru</span>
					<input type="file" accept=".csv" onchange={handleFileUpload} class="hidden" />
				</label>
			</Card.Content>
		</Card.Root>
	</div>

	<!-- Upload feedback banner -->
	{#if uploadMessage}
		<div
			class="p-3 text-sm rounded-lg border {uploadError
				? 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'
				: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'}"
		>
			{uploadMessage}
		</div>
	{/if}

	<!-- Paginated Data Table -->
	<Card.Root>
		<Card.Header class="flex flex-row items-center justify-between">
			<div>
				<Card.Title class="text-lg">Pratinjau Dataset Pemain</Card.Title>
				<Card.Description>
					Menampilkan baris {(currentPage - 1) * pageSize + 1} &ndash; {Math.min(
						currentPage * pageSize,
						appState.totalRows
					)} dari {appState.totalRows} data
				</Card.Description>
			</div>

			<!-- Pagination Nav -->
			<div class="flex items-center gap-2">
				<Button
					variant="outline"
					size="sm"
					disabled={currentPage <= 1}
					onclick={() => (currentPage = Math.max(1, currentPage - 1))}
				>
					<ChevronLeftIcon class="size-4" />
				</Button>
				<span class="text-xs text-muted-foreground font-medium">
					Hal {currentPage} / {totalPages}
				</span>
				<Button
					variant="outline"
					size="sm"
					disabled={currentPage >= totalPages}
					onclick={() => (currentPage = Math.min(totalPages, currentPage + 1))}
				>
					<ChevronRightIcon class="size-4" />
				</Button>
			</div>
		</Card.Header>

		<Card.Content class="p-0 overflow-x-auto">
			<Table.Root>
				<Table.Header class="bg-muted/50 border-y">
					<Table.Row>
						<Table.Head class="w-20 font-semibold">ID</Table.Head>
						<Table.Head class="font-semibold">Age</Table.Head>
						<Table.Head class="font-semibold">PlayTime (Jam)</Table.Head>
						<Table.Head class="font-semibold">Purchases</Table.Head>
						<Table.Head class="font-semibold">Sesi/Mgg</Table.Head>
						<Table.Head class="font-semibold">Durasi (Mnt)</Table.Head>
						<Table.Head class="font-semibold">Level</Table.Head>
						<Table.Head class="font-semibold">Achiev.</Table.Head>
						<Table.Head class="font-semibold">Gender</Table.Head>
						<Table.Head class="font-semibold">Location</Table.Head>
						<Table.Head class="font-semibold">Genre</Table.Head>
						<Table.Head class="font-semibold">Difficulty</Table.Head>
						<Table.Head class="font-semibold">Target</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each paginatedData as row}
						<Table.Row class="hover:bg-muted/40 transition-colors">
							<Table.Cell class="font-mono text-xs text-muted-foreground">{row.PlayerID}</Table.Cell>
							<Table.Cell class="text-xs">{row.Age}</Table.Cell>
							<Table.Cell class="text-xs font-medium">{row.PlayTimeHours}h</Table.Cell>
							<Table.Cell class="text-xs">{row.InGamePurchases === 1 ? 'Ya (1)' : 'Tidak (0)'}</Table.Cell>
							<Table.Cell class="text-xs">{row.SessionsPerWeek}</Table.Cell>
							<Table.Cell class="text-xs">{row.AvgSessionDurationMinutes}m</Table.Cell>
							<Table.Cell class="text-xs font-medium">{row.PlayerLevel}</Table.Cell>
							<Table.Cell class="text-xs">{row.AchievementsUnlocked}</Table.Cell>
							<Table.Cell class="text-xs">{row.Gender}</Table.Cell>
							<Table.Cell class="text-xs">{row.Location}</Table.Cell>
							<Table.Cell class="text-xs">{row.GameGenre}</Table.Cell>
							<Table.Cell class="text-xs">{row.GameDifficulty}</Table.Cell>
							<Table.Cell>
								{#if row.EngagementLevel === 'Low'}
									<Badge variant="outline" class="border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400">Low</Badge>
								{:else if row.EngagementLevel === 'Medium'}
									<Badge variant="outline" class="border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400">Medium</Badge>
								{:else}
									<Badge variant="outline" class="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">High</Badge>
								{/if}
							</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		</Card.Content>
	</Card.Root>
</div>
