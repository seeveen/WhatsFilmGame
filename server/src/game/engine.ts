import { EventEmitter } from 'node:events';
import {
  Challenge,
  GameSettings,
  GameStateDTO,
  GameStatus,
  GiftEvent,
  PlayerScore,
  RoundWinner,
} from '../../../shared/types.ts';
import { DatabaseService } from '../database/db.ts';
import { TikTokService } from '../integrations/tiktok.ts';
import {
  formatSlotTitle,
  getUnrevealedLetters,
  matchesAnswer,
} from '../../../src/game/normalization.ts';
import {
  calculatePointsAwarded,
  DEFAULT_SETTINGS,
  sortLeaderboard,
} from '../../../src/game/scoring.ts';

export class GameEngine extends EventEmitter {
  private db: DatabaseService;
  private tiktok: TikTokService;

  private status: GameStatus = 'idle';
  private matchNumber: number = 1;
  private hasStartedMatch = false;
  private pendingMatchIncrement = false;
  private currentRoundNumber: number = 0;
  private currentChallenge: Challenge | null = null;
  private revealedLetters = new Set<string>();
  private revealedAnswer: string | null = null;

  private timeRemainingSeconds: number = 30;
  private timerInterval: NodeJS.Timeout | null = null;
  private intermissionTimeout: NodeJS.Timeout | null = null;
  private addedTimeThisRound: number = 0;

  private settings: GameSettings;
  private players = new Map<string, PlayerScore>();
  private roundWinners: RoundWinner[] = [];
  private roundScoredUsers = new Set<string>();
  private usedChallengeIdsInMatch = new Set<string>();

  private recentGifts: GiftEvent[] = [];
  private isPaused: boolean = false;
  private matchStartTime: number = Date.now();

  constructor(db: DatabaseService, tiktok: TikTokService) {
    super();
    this.db = db;
    this.tiktok = tiktok;
    this.settings = this.db.getSettings();

    this.setupTikTokListeners();
  }

  private setupTikTokListeners() {
    this.tiktok.on('chat', (data) => {
      this.handleIncomingChat(data.uniqueId, data.comment, data.nickname, data.profilePictureUrl);
    });

    this.tiktok.on('gift', (data) => {
      this.handleIncomingGift(data.uniqueId, data.nickname, data.giftName, data.repeatCount, data.giftId, data.profilePictureUrl);
    });

    this.tiktok.on('status_change', () => {
      this.emitState();
    });
  }

  // --- State Broadcasting ---
  public getSnapshot(): GameStateDTO {
    const sortedPlayers = sortLeaderboard(Array.from(this.players.values()));

    let maskedTitle = '';
    let letterCount = 0;
    let wordCount = 0;

    if (this.currentChallenge) {
      maskedTitle = formatSlotTitle(this.currentChallenge.filme, this.revealedLetters);
      // Count visible characters, including punctuation, while excluding spaces between words.
      letterCount = Array.from(this.currentChallenge.filme).filter((c) => !/\s/u.test(c)).length;
      wordCount = this.currentChallenge.filme.trim().split(/\s+/).length;
    }

    const total = this.db.getChallengeCount();

    return {
      status: this.status,
      matchNumber: this.matchNumber,
      currentRound: this.currentRoundNumber,
      totalRounds: this.settings.roundsPerMatch,
      currentChallenge: this.currentChallenge
        ? {
            id: this.currentChallenge.id,
            emoji: this.currentChallenge.emoji,
            maskedTitle,
            letterCount,
            wordCount,
            category: this.currentChallenge.category,
            difficulty: this.currentChallenge.difficulty,
            revealedLetters: Array.from(this.revealedLetters),
          }
        : null,
      revealedAnswer: ['round_result', 'intermission', 'match_result'].includes(this.status)
        ? this.revealedAnswer
        : null,
      timeRemainingSeconds: this.timeRemainingSeconds,
      roundDurationSeconds: this.settings.roundDurationSeconds,
      intermissionSeconds: this.settings.intermissionSeconds,
      recentGifts: this.recentGifts.slice(0, this.settings.maxRecentGiftsVisible),
      leaderboard: sortedPlayers.slice(0, this.settings.maxVisibleLeaderboard),
      roundWinners: this.roundWinners,
      matchWinners: sortedPlayers.slice(0, 3),
      isPaused: this.isPaused,
      activeMultipliersCount: Array.from(this.players.values()).filter((p) => p.multiplierActive).length,
      tiktokConnection: this.tiktok.getStatus(),
      totalChallengesAvailable: total,
      giftsConfig: this.settings.giftsConfig || DEFAULT_SETTINGS.giftsConfig,
    };
  }

