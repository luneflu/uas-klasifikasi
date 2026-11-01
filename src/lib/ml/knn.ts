import type {
	PlayerRecord,
	EngagementLevel,
	PredictionResult,
	NumericalFeature,
	CategoricalFeature
} from '$lib/types';
import { ALL_CLASSES, NUMERICAL_FEATURES, CATEGORICAL_FEATURES } from '$lib/data/dataset';

interface FeatureRange {
	min: number;
	max: number;
}

export class KNNClassifier {
	public k: number;
	private trainData: PlayerRecord[] = [];
	private ranges: Record<NumericalFeature, FeatureRange> = {} as Record<
		NumericalFeature,
		FeatureRange
	>;

	constructor(k = 5) {
		this.k = Math.max(1, k);
	}

	fit(data: PlayerRecord[]): void {
		this.trainData = [...data];
		if (data.length === 0) return;

		// Compute min and max for numerical normalization
		NUMERICAL_FEATURES.forEach((feat) => {
			const vals = data.map((d) => d[feat]);
			const min = Math.min(...vals);
			const max = Math.max(...vals);
			this.ranges[feat] = {
				min,
				max: max === min ? min + 1 : max
			};
		});
	}

	private normalizeNumerical(val: number, feat: NumericalFeature): number {
		const r = this.ranges[feat];
		if (!r) return val;
		return (val - r.min) / (r.max - r.min);
	}

	private distance(
		a: Omit<PlayerRecord, 'EngagementLevel' | 'PlayerID'>,
		b: PlayerRecord
	): number {
		let sumSq = 0;

		// Normalized numerical difference
		NUMERICAL_FEATURES.forEach((feat) => {
			const normA = this.normalizeNumerical(a[feat], feat);
			const normB = this.normalizeNumerical(b[feat], feat);
			sumSq += Math.pow(normA - normB, 2);
		});

		// Categorical difference (Hamming / Gower component)
		CATEGORICAL_FEATURES.forEach((feat) => {
			if (a[feat] !== b[feat]) {
				sumSq += 1.0;
			}
		});

		return Math.sqrt(sumSq);
	}

	predictOne(record: Omit<PlayerRecord, 'EngagementLevel' | 'PlayerID'>): PredictionResult {
		if (this.trainData.length === 0) {
			return {
				predictedClass: 'Medium',
				probabilities: { Low: 0.33, Medium: 0.34, High: 0.33 }
			};
		}

		// Calculate distances to all training samples
		const scored = this.trainData.map((trainItem) => ({
			record: trainItem,
			dist: this.distance(record, trainItem)
		}));

		// Sort ascending by distance
		scored.sort((a, b) => a.dist - b.dist);

		// Take top K
		const effectiveK = Math.min(this.k, scored.length);
		const neighbors = scored.slice(0, effectiveK);

		// Weighted votes: 1 / (dist + 0.001)
		const votes: Record<EngagementLevel, number> = { Low: 0, Medium: 0, High: 0 };
		let totalWeight = 0;

		neighbors.forEach((item) => {
			const weight = 1 / (item.dist + 1e-4);
			votes[item.record.EngagementLevel] += weight;
			totalWeight += weight;
		});

		const probabilities: Record<EngagementLevel, number> = {
			Low: totalWeight > 0 ? votes.Low / totalWeight : 1 / 3,
			Medium: totalWeight > 0 ? votes.Medium / totalWeight : 1 / 3,
			High: totalWeight > 0 ? votes.High / totalWeight : 1 / 3
		};

		let bestClass: EngagementLevel = 'Low';
		let maxVote = -1;
		ALL_CLASSES.forEach((cls) => {
			if (votes[cls] > maxVote) {
				maxVote = votes[cls];
				bestClass = cls;
			}
		});

		return {
			predictedClass: bestClass,
			probabilities
		};
	}

	predict(testRecords: PlayerRecord[]): EngagementLevel[] {
		return testRecords.map((r) => this.predictOne(r).predictedClass);
	}
}
