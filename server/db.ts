import pg from 'pg';

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('❌ DATABASE_URL não está definida nas variáveis de ambiente! Configure no Railway antes de fazer deploy.');
}

console.log('✅ DATABASE_URL carregada:', connectionString.replace(/:[^:@]+@/, ':****@'));

export const pool = new Pool({
  connectionString,
  ssl: connectionString ? { rejectUnauthorized: false } : false, // Supabase Pooler exige SSL sem verificação de certificado
  max: 15,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000
});

// Inicializar tabela de histórico de moedas
export async function initializeCurrencyHistoryTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS currency_history (
        id SERIAL PRIMARY KEY,
        code VARCHAR(10) NOT NULL,
        buy_price DECIMAL(10, 6) NOT NULL,
        sell_price DECIMAL(10, 6) NOT NULL,
        timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `);

    // Criar índice para melhorar performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_currency_history_code_timestamp
      ON currency_history (code, timestamp DESC)
    `);

    console.log('✅ Tabela currency_history inicializada');
  } catch (error) {
    console.error('❌ Erro ao inicializar tabela currency_history:', error);
  }
}

// Garantir colunas necessárias na tabela alerts
export async function initializeAlertsTable() {
  try {
    await pool.query(`
      ALTER TABLE alerts
      ADD COLUMN IF NOT EXISTS validade TIMESTAMP WITH TIME ZONE,
      ADD COLUMN IF NOT EXISTS valor DECIMAL(10, 6),
      ADD COLUMN IF NOT EXISTS condicao_valor VARCHAR(10)
    `);
    console.log('✅ Colunas da tabela alerts verificadas');
  } catch (error) {
    console.error('❌ Erro ao verificar colunas da tabela alerts:', error);
  }
}

// Garante 1 alerta por (usuário, moeda): remove duplicados históricos (mantém o
// mais recente) e cria índice UNIQUE. Precisa rodar ANTES do addAlert fazer upsert,
// pois o ON CONFLICT exige a constraint existente.
export async function initializeAlertsUniqueness() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`
      DELETE FROM alerts a
      WHERE EXISTS (
        SELECT 1 FROM alerts b
        WHERE b.user_email = a.user_email
          AND b.currency_code = a.currency_code
          AND (b.created_at, b.id) > (a.created_at, a.id)
      )
    `);
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS uniq_alerts_user_currency
      ON alerts (user_email, currency_code)
    `);
    await client.query('COMMIT');
    console.log('✅ Unicidade de alertas (1 por usuário+moeda) verificada');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Erro ao impor unicidade de alertas:', error);
  } finally {
    client.release();
  }
}

// Adicionar colunas de preferências de usuário (idioma + ordem dos cards + canais de aviso)
export async function initializeUserPreferencesColumns() {
  try {
    await pool.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS language VARCHAR(5) DEFAULT 'pt',
      ADD COLUMN IF NOT EXISTS card_order JSONB,
      ADD COLUMN IF NOT EXISTS notify_email BOOLEAN DEFAULT TRUE,
      ADD COLUMN IF NOT EXISTS notify_push BOOLEAN DEFAULT TRUE
    `);
    console.log('✅ Colunas de preferências (language, card_order, notify_email, notify_push) verificadas');
  } catch (error) {
    console.error('❌ Erro ao verificar colunas de preferências:', error);
  }
}

export async function updateUserPreferences(
  email: string,
  prefs: { language?: string; cardOrder?: string[]; notifyEmail?: boolean; notifyPush?: boolean }
): Promise<boolean> {
  const fields: string[] = [];
  const values: any[] = [];
  let idx = 1;
  if (prefs.language !== undefined) {
    fields.push(`language = $${idx++}`);
    values.push(prefs.language);
  }
  if (prefs.cardOrder !== undefined) {
    fields.push(`card_order = $${idx++}`);
    values.push(JSON.stringify(prefs.cardOrder));
  }
  if (prefs.notifyEmail !== undefined) {
    fields.push(`notify_email = $${idx++}`);
    values.push(prefs.notifyEmail);
  }
  if (prefs.notifyPush !== undefined) {
    fields.push(`notify_push = $${idx++}`);
    values.push(prefs.notifyPush);
  }
  if (fields.length === 0) return false;
  values.push(email.toLowerCase());
  const result = await pool.query(
    `UPDATE users SET ${fields.join(', ')} WHERE email = $${idx}`,
    values
  );
  return (result.rowCount ?? 0) > 0;
}

