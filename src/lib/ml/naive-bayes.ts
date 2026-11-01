import type {
	PlayerRecord,
	EngagementLevel,
	NaiveBayesSummary,
	PredictionResult,
	NumericalFeature,
	CategoricalFeature,
	GaussianStats
} from '$lib/types';
import { ALL_CLASSES, NUMERICAL_FEATURES, CATEGORICAL_FEATURES } from '$lib/data/dataset';

export class NaiveBayesClassifier {
	public summary: NaiveBayesSummary | null = null;
	private knownCategories: Record<CategoricalFeature, Set<string>> = {
		Gender: new Set(),
		Location: new Set(),
		GameGenre: new Set(),
		GameDifficulty: new Set()
	};

	fit(data: PlayerRecord[]): void {
		const total = data.length;
		if (total === 0) return;

		// Group records by class
		const grouped: Record<EngagementLevel, PlayerRecord[]> = {
			Low: [],
			Medium: [],
			High: []
		};
		data.forEach((r) => grouped[r.EngagementLevel].push(r));

		// Extract all unique categorical values
		CATEGORICAL_FEATURES.forEach((feat) => {
			this.knownCategories[feat] = new Set(data.map((r) => String(r[feat])));
		});

		// Compute Priors P(Y)
		const priors = ALL_CLASSES.map((cls) => ({
			class: cls,
			count: grouped[cls].length,
			prior: grouped[cls].length / total
		}));

		// Compute Gaussian Numerical Stats: mean, variance, stdDev
		const numericalStats = {} as NaiveBayesSummary['numericalStats'];
		ALL_CLASSES.forEach((cls) => {
			numericalStats[cls] = {} as Record<NumericalFeature, GaussianStats>;
			const records = grouped[cls];
			const n = records.length;

			NUMERICAL_FEATURES.forEach((feat) => {
				if (n === 0) {
					numericalStats[cls][feat] = { mean: 0, variance: 1e-4, stdDev: 1e-2 };
					return;
				}
				const values = records.map((r) => r[feat]);
				const mean = values.reduce((acc, v) => acc + v, 0) / n;
				const varianceSum = values.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0);
				// Sample variance (or clipped population variance)
				const variance = Math.max(varianceSum / Math.max(1, n - 1), 1e-4);
				numericalStats[cls][feat] = {
					mean,
					variance,
					stdDev: Math.sqrt(variance)
				};
			});
		});

		// Compute Categorical Laplace Probabilities: (count + 1) / (N_c + V_j)
		const categoricalProbs = {} as NaiveBayesSummary['categoricalProbs'];
		ALL_CLASSES.forEach((cls) => {
			categoricalProbs[cls] = {} as Record<CategoricalFeature, Record<string, number>>;
			const records = grouped[cls];
			const countC = records.length;

			CATEGORICAL_FEATURES.forEach((feat) => {
				categoricalProbs[cls][feat] = {};
				const numDistinct = Math.max(1, this.knownCategories[feat].size);

				// Frequency count in class
				const freqMap: Record<string, number> = {};
				records.forEach((r) => {
					const val = String(r[feat]);
					freqMap[val] = (freqMap[val] || 0) + 1;
				});

				this.knownCategories[feat].forEach((val) => {
					const count = freqMap[val] || 0;
					categoricalProbs[cls][feat][val] = (count + 1) / (countC + numDistinct);
				});
			});
		});

		this.summary = {
			priors,
			totalTrainCount: total,
			classes: ALL_CLASSES,
			numericalStats,
			categoricalProbs
		};
	}

	private gaussianPDF(x: number, mean: number, variance: number): number {
		const denom = Math.sqrt(2 * Math.PI * variance);
		const exp = Math.exp(-Math.pow(x - mean, 2) / (2 * variance));
		return Math.max(exp / denom, 1e-12);
	}

	predictOne(record: Omit<PlayerRecord, 'EngagementLevel' | 'PlayerID'>): PredictionResult {
		if (!this.summary) {
			return {
				predictedClass: 'Medium',
				probabilities: { Low: 0.33, Medium: 0.34, High: 0.33 }
			};
		}

		const logScores: Record<EngagementLevel, number> = {
			Low: 0,
			Medium: 0,
			High: 0
		};

		ALL_CLASSES.forEach((cls) => {
			const priorObj = this.summary!.priors.find((p) => p.class === cls);
			const prior = priorObj && priorObj.prior > 0 ? priorObj.prior : 1 / 3;
			let score = Math.log(prior);

			// Numerical features (Gaussian log likelihood)
			NUMERICAL_FEATURES.forEach((feat) => {
				const val = record[feat];
				const stats = this.summary!.numericalStats[cls][feat];
				const pdf = this.gaussianPDF(val, stats.mean, stats.variance);
				score += Math.log(pdf);
			});

			// Categorical features (Laplace smoothed probability)
			CATEGORICAL_FEATURES.forEach((feat) => {
				const val = String(record[feat]);
				const catProbMap = this.summary!.categoricalProbs[cls][feat];
				const prob =
					catProbMap[val] ??
					1 / (this.summary!.totalTrainCount + Math.max(1, this.knownCategories[feat].size));
				score += Math.log(Math.max(prob, 1e-12));
			});

			logScores[cls] = score;
		});

		// Softmax to normalize log probabilities stably
		const maxLog = Math.max(...ALL_CLASSES.map((c) => logScores[c]));
		let sumExp = 0;
		const exps: Record<EngagementLevel, number> = { Low: 0, Medium: 0, High: 0 };
		ALL_CLASSES.forEach((cls) => {
			const e = Math.exp(logScores[cls] - maxLog);
			exps[cls] = e;
			sumExp += e;
		});

		const probabilities: Record<EngagementLevel, number> = {
			Low: sumExp > 0 ? exps.Low / sumExp : 1 / 3,
			Medium: sumExp > 0 ? exps.Medium / sumExp : 1 / 3,
			High: sumExp > 0 ? exps.High / sumExp : 1 / 3
		};

		let bestClass: EngagementLevel = 'Low';
		let bestProb = -1;
		ALL_CLASSES.forEach((cls) => {
			if (probabilities[cls] > bestProb) {
				bestProb = probabilities[cls];
				bestClass = cls;
			}
		});

		return {
			predictedClass: bestClass,
			probabilities,
			logProbabilities: logScores
		};
	}

	predict(testRecords: PlayerRecord[]): EngagementLevel[] {
		return testRecords.map((r) => this.predictOne(r).predictedClass);
	}
}
