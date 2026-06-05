import webpush from 'web-push';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregar variáveis de ambiente
async function runDebug() {
  const dotenv = await import('dotenv');
  dotenv.config({ path: path.join(__dirname, '../.env') });
  
  console.log('=== DEBUG DO SISTEMA DE PUSH NOTIFICATIONS ===\n');
  
  // 1. Verificar variáveis VAPID
  console.log('1. Verificando variáveis VAPID:');
  console.log(`   VAPID_PUBLIC_KEY: ${process.env.VAPID_PUBLIC_KEY ? '✅ Configurada' : '❌ NÃO configurada'}`);
  console.log(`   VAPID_PRIVATE_KEY: ${process.env.VAPID_PRIVATE_KEY ? '✅ Configurada' : '❌ NÃO configurada'}`);
  console.log(`   VAPID_EMAIL: ${process.env.VAPID_EMAIL || '❌ NÃO configurada'}`);
  console.log('');
  
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    console.log('❌ VAPID não está configurado. Configure as variáveis no .env');
    process.exit(1);
  }
  
  // 2. Verificar arquivo de assinaturas
  console.log('2. Verificando arquivo de assinaturas:');
  const subscriptionsPath = path.join(__dirname, '../data/subscriptions.json');
  if (fs.existsSync(subscriptionsPath)) {
    const subscriptionsData = fs.readFileSync(subscriptionsPath, 'utf8');
    const subscriptions = JSON.parse(subscriptionsData);
    console.log(`   ✅ Arquivo existe com ${subscriptions.length} assinatura(s)`);
    subscriptions.forEach((sub, index) => {
      console.log(`   Assinatura ${index + 1}:`);
      console.log(`     - Email: ${sub.email || 'N/A'}`);
      console.log(`     - Endpoint: ${sub.endpoint ? sub.endpoint.substring(0, 50) + '...' : 'N/A'}`);
    });
  } else {
    console.log('   ❌ Arquivo subscriptions.json não existe');
  }
  console.log('');
  
  // 3. Verificar arquivo de alertas
  console.log('3. Verificando arquivo de alertas (pushSubscriptions):');
  const alertsPath = path.join(__dirname, '../data/alerts.json');
  if (fs.existsSync(alertsPath)) {
    const alertsData = fs.readFileSync(alertsPath, 'utf8');
    const alerts = JSON.parse(alertsData);
    let totalPushSubs = 0;
    Object.entries(alerts).forEach(([email, userData]) => {
      if (userData.pushSubscriptions && userData.pushSubscriptions.length > 0) {
        totalPushSubs += userData.pushSubscriptions.length;
        console.log(`   ✅ Usuário ${email}: ${userData.pushSubscriptions.length} assinatura(s) push`);
      }
    });
    if (totalPushSubs === 0) {
      console.log('   ⚠️ Nenhuma assinatura push encontrada em alerts.json');
    }
  } else {
    console.log('   ❌ Arquivo alerts.json não existe');
  }
  console.log('');
  
  // 4. Configurar VAPID e testar envio
  console.log('4. Testando configuração VAPID:');
  try {
    webpush.setVapidDetails(
      `mailto:${process.env.VAPID_EMAIL}`,
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );
    console.log('   ✅ VAPID configurado com sucesso');
  } catch (error) {
    console.log('   ❌ Erro ao configurar VAPID:', error.message);
  }
  console.log('');
  
  // 5. Enviar notificação de teste
  console.log('5. Enviando notificação de teste:');
  if (fs.existsSync(subscriptionsPath)) {
    const subscriptionsData = fs.readFileSync(subscriptionsPath, 'utf8');
    const subscriptions = JSON.parse(subscriptionsData);
    
    if (subscriptions.length > 0) {
      const notification = {
        title: '🧪 Teste de Debug',
        body: 'Esta é uma notificação de teste do sistema de debug',
        icon: 'https://iili.io/fBQNNwX.jpg',
        data: {
          url: '/',
          timestamp: new Date().toISOString()
        }
      };
      
      for (const subscription of subscriptions) {
        try {
          console.log(`   → Enviando para: ${subscription.email || 'endpoint'}`);
          await webpush.sendNotification(subscription, JSON.stringify(notification));
          console.log('   ✅ Notificação enviada com sucesso!');
        } catch (error) {
          console.log('   ❌ Erro ao enviar:', error.message);
          if (error.statusCode === 410) {
            console.log('   ⚠️ Assinatura expirada (410)');
          } else if (error.statusCode === 403) {
            console.log('   ⚠️ Erro de autenticação VAPID (403) - verifique as chaves');
          } else if (error.statusCode === 400) {
            console.log('   ⚠️ Requisição inválida (400) - verifique o payload');
          }
        }
      }
    } else {
      console.log('   ⚠️ Nenhuma assinatura para testar');
    }
  } else {
    console.log('   ⚠️ Nenhuma assinatura para testar');
  }
  
  console.log('\n=== FIM DO DEBUG ===');
}

runDebug();
