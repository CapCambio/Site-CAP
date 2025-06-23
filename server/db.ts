
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from "@shared/schema";
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Caminho para o arquivo SQLite
const dbPath = path.join(__dirname, 'database.sqlite');

// Criar conexão SQLite
const sqlite = new Database(dbPath);
sqlite.pragma('foreign_keys = ON');

export const db = drizzle(sqlite, { schema });

// Inicializar banco
export function initializeDatabase() {
  try {
    const tables = sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    console.log('📁 Banco SQLite inicializado:', dbPath);
    console.log('📊 Tabelas encontradas:', tables.map((t: any) => t.name));
  } catch (error) {
    console.error('❌ Erro ao inicializar banco SQLite:', error);
  }
}
