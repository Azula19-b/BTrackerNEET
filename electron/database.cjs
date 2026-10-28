const Database = require('better-sqlite3');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const UNDERSTANDING = ['none', 'partial', 'full'];
const PROGRESS = ['not_started', 'partial', 'solved'];

function now() { return new Date().toISOString(); }
function id(prefix = 'custom') { return `${prefix}-${crypto.randomUUID()}`; }
function ensure(value, allowed, label) {
  if (!allowed.includes(value)) throw new Error(`Invalid ${label}`);
  return value;
}

function createDatabase(filename, catalog = []) {
  const existed = filename !== ':memory:' && fs.existsSync(filename);
  const db = new Database(filename);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  migrate(db, existed);
  if (catalog.length) seedCatalog(db, catalog);
  return makeRepository(db);
}

function migrate(db, createBackup = false) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS problems (
      id TEXT PRIMARY KEY,
      source TEXT NOT NULL CHECK(source IN ('builtin','custom')),
      position INTEGER,
      title TEXT NOT NULL,
      url TEXT NOT NULL UNIQUE,
      neetcode_url TEXT,
      topic TEXT NOT NULL,
      difficulty TEXT NOT NULL CHECK(difficulty IN ('Easy','Medium','Hard')),
      summary TEXT NOT NULL,
      examples TEXT NOT NULL DEFAULT '[]',
      starter_code TEXT NOT NULL DEFAULT '',
      solution_code TEXT NOT NULL DEFAULT '',
      hints TEXT NOT NULL DEFAULT '[]',
      explanation TEXT NOT NULL DEFAULT '',
      walkthrough TEXT NOT NULL DEFAULT '',
      time_complexity TEXT NOT NULL DEFAULT '',
      space_complexity TEXT NOT NULL DEFAULT '',
      cpp_concepts TEXT NOT NULL DEFAULT '[]',
      personal_notes TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS user_progress (
      problem_id TEXT PRIMARY KEY REFERENCES problems(id) ON DELETE CASCADE,
      understanding TEXT NOT NULL DEFAULT 'none' CHECK(understanding IN ('none','partial','full')),
      solving_progress TEXT NOT NULL DEFAULT 'not_started' CHECK(solving_progress IN ('not_started','partial','solved')),
      solution_viewed INTEGER NOT NULL DEFAULT 0,
      hints_used INTEGER NOT NULL DEFAULT 0,
      last_practiced_at TEXT,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS practice_sessions (
      id TEXT PRIMARY KEY,
      problem_id TEXT NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
      started_at TEXT NOT NULL,
      ended_at TEXT,
      hints_used INTEGER NOT NULL DEFAULT 0,
      solution_viewed INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS code_attempts (
      id TEXT PRIMARY KEY,
      problem_id TEXT NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
      session_id TEXT REFERENCES practice_sessions(id) ON DELETE SET NULL,
      code TEXT NOT NULL,
      is_draft INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE UNIQUE INDEX IF NOT EXISTS one_draft_per_problem ON code_attempts(problem_id) WHERE is_draft = 1;
    CREATE TABLE IF NOT EXISTS hint_views (
      id TEXT PRIMARY KEY,
      problem_id TEXT NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
      session_id TEXT REFERENCES practice_sessions(id) ON DELETE SET NULL,
      hint_number INTEGER NOT NULL CHECK(hint_number BETWEEN 1 AND 3),
      viewed_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS review_schedules (
      problem_id TEXT PRIMARY KEY REFERENCES problems(id) ON DELETE CASCADE,
      next_review_date TEXT NOT NULL,
      manually_set INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS review_history (
      id TEXT PRIMARY KEY,
      problem_id TEXT NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
      reviewed_at TEXT NOT NULL,
      understanding TEXT NOT NULL,
      solving_progress TEXT NOT NULL,
      notes TEXT NOT NULL DEFAULT ''
    );
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY, value TEXT NOT NULL
    );
    INSERT OR IGNORE INTO schema_migrations(version, applied_at) VALUES (1, datetime('now'));
  `);
  const version = db.prepare('SELECT MAX(version) AS version FROM schema_migrations').get().version || 1;
  if (version < 2) {
    if (createBackup && db.name && db.name !== ':memory:') {
      const backup = `${db.name}.pre-v2-${new Date().toISOString().replace(/[:.]/g, '-')}.bak`;
      db.prepare('VACUUM INTO ?').run(backup);
    }
    const columns = new Set(db.prepare('PRAGMA table_info(problems)').all().map(column => column.name));
    const additions = [
      ['constraints', "TEXT NOT NULL DEFAULT '[]'"],
      ['contract', "TEXT NOT NULL DEFAULT '{}'"],
      ['sample_inputs', "TEXT NOT NULL DEFAULT '[]'"],
      ['harness', "TEXT NOT NULL DEFAULT ''"],
      ['local_tests', "TEXT NOT NULL DEFAULT '[]'"],
    ];
    const apply = db.transaction(() => {
      for (const [name, definition] of additions) if (!columns.has(name)) db.exec(`ALTER TABLE problems ADD COLUMN ${name} ${definition}`);
      db.prepare('INSERT INTO schema_migrations(version,applied_at) VALUES (2,?)').run(now());
    });
    apply();
  }
}

function seedCatalog(db, catalog) {
  const insert = db.prepare(`INSERT INTO problems (
    id,source,position,title,url,neetcode_url,topic,difficulty,summary,examples,constraints,starter_code,
    solution_code,hints,explanation,walkthrough,time_complexity,space_complexity,cpp_concepts,
    contract,sample_inputs,harness,local_tests,created_at,updated_at
  ) VALUES (@id,'builtin',@position,@title,@url,@neetcodeUrl,@topic,@difficulty,@summary,@examples,@constraints,@starterCode,
    @solutionCode,@hints,@explanation,@walkthrough,@timeComplexity,@spaceComplexity,@cppConcepts,
    @contract,@sample_inputs,@harness,@local_tests,@timestamp,@timestamp)
  ON CONFLICT(id) DO UPDATE SET
    position=excluded.position,title=excluded.title,url=excluded.url,neetcode_url=excluded.neetcode_url,
    topic=excluded.topic,difficulty=excluded.difficulty,summary=excluded.summary,examples=excluded.examples,constraints=excluded.constraints,
    starter_code=excluded.starter_code,solution_code=excluded.solution_code,hints=excluded.hints,
    explanation=excluded.explanation,walkthrough=excluded.walkthrough,time_complexity=excluded.time_complexity,
    space_complexity=excluded.space_complexity,cpp_concepts=excluded.cpp_concepts,contract=excluded.contract,
    sample_inputs=excluded.sample_inputs,harness=excluded.harness,local_tests=excluded.local_tests,updated_at=excluded.updated_at`);
  const seed = db.transaction(() => {
    for (const item of catalog) insert.run({
      ...item,
      examples: JSON.stringify(item.examples),
      constraints: JSON.stringify(item.constraints || []),
      hints: JSON.stringify(item.hints),
      cppConcepts: JSON.stringify(item.cppConcepts),
      contract: JSON.stringify(item.contract || {}),
      sample_inputs: JSON.stringify(item.sampleInputs || []),
      harness: item.harness || '',
      local_tests: JSON.stringify(item.localTests || []),
      timestamp: now(),
    });
    db.prepare(`INSERT OR IGNORE INTO user_progress(problem_id,updated_at)
      SELECT id, ? FROM problems WHERE source='builtin'`).run(now());
  });
  seed();
}

function hydrate(row) {
  if (!row) return null;
  return {
    ...row,
    examples: JSON.parse(row.examples || '[]'),
    constraints: JSON.parse(row.constraints || '[]'),
    hints: JSON.parse(row.hints || '[]'),
    cpp_concepts: JSON.parse(row.cpp_concepts || '[]'),
    contract: JSON.parse(row.contract || '{}'),
    sample_inputs: JSON.parse(row.sample_inputs || '[]'),
    local_tests: JSON.parse(row.local_tests || '[]'),
    solution_viewed: Boolean(row.solution_viewed),
  };
}

function makeRepository(db) {
  const baseSelect = `SELECT p.*,u.understanding,u.solving_progress,u.solution_viewed,u.hints_used,
    u.last_practiced_at,r.next_review_date
    FROM problems p LEFT JOIN user_progress u ON u.problem_id=p.id
    LEFT JOIN review_schedules r ON r.problem_id=p.id`;

  return {
    db,
    close: () => db.close(),
    listProblems(filters = {}) {
      const clauses = [], values = {};
      if (filters.source) { clauses.push('p.source=@source'); values.source = filters.source; }
      if (filters.topic) { clauses.push('p.topic=@topic'); values.topic = filters.topic; }
      if (filters.difficulty) { clauses.push('p.difficulty=@difficulty'); values.difficulty = filters.difficulty; }
      if (filters.understanding) { clauses.push('u.understanding=@understanding'); values.understanding = filters.understanding; }
      if (filters.progress) { clauses.push('u.solving_progress=@progress'); values.progress = filters.progress; }
      if (filters.search) { clauses.push('(p.title LIKE @search OR p.summary LIKE @search)'); values.search = `%${filters.search}%`; }
      const where = clauses.length ? ` WHERE ${clauses.join(' AND ')}` : '';
      const sortMap = { title: 'p.title COLLATE NOCASE', difficulty: "CASE p.difficulty WHEN 'Easy' THEN 1 WHEN 'Medium' THEN 2 ELSE 3 END", practiced: 'u.last_practiced_at DESC', review: 'r.next_review_date' };
      return db.prepare(`${baseSelect}${where} ORDER BY ${sortMap[filters.sort] || "p.source='custom', p.position, p.title"}`).all(values).map(hydrate);
    },
    getProblem(problemId) { return hydrate(db.prepare(`${baseSelect} WHERE p.id=?`).get(problemId)); },
    addCustomProblem(input) {
      if (!input.title?.trim() || !/^https?:\/\//.test(input.url || '')) throw new Error('A title and valid URL are required');
      const problemId = id(); const timestamp = now();
      const row = {
        id: problemId, source: 'custom', position: null, title: input.title.trim(), url: input.url.trim(), neetcode_url: null,
        topic: input.topic || 'Arrays & Hashing', difficulty: input.difficulty || 'Medium', summary: input.summary?.trim() || 'Personal practice problem.',
        examples: JSON.stringify(input.examples || []), starter_code: input.starterCode || '', solution_code: input.solutionCode || '',
        hints: JSON.stringify((input.hints || []).filter(Boolean).slice(0, 3)), explanation: input.explanation || '', walkthrough: '',
        time_complexity: '', space_complexity: '', cpp_concepts: '[]', personal_notes: input.personalNotes || '', created_at: timestamp, updated_at: timestamp,
      };
      const add = db.transaction(() => {
        db.prepare(`INSERT INTO problems (${Object.keys(row).join(',')}) VALUES (${Object.keys(row).map(k => `@${k}`).join(',')})`).run(row);
        db.prepare('INSERT INTO user_progress(problem_id,updated_at) VALUES (?,?)').run(problemId, timestamp);
      });
      try { add(); } catch (error) { if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') throw new Error('A problem with this URL already exists'); throw error; }
      return this.getProblem(problemId);
    },
    updateCustomProblem(problemId, input) {
      const current = this.getProblem(problemId);
      if (!current || current.source !== 'custom') throw new Error('Custom problem not found');
      const fields = ['title','url','topic','difficulty','summary','personal_notes','starter_code','solution_code'];
      const values = { id: problemId, updated_at: now() };
      for (const field of fields) values[field] = input[field] ?? current[field];
      values.hints = JSON.stringify(input.hints ?? current.hints);
      db.prepare(`UPDATE problems SET title=@title,url=@url,topic=@topic,difficulty=@difficulty,summary=@summary,
        personal_notes=@personal_notes,starter_code=@starter_code,solution_code=@solution_code,hints=@hints,updated_at=@updated_at WHERE id=@id AND source='custom'`).run(values);
      return this.getProblem(problemId);
    },
    deleteCustomProblem(problemId) { return db.prepare("DELETE FROM problems WHERE id=? AND source='custom'").run(problemId).changes > 0; },
    updateProgress(problemId, changes) {
      const current = db.prepare('SELECT * FROM user_progress WHERE problem_id=?').get(problemId);
      if (!current) throw new Error('Problem progress not found');
      const understanding = ensure(changes.understanding ?? current.understanding, UNDERSTANDING, 'understanding');
      const solving = ensure(changes.solvingProgress ?? current.solving_progress, PROGRESS, 'solving progress');
      db.prepare('UPDATE user_progress SET understanding=?,solving_progress=?,updated_at=? WHERE problem_id=?').run(understanding, solving, now(), problemId);
      if (changes.understanding) this.scheduleReview(problemId, null, false, understanding);
      return this.getProblem(problemId);
    },
    updateNotes(problemId, notes) {
      if (typeof notes !== 'string' || notes.length > 100000) throw new Error('Invalid notes');
      const result = db.prepare('UPDATE problems SET personal_notes=?,updated_at=? WHERE id=?').run(notes, now(), problemId);
      if (!result.changes) throw new Error('Problem not found');
      return { savedAt: now() };
    },
    startSession(problemId) {
      const sessionId = id('session');
      db.prepare('INSERT INTO practice_sessions(id,problem_id,started_at) VALUES (?,?,?)').run(sessionId, problemId, now());
      db.prepare('UPDATE user_progress SET last_practiced_at=?,updated_at=? WHERE problem_id=?').run(now(), now(), problemId);
      return { id: sessionId };
    },
    endSession(sessionId) { db.prepare('UPDATE practice_sessions SET ended_at=? WHERE id=?').run(now(), sessionId); },
    saveDraft(problemId, code, sessionId = null) {
      const existing = db.prepare('SELECT id FROM code_attempts WHERE problem_id=? AND is_draft=1').get(problemId);
      const timestamp = now();
      if (existing) db.prepare('UPDATE code_attempts SET code=?,session_id=COALESCE(?,session_id),updated_at=? WHERE id=?').run(code, sessionId, timestamp, existing.id);
      else db.prepare('INSERT INTO code_attempts(id,problem_id,session_id,code,is_draft,created_at,updated_at) VALUES (?,?,?,?,1,?,?)').run(id('attempt'), problemId, sessionId, code, timestamp, timestamp);
      return { savedAt: timestamp };
    },
    saveAttempt(problemId, code, sessionId = null) {
      const timestamp = now();
      const attemptId = id('attempt');
      db.prepare('INSERT INTO code_attempts(id,problem_id,session_id,code,is_draft,created_at,updated_at) VALUES (?,?,?,?,0,?,?)').run(attemptId, problemId, sessionId, code, timestamp, timestamp);
      return { id: attemptId, createdAt: timestamp };
    },
    getAttempts(problemId) { return db.prepare('SELECT * FROM code_attempts WHERE problem_id=? ORDER BY is_draft DESC,updated_at DESC').all(problemId); },
    viewHint(problemId, hintNumber, sessionId = null) {
      if (![1,2,3].includes(hintNumber)) throw new Error('Invalid hint number');
      db.prepare('INSERT INTO hint_views(id,problem_id,session_id,hint_number,viewed_at) VALUES (?,?,?,?,?)').run(id('hint'), problemId, sessionId, hintNumber, now());
      db.prepare('UPDATE user_progress SET hints_used=MAX(hints_used,?),updated_at=? WHERE problem_id=?').run(hintNumber, now(), problemId);
      if (sessionId) db.prepare('UPDATE practice_sessions SET hints_used=MAX(hints_used,?) WHERE id=?').run(hintNumber, sessionId);
      return { hintNumber };
    },
    revealSolution(problemId, sessionId = null) {
      db.prepare('UPDATE user_progress SET solution_viewed=1,updated_at=? WHERE problem_id=?').run(now(), problemId);
      if (sessionId) db.prepare('UPDATE practice_sessions SET solution_viewed=1 WHERE id=?').run(sessionId);
      return true;
    },
    scheduleReview(problemId, date = null, manual = true, understanding = null) {
      const level = understanding || db.prepare('SELECT understanding FROM user_progress WHERE problem_id=?').get(problemId)?.understanding || 'none';
      const days = { none: 1, partial: 3, full: 7 }[level];
      const next = date || new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);
      db.prepare(`INSERT INTO review_schedules(problem_id,next_review_date,manually_set,updated_at) VALUES (?,?,?,?)
        ON CONFLICT(problem_id) DO UPDATE SET next_review_date=excluded.next_review_date,manually_set=excluded.manually_set,updated_at=excluded.updated_at`).run(problemId, next, manual ? 1 : 0, now());
      return { nextReviewDate: next };
    },
    completeReview(problemId, data) {
      ensure(data.understanding, UNDERSTANDING, 'understanding'); ensure(data.solvingProgress, PROGRESS, 'solving progress');
      const action = db.transaction(() => {
        this.updateProgress(problemId, data);
        db.prepare('INSERT INTO review_history(id,problem_id,reviewed_at,understanding,solving_progress,notes) VALUES (?,?,?,?,?,?)').run(id('review'), problemId, now(), data.understanding, data.solvingProgress, data.notes || '');
      }); action(); return this.scheduleReview(problemId, null, false, data.understanding);
    },
    getReviews() {
      const today = new Date().toISOString().slice(0, 10);
      return db.prepare(`${baseSelect} WHERE r.next_review_date IS NOT NULL ORDER BY r.next_review_date`).all().map(row => ({ ...hydrate(row), review_state: row.next_review_date < today ? 'overdue' : row.next_review_date === today ? 'due' : 'upcoming' }));
    },
    getAnalytics() {
      const count = (where = '1=1') => db.prepare(`SELECT COUNT(*) n FROM problems p LEFT JOIN user_progress u ON u.problem_id=p.id WHERE ${where}`).get().n;
      const due = db.prepare("SELECT COUNT(*) n FROM review_schedules WHERE next_review_date <= date('now')").get().n;
      const topic = db.prepare(`SELECT p.topic,COUNT(*) total,SUM(u.solving_progress='solved') solved FROM problems p JOIN user_progress u ON u.problem_id=p.id GROUP BY p.topic ORDER BY MIN(p.position)`).all();
      const recent = db.prepare(`${baseSelect} WHERE u.last_practiced_at IS NOT NULL ORDER BY u.last_practiced_at DESC LIMIT 5`).all().map(hydrate);
      const dates = db.prepare("SELECT DISTINCT date(started_at) d FROM practice_sessions ORDER BY d DESC").all().map(x => x.d);
      let streak = 0, cursor = new Date();
      if (dates[0] && dates[0] < cursor.toISOString().slice(0,10)) cursor = new Date(Date.now() - 86400000);
      for (const d of dates) { if (d === cursor.toISOString().slice(0,10)) { streak++; cursor = new Date(cursor.getTime() - 86400000); } else break; }
      return {
        total: count(), builtin: count("p.source='builtin'"), custom: count("p.source='custom'"),
        solved: count("u.solving_progress='solved'"), partialSolved: count("u.solving_progress='partial'"), notStarted: count("u.solving_progress='not_started'"),
        full: count("u.understanding='full'"), partialUnderstanding: count("u.understanding='partial'"), none: count("u.understanding='none'"),
        due, sessions: db.prepare('SELECT COUNT(*) n FROM practice_sessions').get().n, streak, topic, recent,
      };
    },
    exportData() {
      const tables = ['problems','user_progress','practice_sessions','code_attempts','hint_views','review_schedules','review_history','settings'];
      return { version: 1, exportedAt: now(), data: Object.fromEntries(tables.map(table => [table, db.prepare(`SELECT * FROM ${table}`).all()])) };
    },
    importData(payload) {
      if (payload?.version !== 1 || !payload.data) throw new Error('Unsupported backup format');
      const tables = ['problems','user_progress','practice_sessions','code_attempts','hint_views','review_schedules','review_history','settings'];
      const importAll = db.transaction(() => {
        for (const table of tables) for (const row of payload.data[table] || []) {
          const keys = Object.keys(row); db.prepare(`INSERT OR REPLACE INTO ${table} (${keys.join(',')}) VALUES (${keys.map(k=>`@${k}`).join(',')})`).run(row);
        }
      }); importAll(); return true;
    },
  };
}

function loadCatalog() {
  const file = path.join(__dirname, '..', 'data', 'neetcode150.json');
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : [];
}

module.exports = { createDatabase, loadCatalog, UNDERSTANDING, PROGRESS };
