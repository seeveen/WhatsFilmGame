import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import { Challenge, GameSettings, GiftEvent, PlayerScore, RoundWinner } from '../../../shared/types.ts';
import { DEFAULT_SETTINGS } from '../../../src/game/scoring.ts';
import { normalizeAnswer } from '../../../src/game/normalization.ts';

const DB_PATH = path.resolve(process.env.QUAL_FILME_DB_PATH || path.join(process.cwd(), 'qual_e_o_filme.db'));

export class DatabaseService {
  private db: DatabaseSync;

  constructor() {
    this.db = new DatabaseSync(DB_PATH);
    this.initSchema();
    this.seedDefaultChallengesIfEmpty();
  }

  private initSchema() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS challenges (
        id TEXT PRIMARY KEY,
        emoji TEXT NOT NULL,
        filme TEXT NOT NULL,
        normalized_title TEXT NOT NULL,
        aliases_json TEXT,
        category TEXT DEFAULT 'Filmes',
        difficulty TEXT DEFAULT 'medio',
        created_at INTEGER
      );

      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS matches (
        id TEXT PRIMARY KEY,
        match_number INTEGER,
        total_rounds INTEGER,
        started_at INTEGER,
        completed_at INTEGER,
        winners_json TEXT
      );

      CREATE TABLE IF NOT EXISTS round_history (
        id TEXT PRIMARY KEY,
        match_id TEXT,
        round_number INTEGER,
        challenge_id TEXT,
        filme TEXT,
        emoji TEXT,
        winners_json TEXT,
        created_at INTEGER
      );

      CREATE TABLE IF NOT EXISTS gifts_log (
        id TEXT PRIMARY KEY,
        username TEXT,
        gift_name TEXT,
        action TEXT,
        effect_label TEXT,
        amount INTEGER,
        timestamp INTEGER
      );

