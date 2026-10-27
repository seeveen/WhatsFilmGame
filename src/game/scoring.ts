import { GameSettings, GiftConfig, PlayerScore } from '../../shared/types.ts';

export const DEFAULT_GIFTS: GiftConfig[] = [
  {
    id: 'rose',
    name: 'Rosa',
    iconType: 'emoji',
    iconValue: '🌹',
    action: 'add_time',
    value: 5,
    active: true,
  },
  {
    id: 'white_rose',
    name: 'Rosa Branca',
    iconType: 'emoji',
    iconValue: '🤍',
    action: 'add_time',
    value: 5,
    active: true,
  },
  {
    id: 'finger_heart',
    name: 'Finger Heart',
    iconType: 'emoji',
    iconValue: '🫰',
    action: 'reveal_letter',
    value: 1,
    active: true,
  },
  {
    id: 'capivara',
    name: 'Capivara',
    iconType: 'emoji',
    iconValue: '🦫',
    action: 'multiplier_2x',
    value: 2,
    active: true,
  },
];

export const DEFAULT_SETTINGS: GameSettings = {
  roundsPerMatch: 10,
  roundDurationSeconds: 30,
  intermissionSeconds: 5,
  autoLoopMatches: true,
  maxVisibleLeaderboard: 5,
  maxRecentGiftsVisible: 4,
  giftNotificationDurationSeconds: 6,
  points1st: 100,
  points2nd: 75,
  points3rd: 50,
  pointsOthers: 25,
  roseSeconds: 5,
  whiteRoseSeconds: 5,
  maxAddedTimePerRound: 60,
  categoryFilter: 'all',
  preventRepeatInMatch: true,
  giftsConfig: DEFAULT_GIFTS,
};

export function calculateBasePoints(
  rank: number,
  settings: Partial<GameSettings> = {}
): number {
  const cfg = { ...DEFAULT_SETTINGS, ...settings };
  if (rank === 1) return cfg.points1st;
  if (rank === 2) return cfg.points2nd;
  if (rank === 3) return cfg.points3rd;
  return cfg.pointsOthers;
}

export function calculatePointsAwarded(
  rank: number,
  hasMultiplier: boolean,
  multiplierValue: number = 2,
  settings: Partial<GameSettings> = {}
): { basePoints: number; totalPoints: number; multiplierApplied: boolean } {
  const basePoints = calculateBasePoints(rank, settings);
  if (hasMultiplier && multiplierValue > 1) {
    return {
      basePoints,
      totalPoints: basePoints * multiplierValue,
      multiplierApplied: true,
    };
  }
  return {
    basePoints,
    totalPoints: basePoints,
    multiplierApplied: false,
  };
}

export function sortLeaderboard(players: PlayerScore[]): PlayerScore[] {
  return [...players].sort((a, b) => {
    // Primary: match score desc
    if (b.matchScore !== a.matchScore) {
      return b.matchScore - a.matchScore;
    }
    // Secondary: correct guesses desc
    if (b.correctGuesses !== a.correctGuesses) {
      return b.correctGuesses - a.correctGuesses;
    }
    // Tie-breaker: username alphabetical
    return a.username.localeCompare(b.username);
  });
}
