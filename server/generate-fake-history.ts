import { addCurrencyHistory } from './db';
import type { InsertCurrencyHistory } from '../shared/schema';

// Moedas para gerar histórico (baseado nas moedas do sistema)
const CURRENCIES = [
  { code: 'USD', baseBuy: 5.20, baseSell: 5.40 },
  { code: 'EUR', baseBuy: 5.60, baseSell: 5.85 },
  { code: 'GBP', baseBuy: 6.40, baseSell: 6.70 },
  { code: 'CAD', baseBuy: 3.80, baseSell: 4.00 },
  { code: 'AUD', baseBuy: 3.30, baseSell: 3.50 },
  { code: 'CHF', baseBuy: 5.90, baseSell: 6.15 },
  { code: 'JPY', baseBuy: 0.034, baseSell: 0.036 },
  { code: 'CNY', baseBuy: 0.72, baseSell: 0.76 },
  { code: 'ARS', baseBuy: 0.005, baseSell: 0.006 },
  { code: 'CLP', baseBuy: 0.0052, baseSell: 0.0055 },
  { code: 'COP', baseBuy: 0.0013, baseSell: 0.0014 },
  { code: 'PEN', baseBuy: 1.35, baseSell: 1.42 },
  { code: 'UYU', baseBuy: 0.13, baseSell: 0.14 },
  { code: 'MXN', baseBuy: 0.28, baseSell: 0.30 },
  { code: 'BOB', baseBuy: 0.75, baseSell: 0.79 },
  { code: 'PYG', baseBuy: 0.00071, baseSell: 0.00075 },
];

// Gerar dados históricos para os últimos 30 dias
async function generateFakeHistory() {
  console.log('🎨 Gerando dados históricos falsos...\n');

  const daysToGenerate = 30;
  const entriesPerDay = 4; // 4 entradas por dia (a cada 6 horas)

  for (const currency of CURRENCIES) {
    console.log(`📊 Gerando histórico para ${currency.code}...`);

    const now = new Date();
    const startDate = new Date(now.getTime() - daysToGenerate * 24 * 60 * 60 * 1000);

    let currentBuy = currency.baseBuy!;
    let currentSell = currency.baseSell!;

    for (let day = 0; day < daysToGenerate; day++) {
      const date = new Date(startDate.getTime() + day * 24 * 60 * 60 * 1000);

      for (let entry = 0; entry < entriesPerDay; entry++) {
        const hours = entry * 6;
        const timestamp = new Date(date.getTime() + hours * 60 * 60 * 1000);

        // Variação aleatória de -2% a +2%
        const buyVariation = (Math.random() - 0.5) * 0.04;
        const sellVariation = (Math.random() - 0.5) * 0.04;

        currentBuy = currentBuy * (1 + buyVariation);
        currentSell = currentSell * (1 + sellVariation);

        // Garantir que venda seja maior que compra
        const spread = currentSell - currentBuy;
        if (spread < 0) {
          currentSell = currentBuy + (currency.baseSell! - currency.baseBuy!) * 0.05;
        }

        const historyEntry: InsertCurrencyHistory = {
          code: currency.code,
          buyPrice: currentBuy,
          sellPrice: currentSell,
          timestamp: timestamp.toISOString(),
        };

        try {
          await addCurrencyHistory(historyEntry);
        } catch (error) {
          console.error(`Erro ao adicionar histórico para ${currency.code}:`, error);
        }
      }
    }

    console.log(`✅ Histórico gerado para ${currency.code}\n`);
  }

  console.log('🎉 Dados históricos falsos gerados com sucesso!');
  console.log(`📅 Período: ${daysToGenerate} dias`);
  console.log(`📈 Entradas por moeda: ${daysToGenerate * entriesPerDay}`);
  console.log(`💰 Total de entradas: ${CURRENCIES.length * daysToGenerate * entriesPerDay}`);
}

// Exportar a função para uso em outros módulos
export { generateFakeHistory };

// Executar apenas se for chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  generateFakeHistory().catch(console.error);
}
