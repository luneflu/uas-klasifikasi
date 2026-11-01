import type {
	PlayerRecord,
	EngagementLevel,
	PredictionResult,
	NumericalFeature,
	CategoricalFeature
} from '$lib/types';
import { ALL_CLASSES, NUMERICAL_FEATURES, CATEGORICAL_FEATURES } from '$lib/data/dataset';

const CLASS_TO_INT: Record<EngagementLevel, number> = { Low: 0, Medium: 1, High: 2 };
const INT_TO_CLASS: EngagementLevel[] = ['Low', 'Medium', 'High'];

// Predefined categories mapping to integer indices for flat matrix
const CATEGORY_MAP: Record<CategoricalFeature, Record<string, number>> = {
	Gender: { Male: 0, Female: 1 },
	Location: { USA: 0, Europe: 1, Asia: 2, Other: 3 },
	GameGenre: { Strategy: 0, Sports: 1, Action: 2, RPG: 3, Simulation: 4 },
	GameDifficulty: { Easy: 0, Medium: 1, Hard: 2 }
};

const NUM_DIM = NUMERICAL_FEATURES.length; // 7
const CAT_DIM = CATEGORICAL_FEATURES.length; // 4
const TOTAL_DIM = NUM_DIM + CAT_DIM; // 11

export class KNNClassifier {
	public k: number;
	private numTrain = 0;
	// Contiguous flat buffer: [train_0_feat_0..10, train_1_feat_0..10, ...]
	private trainMatrix = new Float32Array(0);
	// Train target classes: 0, 1, 2
	private trainLabels = new Uint8Array(0);

	private numMins = new Float32Array(NUM_DIM);
	private numRanges = new Float32Array(NUM_DIM);

	constructor(k = 5) {
		this.k = Math.max(1, k);
	}

	fit(data: PlayerRecord[]): void {
		const n = data.length;
		this.numTrain = n;
		if (n === 0) return;

		// 1. Compute min & range for 7 numerical features
		for (let d = 0; d < NUM_DIM; d++) {
			const feat = NUMERICAL_FEATURES[d];
			let min = Infinity;
			let max = -Infinity;
			for (let i = 0; i < n; i++) {
				const val = data[i][feat];
				if (val < min) min = val;
				if (val > max) max = val;
			}
			this.numMins[d] = min;
			this.numRanges[d] = max === min ? 1 : max - min;
		}

		// 2. Allocate contiguous memory
		this.trainMatrix = new Float32Array(n * TOTAL_DIM);
		this.trainLabels = new Uint8Array(n);

		// 3. Vectorize records into flat memory
		for (let i = 0; i < n; i++) {
			const row = data[i];
			const offset = i * TOTAL_DIM;

			// Normalized numericals
			for (let d = 0; d < NUM_DIM; d++) {
				const val = row[NUMERICAL_FEATURES[d]];
				this.trainMatrix[offset + d] = (val - this.numMins[d]) / this.numRanges[d];
			}

			// Categorical codes
			for (let d = 0; d < CAT_DIM; d++) {
				const feat = CATEGORICAL_FEATURES[d];
				const catVal = row[feat];
				const code = CATEGORY_MAP[feat][catVal] ?? -1;
				this.trainMatrix[offset + NUM_DIM + d] = code;
			}

			this.trainLabels[i] = CLASS_TO_INT[row.EngagementLevel];
		}
	}

	private extractQueryVector(
		record: Omit<PlayerRecord, 'EngagementLevel' | 'PlayerID'>,
		out: Float32Array
	): void {
		for (let d = 0; d < NUM_DIM; d++) {
			const val = record[NUMERICAL_FEATURES[d]];
			out[d] = (val - this.numMins[d]) / this.numRanges[d];
		}
		for (let d = 0; d < CAT_DIM; d++) {
			const feat = CATEGORICAL_FEATURES[d];
			out[NUM_DIM + d] = CATEGORY_MAP[feat][record[feat]] ?? -1;
		}
	}

	predictOne(record: Omit<PlayerRecord, 'EngagementLevel' | 'PlayerID'>): PredictionResult {
		const n = this.numTrain;
		if (n === 0) {
			return {
				predictedClass: 'Medium',
				probabilities: { Low: 0.33, Medium: 0.34, High: 0.33 }
			};
		}

		const query = new Float32Array(TOTAL_DIM);
		this.extractQueryVector(record, query);

		const k = Math.min(this.k, n);
		// Fixed size arrays for top-k nearest: no allocations, no full O(N log N) sort
		const bestDist = new Float32Array(k).fill(Infinity);
		const bestLabels = new Uint8Array(k);

		const matrix = this.trainMatrix;
		const labels = this.trainLabels;

		// Distance loop: pure pointer arithmetic
		for (let i = 0; i < n; i++) {
			const offset = i * TOTAL_DIM;
			let distSq = 0;

			// Numerical Euclidean difference
			for (let d = 0; d < NUM_DIM; d++) {
				const diff = query[d] - matrix[offset + d];
				distSq += diff * diff;
			}

			// Categorical Hamming difference
			for (let d = 0; d < CAT_DIM; d++) {
				if (query[NUM_DIM + d] !== matrix[offset + NUM_DIM + d]) {
					distSq += 1.0;
				}
			}

			// Bounded insertion into top-k
			if (distSq < bestDist[k - 1]) {
				let pos = k - 1;
				while (pos > 0 && distSq < bestDist[pos - 1]) {
					bestDist[pos] = bestDist[pos - 1];
					bestLabels[pos] = bestLabels[pos - 1];
					pos--;
				}
				bestDist[pos] = distSq;
				bestLabels[pos] = labels[i];
			}
		}

		// Inverse-distance weighted voting
		const votes = [0, 0, 0];
		let totalWeight = 0;

		for (let j = 0; j < k; j++) {
			const w = 1 / (Math.sqrt(bestDist[j]) + 1e-4);
			votes[bestLabels[j]] += w;
			totalWeight += w;
		}

		const invTotal = totalWeight > 0 ? 1 / totalWeight : 1 / 3;
		const pLow = votes[0] * invTotal;
		const pMed = votes[1] * invTotal;
		const pHigh = votes[2] * invTotal;

		let bestClass: EngagementLevel = 'Low';
		if (pMed >= pLow && pMed >= pHigh) bestClass = 'Medium';
		else if (pHigh >= pLow && pHigh >= pMed) bestClass = 'High';

		return {
			predictedClass: bestClass,
			probabilities: { Low: pLow, Medium: pMed, High: pHigh }
		};
	}

	predict(testRecords: PlayerRecord[]): EngagementLevel[] {
		return testRecords.map((r) => this.predictOne(r).predictedClass);
	}
}