  public emitState() {
    this.emit('state', this.getSnapshot());
  }

  public stop() {
    this.clearAllTimers();
  }

  // --- Game Lifecycle Controls ---
  public startMatch() {
    this.clearAllTimers();
    this.pendingMatchIncrement = this.hasStartedMatch;
    this.matchStartTime = Date.now();
    this.currentRoundNumber = 0;
    this.players.clear();
    this.usedChallengeIdsInMatch.clear();
    this.isPaused = false;
    this.nextRound();
  }

  public pauseGame() {
    if (this.status !== 'playing' || this.isPaused) return;
    this.isPaused = true;
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    this.emitState();
  }

  public resumeGame() {
    if (!this.isPaused) return;
    this.isPaused = false;
    if (this.status === 'playing') {
      this.startCountdownTimer();
    }
    this.emitState();
  }

  public skipRound() {
    if (this.status === 'playing' && !this.isPaused) this.endRound();
  }

  // --- Round Transition ---
  private nextRound() {
    this.clearAllTimers();
    this.currentRoundNumber++;

    if (this.currentRoundNumber > this.settings.roundsPerMatch) {
      this.endMatch();
      return;
    }

    // Reset round-specific states
    for (const player of this.players.values()) {
      player.roundScore = 0;
    }
    this.roundWinners = [];
    this.roundScoredUsers.clear();
    this.revealedLetters.clear();
    this.revealedAnswer = null;
    this.addedTimeThisRound = 0;
    this.timeRemainingSeconds = this.settings.roundDurationSeconds;

    // Pick next challenge
    this.currentChallenge = this.selectChallenge();

    if (!this.currentChallenge) {
      this.pendingMatchIncrement = false;
      this.status = 'error';
      this.emitState();
      return;
    }

    if (this.pendingMatchIncrement) this.matchNumber++;
    this.pendingMatchIncrement = false;
    this.hasStartedMatch = true;
    this.usedChallengeIdsInMatch.add(this.currentChallenge.id);
    this.status = 'playing';
    this.emitState();
    this.startCountdownTimer();
  }

  private selectChallenge(): Challenge | null {
    const { challenges } = this.db.getAllChallenges({
      category: this.settings.categoryFilter,
    });

    if (challenges.length === 0) {
      // Fallback to all categories if filter is empty
      const all = this.db.getAllChallenges().challenges;
      if (all.length === 0) return null;
      return all[Math.floor(Math.random() * all.length)];
    }

    let available = challenges;
    if (this.settings.preventRepeatInMatch && challenges.length >= this.settings.roundsPerMatch) {
      available = challenges.filter((c) => !this.usedChallengeIdsInMatch.has(c.id));
      if (available.length === 0) {
        // Reset match used challenges if exhausted
        this.usedChallengeIdsInMatch.clear();
        available = challenges;
      }
    }

    const randomIndex = Math.floor(Math.random() * available.length);
    return available[randomIndex];
  }

  private startCountdownTimer() {
    if (this.timerInterval) clearInterval(this.timerInterval);

    this.timerInterval = setInterval(() => {
      if (this.isPaused) return;

      this.timeRemainingSeconds--;
      this.emitState();

      if (this.timeRemainingSeconds <= 0) {
        this.endRound();
      }
    }, 1000);
  }

  private endRound() {
    if (this.status !== 'playing') return;
    this.clearAllTimers();
    this.status = 'round_result';
    this.revealedAnswer = this.currentChallenge ? this.currentChallenge.filme : '';

    // Record round to database
    if (this.currentChallenge) {
      this.db.recordRound({
        id: `rnd_${Date.now()}_${this.currentRoundNumber}`,
        matchId: `match_${this.matchNumber}`,
        roundNumber: this.currentRoundNumber,
        challengeId: this.currentChallenge.id,
        filme: this.currentChallenge.filme,
        emoji: this.currentChallenge.emoji,
        winners: this.roundWinners,
      });
    }

    // Expire remaining multipliers for round
    for (const player of this.players.values()) {
      player.multiplierActive = false;
    }

    this.emitState();

    // After intermission (default 5s), transition to next round or end of match
    this.intermissionTimeout = setTimeout(() => {
      if (this.currentRoundNumber >= this.settings.roundsPerMatch) {
        this.endMatch();
      } else {
        this.nextRound();
      }
    }, this.settings.intermissionSeconds * 1000);
  }

