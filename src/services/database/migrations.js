// Migrations do SQLite local (versão controlada por PRAGMA user_version).
// Cada entidade tem uma tabela com colunas de controle + o documento inteiro em JSON (coluna "data").
// A tabela sync_queue é a fila de pendências (outbox) que será enviada ao Firestore.

export const DB_NAME = 'jiad.db';
export const ENTITIES = ['alunos', 'cursos', 'matriculas'];

const MIGRATIONS = [
  // v1 — tabelas iniciais
  async (db) => {
    for (const table of ENTITIES) {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS ${table} (
          id         TEXT PRIMARY KEY NOT NULL,
          userId     TEXT NOT NULL,
          data       TEXT NOT NULL,
          updatedAt  TEXT NOT NULL,
          syncStatus TEXT NOT NULL DEFAULT 'synced',
          deleted    INTEGER NOT NULL DEFAULT 0
        );
        CREATE INDEX IF NOT EXISTS idx_${table}_user ON ${table}(userId);
      `);
    }

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS sync_queue (
        id        TEXT PRIMARY KEY NOT NULL,
        userId    TEXT NOT NULL,
        operation TEXT NOT NULL,
        entity    TEXT NOT NULL,
        entityId  TEXT NOT NULL,
        payload   TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        status    TEXT NOT NULL DEFAULT 'pending',
        attempts  INTEGER NOT NULL DEFAULT 0,
        lastError TEXT
      );
      CREATE UNIQUE INDEX IF NOT EXISTS idx_queue_record ON sync_queue(entity, entityId);
    `);
    // operation: create | update | delete   —   status: pending | error
    // O índice único garante no máximo UMA pendência por registro (evita envio duplicado).
  },
];

export async function runMigrations(db) {
  await db.execAsync('PRAGMA journal_mode = WAL;');
  const row = await db.getFirstAsync('PRAGMA user_version');
  let version = row?.user_version ?? 0;

  while (version < MIGRATIONS.length) {
    await MIGRATIONS[version](db);
    version += 1;
    await db.execAsync(`PRAGMA user_version = ${version}`);
  }
}