export async function getAllUserPreferences(): Promise<
  Array<{ email: string; language: string; cardOrder: string[]; notifyEmail: boolean; notifyPush: boolean }>
> {
  // SELECT * para tolerar a corrida no primeiro boot pós-deploy: se ALTER TABLE ainda não
  // commitou quando esta query roda, as colunas novas simplesmente não aparecem no row e os
  // defaults abaixo preservam o comportamento.
  const result = await pool.query('SELECT * FROM users');
  return result.rows.map((r: any) => ({
    email: r.email,
    language: r.language || 'pt',
    cardOrder: Array.isArray(r.card_order) ? r.card_order : [],
    notifyEmail: r.notify_email !== false,
    notifyPush: r.notify_push !== false
  }));
}

// Inicializar tabela de sessões ativas (bloqueio de login simultâneo)
export async function initializeActiveSessionsTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS active_sessions (
        email VARCHAR(255) PRIMARY KEY,
        session_id VARCHAR(64),
        last_activity TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `);
    // Tabela criada numa versão anterior não tinha session_id — adiciona de forma idempotente
    await pool.query(`
      ALTER TABLE active_sessions ADD COLUMN IF NOT EXISTS session_id VARCHAR(64)
    `);
    console.log('✅ Tabela active_sessions inicializada');
  } catch (error) {
    console.error('❌ Erro ao inicializar tabela active_sessions:', error);
  }
}

// Retorna o heartbeat + dono da sessão, ou null se não houver registro
export async function getActiveSession(email: string): Promise<{ lastActivity: Date; sessionId: string | null } | null> {
  const result = await pool.query(
    'SELECT last_activity, session_id FROM active_sessions WHERE email = $1',
    [email.toLowerCase()]
  );
  if (result.rows.length === 0) return null;
  return { lastActivity: result.rows[0].last_activity, sessionId: result.rows[0].session_id };
}

// Login: assume a posse da sessão para este dispositivo (UPSERT com novo session_id)
export async function claimActiveSession(email: string, sessionId: string): Promise<void> {
  await pool.query(
    `INSERT INTO active_sessions (email, session_id, last_activity)
     VALUES ($1, $2, NOW())
     ON CONFLICT (email) DO UPDATE SET session_id = EXCLUDED.session_id, last_activity = NOW()`,
    [email.toLowerCase(), sessionId]
  );
}

// Sessão do dispositivo que atualmente "possui" o login deste e-mail, ou null
export async function getCurrentSessionId(email: string): Promise<string | null> {
  const result = await pool.query(
    'SELECT session_id FROM active_sessions WHERE email = $1',
    [email.toLowerCase()]
  );
  if (result.rows.length === 0) return null;
  return result.rows[0].session_id;
}

// Heartbeat com identidade: renova apenas se este dispositivo ainda for o dono.
// Retorna false quando a sessão foi substituída por outro dispositivo (seria expulso).
// Se a linha sumiu (sem dono), reivindicar para este session_id (self-heal).
export async function heartbeatActiveSession(email: string, sessionId: string): Promise<boolean> {
  const updated = await pool.query(
    'UPDATE active_sessions SET last_activity = NOW() WHERE email = $1 AND session_id = $2',
    [email.toLowerCase(), sessionId]
  );
  if ((updated.rowCount ?? 0) > 0) return true;

  const current = await getCurrentSessionId(email);
  if (current === null) {
    await claimActiveSession(email, sessionId);
    return true;
  }
  return false;
}

// Heartbeat legado (token antigo, sem session_id): apenas renova.
export async function touchActiveSession(email: string): Promise<void> {
  await pool.query(
    `INSERT INTO active_sessions (email, last_activity)
     VALUES ($1, NOW())
     ON CONFLICT (email) DO UPDATE SET last_activity = NOW()`,
    [email.toLowerCase()]
  );
}

// Remove a sessão (logout). Quando sessionId é informado, só derruba se este for o dono —
// assim o logout de um dispositivo já substituído não expulsa o dispositivo atual.
export async function releaseActiveSession(email: string, sessionId?: string | null): Promise<void> {
  if (sessionId) {
    await pool.query(
      'DELETE FROM active_sessions WHERE email = $1 AND session_id = $2',
      [email.toLowerCase(), sessionId]
    );
  } else {
    await pool.query('DELETE FROM active_sessions WHERE email = $1', [email.toLowerCase()]);
  }
}

export interface User {
  id: number;
  email: string;
  name: string;
  password: string | null;
  is_admin: boolean;
  last_access: string | null;
  created_at: string;
}

export interface Alert {
  id: number;
  user_email: string;
  currency_code: string;
  tipo: string | null;
  ativo: boolean;
  valor: number | null;
  condicao_valor: string | null;
  validade: string | null;
  created_at: string;
}

export interface CurrencyHistory {
  id: number;
  code: string;
  buy_price: number;
  sell_price: number;
  timestamp: string;
}

export interface PushSubscription {
  id: number;
  email: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  timestamp: string;
}

// Funções para usuários
export async function getUsers(): Promise<User[]> {
  const result = await pool.query('SELECT * FROM users ORDER BY created_at DESC');
  return result.rows;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const result = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
  return result.rows[0] || null;
}

export async function getAuthorizedEmails(): Promise<User[]> {
  const result = await pool.query('SELECT * FROM users WHERE is_admin = false ORDER BY email');
  return result.rows;
}

export async function getAdminEmails(): Promise<User[]> {
  const result = await pool.query('SELECT * FROM users WHERE is_admin = true ORDER BY email');
  return result.rows;
}

export async function addUser(user: Partial<User>): Promise<User> {
  const result = await pool.query(
    `INSERT INTO users (email, name, password, is_admin, last_access, created_at)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [user.email?.toLowerCase(), user.name, user.password || null, user.is_admin || false, user.last_access || null, user.created_at || new Date()]
  );
  return result.rows[0];
}

