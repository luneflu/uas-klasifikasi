<script lang="ts">
	import { appState } from '$lib/state/app.svelte';
	import * as Card from '$lib/components/ui/card';
	import * as Table from '$lib/components/ui/table';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { toast } from 'svelte-sonner';
	import PlayIcon from '@lucide/svelte/icons/play';
	import Loader2Icon from '@lucide/svelte/icons/loader-2';
	import CheckCircle2Icon from '@lucide/svelte/icons/check-circle-2';
	import SlidersIcon from '@lucide/svelte/icons/sliders';

	let splitSelection = $state<string>('0.8');
	let kValue = $state<number>(appState.knnK);
	let isTraining = $state<boolean>(false);

	function handleSplitChange(val: string) {
		splitSelection = val;
		appState.setSplitRatio(parseFloat(val));
	}

	function handleAlgorithmChange(algo: 'naive_bayes' | 'knn') {
		appState.setAlgorithm(algo);
	}

	function handleKnnChange() {
		appState.setKnnK(kValue);
	}

	async function runTraining() {
		if (isTraining) return;
		isTraining = true;
		const algoName =
			appState.algorithm === 'naive_bayes'
				? 'Naive Bayes'
				: `KNN (K=${appState.knnK})`;
		const toastId = toast.loading(`Melatih model ${algoName}...`);

		// Brief delay for UI render feedback
		await new Promise((r) => setTimeout(r, 450));

		try {
			appState.trainModel();
			const acc = appState.metrics?.accuracy.toFixed(1) ?? '0';
			toast.success(`Model ${algoName} selesai dilatih! Akurasi: ${acc}%`, {
				id: toastId,
				description: `${appState.split.train.length} data latih & ${appState.split.test.length} data uji.`
			});
		} catch {
			toast.error('Gagal melatih model klasifikasi.', { id: toastId });
		} finally {
			isTraining = false;
		}
	}
</script>

