// scripts/test-alert-flow.js
import { alertSystem } from '../server/alert-system-fixed.js';

// Dados reais do cache
const EMAIL = 'mateus.m2o@live.com';
const CURRENCY_CODE = 'USD';
const CURRENT_PRICE = 6.50;      // Preço atual de venda do cache
const NEW_PRICE = 6.60;          // Pequeno aumento para teste (1.54%)

async function testAlertFlow() {
  try {
    console.log('🚀 Testando fluxo de alerta...');
    
    // Calcula a variação
    const variacao = ((NEW_PRICE - CURRENT_PRICE) / CURRENT_PRICE) * 100;
    const variacaoFormatada = variacao > 0 ? `+${variacao.toFixed(2)}%` : `${variacao.toFixed(2)}%`;

    console.log('📊 Dados do teste:');
    console.log(`- Moeda: ${CURRENCY_CODE}`);
    console.log(`- Preço atual: R$ ${CURRENT_PRICE.toFixed(2)}`);
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
testAlertFlow();
