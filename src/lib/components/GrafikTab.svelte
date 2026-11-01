<script lang="ts">
	import { onMount } from 'svelte';
	import { appState } from '$lib/state/app.svelte';
	import * as Card from '$lib/components/ui/card';
	import * as Table from '$lib/components/ui/table';
	import { Badge } from '$lib/components/ui/badge';
	import Chart from 'chart.js/auto';
	import { mode } from 'mode-watcher';
	import BarChartIcon from '@lucide/svelte/icons/chart-bar';

	let distCanvas: HTMLCanvasElement;
	let featureCanvas: HTMLCanvasElement;
	let distChart: Chart | null = null;
	let featureChart: Chart | null = null;

	const summaryStats = $derived.by(() => {
		const groups: Record<string, { count: number; playTimeSum: number; sessionsSum: number; levelSum: number }> = {
			Low: { count: 0, playTimeSum: 0, sessionsSum: 0, levelSum: 0 },
			Medium: { count: 0, playTimeSum: 0, sessionsSum: 0, levelSum: 0 },
			High: { count: 0, playTimeSum: 0, sessionsSum: 0, levelSum: 0 }
		};

		appState.dataset.forEach((d) => {
			const g = groups[d.EngagementLevel];
			if (g) {
				g.count++;
				g.playTimeSum += d.PlayTimeHours;
				g.sessionsSum += d.SessionsPerWeek;
				g.levelSum += d.PlayerLevel;
			}
		});

		const total = Math.max(1, appState.dataset.length);
		return (['Low', 'Medium', 'High'] as const).map((cls) => {
			const g = groups[cls];
			return {
				class: cls,
				count: g.count,
				percentage: (g.count / total) * 100,
				avgPlayTime: g.count > 0 ? g.playTimeSum / g.count : 0,
				avgSessions: g.count > 0 ? g.sessionsSum / g.count : 0,
				avgLevel: g.count > 0 ? g.levelSum / g.count : 0
			};
		});
	});

	function renderCharts() {
		if (distChart) distChart.destroy();
		if (featureChart) featureChart.destroy();

		if (!distCanvas || !featureCanvas) return;

		const isDark = mode.current === 'dark';
		const textColor = isDark ? '#cbd5e1' : '#475569';
		const gridColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';

		// 1. Target Distribution Bar Chart
		const labels = ['Low', 'Medium', 'High'];
		const counts = summaryStats.map((s) => s.count);

		distChart = new Chart(distCanvas, {
			type: 'bar',
			data: {
				labels,
				datasets: [
					{
						label: 'Jumlah Pemain',
						data: counts,
						backgroundColor: [
							'rgba(244, 63, 94, 0.75)',  // rose-500
							'rgba(245, 158, 11, 0.75)', // amber-500
							'rgba(16, 185, 129, 0.75)'  // emerald-500
						],
						borderColor: [
							'rgb(244, 63, 94)',
							'rgb(245, 158, 11)',
							'rgb(16, 185, 129)'
						],
						borderWidth: 1.5,
						borderRadius: 6
					}
				]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					legend: { display: false }
				},
				scales: {
					x: {
						ticks: { color: textColor },
						grid: { color: gridColor }
					},
					y: {
						beginAtZero: true,
						ticks: { precision: 0, color: textColor },
						grid: { color: gridColor }
					}
				}
			}
		});

		// 2. Grouped Bar Chart (Avg PlayTime vs Avg Sessions)
		featureChart = new Chart(featureCanvas, {
			type: 'bar',
			data: {
				labels,
				datasets: [
					{
						label: 'Rata-rata PlayTime (Jam)',
						data: summaryStats.map((s) => s.avgPlayTime),
						backgroundColor: 'rgba(99, 102, 241, 0.75)', // indigo-500
						borderColor: 'rgb(99, 102, 241)',
						borderWidth: 1.5,
						borderRadius: 6
					},
					{
						label: 'Rata-rata Sesi / Minggu',
						data: summaryStats.map((s) => s.avgSessions),
						backgroundColor: 'rgba(14, 165, 233, 0.75)', // sky-500
						borderColor: 'rgb(14, 165, 233)',
						borderWidth: 1.5,
						borderRadius: 6
					}
				]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					legend: {
						position: 'top',
						labels: { color: textColor }
					}
				},
				scales: {
					x: {
						ticks: { color: textColor },
						grid: { color: gridColor }
					},
					y: {
						beginAtZero: true,
						ticks: { color: textColor },
						grid: { color: gridColor }
					}
				}
			}
		});
	}

	onMount(() => {
		renderCharts();
		return () => {
			if (distChart) distChart.destroy();
			if (featureChart) featureChart.destroy();
		};
	});

	// Re-render when dataset or theme mode updates
	$effect(() => {
		// track dependency
		if (appState.dataset && mode.current && distCanvas && featureCanvas) {
			renderCharts();
		}
	});
