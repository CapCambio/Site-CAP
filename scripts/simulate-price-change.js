// Script para simular mudança de preço e acionar alerta
const { alertSystem } = require('../server/alert-system-fixed');

async function simulatePriceChange() {
  try {
    console.log('🚀 Iniciando simulação de mudança de preço...');
    
    // Dados para simulação
    const currencyCode = 'USD';
    const currentSellPrice = 5.92; // Preço atual do cache
    const newSellPrice = 6.20;     // Novo preço (aumento de ~4.7%)
    
    console.log(`📊 Simulando variação de preço para ${currencyCode}:`);
    console.log(`- Preço anterior: R$ ${currentSellPrice.toFixed(2)}`);
    console.log(`- Novo preço: R$ ${newSellPrice.toFixed(2)}`);
    
    // Força a verificação do alerta
    console.log('🔔 Disparando verificação de alerta...');
    await alertSystem.checkPriceAlerts(
      currencyCode,
      newSellPrice * 0.99,  // Preço de compra ligeiramente menor
      newSellPrice,         // Novo preço de venda
      currentSellPrice      // Preço anterior para cálculo da variação
    );
    
    console.log('✅ Simulação concluída! Verifique os logs do servidor e seu e-mail.');
    
  } catch (error) {
    console.error('❌ Erro ao simular mudança de preço:', error);
  }
}

// Executa a simulação
simulatePriceChange();