  private endMatch() {
    this.clearAllTimers();
    this.status = 'match_result';
    const sortedPlayers = sortLeaderboard(Array.from(this.players.values()));

    // Record match to database
    this.db.recordMatch({
      id: `match_${this.matchNumber}_${Date.now()}`,
      matchNumber: this.matchNumber,
      totalRounds: this.currentRoundNumber,
      startedAt: this.matchStartTime,
      completedAt: Date.now(),
      winners: sortedPlayers.slice(0, 3),
    });

    this.emitState();

    // Auto-loop new match if enabled
    if (this.settings.autoLoopMatches) {
      this.intermissionTimeout = setTimeout(() => {
        this.startMatch();
      }, 10000); // 10s celebration screen before looping
    }
  }

  // --- Guess Handling ---
  private getOrCreatePlayer(userId: string, nickname?: string, profilePictureUrl?: string): PlayerScore {
    let player = this.players.get(userId);
    if (!player) {
      player = {
        id: userId,
        username: nickname || userId,
        avatarUrl: profilePictureUrl,
        matchScore: 0,
        roundScore: 0,
        correctGuesses: 0,
        multiplierActive: false,
        multiplierValue: 1,
      };
      this.players.set(userId, player);
    } else if (profilePictureUrl) {
      player.avatarUrl = profilePictureUrl;
    }
    return player;
  }

  public handleIncomingChat(userId: string, comment: string, nickname?: string, profilePictureUrl?: string) {
    if (this.status !== 'playing' || !this.currentChallenge || this.isPaused) return;

    // A user can only score once per round
    if (this.roundScoredUsers.has(userId)) return;

    const isMatch = matchesAnswer(
      comment,
      this.currentChallenge.filme,
      this.currentChallenge.aliases
    );

    if (!isMatch) return;

    this.roundScoredUsers.add(userId);

    const player = this.getOrCreatePlayer(userId, nickname, profilePictureUrl);

    const rank = this.roundWinners.length + 1;
    const { totalPoints, multiplierApplied } = calculatePointsAwarded(
      rank,
      player.multiplierActive,
      player.multiplierValue,
      this.settings
    );

    // Consume multiplier once used
    player.multiplierActive = false;
    player.roundScore += totalPoints;
    player.matchScore += totalPoints;
    player.correctGuesses += 1;

    const winnerEntry: RoundWinner = {
      rank,
      username: player.username,
      points: totalPoints,
      awardedAt: Date.now(),
      multiplierApplied,
      avatarUrl: player.avatarUrl,
    };
    this.roundWinners.push(winnerEntry);

    this.emit('correct_guess', {
      winner: winnerEntry,
    });

    this.emitState();
    // The round continues until timeRemainingSeconds reaches 0, allowing multiple participants to guess and rank.
  }