      CREATE INDEX IF NOT EXISTS matches_completed_at_idx ON matches(completed_at DESC);
      CREATE INDEX IF NOT EXISTS gifts_log_timestamp_idx ON gifts_log(timestamp DESC);
    `);
  }

  private seedDefaultChallengesIfEmpty() {
    const countStmt = this.db.prepare('SELECT count(*) as count FROM challenges');
    const result = countStmt.get() as { count: number };
    if (result.count > 0) return;

    const initialChallenges: Array<Omit<Challenge, 'id' | 'createdAt'>> = [
      { emoji: '🦁👑🌅', filme: 'O Rei Leão', category: 'Disney', difficulty: 'facil', aliases: ['rei leao', 'the lion king'] },
      { emoji: '❄️👸⛄', filme: 'Frozen', category: 'Disney', difficulty: 'facil', aliases: ['uma aventura congelante'] },
      { emoji: '🕷️🧑🏙️', filme: 'Homem-Aranha', category: 'Super-heróis', difficulty: 'facil', aliases: ['spiderman', 'homem aranha'] },
      { emoji: '🧽🍍🌊', filme: 'Bob Esponja', category: 'Desenhos', difficulty: 'facil', aliases: ['spongebob'] },
      { emoji: '🧙‍♂️💍🌋', filme: 'O Senhor dos Anéis', category: 'Fantasia', difficulty: 'medio', aliases: ['senhor dos aneis', 'lotr', 'lord of the rings'] },
      { emoji: '🐭👨‍🍳🍲', filme: 'Ratatouille', category: 'Pixar', difficulty: 'facil', aliases: ['ratatuile'] },
      { emoji: '🎈👴🏠', filme: 'Up: Altas Aventuras', category: 'Pixar', difficulty: 'facil', aliases: ['up', 'altas aventuras'] },
      { emoji: '⚡👓🚂', filme: 'Harry Potter', category: 'Fantasia', difficulty: 'facil', aliases: ['harry potter e a pedra filosofal'] },
      { emoji: '🤖🚗💥', filme: 'Transformers', category: 'Ficção científica', difficulty: 'medio', aliases: [] },
      { emoji: '🚢🧊💔', filme: 'Titanic', category: 'Filmes', difficulty: 'facil', aliases: [] },
      { emoji: '🥋🐼🎋', filme: 'Kung Fu Panda', category: 'Animações', difficulty: 'facil', aliases: [] },
      { emoji: '🦇🃏🌃', filme: 'Batman: O Cavaleiro das Trevas', category: 'Super-heróis', difficulty: 'medio', aliases: ['batman', 'o cavaleiro das trevas', 'dark knight'] },
      { emoji: '🏴‍☠️👒🍖', filme: 'One Piece', category: 'Animes', difficulty: 'facil', aliases: ['luffy'] },
      { emoji: '⚔️🥋🟠', filme: 'Dragon Ball Z', category: 'Animes', difficulty: 'facil', aliases: ['dragon ball', 'dbz'] },
      { emoji: '🦖🏝️🚙', filme: 'Jurassic Park', category: 'Ficção científica', difficulty: 'facil', aliases: ['parque dos dinossauros'] },
      { emoji: '🧸🤠🚀', filme: 'Toy Story', category: 'Pixar', difficulty: 'facil', aliases: ['toy story 1'] },
      { emoji: '👻🚫🔫', filme: 'Os Caça-Fantasmas', category: 'Filmes', difficulty: 'medio', aliases: ['ghostbusters', 'caca fantasmas'] },
      { emoji: '🐟🐠🌊', filme: 'Procurando Nemo', category: 'Pixar', difficulty: 'facil', aliases: ['nemo'] },
      { emoji: '🥷🦊🍜', filme: 'Naruto', category: 'Animes', difficulty: 'facil', aliases: ['naruto shippuden'] },
      { emoji: '👑♟️🏰', filme: 'O Gambito da Rainha', category: 'Séries', difficulty: 'medio', aliases: ['gambito da rainha'] },
      { emoji: '🧇🚲🚲', filme: 'Stranger Things', category: 'Séries', difficulty: 'medio', aliases: [] },
      { emoji: '🍫🏭🎫', filme: 'A Fantástica Fábrica de Chocolate', category: 'Filmes', difficulty: 'medio', aliases: ['fabrica de chocolate', 'willy wonka'] },
      { emoji: '🚗⚡🕰️', filme: 'De Volta para o Futuro', category: 'Ficção científica', difficulty: 'medio', aliases: ['back to the future'] },
      { emoji: '🕶️💊🟢', filme: 'Matrix', category: 'Ficção científica', difficulty: 'facil', aliases: ['the matrix'] },
      { emoji: '👽🚲🌕', filme: 'E.T. O Extraterrestre', category: 'Ficção científica', difficulty: 'facil', aliases: ['et', 'e.t.'] },
      { emoji: '🧜‍♀️🐠🌊', filme: 'A Pequena Sereia', category: 'Disney', difficulty: 'facil', aliases: ['pequena sereia', 'the little mermaid'] },
      { emoji: '🦍🏢🛩️', filme: 'King Kong', category: 'Filmes', difficulty: 'facil', aliases: [] },
      { emoji: '🏎️💨🏁', filme: 'Velozes e Furiosos', category: 'Filmes', difficulty: 'facil', aliases: ['fast and furious'] },
      { emoji: '👸🪞🍎', filme: 'Branca de Neve', category: 'Disney', difficulty: 'facil', aliases: ['branca de neve e os sete anoes'] },
      { emoji: '🐶🍝🐕', filme: 'A Dama e o Vagabundo', category: 'Disney', difficulty: 'facil', aliases: ['dama e o vagabundo'] }
    ];

    const insertStmt = this.db.prepare(`
      INSERT INTO challenges (id, emoji, filme, normalized_title, aliases_json, category, difficulty, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (let i = 0; i < initialChallenges.length; i++) {
      const c = initialChallenges[i];
      insertStmt.run(
        `chal_init_${i + 1}`,
        c.emoji,
        c.filme,
        normalizeAnswer(c.filme),
        JSON.stringify(c.aliases || []),
        c.category || 'Filmes',
        c.difficulty || 'medio',
        Date.now()
      );
    }
  }

  // --- Challenges Queries ---
  public getChallengeCount(): number {
    const result = this.db.prepare('SELECT count(*) AS count FROM challenges').get() as { count: number };
    return result.count;
  }

