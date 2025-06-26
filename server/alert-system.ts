import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import webpush from 'web-push';
import nodemailer from 'nodemailer';

const ALERTS_FILE = './data/alerts.json';

interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

interface Alert {
  limite: number;
  tipo: 'subida' | 'descida' | 'ambas';
  ativo: boolean;
  ultimoValor?: number;
}

interface UserAlerts {
  email: string;
  pushSubscription?: PushSubscription;
  alerts: { [currencyCode: string]: Alert };
}

interface AlertsData {
  [email: string]: UserAlerts;
}

class AlertSystem {
  private data: AlertsData = {};

  constructor() {
    this.loadAlerts();
    this.setupWebPush();
    this.setupEmail();
  }

  private setupWebPush() {
    // Chaves VAPID para Web Push (podem ser geradas ou usar estas de exemplo)
    const vapidKeys = {
      publicKey: 'BEl62iUYgUivxIkv69yViEuiBIa40HcCWLroDiUnzjOF_6wdLf0O8x4VJ0-1uL8jQq7bFe6a7nFxHaNs-gTOXPs',
      privateKey: 'dSuN2qk3lAkJg9XvY8f3Z4Mc8vVbN7pQ2rT6uE9wA2k'
    };

    webpush.setVapidDetails(
      'mailto:admin@capcambio.com',
      vapidKeys.publicKey,
      vapidKeys.privateKey
    );
  }

