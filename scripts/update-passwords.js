import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('Defina DATABASE_URL no ambiente (ou em ../.env) antes de rodar este script.');
  process.exit(1);
}

const pool = new Pool({ connectionString });

async function updatePasswords() {
  try {
    const passwords = [
      { email: 'capcambiocx@gmail.com', password: 'passo2012' },
      { email: 'capcambio_caxias@hotmail.com', password: 'passo2012' },
      { email: 'capcambio.bento@gmail.com', password: 'bento877' },
      { email: 'capcambio_passo@hotmail.com', password: '14052006' }
    ];

    for (const { email, password } of passwords) {
      const result = await pool.query(
        'UPDATE users SET password = $1 WHERE email = $2',
        [password, email]
      );
      console.log(`✅ Senha atualizada para ${email}`);
    }

    console.log('\n🎉 Todas as senhas foram atualizadas no Supabase');
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await pool.end();
  }
}

updatePasswords();
