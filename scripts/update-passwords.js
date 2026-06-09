import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgresql://postgres:passofundo2012@db.wzrkasgtryxyiwtrmcqo.supabase.co:5432/postgres'
});

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
