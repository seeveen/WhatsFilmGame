import { Challenge } from '../../shared/types.ts';
import { normalizeAnswer } from './normalization.ts';

export interface ValidationError {
  index: number;
  message: string;
}

export interface ImportValidationResult {
  isValid: boolean;
  totalParsed: number;
  validChallenges: Challenge[];
  errors: ValidationError[];
  duplicatesCount: number;
  duplicateTitles: string[];
}

export function validateJsonImport(
  rawInput: string | unknown[],
  existingChallenges: Challenge[] = []
): ImportValidationResult {
  let parsed: unknown;

  if (typeof rawInput === 'string') {
    const trimmed = rawInput.trim();
    if (!trimmed) {
      return {
        isValid: false,
        totalParsed: 0,
        validChallenges: [],
        errors: [{ index: 0, message: 'O arquivo ou texto JSON está vazio.' }],
        duplicatesCount: 0,
        duplicateTitles: [],
      };
    }
    try {
      parsed = JSON.parse(trimmed);
    } catch (err: unknown) {
      return {
        isValid: false,
        totalParsed: 0,
        validChallenges: [],
        errors: [{ index: 0, message: `Erro de sintaxe JSON: ${(err as Error).message}` }],
        duplicatesCount: 0,
        duplicateTitles: [],
      };
    }
  } else {
    parsed = rawInput;
  }

  if (!Array.isArray(parsed)) {
    return {
      isValid: false,
      totalParsed: 0,
      validChallenges: [],
      errors: [{ index: 0, message: 'O JSON raiz precisa ser uma lista de objetos [ { ... } ].' }],
      duplicatesCount: 0,
      duplicateTitles: [],
    };
  }

  const validChallenges: Challenge[] = [];
  const errors: ValidationError[] = [];
  const seenNormTitlesInBatch = new Set<string>();
  const existingNormTitles = new Set(
    existingChallenges.map((c) => normalizeAnswer(c.filme))
  );

  const duplicateTitles: string[] = [];
  let duplicatesCount = 0;

  for (let i = 0; i < parsed.length; i++) {
    const item = parsed[i];
    const itemIndex = i + 1; // 1-indexed for user-friendly error reporting

    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      errors.push({
        index: itemIndex,
        message: `Registro ${itemIndex}: formato inválido (não é um objeto).`,
      });
      continue;
    }

    const record = item as Record<string, unknown>;
    const emojiRaw = record.emoji ?? record.emojis;
    const titleRaw = record.filme ?? record.title ?? record.movie ?? record.name;

    // Check emoji field
    if (emojiRaw === undefined || emojiRaw === null) {
      errors.push({
        index: itemIndex,
        message: `Registro ${itemIndex}: campo "emoji" ausente.`,
      });
      continue;
    }
    const emojiStr = String(emojiRaw).trim();
    if (!emojiStr) {
      errors.push({
        index: itemIndex,
        message: `Registro ${itemIndex}: campo "emoji" está vazio.`,
      });
      continue;
    }

    // Check title field
    if (titleRaw === undefined || titleRaw === null) {
      errors.push({
        index: itemIndex,
        message: `Registro ${itemIndex}: campo "filme" ausente.`,
      });
      continue;
    }
    const titleStr = String(titleRaw).trim();
    if (!titleStr) {
      errors.push({
        index: itemIndex,
        message: `Registro ${itemIndex}: campo "filme" está vazio.`,
      });
      continue;
    }

    // Check duplicate title
    const normTitle = normalizeAnswer(titleStr);
    if (seenNormTitlesInBatch.has(normTitle)) {
      duplicatesCount++;
      duplicateTitles.push(titleStr);
      errors.push({
        index: itemIndex,
        message: 'Registro ' + itemIndex + ': título duplicado "' + titleStr + '".',
      });
      continue;
    }

    if (existingNormTitles.has(normTitle)) {
      duplicatesCount++;
      duplicateTitles.push(titleStr);
    }

    seenNormTitlesInBatch.add(normTitle);

    // Optional fields
    const category = typeof record.category === 'string' && record.category.trim()
      ? record.category.trim()
      : 'Filmes';

    let difficulty: 'facil' | 'medio' | 'dificil' = 'medio';
    if (record.difficulty === 'facil' || record.difficulty === 'medio' || record.difficulty === 'dificil') {
      difficulty = record.difficulty;
    }

    const aliases: string[] = [];
    if (Array.isArray(record.aliases)) {
      for (const a of record.aliases) {
        if (typeof a === 'string' && a.trim()) {
          aliases.push(a.trim());
        }
      }
    }

    const id = typeof record.id === 'string' && record.id.trim()
      ? record.id.trim()
      : `chal_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    validChallenges.push({
      id,
      emoji: emojiStr,
      filme: titleStr,
      aliases,
      category,
      difficulty,
      createdAt: Date.now(),
    });
  }

  return {
    isValid: errors.length === 0,
    totalParsed: parsed.length,
    validChallenges,
    errors,
    duplicatesCount,
    duplicateTitles,
  };
}
