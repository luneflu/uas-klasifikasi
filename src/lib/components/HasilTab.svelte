<script lang="ts">
	import { appState } from '$lib/state/app.svelte';
	import type { PlayerRecord, EngagementLevel } from '$lib/types';
	import { NUMERICAL_FEATURES } from '$lib/data/dataset';
	import * as Card from '$lib/components/ui/card';
	import * as Table from '$lib/components/ui/table';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { toast } from 'svelte-sonner';
	import CalculatorIcon from '@lucide/svelte/icons/calculator';
	import SparklesIcon from '@lucide/svelte/icons/sparkles';
	import BookOpenIcon from '@lucide/svelte/icons/book-open';

	// Simulation form state
	let simForm = $state({
		Age: 24,
		PlayTimeHours: 35,
		InGamePurchases: 1,
		SessionsPerWeek: 7,
		AvgSessionDurationMinutes: 75,
		PlayerLevel: 42,
		AchievementsUnlocked: 28,
		Gender: 'Male' as PlayerRecord['Gender'],
		Location: 'USA' as PlayerRecord['Location'],
		GameGenre: 'Action' as PlayerRecord['GameGenre'],
		GameDifficulty: 'Medium' as PlayerRecord['GameDifficulty']
	});

	let livePrediction = $state<{
		predictedClass: EngagementLevel;
		probabilities: Record<EngagementLevel, number>;
	} | null>(null);

	let isPredicting = $state<boolean>(false);

	function runLivePredict(showToast = false) {
		isPredicting = true;
		livePrediction = appState.predictSingle({
			...simForm,
			Age: Number(simForm.Age),
			PlayTimeHours: Number(simForm.PlayTimeHours),
			InGamePurchases: Number(simForm.InGamePurchases),
			SessionsPerWeek: Number(simForm.SessionsPerWeek),
			AvgSessionDurationMinutes: Number(simForm.AvgSessionDurationMinutes),
			PlayerLevel: Number(simForm.PlayerLevel),
			AchievementsUnlocked: Number(simForm.AchievementsUnlocked)
		});
		isPredicting = false;
		if (showToast && livePrediction) {
			toast.success(`Prediksi: ${livePrediction.predictedClass} Engagement`, {
				description: `Probabilitas ${(livePrediction.probabilities[livePrediction.predictedClass] * 100).toFixed(1)}%`
			});
		}
	}

	// Trigger initial prediction once
	$effect(() => {
		if (appState.isTrained && !livePrediction) {
			runLivePredict();
		}
	});

	const m = $derived(appState.metrics);
	const nbSummary = $derived(appState.nbClassifier.summary);
</script>