export async function updateUser(email: string, updates: Partial<User>): Promise<User | null> {
  const fields = [];
  const values = [];
  let paramIndex = 1;

  if (updates.name !== undefined) {
    fields.push(`name = $${paramIndex++}`);
    values.push(updates.name);
  }
  if (updates.password !== undefined) {
    fields.push(`password = $${paramIndex++}`);
    values.push(updates.password);
  }
  if (updates.is_admin !== undefined) {
    fields.push(`is_admin = $${paramIndex++}`);
    values.push(updates.is_admin);
  }
  if (updates.last_access !== undefined) {
    fields.push(`last_access = $${paramIndex++}`);
    values.push(updates.last_access);
  }

  if (fields.length === 0) return null;

  values.push(email.toLowerCase());
  const result = await pool.query(
    `UPDATE users SET ${fields.join(', ')} WHERE email = $${paramIndex} RETURNING *`,
    values
  );
  return result.rows[0] || null;
}

export async function deleteUser(email: string): Promise<boolean> {
  const result = await pool.query('DELETE FROM users WHERE email = $1', [email.toLowerCase()]);
  return (result.rowCount || 0) > 0;
}

// Migração: converte senhas admin em plaintext para bcrypt hash (roda no startup)
export async function migrateAdminPasswordsToHash(): Promise<void> {
  const bcrypt = (await import('bcryptjs')).default;
  const BCRYPT_PATTERN = /^\$2[aby]\$\d{2}\$.{53}$/;

  const admins = await pool.query(
    "SELECT email, password FROM users WHERE is_admin = true AND password IS NOT NULL"
  );

  let migrated = 0;
  for (const row of admins.rows) {
    const stored = row.password as string;
    if (!stored || BCRYPT_PATTERN.test(stored)) continue;
    const hashed = bcrypt.hashSync(stored, 10);
    await pool.query('UPDATE users SET password = $1 WHERE email = $2', [hashed, row.email]);
    migrated++;
    console.log(`🔐 Senha migrada p/ bcrypt: ${row.email}`);
  }

  if (migrated > 0) {
    console.log(`✅ Migração de senhas: ${migrated} admin(s) convertidos para bcrypt`);
  } else {
    console.log('✅ Senhas admin já estão em bcrypt — nenhuma migração necessária');
  }
}

