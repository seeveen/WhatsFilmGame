import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeAnswer,
  matchesAnswer,
  formatMaskedTitle,
  formatSlotTitle,
  HIDDEN_TITLE_SLOT,
  getUnrevealedLetters,
} from './normalization.ts';
import {
  calculateBasePoints,
  calculatePointsAwarded,
  sortLeaderboard,
  DEFAULT_SETTINGS,
} from './scoring.ts';
import { validateJsonImport } from './import-validator.ts';
import { PlayerScore } from '../../shared/types.ts';

test('normalizeAnswer removes accents, punctuation, extra spaces and lowers case', () => {
  assert.equal(normalizeAnswer('O Rei Leão!'), 'o rei leao');
  assert.equal(normalizeAnswer('  HOMEM-ARANHA: Sem Volta a Casa  '), 'homem aranha sem volta a casa');
  assert.equal(normalizeAnswer('À noite no museu'), 'a noite no museu');
  assert.equal(normalizeAnswer(''), '');
});

test('matchesAnswer checks target and aliases with flexible article handling', () => {
  assert.equal(matchesAnswer('o rei leao', 'O Rei Leão'), true);
  assert.equal(matchesAnswer('rei leao', 'O Rei Leão'), true);
  assert.equal(matchesAnswer('Rei Leão', 'O Rei Leão'), true);
  assert.equal(matchesAnswer('frozen 2', 'Frozen'), false);
  
  // Aliases support
  assert.equal(matchesAnswer('spiderman', 'Homem-Aranha', ['spiderman', 'aranha']), true);
  assert.equal(matchesAnswer('the lion king', 'O Rei Leão', ['the lion king']), true);
  assert.equal(matchesAnswer('shrek', 'O Rei Leão', ['lion king']), false);
});

test('formatMaskedTitle masks letters properly and keeps revealed letters visible', () => {
  const revealed = new Set(['O', 'R']);
  const masked = formatMaskedTitle('O Rei', revealed);
  // 'O' is revealed, ' ' becomes '  ', 'R' is revealed, 'e' is masked, 'i' is masked
  assert.equal(masked, 'O   R _ _');

  const unrevealed = getUnrevealedLetters('O Rei Leão', new Set(['O', 'R']));
  // Letters remaining: E, I, L, A
  assert.ok(unrevealed.includes('E'));
  assert.ok(unrevealed.includes('I'));
  assert.ok(unrevealed.includes('L'));
  assert.ok(unrevealed.includes('A'));
  assert.ok(!unrevealed.includes('O'));
  assert.ok(!unrevealed.includes('R'));
});

test('formatSlotTitle keeps the answer out of the public mask', () => {
  assert.equal(formatSlotTitle('O Rei', new Set(['O'])), `O ${HIDDEN_TITLE_SLOT}${HIDDEN_TITLE_SLOT}${HIDDEN_TITLE_SLOT}`);
});

test('scoring rules grant correct points per rank and double points with capivara multiplier', () => {
  assert.equal(calculateBasePoints(1), 100);
  assert.equal(calculateBasePoints(2), 75);
  assert.equal(calculateBasePoints(3), 50);
  assert.equal(calculateBasePoints(4), 25);
  assert.equal(calculateBasePoints(10), 25);

  const awardNormal = calculatePointsAwarded(1, false);
  assert.equal(awardNormal.totalPoints, 100);
  assert.equal(awardNormal.multiplierApplied, false);

  const awardDoubled = calculatePointsAwarded(1, true, 2);
  assert.equal(awardDoubled.totalPoints, 200);
  assert.equal(awardDoubled.multiplierApplied, true);

  const awardDoubled2nd = calculatePointsAwarded(2, true, 2);
  assert.equal(awardDoubled2nd.totalPoints, 150);
  assert.equal(awardDoubled2nd.multiplierApplied, true);
});

test('sortLeaderboard sorts descending by score then correct guesses', () => {
  const players: PlayerScore[] = [
    { id: '1', username: 'ana', matchScore: 100, roundScore: 100, correctGuesses: 1, multiplierActive: false, multiplierValue: 1 },
    { id: '2', username: 'carlos', matchScore: 250, roundScore: 0, correctGuesses: 3, multiplierActive: false, multiplierValue: 1 },
    { id: '3', username: 'bia', matchScore: 100, roundScore: 50, correctGuesses: 2, multiplierActive: false, multiplierValue: 1 },
  ];

  const sorted = sortLeaderboard(players);
  assert.equal(sorted[0].username, 'carlos'); // 250
  assert.equal(sorted[1].username, 'bia');    // 100 with 2 guesses
  assert.equal(sorted[2].username, 'ana');    // 100 with 1 guess
});

test('validateJsonImport handles standard format and reports specific errors', () => {
  const jsonStr = JSON.stringify([
    { emoji: '🦁👑🌅', filme: 'O Rei Leão' },
    { emoji: '❄️👸⛄', filme: 'Frozen' },
    { emoji: '', filme: 'Vazio' },
    { emoji: '🕷️', filme: '' },
    { emoji: '🦁👑🌅', filme: 'O Rei Leão' }, // Duplicate
  ]);

  const res = validateJsonImport(jsonStr);
  assert.equal(res.totalParsed, 5);
  assert.equal(res.validChallenges.length, 2);
  assert.equal(res.errors.length, 3);
  assert.equal(res.duplicatesCount, 1);
  assert.equal(res.validChallenges[0].filme, 'O Rei Leão');
  assert.equal(res.validChallenges[1].filme, 'Frozen');
});

test('multiple winners in a round earn tiered points based on rank order', () => {
  const roundWinners: Array<{ user: string; rank: number; points: number }> = [];
  const users = ['user_alpha', 'user_beta', 'user_gamma', 'user_delta'];

  users.forEach((u) => {
    const rank = roundWinners.length + 1;
    const { totalPoints } = calculatePointsAwarded(rank, false);
    roundWinners.push({ user: u, rank, points: totalPoints });
  });

  assert.equal(roundWinners.length, 4);
  assert.equal(roundWinners[0].rank, 1);
  assert.equal(roundWinners[0].points, 100);
  assert.equal(roundWinners[1].rank, 2);
  assert.equal(roundWinners[1].points, 75);
  assert.equal(roundWinners[2].rank, 3);
  assert.equal(roundWinners[2].points, 50);
  assert.equal(roundWinners[3].rank, 4);
  assert.equal(roundWinners[3].points, 25);
});