  // --- Gift Handling ---
  public handleIncomingGift(
    userId: string,
    nickname: string,
    giftName: string,
    repeatCount: number = 1,
    giftId?: string | number,
    profilePictureUrl?: string
  ) {
    const cleanGiftName = (giftName || '').toLowerCase().trim();
    const strGiftId = giftId !== undefined ? String(giftId).toLowerCase().trim() : '';

    let player: PlayerScore | undefined;

    let action: GiftEvent['action'] = 'custom';
    let effectLabel = '';
    let giftIcon: string | undefined = undefined;
    let giftIconType: 'emoji' | 'image' = 'emoji';

    // Check custom configured gifts first
    const matchedConfig = this.settings.giftsConfig?.find((g) => {
      if (!g.active) return false;
      const gName = g.name.toLowerCase().trim();
      const gId = g.id.toLowerCase().trim();

      if (strGiftId && (gId === strGiftId || gName === strGiftId)) return true;
      if (gName === cleanGiftName || gId === cleanGiftName) return true;

      if (cleanGiftName.length >= 3 && (gName.includes(cleanGiftName) || cleanGiftName.includes(gName))) {
        return true;
      }

      if (g.iconValue && cleanGiftName.includes(g.iconValue.toLowerCase())) {
        return true;
      }

      if (
        (g.id === 'finger_heart' || g.action === 'reveal_letter') &&
        (cleanGiftName.includes('finger') ||
          cleanGiftName.includes('coracao') ||
          cleanGiftName.includes('coração') ||
          cleanGiftName.includes('heart') ||
          cleanGiftName.includes('dedo') ||
          cleanGiftName.includes('🫰'))
      ) {
        return true;
      }

      if (
        (g.id === 'rose' || g.id === 'gift_rose' || (g.action === 'add_time' && g.id.includes('rose'))) &&
        (cleanGiftName.includes('rosa') || cleanGiftName.includes('rose')) &&
        !cleanGiftName.includes('branca') &&
        !cleanGiftName.includes('white')
      ) {
        return true;
      }

      if (
        (g.id === 'white_rose' || g.id === 'rosa_branca') &&
        (cleanGiftName.includes('rosa branca') || cleanGiftName.includes('white rose') || cleanGiftName.includes('🤍'))
      ) {
        return true;
      }

      if (
        (g.id === 'capivara' || g.id === 'capybara' || g.action === 'multiplier_2x') &&
        (cleanGiftName.includes('capivara') || cleanGiftName.includes('capybara') || cleanGiftName.includes('🦫'))
      ) {
        return true;
      }

      return false;
    });

    let resolvedGiftName = matchedConfig ? matchedConfig.name : giftName;

    if (matchedConfig) {
      action = matchedConfig.action;
      giftIcon = matchedConfig.iconValue;
      giftIconType = matchedConfig.iconType || (giftIcon && (giftIcon.startsWith('http') || giftIcon.startsWith('data:image')) ? 'image' : 'emoji');

      if (action === 'add_time') {
        const added = (matchedConfig.value || 5) * repeatCount;
        this.addRoundTime(added);
        effectLabel = '+' + added + 's';
      } else if (action === 'reveal_letter') {
        const revealedLetter = this.revealRandomLetter();
        effectLabel = revealedLetter ? '+letra (' + revealedLetter + ')' : 'Todas reveladas!';
      } else if (action === 'multiplier_2x') {
        if (this.status === 'playing') {
          player = this.getOrCreatePlayer(userId, nickname, profilePictureUrl);
          player.multiplierActive = true;
          player.multiplierValue = matchedConfig.value || 2;
          effectLabel = 'pontos ×' + (matchedConfig.value || 2);
        } else {
          effectLabel = 'Presente recebido!';
        }
      } else {
        effectLabel = 'Presente recebido!';
      }
    } else if (cleanGiftName.includes('rosa branca') || cleanGiftName.includes('white rose')) {
      action = 'add_time';
      const added = this.settings.whiteRoseSeconds * repeatCount;
      this.addRoundTime(added);
      effectLabel = `+${added}s`;
      giftIcon = '🤍';
      giftIconType = 'emoji';
      resolvedGiftName = 'Rosa Branca';
    } else if (cleanGiftName.includes('rosa') || cleanGiftName.includes('rose')) {
      action = 'add_time';
      const added = this.settings.roseSeconds * repeatCount;
      this.addRoundTime(added);
      effectLabel = `+${added}s`;
      giftIcon = '🌹';
      giftIconType = 'emoji';
      resolvedGiftName = 'Rosa';
    } else if (
      cleanGiftName.includes('finger heart') ||
      cleanGiftName.includes('finger') ||
      cleanGiftName.includes('coracao com os dedos') ||
      cleanGiftName.includes('coração') ||
      cleanGiftName.includes('coracao') ||
      cleanGiftName.includes('🫰')
    ) {
      action = 'reveal_letter';
      const revealedLetter = this.revealRandomLetter();
      effectLabel = revealedLetter ? `+letra (${revealedLetter})` : 'Todas reveladas!';
      giftIcon = '🫰';
      giftIconType = 'emoji';
      resolvedGiftName = 'Finger Heart';
    } else if (cleanGiftName.includes('capivara') || cleanGiftName.includes('capybara')) {
      action = 'multiplier_2x';
      if (this.status === 'playing') {
        player = this.getOrCreatePlayer(userId, nickname, profilePictureUrl);
        player.multiplierActive = true;
        player.multiplierValue = 2;
        effectLabel = 'pontos ×2';
      } else {
        effectLabel = 'Presente recebido!';
      }
      giftIcon = '🦫';
      giftIconType = 'emoji';
      resolvedGiftName = 'Capivara';
    } else {
      // Default bonus
      action = 'add_time';
      const added = 3 * repeatCount;
      this.addRoundTime(added);
      effectLabel = `+${added}s`;
      giftIcon = '🎁';
      giftIconType = 'emoji';
    }

    const giftEvent: GiftEvent = {
      id: `gift_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      username: player?.username || nickname || userId,
      giftId: matchedConfig?.id || (strGiftId || undefined),
      giftName: resolvedGiftName,
      giftIcon,
      giftIconType,
      action,
      effectLabel,
      amount: repeatCount,
      timestamp: Date.now(),
      avatarUrl: profilePictureUrl,
    };

    // Keep persistent recent gifts list (most recent on top)
    this.recentGifts.unshift(giftEvent);
    if (this.recentGifts.length > 20) {
      this.recentGifts.pop();
    }

    this.db.recordGift(giftEvent);
    this.emit('gift_received', giftEvent);
    this.emitState();
  }

  private addRoundTime(seconds: number) {
    if (this.status !== 'playing') return;
    if (this.addedTimeThisRound >= this.settings.maxAddedTimePerRound) return;

    const allowedAdd = Math.min(seconds, this.settings.maxAddedTimePerRound - this.addedTimeThisRound);
    this.addedTimeThisRound += allowedAdd;
    this.timeRemainingSeconds += allowedAdd;
  }

  private revealRandomLetter(): string | null {
    if (!this.currentChallenge || this.status !== 'playing') return null;

    const unrevealed = getUnrevealedLetters(this.currentChallenge.filme, this.revealedLetters);
    if (unrevealed.length === 0) return null;

    const randomLetter = unrevealed[Math.floor(Math.random() * unrevealed.length)];
    this.revealedLetters.add(randomLetter);
    return randomLetter;
  }

  // --- Settings & Database sync ---
  public updateSettings(newSettings: Partial<GameSettings>): boolean {
    if (!newSettings || typeof newSettings !== 'object' || Array.isArray(newSettings)) return false;

    for (const [key, value] of Object.entries(newSettings)) {
      if (!Object.prototype.hasOwnProperty.call(DEFAULT_SETTINGS, key)) return false;
      const defaultValue = DEFAULT_SETTINGS[key as keyof GameSettings];
      if (defaultValue === undefined || typeof value !== typeof defaultValue) return false;
      if (typeof value === 'number' && (!Number.isInteger(value) || value < 0)) return false;
      if (typeof value === 'number' && key === 'roundDurationSeconds' && (value < 10 || value > 120)) return false;
      if (typeof value === 'number' && key === 'intermissionSeconds' && (value < 3 || value > 30)) return false;
      if (typeof value === 'number' && key === 'roundsPerMatch' && (value < 1 || value > 100)) return false;
      if (typeof value === 'number' && key === 'likeNotificationThreshold' && (value < 1 || value > 10000)) return false;
      if (
        key === 'giftsConfig' &&
        (!Array.isArray(value) || value.some((gift: any) =>
          !gift ||
          typeof gift.id !== 'string' ||
          typeof gift.name !== 'string' ||
          !['emoji', 'image'].includes(gift.iconType) ||
          typeof gift.iconValue !== 'string' ||
          !['add_time', 'reveal_letter', 'multiplier_2x', 'custom'].includes(gift.action) ||
          !Number.isFinite(gift.value) ||
          gift.value < 0 ||
          typeof gift.active !== 'boolean'
        ))
      ) return false;
    }

    this.settings = { ...this.settings, ...newSettings };
    this.db.saveSettings(newSettings);
    this.emitState();
    return true;
  }

  public getSettings(): GameSettings {
    return this.settings;
  }

  public resetLeaderboard() {
    this.players.clear();
    this.emitState();
  }

  private clearAllTimers() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    if (this.intermissionTimeout) {
      clearTimeout(this.intermissionTimeout);
      this.intermissionTimeout = null;
    }
  }
}
