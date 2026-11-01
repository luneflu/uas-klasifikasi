import type { EngagementLevel, ConfusionMatrix, EvaluationMetrics } from '$lib/types';
import { ALL_CLASSES } from '$lib/data/dataset';

export function calculateMetrics(
	actual: EngagementLevel[],
	predicted: EngagementLevel[]
): EvaluationMetrics {
	const n = actual.length;
	const matrix: Record<EngagementLevel, Record<EngagementLevel, number>> = {
		Low: { Low: 0, Medium: 0, High: 0 },
		Medium: { Low: 0, Medium: 0, High: 0 },
		High: { Low: 0, Medium: 0, High: 0 }
	};

	let correct = 0;
	for (let i = 0; i < n; i++) {
		const act = actual[i];
		const pred = predicted[i];
		if (matrix[act] && matrix[act][pred] !== undefined) {
			matrix[act][pred] += 1;
		}
		if (act === pred) correct += 1;
	}

	const accuracy = n > 0 ? (correct / n) * 100 : 0;

	const perClass = {} as EvaluationMetrics['perClass'];
	let sumPrecision = 0;
	let sumRecall = 0;
	let sumF1 = 0;

	ALL_CLASSES.forEach((cls) => {
		const tp = matrix[cls][cls];
		// fn = sum of actual cls row excluding tp
		let fn = 0;
		ALL_CLASSES.forEach((c) => {
			if (c !== cls) fn += matrix[cls][c];
		});
		// fp = sum of predicted cls col excluding tp
		let fp = 0;
		ALL_CLASSES.forEach((c) => {
			if (c !== cls) fp += matrix[c][cls];
		});

		const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
		const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
		const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;
		const support = tp + fn;

		perClass[cls] = {
			precision: precision * 100,
			recall: recall * 100,
			f1: f1 * 100,
			support
		};

		sumPrecision += precision * 100;
		sumRecall += recall * 100;
		sumF1 += f1 * 100;
	});

	const k = ALL_CLASSES.length;
	const macroPrecision = sumPrecision / k;
	const macroRecall = sumRecall / k;
	const macroF1 = sumF1 / k;

	const confusionMatrix: ConfusionMatrix = {
		classes: ALL_CLASSES,
		matrix,
		total: n
	};

	return {
		accuracy,
		macroPrecision,
		macroRecall,
		macroF1,
		perClass,
		confusionMatrix
	};
}
