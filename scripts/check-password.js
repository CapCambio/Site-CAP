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

async function checkPassword() {
  try {
    const result = await pool.query(
      'SELECT email, password FROM users WHERE email = $1',
      ['capcambiocx@gmail.com']
    );
    
    if (result.rows.length > 0) {
      console.log('Usuário encontrado:');
      console.log(JSON.stringify(result.rows[0], null, 2));
    } else {
      console.log('Usuário não encontrado');
    }
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await pool.end();
  }
}

checkPassword();