<div class="flex flex-col gap-6">
	{#if !m}
		<div class="p-8 text-center bg-white rounded-xl border">
			<p class="text-sm text-muted-foreground">Model belum dilatih. Silakan buka tab Proses Klasifikasi lalu klik "Hitung / Train Model".</p>
		</div>
	{:else}
		<!-- 1. Evaluation Metric KPIs -->
		<div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
			<Card.Root class="border-indigo-500/30 bg-indigo-500/5">
				<Card.Header class="pb-2">
					<Card.Description class="font-medium text-indigo-600 dark:text-indigo-400">Akurasi (Overall)</Card.Description>
					<Card.Title class="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">
						{m.accuracy.toFixed(2)}%
					</Card.Title>
				</Card.Header>
				<Card.Content>
					<p class="text-xs text-muted-foreground">Persentase prediksi benar pada data uji</p>
				</Card.Content>
			</Card.Root>

			<Card.Root>
				<Card.Header class="pb-2">
					<Card.Description>Macro Precision</Card.Description>
					<Card.Title class="text-3xl font-bold text-foreground">
						{m.macroPrecision.toFixed(2)}%
					</Card.Title>
				</Card.Header>
				<Card.Content>
					<p class="text-xs text-muted-foreground">Rata-rata presisi tiap kelas</p>
				</Card.Content>
			</Card.Root>

			<Card.Root>
				<Card.Header class="pb-2">
					<Card.Description>Macro Recall</Card.Description>
					<Card.Title class="text-3xl font-bold text-foreground">
						{m.macroRecall.toFixed(2)}%
					</Card.Title>
				</Card.Header>
				<Card.Content>
					<p class="text-xs text-muted-foreground">Rata-rata daya tangkap kelas</p>
				</Card.Content>
			</Card.Root>

			<Card.Root>
				<Card.Header class="pb-2">
					<Card.Description>Macro F1-Score</Card.Description>
					<Card.Title class="text-3xl font-bold text-foreground">
						{m.macroF1.toFixed(2)}%
					</Card.Title>
				</Card.Header>
				<Card.Content>
					<p class="text-xs text-muted-foreground">Harmonic mean Precision & Recall</p>
				</Card.Content>
			</Card.Root>
		</div>

		<!-- 2. Confusion Matrix & Per-Class Details -->
		<div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
			<!-- 3x3 Confusion Matrix -->
			<Card.Root class="lg:col-span-6">
				<Card.Header>
					<div class="flex items-center gap-2">
						<CalculatorIcon class="size-4 text-indigo-600" />
						<Card.Title class="text-base">Confusion Matrix (3x3)</Card.Title>
					</div>
					<Card.Description>
						Perbandingan Kelas Aktual (Baris) vs Kelas Prediksi (Kolom) pada {m.confusionMatrix.total} data uji
					</Card.Description>
				</Card.Header>
				<Card.Content class="p-0 overflow-x-auto">
					<Table.Root class="text-center text-xs">
						<Table.Header class="bg-muted/50 border-y">
							<Table.Row>
								<Table.Head class="text-left font-bold">Aktual \ Prediksi</Table.Head>
								<Table.Head class="text-center font-bold text-rose-600 dark:text-rose-400">Pred: Low</Table.Head>
								<Table.Head class="text-center font-bold text-amber-600 dark:text-amber-400">Pred: Medium</Table.Head>
								<Table.Head class="text-center font-bold text-emerald-600 dark:text-emerald-400">Pred: High</Table.Head>
								<Table.Head class="text-center font-bold">Total</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each m.confusionMatrix.classes as actualCls}
								{@const row = m.confusionMatrix.matrix[actualCls]}
								{@const rowTotal = row.Low + row.Medium + row.High}
								<Table.Row>
									<Table.Head class="font-bold text-left bg-muted/20">
										Aktual: {actualCls}
									</Table.Head>
									{#each m.confusionMatrix.classes as predCls}
										{@const count = row[predCls]}
										{@const isTP = actualCls === predCls}
										<Table.Cell
											class="font-semibold py-3 {isTP
												? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold'
												: count > 0
													? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
													: 'text-muted-foreground/60'}"
										>
											{count}
											{#if isTP}
												<span class="block text-[10px] text-emerald-600 dark:text-emerald-400 font-normal">TP</span>
											{/if}
										</Table.Cell>
									{/each}
									<Table.Cell class="font-bold bg-muted/20">{rowTotal}</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</Card.Content>
			</Card.Root>

			<!-- Per-Class Metrics Table -->
			<Card.Root class="lg:col-span-6">
				<Card.Header>
					<Card.Title class="text-base">Metrik Evaluasi per Kelas</Card.Title>
					<Card.Description>Rincian Precision, Recall, dan F1-Score untuk tiap level engagement</Card.Description>
				</Card.Header>
				<Card.Content class="p-0 overflow-x-auto">
					<Table.Root class="text-xs">
						<Table.Header class="bg-muted/50 border-y">
							<Table.Row>
								<Table.Head class="font-bold">Kelas Target</Table.Head>
								<Table.Head class="font-bold">Precision</Table.Head>
								<Table.Head class="font-bold">Recall</Table.Head>
								<Table.Head class="font-bold">F1-Score</Table.Head>
								<Table.Head class="font-bold">Support (N)</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each m.confusionMatrix.classes as cls}
								{@const stats = m.perClass[cls]}
								<Table.Row>
									<Table.Cell class="font-semibold">
										<Badge variant="outline" class="font-medium">
											{cls}
										</Badge>
									</Table.Cell>
									<Table.Cell>{stats.precision.toFixed(1)}%</Table.Cell>
									<Table.Cell>{stats.recall.toFixed(1)}%</Table.Cell>
									<Table.Cell class="font-semibold text-indigo-600 dark:text-indigo-400">{stats.f1.toFixed(1)}%</Table.Cell>
									<Table.Cell class="text-muted-foreground font-mono">{stats.support}</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</Card.Content>
			</Card.Root>
		</div>

		<!-- 3. Transparency: Naive Bayes Mathematical Parameters -->
		{#if appState.algorithm === 'naive_bayes' && nbSummary}
			<Card.Root class="border-indigo-100">
				<Card.Header>
					<div class="flex items-center gap-2">
						<BookOpenIcon class="size-4 text-indigo-600" />
						<Card.Title class="text-base">Transparansi Algoritma: Parameter Naive Bayes</Card.Title>
					</div>
					<Card.Description>
						Parameter probabilistik hasil pelatihan model pada {nbSummary.totalTrainCount} data latih untuk verifikasi perhitungan manual
					</Card.Description>
				</Card.Header>
				<Card.Content class="flex flex-col gap-6">
					<!-- Prior Probabilities Table -->
					<div class="flex flex-col gap-2">
						<h4 class="text-xs font-bold text-foreground uppercase tracking-wider">
							1. Prior Probabilities P(Y)
						</h4>
						<div class="overflow-x-auto border border-border rounded-lg">
							<Table.Root class="text-xs">
								<Table.Header class="bg-muted/50">
									<Table.Row>
										<Table.Head class="font-bold">Kelas (Y)</Table.Head>
										<Table.Head class="font-bold">Jumlah Sampel (N_c)</Table.Head>
										<Table.Head class="font-bold">Rumus P(Y)</Table.Head>
										<Table.Head class="font-bold">Nilai Prior P(Y)</Table.Head>
									</Table.Row>
								</Table.Header>
								<Table.Body>
									{#each nbSummary.priors as p}
										<Table.Row>
											<Table.Cell class="font-semibold">{p.class}</Table.Cell>
											<Table.Cell>{p.count}</Table.Cell>
											<Table.Cell class="font-mono text-muted-foreground">{p.count} / {nbSummary.totalTrainCount}</Table.Cell>
											<Table.Cell class="font-mono font-bold text-indigo-600 dark:text-indigo-400">
												{p.prior.toFixed(4)} ({ (p.prior * 100).toFixed(1) }%)
											</Table.Cell>
										</Table.Row>
									{/each}
								</Table.Body>
							</Table.Root>
						</div>
					</div>

					<!-- Gaussian Numerical Parameters Table -->
					<div class="flex flex-col gap-2">
						<h4 class="text-xs font-bold text-foreground uppercase tracking-wider">
							2. Parameter Gaussian (Mean &mu; dan Standar Deviasi &sigma;) untuk Fitur Numerik
						</h4>
						<div class="overflow-x-auto border border-border rounded-lg">
							<Table.Root class="text-xs">
								<Table.Header class="bg-muted/50">
									<Table.Row>
										<Table.Head class="font-bold">Fitur Numerik</Table.Head>
										<Table.Head class="font-bold text-center" colspan={2}>Low (&mu; / &sigma;)</Table.Head>
										<Table.Head class="font-bold text-center" colspan={2}>Medium (&mu; / &sigma;)</Table.Head>
										<Table.Head class="font-bold text-center" colspan={2}>High (&mu; / &sigma;)</Table.Head>
									</Table.Row>
								</Table.Header>
								<Table.Body>
									{#each NUMERICAL_FEATURES as feat}
										<Table.Row>
											<Table.Cell class="font-semibold">{feat}</Table.Cell>
											<Table.Cell class="font-mono text-center">
												&mu;={nbSummary.numericalStats.Low[feat].mean.toFixed(2)}
											</Table.Cell>
											<Table.Cell class="font-mono text-center text-muted-foreground">
												&sigma;={nbSummary.numericalStats.Low[feat].stdDev.toFixed(2)}
											</Table.Cell>
											<Table.Cell class="font-mono text-center">
												&mu;={nbSummary.numericalStats.Medium[feat].mean.toFixed(2)}
											</Table.Cell>
											<Table.Cell class="font-mono text-center text-muted-foreground">
												&sigma;={nbSummary.numericalStats.Medium[feat].stdDev.toFixed(2)}
											</Table.Cell>
											<Table.Cell class="font-mono text-center">
												&mu;={nbSummary.numericalStats.High[feat].mean.toFixed(2)}
											</Table.Cell>
											<Table.Cell class="font-mono text-center text-muted-foreground">
												&sigma;={nbSummary.numericalStats.High[feat].stdDev.toFixed(2)}
											</Table.Cell>
										</Table.Row>
									{/each}
								</Table.Body>
							</Table.Root>
						</div>
					</div>
				</Card.Content>
			</Card.Root>
		{/if}

		<!-- 4. Simulasi Prediksi Baru (Live Predictor) -->
		<Card.Root class="border-indigo-200 shadow-sm">
			<Card.Header>
				<div class="flex items-center gap-2">
					<SparklesIcon class="size-4 text-indigo-600" />
					<Card.Title class="text-base">Simulasi Prediksi Pemain Baru (Live Predictor)</Card.Title>
				</div>
				<Card.Description>
					Masukkan data profil pemain game hipotetis untuk menguji model yang sudah dilatih
				</Card.Description>
			</Card.Header>
			<Card.Content class="grid grid-cols-1 lg:grid-cols-12 gap-6">
				<!-- Form Input -->
				<div class="lg:col-span-8 grid grid-cols-2 sm:grid-cols-3 gap-3">
					<div>
						<label for="f-age" class="text-xs font-semibold text-foreground">Umur (Age)</label>
						<Input id="f-age" type="number" min="10" max="80" bind:value={simForm.Age} class="h-8 text-xs mt-1" />
					</div>
					<div>
						<label for="f-playtime" class="text-xs font-semibold text-foreground">Play Time (Jam)</label>
						<Input id="f-playtime" type="number" min="0" max="200" bind:value={simForm.PlayTimeHours} class="h-8 text-xs mt-1" />
					</div>
					<div>
						<label for="f-purchases" class="text-xs font-semibold text-foreground">In-Game Purchases</label>
						<select
							id="f-purchases"
							bind:value={simForm.InGamePurchases}
							class="w-full h-8 text-xs mt-1 rounded-md border border-input bg-background px-2"
						>
							<option value={1}>1 (Pernah Membeli)</option>
							<option value={0}>0 (Tidak Pernah)</option>
						</select>
					</div>
					<div>
						<label for="f-sessions" class="text-xs font-semibold text-foreground">Sesi / Minggu</label>
						<Input id="f-sessions" type="number" min="0" max="30" bind:value={simForm.SessionsPerWeek} class="h-8 text-xs mt-1" />
					</div>
					<div>
						<label for="f-durasi" class="text-xs font-semibold text-foreground">Durasi Sesi (Menit)</label>
						<Input id="f-durasi" type="number" min="5" max="360" bind:value={simForm.AvgSessionDurationMinutes} class="h-8 text-xs mt-1" />
					</div>
					<div>
						<label for="f-level" class="text-xs font-semibold text-foreground">Player Level</label>
						<Input id="f-level" type="number" min="1" max="100" bind:value={simForm.PlayerLevel} class="h-8 text-xs mt-1" />
					</div>
					<div>
						<label for="f-achieve" class="text-xs font-semibold text-foreground">Achievements</label>
						<Input id="f-achieve" type="number" min="0" max="150" bind:value={simForm.AchievementsUnlocked} class="h-8 text-xs mt-1" />
					</div>
					<div>
						<label for="f-gender" class="text-xs font-semibold text-foreground">Gender</label>
						<select
							id="f-gender"
							bind:value={simForm.Gender}
							class="w-full h-8 text-xs mt-1 rounded-md border border-input bg-background px-2"
						>
							<option value="Male">Male</option>
							<option value="Female">Female</option>
						</select>
					</div>
					<div>
						<label for="f-location" class="text-xs font-semibold text-foreground">Location</label>
						<select
							id="f-location"
							bind:value={simForm.Location}
							class="w-full h-8 text-xs mt-1 rounded-md border border-input bg-background px-2"
						>
							<option value="USA">USA</option>
							<option value="Europe">Europe</option>
							<option value="Asia">Asia</option>
							<option value="Other">Other</option>
						</select>
					</div>
					<div>
						<label for="f-genre" class="text-xs font-semibold text-foreground">Game Genre</label>
						<select
							id="f-genre"
							bind:value={simForm.GameGenre}
							class="w-full h-8 text-xs mt-1 rounded-md border border-input bg-background px-2"
						>
							<option value="Action">Action</option>
							<option value="Strategy">Strategy</option>
							<option value="RPG">RPG</option>
							<option value="Sports">Sports</option>
							<option value="Simulation">Simulation</option>
						</select>
					</div>
					<div>
						<label for="f-difficulty" class="text-xs font-semibold text-foreground">Game Difficulty</label>
						<select
							id="f-difficulty"
							bind:value={simForm.GameDifficulty}
							class="w-full h-8 text-xs mt-1 rounded-md border border-input bg-background px-2"
						>
							<option value="Easy">Easy</option>
							<option value="Medium">Medium</option>
							<option value="Hard">Hard</option>
						</select>
					</div>
					<div class="flex items-end">
						<Button
							disabled={isPredicting}
							onclick={() => runLivePredict(true)}
							class="w-full h-8 text-xs bg-indigo-600 hover:bg-indigo-500 font-semibold text-white cursor-pointer"
						>
							Prediksi Sekarang
						</Button>
					</div>
				</div>

				<!-- Prediction Output Card -->
				<div class="lg:col-span-4 bg-muted/60 text-card-foreground border border-border rounded-xl p-5 flex flex-col justify-between gap-4">
					<div>
						<span class="text-[11px] font-bold tracking-wider uppercase text-indigo-600 dark:text-indigo-400">
							Hasil Prediksi Model ({appState.algorithm === 'naive_bayes' ? 'Naive Bayes' : `KNN K=${appState.knnK}`})
						</span>
						{#if livePrediction}
							<div class="mt-3 flex items-baseline gap-2">
								<span class="text-3xl font-extrabold tracking-tight text-foreground">
									{livePrediction.predictedClass}
								</span>
								<span class="text-xs text-muted-foreground">Engagement</span>
							</div>
						{/if}
					</div>

					{#if livePrediction}
						<div class="flex flex-col gap-2.5">
							<span class="text-xs font-medium text-muted-foreground">Estimasi Probabilitas Kelas:</span>
							{#each (['Low', 'Medium', 'High'] as const) as cls}
								{@const prob = livePrediction.probabilities[cls] * 100}
								<div class="flex flex-col gap-1">
									<div class="flex justify-between text-xs">
										<span class={cls === livePrediction.predictedClass ? 'font-bold text-foreground' : 'text-muted-foreground'}>
											{cls}
										</span>
										<span class="font-mono text-xs">{prob.toFixed(1)}%</span>
									</div>
									<div class="w-full bg-muted h-2 rounded-full overflow-hidden border border-border">
										<div
											class="h-full rounded-full transition-all duration-300 {cls === 'High' ? 'bg-emerald-500' : cls === 'Medium' ? 'bg-amber-500' : 'bg-rose-500'}"
											style="width: {Math.max(2, prob)}%"
										></div>
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			</Card.Content>
		</Card.Root>
	{/if}
</div>
