import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from "@shared/schema";
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create database file in server directory
const dbPath = path.join(__dirname, 'database.sqlite');
const sqlite = new Database(dbPath);

// Enable WAL mode for better performance
sqlite.pragma('journal_mode = WAL');

export const db = drizzle(sqlite, { schema });

console.log(`📁 Banco SQLite inicializado: ${dbPath}`);

// Check if tables exist
try {
  const tables = sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  console.log('📊 Tabelas encontradas:', tables.map(t => t.name));
} catch (error) {
  console.log('⚠️ Erro ao verificar tabelas:', error);
}