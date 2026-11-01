import type {
	PlayerRecord,
	EngagementLevel,
	EvaluationMetrics,
	SplitData,
	PredictionResult
} from '$lib/types';
import {
	generateDefaultDataset,
	parseCSV,
	stratifiedSplit,
	ALL_CLASSES
} from '$lib/data/dataset';
import { NaiveBayesClassifier } from '$lib/ml/naive-bayes';
import { KNNClassifier } from '$lib/ml/knn';
import { calculateMetrics } from '$lib/ml/metrics';

class AppState {
	dataset = $state<PlayerRecord[]>(generateDefaultDataset(150));
	splitRatio = $state<number>(0.8);
	split = $state<SplitData>(stratifiedSplit(generateDefaultDataset(150), 0.8));
	algorithm = $state<'naive_bayes' | 'knn'>('naive_bayes');
	knnK = $state<number>(5);
	activeTab = $state<'data' | 'klasifikasi' | 'hasil' | 'grafik'>('data');

	nbClassifier = $state<NaiveBayesClassifier>(new NaiveBayesClassifier());
	knnClassifier = $state<KNNClassifier>(new KNNClassifier(5));

	metrics = $state<EvaluationMetrics | null>(null);
	isTrained = $state<boolean>(false);

	constructor() {
		this.performSplit();
		this.trainModel();
	}

	get totalRows(): number {
		return this.dataset.length;
	}

	get classDistribution(): Record<EngagementLevel, number> {
		const counts: Record<EngagementLevel, number> = { Low: 0, Medium: 0, High: 0 };
		this.dataset.forEach((d) => {
			if (counts[d.EngagementLevel] !== undefined) {
				counts[d.EngagementLevel]++;
			}
		});
		return counts;
	}

	performSplit() {
		this.split = stratifiedSplit(this.dataset, this.splitRatio);
		this.isTrained = false;
	}

	setSplitRatio(ratio: number) {
		this.splitRatio = ratio;
		this.performSplit();
		this.trainModel();
	}

	setAlgorithm(algo: 'naive_bayes' | 'knn') {
		this.algorithm = algo;
		this.trainModel();
	}

	setKnnK(k: number) {
		this.knnK = Math.max(1, k);
		this.knnClassifier.k = this.knnK;
		if (this.algorithm === 'knn') {
			this.trainModel();
		}
	}

	loadCustomData(csvText: string): boolean {
		const parsed = parseCSV(csvText);
		if (parsed.length === 0) return false;
		this.dataset = parsed;
		this.performSplit();
		this.trainModel();
		return true;
	}

	resetDefaultData() {
		this.dataset = generateDefaultDataset(150);
		this.performSplit();
		this.trainModel();
	}

	trainModel() {
		const { train, test } = this.split;
		if (train.length === 0 || test.length === 0) return;

		let predicted: EngagementLevel[] = [];

		if (this.algorithm === 'naive_bayes') {
			const nb = new NaiveBayesClassifier();
			nb.fit(train);
			this.nbClassifier = nb;
			predicted = nb.predict(test);
		} else {
			const knn = new KNNClassifier(this.knnK);
			knn.fit(train);
			this.knnClassifier = knn;
			predicted = knn.predict(test);
		}

		const actual = test.map((t) => t.EngagementLevel);
		this.metrics = calculateMetrics(actual, predicted);
		this.isTrained = true;
	}

	predictSingle(record: Omit<PlayerRecord, 'EngagementLevel' | 'PlayerID'>): PredictionResult {
		if (this.algorithm === 'naive_bayes') {
			return this.nbClassifier.predictOne(record);
		} else {
			return this.knnClassifier.predictOne(record);
		}
	}
}

export const appState = new AppState();
