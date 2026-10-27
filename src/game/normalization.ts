/**
 * Answer normalization & string matching utility
 * Robust to accents, punctuation, unicode, case, and extra spaces.
 */

export function normalizeAnswer(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    // Decompose accented characters (e.g., "ã" -> "a" + "~")
    .normalize('NFD')
    // Remove diacritical marks
    .replace(/[\u0300-\u036f]/g, '')
    // Treat hyphen and dash variants as word separators so titles match consistently.
    .replace(/[-‐‑‒–—―_]/g, ' ')
    // Remove punctuation and special symbols except alphanumeric and spaces
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    // Collapse multiple whitespace characters into a single space
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Checks if a user's guess matches the canonical title or any registered aliases.
 */
export function matchesAnswer(
  guess: string,
  targetTitle: string,
  aliases: string[] = []
): boolean {
  const normGuess = normalizeAnswer(guess);
  if (!normGuess) return false;

  const normTarget = normalizeAnswer(targetTitle);
  if (normGuess === normTarget) return true;

  // Check aliases
  for (const alias of aliases) {
    if (normalizeAnswer(alias) === normGuess) {
      return true;
    }
  }

  // Also handle common articles in Portuguese e.g., "O Rei Leão" vs "Rei Leão"
  const stripArticles = (s: string) => s.replace(/^(o|a|os|as|um|uma|uns|umas)\s+/i, '');
  if (stripArticles(normGuess) === stripArticles(normTarget)) {
    return true;
  }

  return false;
}

/**
 * Generates masked string for display (e.g. "_ _   _ _ _ _")
 * Reveals spaces, punctuation, numbers, and any letters in revealedLetters (case-insensitive)
 */
export function formatMaskedTitle(title: string, revealedLetters: Set<string>): string {
  if (!title) return '';
  
  const normRevealed = new Set(Array.from(revealedLetters).map(l => l.toUpperCase()));
  
  // Split words to make spacing crystal clear
  const words = title.split(' ');
  return words.map(word => {
    return Array.from(word).map(char => {
      // Keep punctuation
      if (/^[^\p{L}\p{N}]$/u.test(char)) return char;
      
      const charUpper = char.toUpperCase();
      const charNorm = char.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
      
      if (normRevealed.has(charUpper) || normRevealed.has(charNorm)) {
        return char;
      }
      return '_';
    }).join(' ');
  }).join('   '); // 3 spaces between words
}

/**
 * Returns a list of unique letters that have NOT yet been revealed.
 */
export function getUnrevealedLetters(title: string, revealedLetters: Set<string>): string[] {
  const normRevealed = new Set(
    Array.from(revealedLetters).map(l => l.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase())
  );
  
  const unrevealed = new Set<string>();
  
  for (const char of title) {
    // Only letters
    if (/^\p{L}$/u.test(char)) {
      const normalizedLetter = char.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
      if (!normRevealed.has(normalizedLetter)) {
        unrevealed.add(normalizedLetter);
      }
    }
  }
  
  return Array.from(unrevealed);
}
