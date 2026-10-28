import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildSlotModel, countSlots } from './slots.ts';
import { fitEmojiGrid, fitSlots, splitClue, SLOT_CELL } from './fit.ts';
import { formatClock, formatScore, relativeAge } from '../utils/format.ts';

test('buildSlotModel: letras ocultas, reveladas (com/sem acento) e pontuação visível', () => {
  const model = buildSlotModel('Homem-Aranha: O Rei Leão', ['A', 'O']);
  assert.equal(model.length, 4);
  assert.deepEqual(model[0].slice(0, 2), [
    { char: 'H', kind: 'hidden' },
    { char: 'O', kind: 'revealed' },
  ]);
  assert.equal(model[0][5].kind, 'punct'); // "-"
  assert.equal(model[0][model[0].length - 1].char, ':');
  // "ã" é revelada quando "A" está no conjunto (mesma regra da tela original)
  const leao = model[3];
  assert.equal(leao[2].char, 'Ã');
  assert.equal(leao[2].kind, 'revealed');
  const { total, revealed } = countSlots(model);
  assert.equal(total, 'HomemAranhaOReiLeão'.length);
  assert.ok(revealed > 0 && revealed < total);
});

test('buildSlotModel: título vazio e espaços extras', () => {
  assert.deepEqual(buildSlotModel('', []), []);
  assert.deepEqual(buildSlotModel(null, []), []);
  assert.equal(buildSlotModel('  A   B  ').length, 2);
});

test('splitClue: ZWJ, bandeiras e tons de pele contam como um símbolo; espaços são ignorados', () => {
  assert.equal(splitClue('🦁👑🌅').length, 3);
  assert.equal(splitClue('🚢 🧊 💔 🌊').length, 4);
  assert.equal(splitClue('👨‍👩‍👧‍👦').length, 1);
  assert.equal(splitClue('👍🏽').length, 1);
  assert.equal(splitClue('🇧🇷').length, 1);
  assert.equal(splitClue('').length, 0);
});

test('fitEmojiGrid: cabe na caixa, cresce com poucos símbolos e usa linhas extras quando necessário', () => {
  const box = { w: 480, h: 300 };
  let previous = Infinity;
  for (const n of [1, 2, 3, 4, 5, 6, 8, 10, 14, 20]) {
    const fit = fitEmojiGrid(n, box.w, box.h);
    const usedW = fit.cols * fit.cell + (fit.cols - 1) * fit.gap;
    const usedH = fit.rows * fit.cell + (fit.rows - 1) * fit.gap;
    assert.ok(usedW <= box.w + 0.5, `largura n=${n}`);
    assert.ok(usedH <= box.h + 0.5, `altura n=${n}`);
    assert.ok(fit.cols * fit.rows >= n, `capacidade n=${n}`);
    assert.ok(fit.cell <= previous + 0.5, `tamanho não cresce com mais símbolos n=${n}`);
    previous = fit.cell;
  }
  assert.equal(fitEmojiGrid(3, 480, 300).rows, 1);
  assert.equal(fitEmojiGrid(4, 720, 300).rows, 1); // paisagem: sequência curta continua em uma linha
  assert.ok(fitEmojiGrid(12, 480, 300).rows >= 2);
  // o símbolo nunca passa de 42% da largura (1 emoji não vira um outdoor)
  assert.ok(fitEmojiGrid(1, 480, 300).cell <= 480 * 0.42 + 0.5);
});

test('fitEmojiGrid: caixa inválida não quebra', () => {
  assert.equal(fitEmojiGrid(0, 100, 100).cell, 0);
  assert.equal(fitEmojiGrid(3, 0, 100).cell, 0);
});

test('fitSlots: a maior palavra cabe na largura e o conjunto cabe na altura', () => {
  const words = [
    { letters: 1, punct: 0 },
    { letters: 3, punct: 0 },
    { letters: 11, punct: 1 },
  ];
  const fit = fitSlots(words, 480, 120);
  const widest = (11 * SLOT_CELL + 0.5) * fit.fontSize;
  assert.ok(widest <= 480);
  assert.ok(fit.lines >= 1);
  // títulos muito longos reduzem a fonte em vez de estourar
  const long = Array.from({ length: 9 }, () => ({ letters: 7, punct: 0 }));
  const shrunk = fitSlots(long, 480, 120);
  assert.ok(shrunk.fontSize < fit.fontSize);
});

test('formatadores', () => {
  assert.equal(formatClock(23), '0:23');
  assert.equal(formatClock(65), '1:05');
  assert.equal(formatClock(-3), '0:00');
  assert.equal(formatScore(1250), '1.250');
  assert.equal(relativeAge(1000, 1000), 'agora');
  assert.equal(relativeAge(0, 12_000), '12 s');
  assert.equal(relativeAge(0, 190_000), '3 min');
});

import { stageUnit } from './fit.ts';

test('stageUnit: escala pela dimensão que limita primeiro', () => {
  assert.equal(stageUnit(360, 640, 'portrait'), 1);
  assert.equal(stageUnit(1080, 1920, 'portrait'), 3);
  assert.equal(stageUnit(270, 480, 'portrait'), 0.75);
  assert.equal(stageUnit(1920, 1080, 'landscape'), 3);
  // janela mais larga que 9:16: a altura limita
  assert.equal(stageUnit(1000, 640, 'portrait'), 1);
  // janela mais alta que 9:16: a largura limita
  assert.equal(stageUnit(360, 900, 'portrait'), 1);
  assert.equal(stageUnit(0, 0, 'portrait'), 1);
});
