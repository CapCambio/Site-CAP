import pg from 'pg';

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL não está definida nas variáveis de ambiente!');
  console.error('A aplicação não conseguirá conectar ao banco de dados.');
  throw new Error('DATABASE_URL não está definida');
}

console.log('✅ DATABASE_URL carregada:', connectionString.replace(/:[^:@]+@/, ':****@'));

export const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: true }
});

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

export async function getAuthorizedEmails(): Promise<string[]> {
  const result = await pool.query('SELECT email FROM users WHERE is_admin = false ORDER BY email');
  return result.rows.map((row: { email: string }) => row.email);
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
    `INSERT INTO alerts (user_email, currency_code, tipo, ativo, valor, condicao_valor)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [alert.user_email?.toLowerCase(), alert.currency_code, alert.tipo || null, alert.ativo || true, alert.valor || null, alert.condicao_valor || null]
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
  return result.rows;
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

export async function deletePushSubscriptionsByUser(email: string): Promise<boolean> {
  const result = await pool.query('DELETE FROM push_subscriptions WHERE email = $1', [email.toLowerCase()]);
  return (result.rowCount || 0) > 0;
}