  public getAllChallenges(options?: { category?: string; search?: string; limit?: number; offset?: number }): { challenges: Challenge[]; total: number } {
    let query = 'SELECT * FROM challenges WHERE 1=1';
    const params: (string | number)[] = [];

    if (options?.category && options.category !== 'all') {
      query += ' AND category = ?';
      params.push(options.category);
    }

    if (options?.search && options.search.trim()) {
      query += ' AND (filme LIKE ? OR emoji LIKE ? OR normalized_title LIKE ?)';
      const s = `%${options.search.trim()}%`;
      params.push(s, s, `%${normalizeAnswer(options.search)}%`);
    }

    // Total count query
    const countSql = query.replace('SELECT *', 'SELECT count(*) as count');
    const countStmt = this.db.prepare(countSql);
    const countRow = (params.length > 0 ? countStmt.get(...params) : countStmt.get()) as { count: number };
    const total = countRow?.count ?? 0;

    query += ' ORDER BY created_at DESC';

    if (options?.limit) {
      query += ' LIMIT ?';
      params.push(options.limit);
      if (options?.offset) {
        query += ' OFFSET ?';
        params.push(options.offset);
      }
    }

    const selectStmt = this.db.prepare(query);
    const rows = (params.length > 0 ? selectStmt.all(...params) : selectStmt.all()) as any[];

    const challenges: Challenge[] = rows.map((r) => ({
      id: r.id,
      emoji: r.emoji,
      filme: r.filme,
      aliases: r.aliases_json ? JSON.parse(r.aliases_json) : [],
      category: r.category,
      difficulty: r.difficulty,
      createdAt: r.created_at,
    }));

    return { challenges, total };
  }

  public getChallengeById(id: string): Challenge | null {
    const stmt = this.db.prepare('SELECT * FROM challenges WHERE id = ?');
    const row = stmt.get(id) as any;
    if (!row) return null;
    return {
      id: row.id,
      emoji: row.emoji,
      filme: row.filme,
      aliases: row.aliases_json ? JSON.parse(row.aliases_json) : [],
      category: row.category,
      difficulty: row.difficulty,
      createdAt: row.created_at,
    };
  }

