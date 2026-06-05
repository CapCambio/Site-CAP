// Script para forçar o disparo de um alerta
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { alertSystem } from '../server/alert-system-fixed.js';

// Configura caminhos
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Caminho para o cache de moedas
const CACHE_PATH = path.join(__dirname, '../server/config/currency-cache.json');

// Dados para simulação
const CURRENCY_CODE = 'USD';
const CURRENT_PRICE = 5.92;
const NEW_PRICE = 6.20; // Aumento de ~4.7%

async function forceAlert() {
  try {
    console.log('🚀 Iniciando simulação de mudança de preço...');
    
    // 1. Atualiza o cache com o novo preço
    console.log('📝 Atualizando cache com novo preço...');
    const cache = JSON.parse(fs.readFileSync(CACHE_PATH, 'utf-8'));
    
    // Encontra o USD no cache
    const usdIndex = cache.currencies.findIndex(c => c.code === CURRENCY_CODE);
    if (usdIndex === -1) {
      throw new Error(`Moeda ${CURRENCY_CODE} não encontrada no cache`);
    }
    
    // Salva o preço antigo
    const oldPrice = cache.currencies[usdIndex].sellPrice;
    
    // Atualiza para o novo preço
    cache.currencies[usdIndex].sellPrice = NEW_PRICE;
    cache.currencies[usdIndex].buyPrice = NEW_PRICE * 0.99; // Compra ligeiramente menor
    
    // Salva o cache atualizado
    fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2));
    
    console.log(`✅ Cache atualizado:`);
    console.log(`- Preço antigo: R$ ${oldPrice.toFixed(2)}`);
    console.log(`- Novo preço: R$ ${NEW_PRICE.toFixed(2)}`);
    
    // 2. Força a verificação de alertas
    console.log('🔔 Disparando verificação de alertas...');
    
    // Simula uma variação de 4.7% (aumento)
    const variation = ((NEW_PRICE - oldPrice) / oldPrice) * 100;
    const variationStr = variation > 0 ? `+${variation.toFixed(2)}` : variation.toFixed(2);
    
    // Chama diretamente o método de notificação
    await alertSystem.sendEmailNotification(
      'mateus.m2o@live.com', // E-mail do destinatário
      `Alerta de Variação - ${CURRENCY_CODE}`, // Assunto
      CURRENCY_CODE, // Código da moeda
      NEW_PRICE * 0.99, // Preço de compra
      NEW_PRICE, // Preço de venda
      variation, // Variação percentual
      `${variationStr}%`, // Variação formatada
      { tipo: 'subida', valor: oldPrice } // Configuração do alerta
    );
    
    console.log('✅ Verificação de alertas concluída!');
    console.log('📧 Verifique o e-mail mateus.m2o@live.com');
    
  } catch (error) {
    console.error('❌ Erro ao forçar alerta:', error);
  }
}

// Executa a função
forceAlert();
