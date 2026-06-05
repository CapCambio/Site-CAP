import webpush from 'web-push';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregar assinaturas salvas
const loadSubscriptions = () => {
  try {
    const data = fs.readFileSync(path.join(__dirname, '../data/subscriptions.json'), 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Erro ao carregar assinaturas:', error.message);
    return [];
  }
};

// Configurar VAPID
const vapidKeys = {
  publicKey: 'BEl62iUYgUivxIkv69yViEuiBIa40HcCWLroDiUnzjOF_6wdLf0O8x4VJ0-1uL8jQq7bFe6a7nFxHaNs-gTOXPs',
  privateKey: 'dSuN2qk3lAkJg9XvY8f3Z4Mc8vVbN7pQ2rT6uE9wA2k'
};

webpush.setVapidDetails(
  'mailto:admin@capcambio.com',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

// Enviar notificação de teste
const sendTestNotification = async () => {
  const subscriptions = loadSubscriptions();
  
  if (subscriptions.length === 0) {
    console.log('❌ Nenhuma assinatura encontrada. Cadastre-se primeiro no site.');
    return;
  }

  console.log(`\n📤 Enviando notificação de teste para ${subscriptions.length} assinante(s)...\n`);

  const notification = {
    title: '💰 Teste de Notificação',
    body: 'Esta é uma notificação de teste do CurrencyTracker!',
    icon: '/generated-icon.png',
    data: {
      url: '/',
      timestamp: new Date().toISOString()
    }
  };

  for (const subscription of subscriptions) {
    try {
      console.log(`  → Enviando para: ${subscription.email || 'email não informado'}`);
      await webpush.sendNotification(subscription, JSON.stringify(notification));
      console.log('    ✅ Enviado com sucesso!');
    } catch (error) {
      console.error('    ❌ Erro ao enviar notificação:', error.message);
    }
    console.log('');
  }
};

// Executar
try {
  await sendTestNotification();
  console.log('✅ Teste concluído!');
} catch (error) {
  console.error('❌ Erro durante o teste:', error);
}
