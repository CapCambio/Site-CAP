import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgresql://postgres:passofundo2012@db.wzrkasgtryxyiwtrmcqo.supabase.co:5432/postgres'
});

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