</script>

<div class="flex flex-col gap-6">
	<!-- Charts Grid -->
	<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
		<!-- Chart 1: Target Class Distribution -->
		<Card.Root>
			<Card.Header>
				<div class="flex items-center gap-2">
					<BarChartIcon class="size-4 text-indigo-600" />
					<Card.Title class="text-base">Distribusi Kelas Target (Engagement Level)</Card.Title>
				</div>
				<Card.Description>Frekuensi kemunculan kelas Low, Medium, dan High pada dataset</Card.Description>
			</Card.Header>
			<Card.Content>
				<div class="h-64 sm:h-72 w-full">
					<canvas bind:this={distCanvas}></canvas>
				</div>
			</Card.Content>
		</Card.Root>

		<!-- Chart 2: Grouped Comparison -->
		<Card.Root>
			<Card.Header>
				<div class="flex items-center gap-2">
					<BarChartIcon class="size-4 text-indigo-600" />
					<Card.Title class="text-base">Perbandingan Jam Main & Sesi Mingguan</Card.Title>
				</div>
				<Card.Description>Rata-rata jam bermain vs frekuensi sesi mingguan per level engagement</Card.Description>
			</Card.Header>
			<Card.Content>
				<div class="h-64 sm:h-72 w-full">
					<canvas bind:this={featureCanvas}></canvas>
				</div>
			</Card.Content>
		</Card.Root>
	</div>

	<!-- Exact Summary Statistics Table -->
	<Card.Root>
		<Card.Header>
			<Card.Title class="text-base">Tabel Rekapitulasi Statistik per Kelas</Card.Title>
			<Card.Description>Data agregat lengkap untuk validasi angka pada grafik di atas</Card.Description>
		</Card.Header>
		<Card.Content class="p-0 overflow-x-auto">
			<Table.Root class="text-xs">
				<Table.Header class="bg-muted/50 border-y">
					<Table.Row>
						<Table.Head class="font-bold">Kelas Target</Table.Head>
						<Table.Head class="font-bold">Total Sampel</Table.Head>
						<Table.Head class="font-bold">Persentase (%)</Table.Head>
						<Table.Head class="font-bold">Rata-rata PlayTime</Table.Head>
						<Table.Head class="font-bold">Rata-rata Sesi/Minggu</Table.Head>
						<Table.Head class="font-bold">Rata-rata Player Level</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each summaryStats as row}
						<Table.Row>
							<Table.Cell class="font-semibold">
								<Badge variant="outline" class="font-medium">
									{row.class}
								</Badge>
							</Table.Cell>
							<Table.Cell class="font-mono">{row.count} data</Table.Cell>
							<Table.Cell class="font-mono font-medium">{row.percentage.toFixed(1)}%</Table.Cell>
							<Table.Cell class="font-mono">{row.avgPlayTime.toFixed(1)} jam</Table.Cell>
							<Table.Cell class="font-mono">{row.avgSessions.toFixed(1)} sesi</Table.Cell>
							<Table.Cell class="font-mono">{row.avgLevel.toFixed(1)}</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		</Card.Content>
	</Card.Root>
</div>