// Funções para alertas
export async function getAlerts(): Promise<Alert[]> {
  const result = await pool.query('SELECT * FROM alerts ORDER BY created_at DESC');
  return result.rows;
}

export async function getAlertsByUser(email: string): Promise<Alert[]> {
  const result = await pool.query('SELECT * FROM alerts WHERE user_email = $1 ORDER BY created_at DESC', [email.toLowerCase()]);
  return result.rows;
}

export async function addAlert(alert: Partial<Alert>): Promise<Alert> {
  const result = await pool.query(
    `INSERT INTO alerts (user_email, currency_code, tipo, ativo, valor, condicao_valor, validade)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (user_email, currency_code)
     DO UPDATE SET
       tipo = EXCLUDED.tipo,
       ativo = EXCLUDED.ativo,
       valor = EXCLUDED.valor,
       condicao_valor = EXCLUDED.condicao_valor,
       validade = EXCLUDED.validade,
       created_at = NOW()
     RETURNING *`,
    [alert.user_email?.toLowerCase(), alert.currency_code, alert.tipo || null, alert.ativo || true, alert.valor || null, alert.condicao_valor || null, alert.validade || null]
  );
  return result.rows[0];
}

export async function updateAlert(id: number, updates: Partial<Alert>): Promise<Alert | null> {
  const fields = [];
  const values = [];
  let paramIndex = 1;

  if (updates.tipo !== undefined) {
    fields.push(`tipo = $${paramIndex++}`);
    values.push(updates.tipo);
  }
  if (updates.ativo !== undefined) {
    fields.push(`ativo = $${paramIndex++}`);
    values.push(updates.ativo);
  }
  if (updates.valor !== undefined) {
    fields.push(`valor = $${paramIndex++}`);
    values.push(updates.valor);
  }
  if (updates.condicao_valor !== undefined) {
    fields.push(`condicao_valor = $${paramIndex++}`);
    values.push(updates.condicao_valor);
  }

  if (fields.length === 0) return null;

  values.push(id);
  const result = await pool.query(
    `UPDATE alerts SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    values
  );
  return result.rows[0] || null;
}

export async function deleteAlert(id: number): Promise<boolean> {
  const result = await pool.query('DELETE FROM alerts WHERE id = $1', [id]);
  return (result.rowCount || 0) > 0;
}

export async function deleteAlertsByUser(email: string): Promise<boolean> {
  const result = await pool.query('DELETE FROM alerts WHERE user_email = $1', [email.toLowerCase()]);
  return (result.rowCount || 0) > 0;
}

export async function deleteAlertByUserAndCurrency(email: string, currencyCode: string): Promise<boolean> {
  const result = await pool.query(
    'DELETE FROM alerts WHERE user_email = $1 AND currency_code = $2',
    [email.toLowerCase(), currencyCode]
  );
  return (result.rowCount || 0) > 0;
}

// Funções para histórico de moedas
export async function getCurrencyHistory(code?: string, startDate?: Date, endDate?: Date, limit?: number): Promise<CurrencyHistory[]> {
  let query = 'SELECT * FROM currency_history';
  const conditions = [];
  const values = [];
  let paramIndex = 1;

  if (code) {
    conditions.push(`code = $${paramIndex++}`);
    values.push(code);
  }
  if (startDate) {
    conditions.push(`timestamp >= $${paramIndex++}`);
    values.push(startDate);
  }
  if (endDate) {
    conditions.push(`timestamp <= $${paramIndex++}`);
    values.push(endDate);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' ORDER BY timestamp DESC';

  if (limit) {
    query += ` LIMIT $${paramIndex++}`;
    values.push(limit);
  }

  const result = await pool.query(query, values);
  return result.rows.map(row => ({
    ...row,
    buy_price: parseFloat(row.buy_price),
    sell_price: parseFloat(row.sell_price),
    timestamp: new Date(row.timestamp)
  }));
}

export async function addCurrencyHistory(entry: Partial<CurrencyHistory>): Promise<CurrencyHistory> {
  const result = await pool.query(
    `INSERT INTO currency_history (code, buy_price, sell_price, timestamp)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [entry.code, entry.buy_price, entry.sell_price, entry.timestamp || new Date()]
  );
  return result.rows[0];
}

