// Script para testar o disparo de alerta diretamente
import { alertSystem } from '../server/alert-system-fixed.js';

// Dados para teste
const EMAIL = 'mateus.m2o@live.com';
const CURRENCY_CODE = 'USD';
const OLD_PRICE = 5.92;
const NEW_PRICE = 6.20; // Aumento de ~4.7%

// Simula uma mudança de preço
async function testAlert() {
  try {
    console.log('🚀 Iniciando teste de disparo de alerta...');
    
    // Calcula a variação
    const variacao = ((NEW_PRICE - OLD_PRICE) / OLD_PRICE) * 100;
    const variacaoFormatada = variacao > 0 ? `+${variacao.toFixed(2)}%` : `${variacao.toFixed(2)}%`;
    
    console.log(`📊 Dados do teste:`);
    console.log(`- Moeda: ${CURRENCY_CODE}`);
    console.log(`- Preço antigo: R$ ${OLD_PRICE.toFixed(2)}`);
    console.log(`- Novo preço: R$ ${NEW_PRICE.toFixed(2)}`);
    console.log(`- Variação: ${variacaoFormatada}`);
    
    // Chama diretamente o método de notificação
    console.log('📤 Enviando notificação...');
    await alertSystem.sendEmailNotification(
      EMAIL,
      `Alerta de Variação - ${CURRENCY_CODE}`,
      CURRENCY_CODE,
      NEW_PRICE * 0.99, // Preço de compra (simulado)
      NEW_PRICE,        // Preço de venda
      variacao,         // Variação percentual
      variacaoFormatada, // Variação formatada
      { tipo: 'subida', ativo: true, validade: null } // Configuração do alerta
    );
    
    console.log('✅ Notificação enviada com sucesso!');
    console.log(`📧 Verifique o e-mail: ${EMAIL}`);
    
  } catch (error) {
    console.error('❌ Erro ao enviar notificação:', error);
  }
}

// Executa o teste
testAlert();
