<script lang="ts">
	import { appState } from '$lib/state/app.svelte';
	import Navbar from '$lib/components/Navbar.svelte';
	import DataTab from '$lib/components/DataTab.svelte';
	import KlasifikasiTab from '$lib/components/KlasifikasiTab.svelte';
	import HasilTab from '$lib/components/HasilTab.svelte';
	import GrafikTab from '$lib/components/GrafikTab.svelte';
</script>

<svelte:head>
	<title>Sistem Klasifikasi Data Mining — Player Engagement</title>
	<meta
		name="description"
		content="Aplikasi web klasifikasi data mining berbasis client-side menggunakan Naive Bayes dan KNN untuk memprediksi Player Engagement."
	/>
</svelte:head>

<div class="min-h-screen bg-background flex flex-col text-foreground font-sans antialiased">
	<!-- Academic System Header & Tabs -->
	<Navbar />

	<!-- Tab Main Views Container -->
	<main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
		{#if appState.activeTab === 'data'}
			<DataTab />
		{:else if appState.activeTab === 'klasifikasi'}
			<KlasifikasiTab />
		{:else if appState.activeTab === 'hasil'}
			<HasilTab />
		{:else if appState.activeTab === 'grafik'}
			<GrafikTab />
		{/if}
	</main>

	<!-- Footer -->
	<footer class="border-t border-border bg-card py-4 mt-8">
		<div class="max-w-7xl mx-auto px-4 text-center text-xs text-muted-foreground">
			UAS Data Mining &bull; Online Gaming Player Engagement Classification &bull; 100% Client-Side Engine
		</div>
	</footer>
</div>
