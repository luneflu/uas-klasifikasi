import type {
	PlayerRecord,
	EngagementLevel,
	SplitData,
	NumericalFeature,
	CategoricalFeature
} from '$lib/types';

export const NUMERICAL_FEATURES: NumericalFeature[] = [
	'Age',
	'PlayTimeHours',
	'InGamePurchases',
	'SessionsPerWeek',
	'AvgSessionDurationMinutes',
	'PlayerLevel',
	'AchievementsUnlocked'
];

export const CATEGORICAL_FEATURES: CategoricalFeature[] = [
	'Gender',
	'Location',
	'GameGenre',
	'GameDifficulty'
];

export const ALL_CLASSES: EngagementLevel[] = ['Low', 'Medium', 'High'];

// Seeded pseudo-random generator (LCG)
function lcg(seed: number) {
	let s = seed % 2147483647;
	if (s <= 0) s += 2147483646;
	return () => {
		s = (s * 16807) % 2147483647;
		return (s - 1) / 2147483646;
	};
}

export function generateDefaultDataset(count = 150): PlayerRecord[] {
	const rand = lcg(42);
	const genders: PlayerRecord['Gender'][] = ['Male', 'Female'];
	const locations: PlayerRecord['Location'][] = ['USA', 'Europe', 'Asia', 'Other'];
	const genres: PlayerRecord['GameGenre'][] = ['Strategy', 'Sports', 'Action', 'RPG', 'Simulation'];
	const difficulties: PlayerRecord['GameDifficulty'][] = ['Easy', 'Medium', 'Hard'];

	const pick = <T>(arr: T[]): T => arr[Math.floor(rand() * arr.length)];
	const randInt = (min: number, max: number) => Math.floor(rand() * (max - min + 1)) + min;

	const records: PlayerRecord[] = [];

	for (let i = 1; i <= count; i++) {
		const id = `PLR-${String(i).padStart(4, '0')}`;
		// Balanced target class distribution
		const targetChoice = rand();
		let target: EngagementLevel = 'Medium';
		let playTime = 0;
		let sessions = 0;
		let duration = 0;
		let level = 0;
		let achievements = 0;
		let purchases = 0;

		if (targetChoice < 0.33) {
			target = 'Low';
			playTime = randInt(2, 14);
			sessions = randInt(1, 4);
			duration = randInt(15, 45);
			level = randInt(1, 20);
			achievements = randInt(0, 12);
			purchases = rand() < 0.2 ? 1 : 0;
		} else if (targetChoice < 0.67) {
			target = 'Medium';
			playTime = randInt(12, 38);
			sessions = randInt(4, 8);
			duration = randInt(35, 90);
			level = randInt(18, 55);
			achievements = randInt(10, 35);
			purchases = rand() < 0.5 ? 1 : 0;
		} else {
			target = 'High';
			playTime = randInt(35, 85);
			sessions = randInt(7, 15);
			duration = randInt(65, 180);
			level = randInt(45, 99);
			achievements = randInt(30, 80);
			purchases = rand() < 0.8 ? 1 : 0;
		}

		records.push({
			PlayerID: id,
			Age: randInt(15, 48),
			PlayTimeHours: playTime,
			InGamePurchases: purchases,
			SessionsPerWeek: sessions,
			AvgSessionDurationMinutes: duration,
			PlayerLevel: level,
			AchievementsUnlocked: achievements,
			Gender: pick(genders),
			Location: pick(locations),
			GameGenre: pick(genres),
			GameDifficulty: pick(difficulties),
			EngagementLevel: target
		});
	}

	return records;
}

export function parseCSV(csvText: string): PlayerRecord[] {
	const lines = csvText.trim().split(/\r?\n/).filter(Boolean);
	if (lines.length < 2) return [];

	const headers = lines[0].split(',').map((h) => h.trim());
	const result: PlayerRecord[] = [];

	for (let i = 1; i < lines.length; i++) {
		const row = lines[i].split(',').map((c) => c.trim());
		if (row.length !== headers.length) continue;

		const obj: Record<string, string> = {};
		headers.forEach((h, idx) => {
			obj[h] = row[idx];
		});

		const eng = obj['EngagementLevel'] as EngagementLevel;
		if (!ALL_CLASSES.includes(eng)) continue;

		result.push({
			PlayerID: obj['PlayerID'] || `PLR-${i}`,
			Age: Number(obj['Age']) || 20,
			PlayTimeHours: Number(obj['PlayTimeHours']) || 0,
			InGamePurchases: Number(obj['InGamePurchases']) > 0 ? 1 : 0,
			SessionsPerWeek: Number(obj['SessionsPerWeek']) || 0,
			AvgSessionDurationMinutes: Number(obj['AvgSessionDurationMinutes']) || 0,
			PlayerLevel: Number(obj['PlayerLevel']) || 1,
			AchievementsUnlocked: Number(obj['AchievementsUnlocked']) || 0,
			Gender: (obj['Gender'] === 'Female' ? 'Female' : 'Male') as 'Male' | 'Female',
			Location: (['USA', 'Europe', 'Asia', 'Other'].includes(obj['Location'])
				? obj['Location']
				: 'Other') as PlayerRecord['Location'],
			GameGenre: (['Strategy', 'Sports', 'Action', 'RPG', 'Simulation'].includes(obj['GameGenre'])
				? obj['GameGenre']
				: 'Action') as PlayerRecord['GameGenre'],
			GameDifficulty: (['Easy', 'Medium', 'Hard'].includes(obj['GameDifficulty'])
				? obj['GameDifficulty']
				: 'Medium') as PlayerRecord['GameDifficulty'],
			EngagementLevel: eng
		});
	}

	return result;
}

export function exportToCSV(data: PlayerRecord[]): string {
	const headers = [
		'PlayerID',
		'Age',
		'PlayTimeHours',
		'InGamePurchases',
		'SessionsPerWeek',
		'AvgSessionDurationMinutes',
		'PlayerLevel',
		'AchievementsUnlocked',
		'Gender',
		'Location',
		'GameGenre',
		'GameDifficulty',
		'EngagementLevel'
	];
	const rows = data.map((d) =>
		[
			d.PlayerID,
			d.Age,
			d.PlayTimeHours,
			d.InGamePurchases,
			d.SessionsPerWeek,
			d.AvgSessionDurationMinutes,
			d.PlayerLevel,
			d.AchievementsUnlocked,
			d.Gender,
			d.Location,
			d.GameGenre,
			d.GameDifficulty,
			d.EngagementLevel
		].join(',')
	);
	return [headers.join(','), ...rows].join('\n');
}

export function stratifiedSplit(
	data: PlayerRecord[],
	trainRatio = 0.8,
	seed = 123
): SplitData {
	const rand = lcg(seed);

	// Group by target class
	const groups: Record<EngagementLevel, PlayerRecord[]> = {
		Low: [],
		Medium: [],
		High: []
	};

	data.forEach((item) => {
		groups[item.EngagementLevel].push(item);
	});

	const train: PlayerRecord[] = [];
	const test: PlayerRecord[] = [];

	ALL_CLASSES.forEach((cls) => {
		const items = [...groups[cls]];
		// Fisher-Yates shuffle with seeded LCG
		for (let i = items.length - 1; i > 0; i--) {
			const j = Math.floor(rand() * (i + 1));
			[items[i], items[j]] = [items[j], items[i]];
		}

		const trainCount = Math.max(1, Math.round(items.length * trainRatio));
		train.push(...items.slice(0, trainCount));
		test.push(...items.slice(trainCount));
	});

	return { train, test };
}
