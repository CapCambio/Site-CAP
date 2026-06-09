import pg from 'pg';
const { Client } = pg;
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const connectionString = 'postgresql://postgres:passofundo2012@db.wzrkasgtryxyiwtrmcqo.supabase.co:5432/postgres';

async function migrateUsers() {
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    console.log('✅ Conectado ao Supabase');

    // Migrar usuários de email-config.json
    const emailConfigPath = path.join(__dirname, '..', 'server', 'config', 'email-config.json');
    const emailConfig = JSON.parse(fs.readFileSync(emailConfigPath, 'utf-8'));

    // Migrar authorizedEmails
    for (const user of emailConfig.authorizedEmails) {
      const email = typeof user === 'string' ? user : user.email;
      const name = typeof user === 'string' ? email.split('@')[0] : user.name;
      const isAdmin = typeof user === 'object' ? user.isAdmin : false;
      const lastAccess = typeof user === 'object' ? user.lastAccess : null;
      const createdAt = typeof user === 'object' ? user.createdAt : null;

      await client.query(`
        INSERT INTO users (email, name, is_admin, last_access, created_at)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (email) DO UPDATE SET
          name = EXCLUDED.name,
          is_admin = EXCLUDED.is_admin,
          last_access = EXCLUDED.last_access
      `, [email, name, isAdmin, lastAccess, createdAt]);
      console.log(`✅ Usuário migrado: ${email}`);
    }

    // Migrar adminEmails
    for (const admin of emailConfig.adminEmails) {
      const email = typeof admin === 'string' ? admin : admin.email;
      const name = typeof admin === 'string' ? 'CAP Câmbio' : admin.name;
      const isAdmin = true;
      const password = typeof admin === 'object' ? admin.password : null;
      const lastAccess = typeof admin === 'object' ? admin.lastAccess : null;
      const createdAt = typeof admin === 'object' ? admin.createdAt : null;

      await client.query(`
        INSERT INTO users (email, name, password, is_admin, last_access, created_at)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (email) DO UPDATE SET
          name = EXCLUDED.name,
          password = EXCLUDED.password,
          is_admin = EXCLUDED.is_admin,
          last_access = EXCLUDED.last_access
      `, [email, name, password, isAdmin, lastAccess, createdAt]);
      console.log(`✅ Admin migrado: ${email}`);
    }

    console.log('\n✅ Usuários migrados com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao migrar usuários:', error);
    throw error;
  } finally {
    await client.end();
  }
}

async function migrateAlerts() {
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    console.log('✅ Conectado ao Supabase');

    const alertsPath = path.join(__dirname, '..', 'data', 'alerts.json');
    const alerts = JSON.parse(fs.readFileSync(alertsPath, 'utf-8'));

    for (const [userEmail, userData] of Object.entries(alerts)) {
      for (const [currencyCode, alertData] of Object.entries(userData.alerts)) {
        await client.query(`
          INSERT INTO alerts (user_email, currency_code, tipo, ativo, valor, condicao_valor)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [userEmail, currencyCode, alertData.tipo, alertData.ativo, alertData.valor, alertData.condicaoValor]);
        console.log(`✅ Alerta migrado: ${userEmail} - ${currencyCode}`);
      }
    }

    console.log('\n✅ Alertas migrados com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao migrar alertas:', error);
    throw error;
  } finally {
    await client.end();
  }
}

async function migrateHistory() {
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    console.log('✅ Conectado ao Supabase');

    const historyPath = path.join(__dirname, '..', 'data', 'history.json');
    const history = JSON.parse(fs.readFileSync(historyPath, 'utf-8'));

    for (const entry of history) {
      await client.query(`
        INSERT INTO currency_history (code, buy_price, sell_price, timestamp)
        VALUES ($1, $2, $3, $4)
      `, [entry.code, entry.buyPrice, entry.sellPrice, entry.timestamp]);
    }

    console.log(`✅ ${history.length} registros de histórico migrados com sucesso!`);
  } catch (error) {
    console.error('❌ Erro ao migrar histórico:', error);
    throw error;
  } finally {
    await client.end();
  }
}

async function migrateSubscriptions() {
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    console.log('✅ Conectado ao Supabase');

    const subscriptionsPath = path.join(__dirname, '..', 'data', 'subscriptions.json');
    const subscriptions = JSON.parse(fs.readFileSync(subscriptionsPath, 'utf-8'));

    for (const sub of subscriptions) {
      await client.query(`
        INSERT INTO push_subscriptions (email, endpoint, p256dh, auth, timestamp)
        VALUES ($1, $2, $3, $4, $5)
      `, [sub.email, sub.endpoint, sub.keys.p256dh, sub.keys.auth, sub.timestamp]);
      console.log(`✅ Subscription migrada: ${sub.email}`);
    }

    console.log('\n✅ Subscriptions migradas com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao migrar subscriptions:', error);
    throw error;
  } finally {
    await client.end();
  }
}

async function migrateAll() {
  try {
    console.log('=== Iniciando migração para Supabase ===\n');
    
    await migrateUsers();
    await migrateAlerts();
    await migrateHistory();
    await migrateSubscriptions();
    
    console.log('\n=== Migração concluída com sucesso! ===');
  } catch (error) {
    console.error('❌ Erro na migração:', error);
    process.exit(1);
  }
}

migrateAll();