  public addChallenge(c: Challenge): void {
    const stmt = this.db.prepare(`
      INSERT INTO challenges (id, emoji, filme, normalized_title, aliases_json, category, difficulty, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      c.id,
      c.emoji,
      c.filme,
      normalizeAnswer(c.filme),
      JSON.stringify(c.aliases || []),
      c.category || 'Filmes',
      c.difficulty || 'medio',
      c.createdAt || Date.now()
    );
  }

  public updateChallenge(c: Challenge): void {
    const stmt = this.db.prepare(`
      UPDATE challenges
      SET emoji = ?, filme = ?, normalized_title = ?, aliases_json = ?, category = ?, difficulty = ?
      WHERE id = ?
    `);
    stmt.run(
      c.emoji,
      c.filme,
      normalizeAnswer(c.filme),
      JSON.stringify(c.aliases || []),
      c.category || 'Filmes',
      c.difficulty || 'medio',
      c.id
    );
  }

  public deleteChallenge(id: string): void {
    const stmt = this.db.prepare('DELETE FROM challenges WHERE id = ?');
    stmt.run(id);
  }

  public bulkAddChallenges(challenges: Challenge[], overwriteDuplicates: boolean): { inserted: number; updated: number; ignored: number } {
    let inserted = 0;
    let updated = 0;
    let ignored = 0;

    const findByTitle = this.db.prepare('SELECT id FROM challenges WHERE normalized_title = ?');
    const insertStmt = this.db.prepare(`
      INSERT INTO challenges (id, emoji, filme, normalized_title, aliases_json, category, difficulty, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const updateStmt = this.db.prepare(`
      UPDATE challenges
      SET emoji = ?, filme = ?, aliases_json = ?, category = ?, difficulty = ?
      WHERE id = ?
    `);

    // Using transaction block
    this.db.exec('BEGIN TRANSACTION');
    try {
      for (const c of challenges) {
        const norm = normalizeAnswer(c.filme);
        const existing = findByTitle.get(norm) as { id: string } | undefined;

        if (existing) {
          if (overwriteDuplicates) {
            updateStmt.run(
              c.emoji,
              c.filme,
              JSON.stringify(c.aliases || []),
              c.category || 'Filmes',
              c.difficulty || 'medio',
              existing.id
            );
            updated++;
          } else {
            ignored++;
          }
        } else {
          insertStmt.run(
            c.id,
            c.emoji,
            c.filme,
            norm,
            JSON.stringify(c.aliases || []),
            c.category || 'Filmes',
            c.difficulty || 'medio',
            c.createdAt || Date.now()
          );
          inserted++;
        }
      }
      this.db.exec('COMMIT');
    } catch (e) {
      this.db.exec('ROLLBACK');
      throw e;
    }

    return { inserted, updated, ignored };
  }

  // --- Settings ---
  public getSettings(): GameSettings {
    const stmt = this.db.prepare('SELECT key, value FROM settings');
    const rows = stmt.all() as { key: string; value: string }[];
    const result: any = { ...DEFAULT_SETTINGS };

    for (const r of rows) {
      try {
        result[r.key] = JSON.parse(r.value);
      } catch {
        result[r.key] = r.value;
      }
    }

    // Clean up any old forced emoji in name if the user configured an image icon
    if (Array.isArray(result.giftsConfig)) {
      result.giftsConfig = result.giftsConfig.map((g: any) => {
        if (g.iconType === 'image' && g.name && /^🫰\s*/.test(g.name)) {
          return {
            ...g,
            name: g.name.replace(/^🫰\s*/, ''),
          };
        }
        return g;
      });
    }

    return result as GameSettings;
  }

  public saveSettings(settings: Partial<GameSettings>): void {
    const upsertStmt = this.db.prepare(`
      INSERT INTO settings (key, value) VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `);

    for (const [key, value] of Object.entries(settings)) {
      upsertStmt.run(key, JSON.stringify(value));
    }
  }

  // --- Matches & Rounds History ---
  public recordMatch(match: { id: string; matchNumber: number; totalRounds: number; startedAt: number; completedAt: number; winners: PlayerScore[] }): void {
    const stmt = this.db.prepare(`
      INSERT INTO matches (id, match_number, total_rounds, started_at, completed_at, winners_json)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      match.id,
      match.matchNumber,
      match.totalRounds,
      match.startedAt,
      match.completedAt,
      JSON.stringify(match.winners)
    );
  }

  public recordRound(round: { id: string; matchId: string; roundNumber: number; challengeId: string; filme: string; emoji: string; winners: RoundWinner[] }): void {
    const stmt = this.db.prepare(`
      INSERT INTO round_history (id, match_id, round_number, challenge_id, filme, emoji, winners_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      round.id,
      round.matchId,
      round.roundNumber,
      round.challengeId,
      round.filme,
      round.emoji,
      JSON.stringify(round.winners),
      Date.now()
    );
  }

  public recordGift(gift: GiftEvent): void {
    const stmt = this.db.prepare(`
      INSERT INTO gifts_log (id, username, gift_name, action, effect_label, amount, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      gift.id,
      gift.username,
      gift.giftName,
      gift.action,
      gift.effectLabel,
      gift.amount,
      gift.timestamp
    );
  }

  public getRecentGiftsLog(limit: number = 50): GiftEvent[] {
    const stmt = this.db.prepare('SELECT * FROM gifts_log ORDER BY timestamp DESC LIMIT ?');
    const rows = stmt.all(limit) as any[];
    return rows.map((r) => ({
      id: r.id,
      username: r.username,
      giftName: r.gift_name,
      action: r.action,
      effectLabel: r.effect_label,
      amount: r.amount,
      timestamp: r.timestamp,
    }));
  }

  public getMatchHistory(limit: number = 20): any[] {
    const stmt = this.db.prepare('SELECT * FROM matches ORDER BY completed_at DESC LIMIT ?');
    const rows = stmt.all(limit) as any[];
    return rows.map((r) => ({
      id: r.id,
      matchNumber: r.match_number,
      totalRounds: r.total_rounds,
      startedAt: r.started_at,
      completedAt: r.completed_at,
      winners: r.winners_json ? JSON.parse(r.winners_json) : [],
    }));
  }
}
