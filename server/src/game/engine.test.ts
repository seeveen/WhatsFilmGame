import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import test from 'node:test';
import type { Challenge } from '../../../shared/types.ts';
import type { DatabaseService } from '../database/db.ts';
import type { TikTokService } from '../integrations/tiktok.ts';
import { GameEngine } from './engine.ts';
import { DEFAULT_SETTINGS } from '../../../src/game/scoring.ts';

const challenge: Challenge = {
  id: 'test-challenge',
  emoji: '🌊 🎬',
  filme: 'O Segredo do Oceano',
  category: 'Filmes',
  difficulty: 'facil',
};

function createEngine() {
  const db = {
    getSettings: () => ({ ...DEFAULT_SETTINGS }),
    getChallengeCount: () => 1,
    getAllChallenges: () => ({ challenges: [challenge], total: 1 }),
    recordRound: () => undefined,
    recordMatch: () => undefined,
    saveSettings: () => undefined,
  } as unknown as DatabaseService;
  const tiktok = Object.assign(new EventEmitter(), {
    getStatus: () => ({ status: 'disconnected' as const, username: '' }),
  }) as unknown as TikTokService;
  return new GameEngine(db, tiktok);
}

test('public state exposes only the masked title while a round is active', () => {
  const engine = createEngine();
  try {
    engine.startMatch();
    const state = engine.getSnapshot();

    assert.equal(state.revealedAnswer, null);
    assert.equal('filme' in (state.currentChallenge ?? {}), false);
    assert.equal(state.currentChallenge?.maskedTitle.includes(challenge.filme), false);
  } finally {
    engine.stop();
  }
});

test('manually starting another match increments its number', () => {
  const engine = createEngine();
  try {
    engine.startMatch();
    engine.startMatch();

    assert.equal(engine.getSnapshot().matchNumber, 2);
  } finally {
    engine.stop();
  }
});

test('public round state reports all correct guesses but only sends the first three winners', () => {
  const engine = createEngine();
  try {
    engine.startMatch();
    for (let i = 1; i <= 5; i++) {
      engine.handleIncomingChat(`user-${i}`, challenge.filme, `Viewer ${i}`);
    }

    const state = engine.getSnapshot();
    assert.equal(state.roundCorrectCount, 5);
    assert.equal(state.roundWinners.length, 3);
    assert.equal(state.leaderboard.length, 5);
  } finally {
    engine.stop();
  }
});

test('settings reject unsafe values and zero gift effects but keep zero points valid', () => {
  const engine = createEngine();
  try {
    assert.equal(engine.updateSettings({ maxAddedTimePerRound: 1e308 }), false);
    assert.equal(engine.updateSettings({ giftsConfig: [{ ...DEFAULT_SETTINGS.giftsConfig[0], value: 0 }] }), false);
    assert.equal(engine.updateSettings({ pointsOthers: 0 }), true);
  } finally {
    engine.stop();
  }
});