  private setupEmail() {
    // Configuração básica do email (pode ser configurada via env vars)
    this.emailTransporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER || 'capcambiocx@gmail.com',
        pass: process.env.EMAIL_PASS || 'sua-senha-de-app'
      }
    });
  }

  private emailTransporter: any;

  private loadAlerts() {
    try {
      if (existsSync(ALERTS_FILE)) {
        const data = readFileSync(ALERTS_FILE, 'utf8');
        this.data = JSON.parse(data);
      }
    } catch (error) {
      console.log('📋 Inicializando sistema de alertas vazio');
      this.data = {};
    }
  }

  private saveAlerts() {
    try {
      writeFileSync(ALERTS_FILE, JSON.stringify(this.data, null, 2));
    } catch (error) {
      console.error('❌ Erro ao salvar alertas:', error);
    }
  }

  // Criar ou atualizar alerta
  createAlert(email: string, currencyCode: string, limite: number, tipo: 'subida' | 'descida' | 'ambas' | 'valor-especifico', valor?: number, validade?: string | null) {
    if (!this.data[email]) {
      this.data[email] = {
        email,
        alerts: {}
      };
    }

    const alertData: any = {
      limite,
      tipo,
      ativo: true
    };

    if (tipo === 'valor-especifico' && valor !== undefined) {
      alertData.valor = valor;
    }

    if (validade !== undefined) {
      alertData.validade = validade;
    }

    this.data[email].alerts[currencyCode] = alertData;

    this.saveAlerts();
    console.log(`📢 Alerta criado: ${email} - ${currencyCode} (${limite}% - ${tipo})`);
  }

  // Registrar push subscription
  registerPushSubscription(email: string, subscription: PushSubscription) {
    if (!this.data[email]) {
      this.data[email] = {
        email,
        alerts: {}
      };
    }

    this.data[email].pushSubscription = subscription;
    this.saveAlerts();
    console.log(`🔔 Push subscription registrada para ${email}`);
  }

  // Remover alerta
  removeAlert(email: string, currencyCode: string) {
    if (this.data[email] && this.data[email].alerts[currencyCode]) {
      delete this.data[email].alerts[currencyCode];
      this.saveAlerts();
      console.log(`🗑️ Alerta removido: ${email} - ${currencyCode}`);
    }
  }

  // Obter alertas de um usuário
  getUserAlerts(email: string): UserAlerts | null {
    return this.data[email] || null;
  }

  // Verificar alertas quando preços mudam
  async checkPriceAlerts(currencyCode: string, newBuyPrice: number, newSellPrice: number, previousBuyPrice?: number) {
    const alerts: Array<{ email: string; alert: Alert; variacao: number }> = [];

    // Calcular variação percentual
    if (!previousBuyPrice) return; // Sem preço anterior para comparar

    const variacao = ((newBuyPrice - previousBuyPrice) / previousBuyPrice) * 100;

    // Buscar todos os alertas para esta moeda
    for (const [email, userData] of Object.entries(this.data)) {
      const alert = userData.alerts[currencyCode];
      if (!alert || !alert.ativo) continue;

      let shouldAlert = false;

      switch (alert.tipo) {
        case 'subida':
          shouldAlert = variacao > 0 && Math.abs(variacao) >= alert.limite;
          break;
        case 'descida':
          shouldAlert = variacao < 0 && Math.abs(variacao) >= alert.limite;
          break;
        case 'ambas':
          shouldAlert = Math.abs(variacao) >= alert.limite;
          break;
      }

      if (shouldAlert) {
        alerts.push({ email, alert, variacao });
      }
    }

    // Enviar alertas
    for (const { email, alert, variacao } of alerts) {
      await this.sendAlert(email, currencyCode, newBuyPrice, newSellPrice, variacao);
    }
  }

  // Enviar alerta (email + push)
  private async sendAlert(email: string, currencyCode: string, buyPrice: number, sellPrice: number, variacao: number) {
    const userData = this.data[email];
    if (!userData) return;

    const variacaoFormatada = variacao > 0 ? `+${variacao.toFixed(2)}%` : `${variacao.toFixed(2)}%`;
    const titulo = `${currencyCode}: ${variacaoFormatada}`;
    const mensagem = `${currencyCode} mudou ${variacaoFormatada}\nCompra: R$ ${buyPrice.toFixed(2)}\nVenda: R$ ${sellPrice.toFixed(2)}`;

    // Enviar push notification
    if (userData.pushSubscription) {
      try {
        await webpush.sendNotification(userData.pushSubscription, JSON.stringify({
          title: titulo,
          body: mensagem,
          icon: '/generated-icon.png',
          badge: '/generated-icon.png',
          data: { currencyCode, variacao }
        }));
        console.log(`📱 Push enviado para ${email}: ${titulo}`);
      } catch (error) {
        console.error(`❌ Erro ao enviar push para ${email}:`, error);
        // Remover subscription inválida
        delete userData.pushSubscription;
        this.saveAlerts();
      }
    }

    // Enviar email
    try {
      await this.emailTransporter.sendMail({
        from: '"CAP Câmbio" <capcambiocx@gmail.com>',
        to: email,
        subject: `Alerta de Cotação: ${titulo}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #f59e0b;">📊 Alerta de Cotação</h2>
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin: 0; color: ${variacao > 0 ? '#10b981' : '#ef4444'};">
                ${currencyCode} ${variacaoFormatada}
              </h3>
              <p style="margin: 10px 0; font-size: 18px;">
                <strong>Compra:</strong> R$ ${buyPrice.toFixed(2)}<br>
                <strong>Venda:</strong> R$ ${sellPrice.toFixed(2)}
              </p>
            </div>
            <p style="color: #6b7280; font-size: 14px;">
              Este alerta foi enviado porque ${currencyCode} atingiu sua variação configurada de ${userData.alerts[currencyCode]?.limite}%.
            </p>
            <p style="color: #6b7280; font-size: 12px;">
              CAP Câmbio - Sistema de Alertas Automático
            </p>
          </div>
        `
      });
      console.log(`📧 Email enviado para ${email}: ${titulo}`);
    } catch (error) {
      console.error(`❌ Erro ao enviar email para ${email}:`, error);
    }
  }

  // Obter chave pública VAPID para o frontend
  getVapidPublicKey() {
    return 'BEl62iUYgUivxIkv69yViEuiBIa40HcCWLroDiUnzjOF_6wdLf0O8x4VJ0-1uL8jQq7bFe6a7nFxHaNs-gTOXPs';
  }

  // Listar todos os alertas (para admin)
  getAllAlerts() {
    return this.data;
  }
}

export const alertSystem = new AlertSystem();