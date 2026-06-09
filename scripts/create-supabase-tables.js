import pg from 'pg';
const { Client } = pg;

const connectionString = 'postgresql://postgres:passofundo2012@db.wzrkasgtryxyiwtrmcqo.supabase.co:5432/postgres';

async function createTables() {
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    console.log('✅ Conectado ao Supabase');

    // Tabela users (emails autorizados, admins, senhas)
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255),
        password VARCHAR(255),
        is_admin BOOLEAN DEFAULT false,
        last_access TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Tabela users criada');

    // Tabela alerts (alertas configurados por usuário)
    await client.query(`
      CREATE TABLE IF NOT EXISTS alerts (
        id SERIAL PRIMARY KEY,
        user_email VARCHAR(255) NOT NULL,
        currency_code VARCHAR(10) NOT NULL,
        tipo VARCHAR(50),
        ativo BOOLEAN DEFAULT true,
        valor DECIMAL(10, 4),
        condicao_valor VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_email) REFERENCES users(email) ON DELETE CASCADE
      );
    `);
    console.log('✅ Tabela alerts criada');

    // Tabela currency_history (histórico de moedas)
    await client.query(`
      CREATE TABLE IF NOT EXISTS currency_history (
        id SERIAL PRIMARY KEY,
        code VARCHAR(10) NOT NULL,
        buy_price DECIMAL(10, 4),
        sell_price DECIMAL(10, 4),
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Tabela currency_history criada');

    // Tabela push_subscriptions (inscrições para notificações push)
    await client.query(`
      CREATE TABLE IF NOT EXISTS push_subscriptions (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        endpoint TEXT NOT NULL,
        p256dh TEXT NOT NULL,
        auth TEXT NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (email) REFERENCES users(email) ON DELETE CASCADE
      );
    `);
    console.log('✅ Tabela push_subscriptions criada');

    // Criar índices para performance
    await client.query('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_alerts_user_email ON alerts(user_email)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_alerts_currency_code ON alerts(currency_code)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_currency_history_code ON currency_history(code)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_currency_history_timestamp ON currency_history(timestamp)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_push_subscriptions_email ON push_subscriptions(email)');
    console.log('✅ Índices criados');

    console.log('\n✅ Todas as tabelas criadas com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao criar tabelas:', error);
    throw error;
  } finally {
    await client.end();
  }
}

createTables().catch(console.error);
