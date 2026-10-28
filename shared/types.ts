export type GameStatus =
  | 'idle'
  | 'preparing'
  | 'playing'
  | 'round_result'
  | 'intermission'
  | 'match_result'
  | 'paused'
  | 'error';

export interface Challenge {
  id: string;
  emoji: string;
  filme: string;
  aliases?: string[];
  category?: string;
  difficulty?: 'facil' | 'medio' | 'dificil';
  createdAt?: number;
}

export interface ChallengeInput {
  id?: string;
  emoji?: string;
  emojis?: string;
  filme?: string;
  title?: string;
  movie?: string;
  aliases?: string[];
  category?: string;
  difficulty?: 'facil' | 'medio' | 'dificil';
}

export interface PlayerScore {
  id: string;
  username: string;
  avatarUrl?: string;
  matchScore: number;
  roundScore: number;
  correctGuesses: number;
  multiplierActive: boolean;
  multiplierValue: number;
}

export interface GiftConfig {
  id: string; // e.g. "gift_rose", "5655", "custom_lion"
  name: string;
  iconType: 'emoji' | 'image';
  iconValue: string; // emoji char or PNG base64/URL
  action: 'add_time' | 'reveal_letter' | 'multiplier_2x' | 'custom';
  value: number; // e.g. 5 (seconds) or 2 (multiplier)
  active: boolean;
}

export interface GiftEvent {
  id: string;
  username: string;
  giftId?: number | string;
  giftName: string;
  giftIcon?: string;
  giftIconType?: 'emoji' | 'image';
  action: 'add_time' | 'reveal_letter' | 'multiplier_2x' | 'custom';
  effectLabel: string;
  amount: number;
  timestamp: number;
  avatarUrl?: string;
}

export interface RoundWinner {
  rank: number;
  username: string;
  points: number;
  awardedAt: number;
  multiplierApplied?: boolean;
  avatarUrl?: string;
}

export interface GameSettings {
  roundsPerMatch: number;
  roundDurationSeconds: number;
  intermissionSeconds: number;
  autoLoopMatches: boolean;
  maxVisibleLeaderboard: number;
  maxRecentGiftsVisible: number;
  giftNotificationDurationSeconds: number;
  likeNotificationThreshold: number;
  points1st: number;
  points2nd: number;
  points3rd: number;
  pointsOthers: number;
  roseSeconds: number;
  whiteRoseSeconds: number;
  maxAddedTimePerRound: number;
  categoryFilter: string;
  preventRepeatInMatch: boolean;
  giftsConfig: GiftConfig[];
}

export interface LiveNotification {
  id: string;
  type: 'correct' | 'gift' | 'likes' | 'follow' | 'share';
  username: string;
  timestamp: number;
  points?: number;
  multiplierApplied?: boolean;
  giftName?: string;
  giftId?: string | number;
  giftIcon?: string;
  giftIconType?: 'emoji' | 'image';
  amount?: number;
  effectLabel?: string;
  count?: number;
}

export interface TikTokLogLine {
  message: string;
  timestamp: number;
}

export interface GameStateDTO {
  status: GameStatus;
  matchNumber: number;
  currentRound: number;
  totalRounds: number;
  currentChallenge: {
    id: string;
    emoji: string;
    maskedTitle: string;
    letterCount: number;
    wordCount: number;
    category?: string;
    difficulty?: 'facil' | 'medio' | 'dificil';
    revealedLetters: string[];
  } | null;
  revealedAnswer: string | null;
  timeRemainingSeconds: number;
  roundDurationSeconds: number;
  intermissionSeconds: number;
  recentGifts: GiftEvent[];
  leaderboard: PlayerScore[];
  roundWinners: RoundWinner[];
  roundCorrectCount: number;
  matchWinners: PlayerScore[];
  isPaused: boolean;
  activeMultipliersCount: number;
  tiktokConnection: {
    status: 'disconnected' | 'connecting' | 'connected' | 'error';
    username: string;
    viewerCount?: number;
    errorMsg?: string;
  };
  totalChallengesAvailable: number;
  giftsConfig: GiftConfig[];
}
