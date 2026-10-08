import * as db from './server/db';

async function testHistoryData() {
  console.log('🔍 Testando dados históricos...\n');

  const code = 'ARS'; // Peso Argentino (uma das moedas que não aparece)
  const startDate = new Date('2026-10-01');
  const endDate = new Date('2026-10-05');

  console.log(`Buscando histórico de ${code} de ${startDate.toISOString()} até ${endDate.toISOString()}\n`);

  const history = await db.getCurrencyHistory(code, startDate, endDate);

  console.log(`Total de registros: ${history.length}\n`);

  if (history.length > 0) {
    console.log('Primeiros 5 registros:');
    history.slice(0, 5).forEach((entry, i) => {
      const date = new Date(entry.timestamp);
      console.log(`${i + 1}. timestamp: ${entry.timestamp}`);
      console.log(`   Date object: ${date.toString()}`);
      console.log(`   getFullYear: ${date.getFullYear()}, getMonth: ${date.getMonth()}, getDate: ${date.getDate()}`);
      console.log(`   sell_price: ${entry.sell_price}, buy_price: ${entry.buy_price}\n`);
    });
  } else {
    console.log('❌ Nenhum registro encontrado!');
  }

  process.exit(0);
}

testHistoryData().catch(error => {
  console.error('Erro:', error);
  process.exit(1);
});