<div class="flex flex-col gap-6">
	<!-- Training Configuration Card -->
	<Card.Root>
		<Card.Header>
			<div class="flex items-center gap-2">
				<SlidersIcon class="size-5 text-indigo-600" />
				<Card.Title>Konfigurasi Model & Pembagian Data</Card.Title>
			</div>
			<Card.Description>
				Tentukan algoritma machine learning, rasio data latih/uji, lalu lakukan proses pelatihan.
			</Card.Description>
		</Card.Header>

		<Card.Content class="grid grid-cols-1 md:grid-cols-3 gap-6">
			<!-- Algorithm Selector -->
			<div class="flex flex-col gap-2">
				<span class="text-sm font-medium text-foreground">1. Pilih Algoritma</span>
				<div class="flex flex-col gap-2">
					<button
						type="button"
						onclick={() => handleAlgorithmChange('naive_bayes')}
						class="flex flex-col items-start p-3 rounded-lg border text-left transition-colors {appState.algorithm === 'naive_bayes'
							? 'border-indigo-600 bg-indigo-500/10 ring-1 ring-indigo-600'
							: 'border-border hover:bg-muted/50'}"
					>
						<span class="text-sm font-semibold text-foreground">Gaussian & Categorical Naive Bayes</span>
						<span class="text-xs text-muted-foreground">
							Probabilitas Prior & Likelihood terpisah (Gaussian untuk numerik, Laplace untuk kategori)
						</span>
					</button>

					<button
						type="button"
						onclick={() => handleAlgorithmChange('knn')}
						class="flex flex-col items-start p-3 rounded-lg border text-left transition-colors {appState.algorithm === 'knn'
							? 'border-indigo-600 bg-indigo-500/10 ring-1 ring-indigo-600'
							: 'border-border hover:bg-muted/50'}"
					>
						<span class="text-sm font-semibold text-foreground">K-Nearest Neighbors (KNN)</span>
						<span class="text-xs text-muted-foreground">
							Jarak Euclidean ternormalisasi Min-Max + inverse distance voting
						</span>
					</button>
				</div>

				{#if appState.algorithm === 'knn'}
					<div class="mt-2 p-3 bg-muted/40 rounded-lg border border-border flex flex-col gap-1.5">
						<label for="knn-k-input" class="text-xs font-semibold text-foreground">
							Nilai K (Jumlah Tetangga Terdekat): {kValue}
						</label>
						<div class="flex items-center gap-2">
							<input
								id="knn-k-range"
								type="range"
								min="1"
								max="25"
								step="2"
								bind:value={kValue}
								oninput={handleKnnChange}
								class="w-full accent-indigo-600 cursor-pointer"
							/>
							<Input
								id="knn-k-input"
								type="number"
								min="1"
								max="50"
								bind:value={kValue}
								onchange={handleKnnChange}
								class="w-16 h-8 text-xs text-center"
							/>
						</div>
						<p class="text-[11px] text-muted-foreground">Disarankan bilangan ganjil (cth: 3, 5, 7, 9)</p>
					</div>
				{/if}
			</div>

			<!-- Split Ratio Selector -->
			<div class="flex flex-col gap-2">
				<span class="text-sm font-medium text-foreground">2. Rasio Train / Test</span>
				<div class="grid grid-cols-3 gap-2">
					{#each [{ val: '0.7', label: '70 / 30' }, { val: '0.8', label: '80 / 20' }, { val: '0.9', label: '90 / 10' }] as ratio}
						<button
							type="button"
							onclick={() => handleSplitChange(ratio.val)}
							class="py-2.5 px-3 text-xs font-semibold rounded-lg border text-center transition-colors {splitSelection === ratio.val
								? 'bg-primary text-primary-foreground border-primary shadow-xs'
								: 'bg-card text-muted-foreground border-border hover:bg-muted/50 hover:text-foreground'}"
						>
							{ratio.label}
						</button>
					{/each}
				</div>

				<div class="mt-3 p-3 bg-muted/40 rounded-lg border border-border text-xs flex flex-col gap-1.5">
					<div class="flex justify-between text-muted-foreground">
						<span>Data Latih (Train):</span>
						<span class="font-bold text-foreground">{appState.split.train.length} baris ({Math.round(parseFloat(splitSelection) * 100)}%)</span>
					</div>
					<div class="flex justify-between text-muted-foreground">
						<span>Data Uji (Test):</span>
						<span class="font-bold text-foreground">{appState.split.test.length} baris ({Math.round((1 - parseFloat(splitSelection)) * 100)}%)</span>
					</div>
					<div class="flex justify-between text-muted-foreground border-t border-border pt-1.5">
						<span>Metode Pemisahan:</span>
						<span class="font-medium text-indigo-600 dark:text-indigo-400">Stratified Random Split</span>
					</div>
				</div>
			</div>

			<!-- Action & Status -->
			<div class="flex flex-col justify-between gap-4 p-4 bg-muted/70 text-foreground border border-border rounded-xl">
				<div class="flex flex-col gap-2">
					<div class="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold text-xs tracking-wider uppercase">
						<CheckCircle2Icon class="size-4" />
						Siap Dijalankan
					</div>
					<p class="text-xs text-muted-foreground leading-relaxed">
						Model akan dilatih pada {appState.split.train.length} data latih dan dievaluasi langsung pada {appState.split.test.length} data uji.
					</p>
				</div>

				<div class="flex flex-col gap-2">
					<Button
						size="lg"
						disabled={isTraining}
						onclick={runTraining}
						class="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
					>
						{#if isTraining}
							<Loader2Icon class="size-4 animate-spin" data-icon="inline-start" />
							<span>Sedang Melatih...</span>
						{:else}
							<PlayIcon class="size-4" data-icon="inline-start" />
							<span>Hitung / Train Model</span>
						{/if}
					</Button>
					{#if appState.isTrained}
						<button
							type="button"
							onclick={() => (appState.activeTab = 'hasil')}
							class="text-xs text-center text-indigo-600 dark:text-indigo-400 hover:underline mt-1 cursor-pointer"
						>
							&rarr; Lihat Hasil Evaluasi & Prediksi
						</button>
					{/if}
				</div>
			</div>
		</Card.Content>
	</Card.Root>

	<!-- Split Preview Tables -->
	<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
		<!-- Training Split Preview -->
		<Card.Root>
			<Card.Header class="pb-3 flex flex-row items-center justify-between">
				<div>
					<Card.Title class="text-sm">Sampel Data Latih (Train Set)</Card.Title>
					<Card.Description>5 baris pertama dari {appState.split.train.length} baris</Card.Description>
				</div>
				<Badge variant="outline" class="border-indigo-500/30 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
					{appState.split.train.length} baris
				</Badge>
			</Card.Header>
			<Card.Content class="p-0 overflow-x-auto">
				<Table.Root>
					<Table.Header class="bg-muted/50 border-y">
						<Table.Row>
							<Table.Head class="text-xs font-semibold">ID</Table.Head>
							<Table.Head class="text-xs font-semibold">PlayTime</Table.Head>
							<Table.Head class="text-xs font-semibold">Sesi</Table.Head>
							<Table.Head class="text-xs font-semibold">Level</Table.Head>
							<Table.Head class="text-xs font-semibold">Genre</Table.Head>
							<Table.Head class="text-xs font-semibold">Target</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each appState.split.train.slice(0, 5) as row}
							<Table.Row>
								<Table.Cell class="font-mono text-xs">{row.PlayerID}</Table.Cell>
								<Table.Cell class="text-xs">{row.PlayTimeHours}h</Table.Cell>
								<Table.Cell class="text-xs">{row.SessionsPerWeek}</Table.Cell>
								<Table.Cell class="text-xs">{row.PlayerLevel}</Table.Cell>
								<Table.Cell class="text-xs">{row.GameGenre}</Table.Cell>
								<Table.Cell class="text-xs font-semibold">
									<span class={row.EngagementLevel === 'High' ? 'text-emerald-600' : row.EngagementLevel === 'Medium' ? 'text-amber-600' : 'text-rose-600'}>
										{row.EngagementLevel}
									</span>
								</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			</Card.Content>
		</Card.Root>

		<!-- Testing Split Preview -->
		<Card.Root>
			<Card.Header class="pb-3 flex flex-row items-center justify-between">
				<div>
					<Card.Title class="text-sm">Sampel Data Uji (Test Set)</Card.Title>
					<Card.Description>5 baris pertama dari {appState.split.test.length} baris</Card.Description>
				</div>
				<Badge variant="outline" class="border-border bg-muted/50 text-muted-foreground">
					{appState.split.test.length} baris
				</Badge>
			</Card.Header>
			<Card.Content class="p-0 overflow-x-auto">
				<Table.Root>
					<Table.Header class="bg-muted/50 border-y">
						<Table.Row>
							<Table.Head class="text-xs font-semibold">ID</Table.Head>
							<Table.Head class="text-xs font-semibold">PlayTime</Table.Head>
							<Table.Head class="text-xs font-semibold">Sesi</Table.Head>
							<Table.Head class="text-xs font-semibold">Level</Table.Head>
							<Table.Head class="text-xs font-semibold">Genre</Table.Head>
							<Table.Head class="text-xs font-semibold">Target</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each appState.split.test.slice(0, 5) as row}
							<Table.Row>
								<Table.Cell class="font-mono text-xs">{row.PlayerID}</Table.Cell>
								<Table.Cell class="text-xs">{row.PlayTimeHours}h</Table.Cell>
								<Table.Cell class="text-xs">{row.SessionsPerWeek}</Table.Cell>
								<Table.Cell class="text-xs">{row.PlayerLevel}</Table.Cell>
								<Table.Cell class="text-xs">{row.GameGenre}</Table.Cell>
								<Table.Cell class="text-xs font-semibold">
									<span class={row.EngagementLevel === 'High' ? 'text-emerald-600' : row.EngagementLevel === 'Medium' ? 'text-amber-600' : 'text-rose-600'}>
										{row.EngagementLevel}
									</span>
								</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			</Card.Content>
		</Card.Root>
	</div>
</div>
