#!/usr/bin/env ts-node
/**
 * Script para testar o disparo de alerta existente
 * Uso: npx ts-node scripts/test-alert-trigger.ts
 */

import { alertSystem } from '../server/alert-system-fixed.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Configura o caminho para o .env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function testAlertTrigger() {
  try {
    console.log('🚀 Iniciando teste de disparo de alerta...');
    
    // Dados do alerta existente
    const testEmail = 'mateus.m2o@live.com';
    const currencyCode = 'USD';
    
    // Simula uma mudança de preço (aumento de 1%)
    const currentPrice = 5.25; // Preço atual do dólar
    const newPrice = currentPrice * 1.01; // Aumento de 1%
    const variation = 1.0; // Variação de 1%
    
    console.log(`📊 Simulando variação de preço para ${currencyCode}:`);
    console.log(`- Preço anterior: R$ ${currentPrice.toFixed(2)}`);
    console.log(`- Novo preço: R$ ${newPrice.toFixed(2)}`);
    console.log(`- Variação: +${variation.toFixed(2)}%`);
    
    // Força a verificação do alerta
    console.log('🔔 Disparando verificação de alerta...');
    await alertSystem.checkPriceAlerts(currencyCode, newPrice - 0.05, newPrice, currentPrice);
    
    console.log('✅ Teste concluído! Verifique seu e-mail.');
    
  } catch (error) {
    console.error('❌ Erro ao testar disparo de alerta:', error);
  }
}

// Executa o teste
testAlertTrigger();
