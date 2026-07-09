import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { existsSync } from 'node:fs'
import { dirname } from 'node:path'
import { mkdirSync } from 'node:fs'

export type HarborDatabase = {
  db: Database.Database
  close: () => void
}

// AC-009 + atlas L-1: cria harbor.db + PRAGMA journal_mode=WAL + busy_timeout=5000.
// Drizzle schema stub vazio (nenhuma tabela de domínio no scaffold).
export function openDatabase(dbPath: string): HarborDatabase {
  const dir = dirname(dbPath)
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }

  const db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('busy_timeout = 5000')

  // ponytail: schema vazio — drizzle-orm inicializado sem tabelas; domínio adicionado quando features chegarem.
  drizzle(db)

  return { db, close: () => db.close() }
}