export type EngagementLevel = 'Low' | 'Medium' | 'High';

export interface PlayerRecord {
	PlayerID: string;
	Age: number;
	PlayTimeHours: number;
	InGamePurchases: number; // 0 or 1
	SessionsPerWeek: number;
	AvgSessionDurationMinutes: number;
	PlayerLevel: number;
	AchievementsUnlocked: number;
	Gender: 'Male' | 'Female';
	Location: 'USA' | 'Europe' | 'Asia' | 'Other';
	GameGenre: 'Strategy' | 'Sports' | 'Action' | 'RPG' | 'Simulation';
	GameDifficulty: 'Easy' | 'Medium' | 'Hard';
	EngagementLevel: EngagementLevel;
}

export type NumericalFeature =
	| 'Age'
	| 'PlayTimeHours'
	| 'InGamePurchases'
	| 'SessionsPerWeek'
	| 'AvgSessionDurationMinutes'
	| 'PlayerLevel'
	| 'AchievementsUnlocked';

export type CategoricalFeature = 'Gender' | 'Location' | 'GameGenre' | 'GameDifficulty';

export interface ClassPrior {
	class: EngagementLevel;
	count: number;
	prior: number;
}

export interface GaussianStats {
	mean: number;
	variance: number;
	stdDev: number;
}

export interface NaiveBayesSummary {
	priors: ClassPrior[];
	totalTrainCount: number;
	classes: EngagementLevel[];
	numericalStats: Record<EngagementLevel, Record<NumericalFeature, GaussianStats>>;
	categoricalProbs: Record<EngagementLevel, Record<CategoricalFeature, Record<string, number>>>;
}

export interface PredictionResult {
	predictedClass: EngagementLevel;
	probabilities: Record<EngagementLevel, number>;
	logProbabilities?: Record<EngagementLevel, number>;
}

export interface ConfusionMatrix {
	classes: EngagementLevel[];
	matrix: Record<EngagementLevel, Record<EngagementLevel, number>>; // [actual][predicted]
	total: number;
}

export interface EvaluationMetrics {
	accuracy: number;
	macroPrecision: number;
	macroRecall: number;
	macroF1: number;
	perClass: Record<
		EngagementLevel,
		{
			precision: number;
			recall: number;
			f1: number;
			support: number;
		}
	>;
	confusionMatrix: ConfusionMatrix;
}

export interface SplitData {
	train: PlayerRecord[];
	test: PlayerRecord[];
}
