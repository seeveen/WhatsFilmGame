import assert from 'node:assert/strict';
import test from 'node:test';
import { TikTokService } from './tiktok.ts';

test('connect rejects a non-string username without throwing', async () => {
  const tiktok = new TikTokService();
  const result = await tiktok.connect(undefined as unknown as string);

  assert.deepEqual(result, {
    success: false,
    message: 'Nome de usuário do TikTok é obrigatório.',
  });
});