export async function deleteCurrencyHistoryOlderThan(date: Date): Promise<number> {
  const result = await pool.query('DELETE FROM currency_history WHERE timestamp < $1', [date]);
  return result.rowCount || 0;
}

// Função para obter o último registro de cada moeda do histórico
export async function getLatestCurrencyHistory(): Promise<Map<string, Omit<CurrencyHistory, 'id'>>> {
  const query = `
    SELECT DISTINCT ON (code) code, buy_price, sell_price, timestamp
    FROM currency_history
    ORDER BY code, timestamp DESC
  `;
  
  const result = await pool.query(query);
  const latestMap = new Map<string, Omit<CurrencyHistory, 'id'>>();
  
  result.rows.forEach(row => {
    latestMap.set(row.code, {
      code: row.code,
      buy_price: parseFloat(row.buy_price),
      sell_price: parseFloat(row.sell_price),
      timestamp: new Date(row.timestamp).toISOString()
    });
  });
  
  return latestMap;
}

// Funções para push subscriptions
export async function getPushSubscriptions(): Promise<PushSubscription[]> {
  const result = await pool.query('SELECT * FROM push_subscriptions ORDER BY timestamp DESC');
  return result.rows;
}

export async function getPushSubscriptionsByUser(email: string): Promise<PushSubscription[]> {
  const result = await pool.query('SELECT * FROM push_subscriptions WHERE email = $1 ORDER BY timestamp DESC', [email.toLowerCase()]);
  return result.rows;
}

export async function addPushSubscription(sub: Partial<PushSubscription>): Promise<PushSubscription> {
  // O cliente reenvia a mesma assinatura a cada carga e a cada retorno de aba: sem
  // substituir aqui a tabela acumula dezenas de cópias e cada alerta dispara um
  // push por cópia. Mantém-se uma linha por endpoint, sempre com as chaves atuais.
  await pool.query('DELETE FROM push_subscriptions WHERE endpoint = $1', [sub.endpoint]);

  const result = await pool.query(
    `INSERT INTO push_subscriptions (email, endpoint, p256dh, auth, timestamp)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [sub.email?.toLowerCase(), sub.endpoint, sub.p256dh, sub.auth, sub.timestamp || new Date()]
  );
  return result.rows[0];
}

export async function deletePushSubscription(id: number): Promise<boolean> {
  const result = await pool.query('DELETE FROM push_subscriptions WHERE id = $1', [id]);
  return (result.rowCount || 0) > 0;
}

export async function deletePushSubscriptionByEndpoint(endpoint: string): Promise<boolean> {
  const result = await pool.query('DELETE FROM push_subscriptions WHERE endpoint = $1', [endpoint]);
  return (result.rowCount || 0) > 0;
}

export async function deletePushSubscriptionsByUser(email: string): Promise<boolean> {
  const result = await pool.query('DELETE FROM push_subscriptions WHERE email = $1', [email.toLowerCase()]);
  return (result.rowCount || 0) > 0;
}
