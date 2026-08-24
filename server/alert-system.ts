import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import webpush from 'web-push';
import nodemailer from 'nodemailer';
import Handlebars from 'handlebars';
import { jsonStorage } from './json-storage';
import { logger } from './logger';

// Registrar helpers Handlebars
Handlebars.registerHelper('gt', (a: number, b: number) => a > b);
Handlebars.registerHelper('eq', (a: string, b: string) => a === b);
Handlebars.registerHelper('formatCurrency', (value: number) => {
  return value.toFixed(2).replace('.', ',');
});
Handlebars.registerHelper('formatNumber', (value: number, decimals: number) => {
  return value.toFixed(decimals).replace('.', ',');
});
Handlebars.registerHelper('getCurrencyName', (code: string, language: string = 'pt') => {
  const currencyNames: { [lang: string]: { [key: string]: string } } = {
    'pt': {
      'USD': 'Dólar Americano',
      'EUR': 'Euro',
      'GBP': 'Libra Esterlina',
      'AUD': 'Dólar Australiano',
      'ARS': 'Peso Argentino',
      'NZD': 'Dólar Neozelandês',
      'CAD': 'Dólar Canadense',
      'CHF': 'Franco Suíço',
      'UYU': 'Peso Uruguaio',
      'CLP': 'Peso Chileno',
      'MXN': 'Peso Mexicano',
      'COP': 'Peso Colombiano',
      'CNY': 'Yuan Chinês',
      'JPY': 'Iene Japonês',
      'PEN': 'Sol Peruano',
      'ZAR': 'Rand Sul-Africano',
      'BTC': 'Bitcoin',
      'ETH': 'Ethereum',
      'USDT': 'Tether',
      'BRL': 'Real Brasileiro'
    },
    'en': {
      'USD': 'US Dollar',
      'EUR': 'Euro',
      'GBP': 'British Pound',
      'AUD': 'Australian Dollar',
      'ARS': 'Argentine Peso',
      'NZD': 'New Zealand Dollar',
      'CAD': 'Canadian Dollar',
      'CHF': 'Swiss Franc',
      'UYU': 'Uruguayan Peso',
      'CLP': 'Chilean Peso',
      'MXN': 'Mexican Peso',
      'COP': 'Colombian Peso',
      'CNY': 'Chinese Yuan',
      'JPY': 'Japanese Yen',
      'PEN': 'Peruvian Sol',
      'ZAR': 'South African Rand',
      'BTC': 'Bitcoin',
      'ETH': 'Ethereum',
      'USDT': 'Tether',
      'BRL': 'Brazilian Real'
    },
    'es': {
      'USD': 'Dólar Estadounidense',
      'EUR': 'Euro',
      'GBP': 'Libra Esterlina',
      'AUD': 'Dólar Australiano',
      'ARS': 'Peso Argentino',
      'NZD': 'Dólar Neozelandés',
      'CAD': 'Dólar Canadiense',
      'CHF': 'Franco Suizo',
      'UYU': 'Peso Uruguayo',
      'CLP': 'Peso Chileno',
      'MXN': 'Peso Mexicano',
      'COP': 'Peso Colombiano',
      'CNY': 'Yuan Chino',
      'JPY': 'Yen Japonés',
      'PEN': 'Sol Peruano',
      'ZAR': 'Rand Sudafricano',
      'BTC': 'Bitcoin',
      'ETH': 'Ethereum',
      'USDT': 'Tether',
      'BRL': 'Real Brasileño'
    },
    'fr': {
      'USD': 'Dollar Américain',
      'EUR': 'Euro',
      'GBP': 'Livre Sterling',
      'AUD': 'Dollar Australien',
      'ARS': 'Peso Argentin',
      'NZD': 'Dollar Néo-Zélandais',
      'CAD': 'Dollar Canadien',
      'CHF': 'Franc Suisse',
      'UYU': 'Peso Uruguayen',
      'CLP': 'Peso Chilien',
      'MXN': 'Peso Mexicain',
      'COP': 'Peso Colombien',
      'CNY': 'Yuan Chinois',
      'JPY': 'Yen Japonais',
      'PEN': 'Sol Péruvien',
      'ZAR': 'Rand Sud-Africain',
      'BTC': 'Bitcoin',
      'ETH': 'Ethereum',
      'USDT': 'Tether',
      'BRL': 'Real Brésilien'
    }
  };
  return currencyNames[language]?.[code] || currencyNames['pt']?.[code] || code;
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ALERTS_FILE = join(__dirname, 'data', 'alerts.json');

interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

interface Alert {
  tipo: 'subida' | 'descida' | 'valor-especifico';
  ativo: boolean;
  ultimoValor?: number;
  validade: string | null;
  limite?: number;
  valorEspecifico?: number;
  valor?: number; // Para alertas de valor específico
  condicaoValor?: 'acima' | 'abaixo'; // Condição para valor específico (acima/abaixo)
}

interface UserAlerts {
  email: string;
  name?: string;
  pushSubscriptions: PushSubscription[]; // ARRAY agora!
  alerts: { [currencyCode: string]: Alert };
  lastNotificationSent?: string | null;
  cardOrder?: string[]; // NOVO: Ordem dos cards do usuário
  language?: string; // NOVO: Idioma preferido do usuário
}

interface AlertsData {
  [email: string]: UserAlerts;
}

class AlertSystem {
  private data: AlertsData = {};
  private emailTransporter: any;
  private templateCache: { [key: string]: Handlebars.TemplateDelegate } = {};

  constructor() {
    this.ensureDataDirectoryExists();
    this.loadAlerts();
    this.setupWebPush();

    // Carrega as variáveis de ambiente antes de configurar o e-mail
    import('dotenv').then(dotenv => {
      dotenv.config();
      this.setupEmail();
    }).catch(error => {
      console.error('❌ Erro ao carregar variáveis de ambiente:', error);
    });
  }

  private ensureDataDirectoryExists() {
    const dataDir = join(__dirname, 'data');
    if (!existsSync(dataDir)) {
      mkdirSync(dataDir, { recursive: true });
    }
  }

  /**
   * Retorna a chave pública VAPID para notificações push
   * @returns A chave pública VAPID ou undefined se não estiver configurada
   */
  public getVapidPublicKey(): string | undefined {
    return process.env.VAPID_PUBLIC_KEY;
  }

  /**
   * Registra uma assinatura push para um usuário
   * @param email Email do usuário
   * @param subscription Dados da assinatura push
   */
  public registerPushSubscription(email: string, subscription: PushSubscription): void {
    console.log('📝 registerPushSubscription chamado:');
    console.log(`   Email: ${email}`);
    console.log(`   Subscription: ${subscription ? 'presente' : 'NULO'}`);
    
    if (!email || !subscription) {
      console.error('❌ Email e subscription são obrigatórios');
      return;
    }

    // Verifica se o usuário já existe
    if (!this.data[email]) {
      console.log(`   Criando novo usuário ${email}`);
      this.data[email] = {
        email,
        alerts: {},
        pushSubscriptions: []
      };
    }

    // Adiciona a nova assinatura push ao array do usuário
    if (!this.data[email].pushSubscriptions) {
      this.data[email].pushSubscriptions = [];
    }
    
    // Verifica se a assinatura já existe
    const exists = this.data[email].pushSubscriptions.some(
      sub => sub.endpoint === subscription.endpoint
    );
    
    if (!exists) {
      console.log(`   Adicionando nova assinatura para ${email}`);
      console.log(`   Endpoint: ${subscription.endpoint.substring(0, 60)}...`);
      this.data[email].pushSubscriptions.push(subscription);
    } else {
      console.log(`   Assinatura já existe para ${email}`);
    }
    
    this.saveAlerts();
    console.log(`   Total de assinaturas para ${email}: ${this.data[email].pushSubscriptions.length}`);
    console.log(`✅ Assinatura push registrada para ${email}`);
  }

  /**
   * Inicia a verificação periódica de alertas
   * @param intervalMinutes Intervalo em minutos entre as verificações (padrão: 5 minutos)
   */
  public startChecking(intervalMinutes: number = 2): void {
    console.log(`⏰ Iniciando verificação de alertas a cada ${intervalMinutes} minutos`);
    
    // Verificação inicial
    this.checkAllCurrencies();
    
    // Configura a verificação periódica
    setInterval(() => {
      this.checkAllCurrencies();
    }, intervalMinutes * 60 * 1000);
  }

  /**
   * Verifica todas as moedas em busca de alertas
   */
  private async checkAllCurrencies(): Promise<void> {
    try {
      logger.info('Iniciando verificação de cotações para alertas');
      console.log('🔍 Verificando cotações para alertas...');

      // Obter todas as moedas do sistema
      const currencies = await jsonStorage.getAllCurrencies();
      
      // Mapa para agrupar todos os alertas por usuário
      const allAlertsByEmail = new Map<string, Array<{
        currencyCode: string;
        buyPrice: number;
        sellPrice: number;
        variacao: number;
        alertType: string;
        alert: Alert;
      }>>();
      
      // Para cada moeda, verificar se há alertas
      for (const currency of currencies) {
        try {
          // Obter histórico recente para calcular variação (últimos 30 minutos)
          const now = new Date();
          const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000); // Últimos 30 minutos
          const history = await jsonStorage.getCurrencyHistory(currency.code, thirtyMinutesAgo, now);
          
          console.log(`\n📊 Dados históricos para ${currency.code} (últimos 30 minutos):`);
          console.log(`- Total de registros: ${history.length}`);
          
          if (history.length >= 2) {
            // Ordenar por timestamp (mais antigo primeiro)
            const sortedHistory = [...history].sort((a, b) => 
              new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
            );
            
            // Pegar o mais antigo e o mais recente
            const previous = sortedHistory[0];
            const current = sortedHistory[sortedHistory.length - 1];

            // Calcular variação
            const variacao = ((current.sellPrice - previous.sellPrice) / previous.sellPrice) * 100;

            console.log(`- Primeiro registro: ${new Date(previous.timestamp).toISOString()} - Venda: R$ ${previous.sellPrice}`);
            console.log(`- Último registro:   ${new Date(current.timestamp).toISOString()} - Venda: R$ ${current.sellPrice}`);

            // Verificar se os preços são diferentes
            if (previous.sellPrice !== current.sellPrice) {
              console.log(`✅ Alteração de preço detectada para ${currency.code}`);
              logger.priceCheck(currency.code, previous.sellPrice, current.sellPrice, variacao);

              // Coletar alertas para esta moeda e adicionar ao mapa do usuário
              await this.collectAlertsForCurrency(
                currency.code,
                current.buyPrice,
                current.sellPrice,
                previous.sellPrice,
                allAlertsByEmail
              );
            } else {
              console.log(`ℹ️  Nenhuma alteração de preço para ${currency.code}`);
            }
          }
        } catch (error) {
          console.error(`Erro ao verificar alertas para ${currency.code}:`, error);
        }
      }
      
      // Envia um único email por usuário com todos os alertas coletados
      for (const [email, alerts] of Array.from(allAlertsByEmail.entries())) {
        if (alerts.length > 0) {
          await this.sendAlert(email, alerts);
          // Marca data da última notificação enviada
          if (this.data[email]) {
            this.data[email].lastNotificationSent = new Date().toISOString();
          }
        }
      }
      
      // Salva os dados atualizados com lastNotificationSent
      this.saveAlerts();
    } catch (error) {
      console.error('Erro ao verificar cotações para alertas:', error);
    }
  }

  /**
   * Coleta alertas para uma moeda específica e agrupa por usuário
   */
  private async collectAlertsForCurrency(
    currencyCode: string,
    newBuyPrice: number,
    newSellPrice: number,
    previousSellPrice: number,
    allAlertsByEmail: Map<string, Array<{
      currencyCode: string;
      buyPrice: number;
      sellPrice: number;
      variacao: number;
      alertType: string;
      alert: Alert;
    }>>
  ): Promise<void> {
    if (previousSellPrice === undefined) return;

    // Calcula a variação baseada no preço de venda
    const variacao = ((newSellPrice - previousSellPrice) / previousSellPrice) * 100;
    
    console.log(`\n🔍 Verificando alertas para ${currencyCode}:`);
    console.log(`- Preço de compra atual:  R$ ${newBuyPrice.toFixed(4)}`);
    console.log(`- Preço de venda atual:   R$ ${newSellPrice.toFixed(4)}`);
    if (previousSellPrice !== undefined) {
      console.log(`- Preço de venda anterior: R$ ${previousSellPrice.toFixed(4)}`);
      console.log(`- Variação:                ${variacao > 0 ? '+' : ''}${variacao.toFixed(4)}%`);
    }

    // Verifica alertas para todos os usuários
    for (const [email, userData] of Object.entries(this.data)) {
      const alert = userData.alerts[currencyCode];
      if (!alert || !alert.ativo) continue;

      // Verificar validade do alerta
      if (alert.validade) {
        const validadeDate = new Date(alert.validade);
        const now = new Date();
        if (now > validadeDate) {
          console.log(`⏰ Alerta expirado: ${email} - ${currencyCode} (validade: ${alert.validade})`);
          delete this.data[email].alerts[currencyCode];
          this.saveAlerts();
          continue;
        }
      }

      let shouldAlert = false;
      
      // Verifica se o alerta deve ser disparado baseado no tipo
      switch (alert.tipo) {
        case 'subida':
          shouldAlert = variacao > 0 && Math.abs(variacao) >= (alert.limite || 0);
          break;
        case 'descida':
          shouldAlert = variacao < 0 && Math.abs(variacao) >= (alert.limite || 0);
          break;
        case 'valor-especifico':
          // Verifica se o preço atual atende à condição do valor específico definido
          if (alert.valor !== undefined && alert.condicaoValor) {
            const targetPrice = newSellPrice;
            const previousPrice = previousSellPrice;
            
            console.log(`\n🔍 Verificando alerta de valor específico (venda):`);
            console.log(`- Email: ${email}`);
            console.log(`- Valor alvo: R$ ${alert.valor.toFixed(4)} (${alert.condicaoValor} deste valor)`);
            console.log(`- Preço atual: R$ ${targetPrice.toFixed(4)}`);
            console.log(`- Preço anterior: R$ ${previousPrice.toFixed(4)}`);
            
            // Verifica se o preço atual atende à condição (acima/abaixo do valor definido)
            let conditionMet = false;
            let crossCondition = false;
            
            if (alert.condicaoValor === 'acima') {
              conditionMet = targetPrice >= alert.valor;
              crossCondition = previousPrice !== undefined && 
                            previousPrice < alert.valor && 
                            targetPrice >= alert.valor;
              console.log(`- Condição 'acima': ${targetPrice.toFixed(4)} >= ${alert.valor.toFixed(4)} = ${conditionMet}`);
              console.log(`- Cross condition: ${previousPrice.toFixed(4)} < ${alert.valor.toFixed(4)} && ${targetPrice.toFixed(4)} >= ${alert.valor.toFixed(4)} = ${crossCondition}`);
            } else {
              conditionMet = targetPrice <= alert.valor;
              crossCondition = previousPrice !== undefined && 
                            previousPrice > alert.valor && 
                            targetPrice <= alert.valor;
              console.log(`- Condição 'abaixo': ${targetPrice.toFixed(4)} <= ${alert.valor.toFixed(4)} = ${conditionMet}`);
              console.log(`- Cross condition: ${previousPrice.toFixed(4)} > ${alert.valor.toFixed(4)} && ${targetPrice.toFixed(4)} <= ${alert.valor.toFixed(4)} = ${crossCondition}`);
            }
            
            shouldAlert = (conditionMet || crossCondition) && (previousSellPrice !== newSellPrice);
            
            console.log(`- Should alert: ${shouldAlert}`);
            
            if (shouldAlert) {
              const conditionText = alert.condicaoValor === 'acima' ? 'acima' : 'abaixo';
              console.log(`🔔 Alerta de valor específico: ${email} - ${currencyCode} (venda ${conditionText} de R$ ${alert.valor.toFixed(2)})`);
              console.log(`   Preço atual: R$ ${targetPrice.toFixed(4)} (${conditionText} do valor alvo)`);
            }
          } else {
            console.log(`⚠️ Alerta de valor-especifico sem valor ou condição definida:`, alert);
          }
          break;
      }

      if (shouldAlert) {
        if (!allAlertsByEmail.has(email)) {
          allAlertsByEmail.set(email, []);
        }
        allAlertsByEmail.get(email)!.push({
          currencyCode,
          buyPrice: newBuyPrice,
          sellPrice: newSellPrice,
          variacao,
          alertType: alert.tipo,
          alert: { ...alert } // Inclui o objeto de alerta completo
        });

        // Log específico para alerta disparado
        logger.alertTriggered(email, currencyCode, alert.tipo, newSellPrice, variacao);

        // Se for alerta de valor-especifico, remove-o após o disparo
        if (alert.tipo === 'valor-especifico') {
          console.log(`🗑️ Removendo alerta de valor específico após disparo: ${email} - ${currencyCode} (valor: R$ ${alert.valor?.toFixed(2)})`);
          delete this.data[email].alerts[currencyCode];
          // Salva imediatamente para garantir que o alerta seja removido
          this.saveAlerts();
        }
      }
    }
  }

  private setupWebPush() {
    const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
    const vapidEmail = process.env.VAPID_EMAIL || 'contato@seu-dominio.com';

    if (!vapidPublicKey || !vapidPrivateKey || !vapidEmail) {
      console.error('❌ Variáveis de ambiente VAPID não configuradas corretamente');
      return;
    }

    webpush.setVapidDetails(
      `mailto:${vapidEmail}`,
      vapidPublicKey,
      vapidPrivateKey
    );
  }

  private setupEmail() {
    const emailEnabled = process.env.EMAIL_ENABLED === 'true';
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;
    const emailFrom = process.env.EMAIL_FROM || 'no-reply@capcambio.com';

    if (!emailEnabled) {
      console.warn('⚠️ Envio de e-mails desativado (EMAIL_ENABLED=false)');
      return;
    }

    if (!emailUser || !emailPass) {
      console.error('❌ Credenciais de e-mail não configuradas. Configure EMAIL_USER e EMAIL_PASS no .env');
      return;
    }

    try {
      this.emailTransporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT || '587', 10),
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
          user: emailUser,
          pass: emailPass
        },
        tls: {
          rejectUnauthorized: process.env.NODE_ENV === 'production'
        }
      });

      // Verificar a conexão com o servidor SMTP
      this.emailTransporter.verify((error: Error) => {
        if (error) {
          console.error('❌ Falha ao conectar ao servidor de e-mail:', error);
        } else {
          console.log('✅ Servidor de e-mail configurado com sucesso');
        }
      });
    } catch (error) {
      console.error('❌ Erro ao configurar o transporte de e-mail:', error);
    }
  }

  /**
   * Carrega o template de email e compila com Handlebars
   */
  private loadEmailTemplate(language: string = 'pt'): Handlebars.TemplateDelegate {
    try {
      const templatePath = join(__dirname, 'emails', 'templates', `alert-${language}.html`);
      const templateSource = readFileSync(templatePath, 'utf8');
      const template = Handlebars.compile(templateSource);
      console.log(`✅ Template de email carregado e compilado com sucesso para idioma: ${language}`);
      return template;
    } catch (error) {
      console.error(`❌ Erro ao carregar o template de email para idioma ${language}:`, error);
      // Tenta fallback para português
      if (language !== 'pt') {
        console.log('🔄 Tentando fallback para português...');
        return this.loadEmailTemplate('pt');
      }
      // Template de fallback em caso de erro
      const fallbackTemplate = `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; background-color: #f5f5f5;">
          <h2>Olá {{userName}}!</h2>
          <p>{{#if multipleAlerts}}Algumas moedas que você acompanha tiveram alterações de valor!{{else}}Uma moeda que você acompanha teve alteração de valor!{{/if}}</p>
          {{#each alerts}}
          <div style="background: white; padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 4px solid #4CAF50;">
            <h3 style="margin: 0 0 10px 0;">
              {{#if (gt this.variation 0)}}📈{{else}}📉{{/if}}
              {{this.currencyCode}} - {{getCurrencyName this.currencyCode}}
              <span style="color: #666; font-size: 0.9em;">
                ({{#if (eq this.alertType 'subida')}}subiu{{else}}caiu{{/if}})
              </span>
            </h3>
            <p style="margin: 5px 0;"><strong>Valor atual:</strong> R$ {{formatCurrency this.sellPrice}}</p>
            <p style="margin: 5px 0; color: {{#if (gt this.variation 0)}}#10b981{{else}}#ef4444{{/if}};">
              <strong>Variação:</strong> {{#if (gt this.variation 0)}}+{{/if}}{{formatNumber this.variation 2}}%
            </p>
          </div>
          {{/each}}
          <div style="margin-top: 20px; text-align: center;">
            <a href="{{appUrl}}/cotacoes" style="display: inline-block; padding: 10px 20px; background: #4CAF50; color: white; text-decoration: none; border-radius: 4px;">
              Acessar Painel de Cotações
            </a>
          </div>
          <p style="margin-top: 20px; text-align: center; color: #666; font-size: 12px;">
            Este é um e-mail automático, por favor não responda.
          </p>
        </div>
      `;
      console.log('✅ Usando template de fallback');
      return Handlebars.compile(fallbackTemplate);
    }
  }

  /**
   * Obtém o nome do usuário a partir do email
   */
  private async getUserName(email: string): Promise<string> {
    try {
      // Tenta encontrar o nome no arquivo de configuração
      const configPath = join(__dirname, 'config', 'authorized-emails.json');
      if (existsSync(configPath)) {
        const configData = readFileSync(configPath, 'utf8');
        const config = JSON.parse(configData);
        
        // Buscar em authorizedEmails
        const authorizedUser = config.authorizedEmails?.find((u: any) => u.email === email);
        if (authorizedUser?.name) {
          return authorizedUser.name;
        }
        
        // Buscar em adminEmails
        const adminUser = config.adminEmails?.find((u: any) => u.email === email);
        if (adminUser?.name) {
          return adminUser.name;
        }
      }
      
      // Fallback: usar parte do email antes do @
      return email.split('@')[0];
    } catch (error) {
      console.error('❌ Erro ao buscar nome do usuário:', error);
      return 'Cliente';
    }
  }

  private loadAlerts() {
    try {
      if (existsSync(ALERTS_FILE)) {
        const data = readFileSync(ALERTS_FILE, 'utf8');
        this.data = JSON.parse(data);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar alertas:', error);
    }
  }

  /**
   * Salva os alertas no arquivo JSON
   */
  private saveAlerts() {
    try {
      // Adiciona timestamp de última notificação enviada para cada usuário
      const alertsToSave: any = {};
      Object.entries(this.data).forEach(([email, userData]) => {
        alertsToSave[email] = {
          ...userData,
          lastNotificationSent: userData.lastNotificationSent || null
        };
      });
      
      writeFileSync(ALERTS_FILE, JSON.stringify(alertsToSave, null, 2));
      console.log('✅ Alertas salvos com sucesso');
    } catch (error) {
      console.error('❌ Erro ao salvar alertas:', error);
    }
  }

  /**
   * Salva a ordem dos cards para um usuário
   */
  public saveCardOrder(email: string, cardOrder: string[]) {
    try {
      if (!this.data[email]) {
        this.data[email] = { email, alerts: {}, pushSubscriptions: [] };
      }
      
      this.data[email].cardOrder = cardOrder;
      this.saveAlerts();
      console.log(`✅ Ordem dos cards salva para ${email}:`, cardOrder);
    } catch (error) {
      console.error('❌ Erro ao salvar ordem dos cards:', error);
    }
  }

  /**
   * Carrega a ordem dos cards de um usuário
   */
  public getCardOrder(email: string): string[] {
    try {
      return this.data[email]?.cardOrder || [];
    } catch (error) {
      console.error('❌ Erro ao carregar ordem dos cards:', error);
      return [];
    }
  }

  /**
   * Salva o idioma preferido do usuário
   */
  public saveLanguage(email: string, language: string) {
    try {
      if (!this.data[email]) {
        this.data[email] = { email, alerts: {}, pushSubscriptions: [] };
      }

      this.data[email].language = language;
      this.saveAlerts();
      console.log(`✅ Idioma salvo para ${email}:`, language);
    } catch (error) {
      console.error('❌ Erro ao salvar idioma:', error);
    }
  }

  /**
   * Carrega o idioma preferido do usuário
   */
  public getLanguage(email: string): string | null {
    try {
      return this.data[email]?.language || null;
    } catch (error) {
      console.error('❌ Erro ao carregar idioma:', error);
      return null;
    }
  }

// ... (restante do código)
  /**
   * Cria um novo alerta para um usuário
   */
  public createAlert(
    email: string,
    currencyCode: string,
    tipo: 'subida' | 'descida' | 'valor-especifico',
    validade: string | null = null,
    limite?: number,
    valorEspecifico?: number,
    condicaoValor?: 'acima' | 'abaixo' // Condição para alertas de valor específico
  ) {
if (!this.data[email]) {
this.data[email] = { email, alerts: {}, pushSubscriptions: [] };
}

const alertData: Alert = {
tipo,
ativo: true,
ultimoValor: undefined,
validade,
limite,
valorEspecifico
};
        
// Se for um alerta de valor específico, garante que o valor e a condição sejam armazenados
if (tipo === 'valor-especifico') {
if (valorEspecifico !== undefined) {
alertData.valor = valorEspecifico;
alertData.condicaoValor = condicaoValor || 'acima'; // Define a condição como 'acima' por padrão
}
}

this.data[email].alerts[currencyCode] = alertData;
this.saveAlerts();
        
const validadeInfo = validade ? ` até ${new Date(validade).toLocaleDateString('pt-BR')}` : ' por tempo indeterminado';
const valorInfo = tipo === 'valor-especifico' && valorEspecifico !== undefined 
? ` - ${condicaoValor} de R$ ${valorEspecifico.toFixed(2).replace('.', ',')}` 
: '';
        
console.log(`📝 Alerta criado: ${email} - ${currencyCode} (${tipo})${valorInfo}${validadeInfo}`);
  }

  /**
   * Remove um alerta de um usuário
   */
  removeAlert(email: string, currencyCode: string) {
    if (this.data[email]?.alerts[currencyCode]) {
      delete this.data[email].alerts[currencyCode];
      this.saveAlerts();
      console.log(`🗑️ Alerto removido: ${email} - ${currencyCode}`);
    }
  }

  /**
   * Remove todos os alertas de um usuário
   */
  removeAllUserAlerts(email: string) {
    if (this.data[email]) {
      delete this.data[email];
      this.saveAlerts();
      console.log(`🗑️ Todos os alertas do usuário ${email} foram removidos`);
    }
  }

  /**
   * Obtém todos os alertas de um usuário
   */
  getUserAlerts(email: string): UserAlerts | null {
    return this.data[email] || null;
  }

  /**
   * Obtém todos os alertas do sistema (apenas para administradores)
   */
  getAllAlerts(): AlertsData {
    return this.data;
  }

  /**
    
    let shouldAlert = false;
    
    // Verifica se o alerta deve ser disparado baseado no tipo
    switch (alert.tipo) {
      case 'subida':
        shouldAlert = variacao > 0 && Math.abs(variacao) >= (alert.limite || 0);
        break;
      case 'descida':
        shouldAlert = variacao < 0 && Math.abs(variacao) >= (alert.limite || 0);
        break;
          const variacao = ((newSellPrice - previousSellPrice) / previousSellPrice) * 100;
    
    console.log(`🔍 Coletando alertas para ${currencyCode} (Variação: ${variacao > 0 ? '+' : ''}${variacao.toFixed(2)}%)`);
    
    // Verifica alertas para todos os usuários
    for (const [email, userData] of Object.entries(this.data)) {
      const alert = userData.alerts[currencyCode];
      if (!alert || !alert.ativo) continue;
      
      let shouldAlert = false;
      
      // Verifica se o alerta deve ser disparado baseado no tipo
      switch (alert.tipo) {
        case 'subida':
          shouldAlert = variacao > 0 && Math.abs(variacao) >= (alert.limite || 0);
          break;
        case 'descida':
          shouldAlert = variacao < 0 && Math.abs(variacao) >= (alert.limite || 0);
          break;
      }
      
      if (shouldAlert) {
        alerts.push({
          email,
          variacao,
          alertType: alert.tipo
        });
      }
    }
    
    return alerts;
  }

  /**
   * Obtém o nome da moeda a partir do código
   */
  private getCurrencyName(code: string, language: string = 'pt'): string {
    const currencyNames: { [lang: string]: { [key: string]: string } } = {
      'pt': {
        'USD': 'Dólar Americano',
        'EUR': 'Euro',
        'GBP': 'Libra Esterlina',
        'AUD': 'Dólar Australiano',
        'ARS': 'Peso Argentino',
        'NZD': 'Dólar Neozelandês',
        'CAD': 'Dólar Canadense',
        'CHF': 'Franco Suíço',
        'UYU': 'Peso Uruguaio',
        'CLP': 'Peso Chileno',
        'MXN': 'Peso Mexicano',
        'COP': 'Peso Colombiano',
        'CNY': 'Yuan Chinês',
        'JPY': 'Iene Japonês',
        'PEN': 'Sol Peruano',
        'ZAR': 'Rand Sul-Africano',
        'BTC': 'Bitcoin',
        'ETH': 'Ethereum',
        'USDT': 'Tether',
        'BRL': 'Real Brasileiro'
      },
      'en': {
        'USD': 'US Dollar',
        'EUR': 'Euro',
        'GBP': 'British Pound',
        'AUD': 'Australian Dollar',
        'ARS': 'Argentine Peso',
        'NZD': 'New Zealand Dollar',
        'CAD': 'Canadian Dollar',
        'CHF': 'Swiss Franc',
        'UYU': 'Uruguayan Peso',
        'CLP': 'Chilean Peso',
        'MXN': 'Mexican Peso',
        'COP': 'Colombian Peso',
        'CNY': 'Chinese Yuan',
        'JPY': 'Japanese Yen',
        'PEN': 'Peruvian Sol',
        'ZAR': 'South African Rand',
        'BTC': 'Bitcoin',
        'ETH': 'Ethereum',
        'USDT': 'Tether',
        'BRL': 'Brazilian Real'
      },
      'es': {
        'USD': 'Dólar Estadounidense',
        'EUR': 'Euro',
        'GBP': 'Libra Esterlina',
        'AUD': 'Dólar Australiano',
        'ARS': 'Peso Argentino',
        'NZD': 'Dólar Neozelandés',
        'CAD': 'Dólar Canadiense',
        'CHF': 'Franco Suizo',
        'UYU': 'Peso Uruguayo',
        'CLP': 'Peso Chileno',
        'MXN': 'Peso Mexicano',
        'COP': 'Peso Colombiano',
        'CNY': 'Yuan Chino',
        'JPY': 'Yen Japonés',
        'PEN': 'Sol Peruano',
        'ZAR': 'Rand Sudafricano',
        'BTC': 'Bitcoin',
        'ETH': 'Ethereum',
        'USDT': 'Tether',
        'BRL': 'Real Brasileño'
      },
      'fr': {
        'USD': 'Dollar Américain',
        'EUR': 'Euro',
        'GBP': 'Livre Sterling',
        'AUD': 'Dollar Australien',
        'ARS': 'Peso Argentin',
        'NZD': 'Dollar Néo-Zélandais',
        'CAD': 'Dollar Canadien',
        'CHF': 'Franc Suisse',
        'UYU': 'Peso Uruguayen',
        'CLP': 'Peso Chilien',
        'MXN': 'Peso Mexicain',
        'COP': 'Peso Colombien',
        'CNY': 'Yuan Chinois',
        'JPY': 'Yen Japonais',
        'PEN': 'Sol Péruvien',
        'ZAR': 'Rand Sud-Africain',
        'BTC': 'Bitcoin',
        'ETH': 'Ethereum',
        'USDT': 'Tether',
        'BRL': 'Real Brésilien'
      }
    };
    return currencyNames[language]?.[code] || currencyNames['pt']?.[code] || code;
  }

  /**
   * Dicionário de textos de notificação push por idioma
   */
  private pushNotificationTexts: { [lang: string]: { rose: string; fell: string; otherAlert: string; otherAlerts: string } } = {
    'pt': {
      rose: 'Subiu',
      fell: 'Caiu',
      otherAlert: 'outro alerta',
      otherAlerts: 'outros alertas'
    },
    'en': {
      rose: 'Rose',
      fell: 'Fell',
      otherAlert: 'other alert',
      otherAlerts: 'other alerts'
    },
    'es': {
      rose: 'Subió',
      fell: 'Bajó',
      otherAlert: 'otra alerta',
      otherAlerts: 'otras alertas'
    },
    'fr': {
      rose: 'A augmenté',
      fell: 'A baissé',
      otherAlert: 'autre alerte',
      otherAlerts: 'autres alertes'
    }
  };

  /**
   * Obtém o título da notificação push baseado no idioma
   */
  private getPushNotificationTitle(language: string = 'pt'): string {
    const titles: { [lang: string]: string } = {
      'pt': '💰 Alerta de cotações',
      'en': '💰 Currency Alert',
      'es': '💰 Alerta de cotizaciones',
      'fr': '💰 Alerte de devises'
    };
    return titles[language] || titles['pt'];
  }

  /**
   * Envia notificação push para o usuário
   */
  private async sendPushNotification(
    userData: UserAlerts,
    email: string,
    titulo: string,
    mensagem: string,
    currencyCode: string,
    variacao: number,
    language: string = 'pt'
  ) {
    const subscriptions = userData.pushSubscriptions;
    if (!subscriptions || subscriptions.length === 0) {
      console.log(`⚠️ Usuário ${email} não possui assinaturas push ativas`);
      return;
    }

    console.log(`📤 Preparando envio de push para ${email}:`);
    console.log(`   - Título: ${titulo}`);
    console.log(`   - Moedas: ${currencyCode}`);
    console.log(`   - Idioma: ${language}`);
    console.log(`   - Assinaturas: ${subscriptions.length}`);

    const payload = JSON.stringify({
      title: titulo,
      body: mensagem,
      icon: 'https://iili.io/fBQNNwX.jpg',
      badge: 'https://iili.io/fBQNNwX.jpg',
      image: 'https://iili.io/fBQNNwX.jpg',
      actions: [
        {
          action: 'view-quotes',
          title: language === 'en' ? 'View Quotes' : language === 'es' ? 'Ver Cotizaciones' : language === 'fr' ? 'Voir les Cotations' : 'Ver Cotações',
          icon: 'https://iili.io/fBQNNwX.jpg'
        }
      ],
      data: {
        url: `${process.env.APP_URL || ''}/dashboard`,
        actionUrl: 'https://capcambio.com.br/cotacoes',
        currencyCode,
        variacao: currencyCode === 'MULTIPLE' ? null : variacao,
        language
      }
    });

    // Enviar para todas as assinaturas do usuário
    let successCount = 0;
    for (const subscription of subscriptions) {
      try {
        console.log(`   → Enviando para endpoint: ${subscription.endpoint.substring(0, 60)}...`);
        await webpush.sendNotification(subscription, payload);
        console.log(`   ✅ PUSH ENVIADO COM SUCESSO para ${email}`);
        logger.pushSent(email, subscription.endpoint, true);
        successCount++;
      } catch (error: unknown) {
        if (error && typeof error === 'object' && 'statusCode' in error && error.statusCode === 410) {
          // Assinatura expirada, remover do array
          console.log(`   ❌ Assinatura push expirada (410) para ${email}, removendo...`);
          logger.pushSent(email, subscription.endpoint, false, 'Subscription expired (410)');
          const index = subscriptions.indexOf(subscription);
          if (index > -1) {
            subscriptions.splice(index, 1);
          }
          this.saveAlerts();
        } else {
          const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
          const statusCode = error && typeof error === 'object' && 'statusCode' in error ? error.statusCode : 'N/A';
          console.error(`   ❌ Erro ao enviar notificação push para ${email}:`);
          console.error(`      Status: ${statusCode}`);
          console.error(`      Mensagem: ${errorMessage}`);
          logger.pushSent(email, subscription.endpoint, false, `${statusCode}: ${errorMessage}`);
        }
      }
    }

    console.log(`📊 Resumo do envio para ${email}: ${successCount}/${subscriptions.length} notificações enviadas com sucesso\n`);
    // #region agent log
    fetch('http://127.0.0.1:7755/ingest/d33e14d9-8b7f-451e-8c44-954461d3c7f2',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'aff3bf'},body:JSON.stringify({sessionId:'aff3bf',location:'alert-system.ts:sendPushNotification',message:'push_send_summary',data:{email:email.replace(/(.{2}).*(@.*)/,'$1***$2'),total:subscriptions.length,success:successCount},timestamp:Date.now(),hypothesisId:'H1-H3',runId:'post-fix'})}).catch(()=>{});
    // #endregion
  }

  /**
   * Envia um único e-mail com múltiplos alertas agrupados para um usuário
   * @param email Email do destinatário
   * @param alerts Array de alertas a serem enviados
   */
  async sendGroupedAlert(
    email: string,
    alerts: Array<{
      currencyCode: string;
      buyPrice: number;
      sellPrice: number;
      variacao: number;
      alertType: string;
    }>
  ) {
    const userData = this.data[email];
    if (!userData || alerts.length === 0) return;

    console.log(`📨 Preparando para enviar notificações agrupadas para ${email} com ${alerts.length} alerta(s)`);

    // Obtém o idioma do usuário (padrão: pt)
    const userLanguage = userData.language || 'pt';
    console.log(`🌐 Idioma do usuário para push: ${userLanguage}`);

    try {
      // Se houver assinatura push, envia uma única notificação agrupada
      if (userData.pushSubscriptions) {
        // Título baseado no idioma
        const titulo = this.getPushNotificationTitle(userLanguage);

        // Textos baseados no idioma
        const texts = this.pushNotificationTexts[userLanguage] || this.pushNotificationTexts['pt'];

        // Limita a 3 itens na notificação para não ficar muito grande
        const maxItems = 3;
        const totalAlerts = alerts.length;
        const alertsToShow = alerts.slice(0, maxItems);

        // Formata a mensagem com os alertas
        let mensagem = alertsToShow.map(alert => {
          const variacaoFormatada = alert.variacao > 0
            ? `${texts.rose} ${alert.variacao.toFixed(2)}%`
            : `${texts.fell} ${Math.abs(alert.variacao).toFixed(2)}%`;
          return `• ${alert.currencyCode}: R$ ${alert.sellPrice.toFixed(2)} (${variacaoFormatada})`;
        }).join('\n');

        // Adiciona contador se houver mais itens
        if (totalAlerts > maxItems) {
          mensagem += `\n\n+${totalAlerts - maxItems} ${totalAlerts - maxItems === 1 ? texts.otherAlert : texts.otherAlerts}...`;
        }

        // Envia uma única notificação push com todos os alertas
        await this.sendPushNotification(
          userData,
          email,
          titulo,
          mensagem,
          'MULTIPLE', // Indica que é uma notificação com múltiplas moedas
          0, // Variação não usada para notificações múltiplas
          userLanguage
        );
      }

      // Prepara os dados para o template de e-mail
      const emailAlerts = alerts.map(alert => ({
        currencyCode: alert.currencyCode,
        buyPrice: alert.buyPrice,
        sellPrice: alert.sellPrice,
        variation: alert.variacao,
        variationFormatted: `${alert.variacao > 0 ? '+' : ''}${alert.variacao.toFixed(2)}%`,
        alertType: alert.alertType,
        isUp: alert.variacao > 0,
        variationText: alert.variacao > 0 ? 'subiu' : 'caiu',
        variationAbs: Math.abs(alert.variacao).toFixed(2).replace('.', ',')
      }));

      // Envia o e-mail com todos os alertas
      await this.sendEmailNotification(email, emailAlerts);

      logger.emailSent(email, `Alertas de cotações (${alerts.length} moedas)`, alerts.length);

      console.log(`✅ Notificações agrupadas enviadas para ${email} com ${alerts.length} alerta(s)`);
    } catch (error) {
      console.error(`❌ Erro ao enviar notificações para ${email}:`, error);
      
      // Se o erro for relacionado à assinatura push, remove a assinatura inválida
      if (error && typeof error === 'object' && 'statusCode' in error) {
        userData.pushSubscriptions = [];
        this.saveAlerts();
        console.log(`⚠️ Assinaturas push removidas para ${email} devido a erro`);
      }
    }
  }

  /**
   * Envia um ou mais alertas para o usuário em notificações agrupadas
   */
  async sendAlert(
    email: string, 
    alerts: Array<{
      currencyCode: string;
      buyPrice: number;
      sellPrice: number;
      variacao: number;
      alertType: string;
    }>
  ) {
    const userData = this.data[email];
    if (!userData) return;

    // Obtém o idioma do usuário (padrão: pt)
    const userLanguage = userData.language || 'pt';

    // Se houver assinatura push e alertas para notificar, envia uma notificação agrupada
    if (userData.pushSubscriptions && alerts.length > 0) {
      // Título baseado no idioma
      const titulo = this.getPushNotificationTitle(userLanguage);

      // Textos baseados no idioma
      const texts = this.pushNotificationTexts[userLanguage] || this.pushNotificationTexts['pt'];

      // Limita a 3 itens na notificação para não ficar muito grande
      const maxItems = 3;
      const totalAlerts = alerts.length;
      const alertsToShow = alerts.slice(0, maxItems);

      // Formata a mensagem com os alertas
      let mensagem = alertsToShow.map(alert => {
        const variacaoFormatada = alert.variacao > 0
          ? `${texts.rose} ${alert.variacao.toFixed(2)}%`
          : `${texts.fell} ${Math.abs(alert.variacao).toFixed(2)}%`;
        return `• ${alert.currencyCode}: R$ ${alert.sellPrice.toFixed(2)} (${variacaoFormatada})`;
      }).join('\n');

      // Adiciona contador se houver mais itens
      if (totalAlerts > maxItems) {
        mensagem += `\n\n+${totalAlerts - maxItems} ${totalAlerts - maxItems === 1 ? texts.otherAlert : texts.otherAlerts}...`;
      }

      // Envia uma única notificação push com todos os alertas
      await this.sendPushNotification(
        userData,
        email,
        titulo,
        mensagem,
        'MULTIPLE', // Indica que é uma notificação com múltiplas moedas
        0, // Variação não usada para notificações múltiplas
        userLanguage
      );
    }
    
    // Filtra os alertas ativos para notificações por e-mail
    const emailAlerts = alerts.filter(alert => {
      const userAlert = userData.alerts[alert.currencyCode];
      // Verifica se existe um alerta ativo para a moeda
      return userAlert?.ativo !== false;
    });
    
    // Se houver alertas para notificar por e-mail, envia um único e-mail
    if (emailAlerts.length > 0) {
      // Prepara os dados para o template de e-mail
      const alertItems = emailAlerts.map(alert => ({
        currencyCode: alert.currencyCode,
        buyPrice: alert.buyPrice,
        sellPrice: alert.sellPrice,
        variation: alert.variacao,
        variationFormatted: alert.variacao > 0 ? `+${alert.variacao.toFixed(2)}%` : `${alert.variacao.toFixed(2)}%`,
        alertType: alert.alertType,
        isUp: alert.variacao > 0,
        variationText: alert.variacao > 0 ? 'subiu' : 'caiu',
        variationAbs: Math.abs(alert.variacao).toFixed(2).replace('.', ',')
      }));
      
      // Envia um único e-mail com todos os alertas
      await this.sendEmailNotification(email, alertItems);
    }
  }

  /**
   * Envia notificação por e-mail usando o template Handlebars
   */
  private async sendEmailNotification(
    email: string,
    alerts: Array<{
      currencyCode: string;
      buyPrice: number;
      sellPrice: number;
      variation: number;
      variationFormatted: string;
      alertType?: string;
      isUp: boolean;
      variationText: string;
      variationAbs: string;
    }>
  ) {
    console.log('🔍 Método sendEmailNotification chamado para o email:', email);
    console.log(`- Total de alertas: ${alerts.length}`);

    if (!this.emailTransporter) {
      console.warn('⚠️ Serviço de e-mail não configurado');
      console.log('📝 Estado do emailTransporter:', this.emailTransporter);
      console.log('📝 EMAIL_ENABLED:', process.env.EMAIL_ENABLED);
      console.log('📝 EMAIL_USER:', process.env.EMAIL_USER ? '*** (definido)' : 'não definido');
      console.log('📝 EMAIL_PASS:', process.env.EMAIL_PASS ? '*** (definido)' : 'não definido');
      return false;
    }

    try {
      const userData = this.data[email];
      if (!userData) {
        console.warn(`❌ Nenhum dado encontrado para o usuário: ${email}`);
        return false;
      }

      // Obtém o idioma do usuário (padrão: pt)
      const userLanguage = userData.language || 'pt';
      console.log(`🌐 Idioma do usuário: ${userLanguage}`);

      // Carrega o template de e-mail baseado no idioma
      const template = this.loadEmailTemplate(userLanguage);

      // Obtém o nome do usuário
      const userName = await this.getUserName(email);

      // Prepara os dados para o template
      const templateData = {
        userName,
        multipleAlerts: alerts.length > 1,
        language: userLanguage,
        alerts: alerts.map(alert => ({
          ...alert,
          currencyName: this.getCurrencyName(alert.currencyCode, userLanguage)
        })),
        appUrl: process.env.APP_URL || 'https://capcambio.com.br',
        currentYear: new Date().getFullYear()
      };

      // Renderiza o template com os dados
      const htmlContent = template(templateData);

      // Define o assunto baseado no idioma
      const subjects: { [lang: string]: string } = {
        'pt': '💰 Alerta de Cotações',
        'en': '💰 Currency Alert',
        'es': '💰 Alerta de Cotizaciones',
        'fr': '💰 Alerte de Devises'
      };
      const subject = subjects[userLanguage] || subjects['pt'];

      // Envia o e-mail usando o método de retentativa
      await this.sendWithRetry({
        from: process.env.EMAIL_FROM || '"CAP Câmbio" <capcambiocx@gmail.com>',
        to: email,
        subject: subject,
        html: htmlContent,
        headers: {
          'X-Priority': '1',
          'X-MSMail-Priority': 'High',
          'Importance': 'high'
        }
      });

      console.log(`📧 E-mail com ${alerts.length} alerta(s) enviado para ${email} (idioma: ${userLanguage})`);
      return true;
    } catch (error) {
      console.error('❌ Erro ao enviar e-mail:', error);
      return false;
    }
  }

  /**
   * Funções auxiliares para os templates
   */
  private templateHelpers: Record<string, (...args: any[]) => any> = {
    // Verifica se um valor é maior que outro
    gt: (a: number, b: number) => a > b,
    // Formata número com casas decimais
    formatNumber: (num: number, decimals: number) => num.toFixed(decimals).replace('.', ','),
    // Formata valor monetário
    formatCurrency: (value: number) => value.toFixed(2).replace('.', ','),
    // Obtém o nome da moeda
    getCurrencyName: (code: string, language: string = 'pt') => this.getCurrencyName(code, language) || code,
    // Verifica se dois valores são iguais
    eq: (a: any, b: any) => a === b
  };

  /**
   * Renderiza um template de e-mail com as variáveis fornecidas
   */
  private renderTemplate(template: string, variables: Record<string, any>): string {
    let result = template;
    
    // Processa as variáveis para garantir que estejam no formato correto
    const processedVars: Record<string, any> = { ...variables };
    
    // Adiciona as funções auxiliares às variáveis
    Object.assign(processedVars, this.templateHelpers);
    
    // Primeiro, processa os blocos de código EJS
    
    // Processa condicionais EJS
    result = result.replace(/<%\s*if\s*\(([^)]+)\)\s*%>([\s\S]*?)<%\s*\/\s*if\s*%>/g, (_, condition, content) => {
      try {
        // Cria uma função que avalia a condição no contexto das variáveis
        const conditionFn = new Function(...Object.keys(processedVars), `return ${condition};`);
        const isTrue = conditionFn(...Object.values(processedVars));
        return isTrue ? content : '';
      } catch (e) {
        console.error(`Erro ao processar condição EJS ${condition}:`, e);
        return '';
      }
    });
    
    // Processa loops EJS
    result = result.replace(/<%\s*alerts\.forEach\(\s*alert\s*=>\s*\{[\s\S]*?%>([\s\S]*?)<%\s*\}\)\s*;?\s*%>/g, (match: string, content: string) => {
      try {
        if (!Array.isArray(processedVars.alerts)) return '';
        
        return processedVars.alerts.map(alert => {
          let itemResult = content;
          // Adiciona as variáveis do alerta ao contexto
          const alertContext = { ...processedVars, alert };
          
          // Substitui as variáveis do alerta
          for (const [key, value] of Object.entries(alert)) {
            itemResult = itemResult.replace(new RegExp(`<%=?\s*alert\.${key}\s*%>`, 'g'), String(value));
          }
          
          // Substitui as variáveis de função auxiliar
          itemResult = itemResult.replace(/<%=?\s*([a-zA-Z0-9_]+)\((.*?)\)\s*%>/g, (_match: string, funcName: string, args: string) => {
            const func = (alertContext as Record<string, any>)[funcName];
            if (typeof func === 'function') {
              // Extrai os argumentos da função
              const funcArgs = args.split(',').map((arg: string) => {
                const trimmed = arg.trim();
                // Se o argumento é uma referência a uma variável do alerta
                if (trimmed.startsWith('alert.')) {
                  const prop = trimmed.replace('alert.', '');
                  // Usar type assertion para acessar propriedades dinâmicas
                  return (alert as Record<string, any>)[prop];
                }
                // Se for string entre aspas
                if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || 
                    (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
                  return trimmed.slice(1, -1);
                }
                // Se for número
                if (!isNaN(parseFloat(trimmed))) {
                  return parseFloat(trimmed);
                }
                // Se for variável
                return (alertContext as Record<string, any>)[trimmed];
              });
              
              try {
                return String(func(...funcArgs));
              } catch (e) {
                console.error(`Erro ao executar função ${funcName}:`, e);
                return '';
              }
            }
            return '';
          });
          
          return itemResult;
        }).join('');
      } catch (e) {
        console.error('Erro ao processar loop EJS:', e);
        return '';
      }
    });
    
    // Depois de processar os blocos de código, substitui as variáveis simples
    
    // Substitui as variáveis no formato <%= variavel %>
    for (const [key, value] of Object.entries(processedVars)) {
      if (value !== null && value !== undefined) {
        // Evita substituir dentro de blocos de código
        result = result.replace(new RegExp(`<%=(.*?)${key}(.*?)%>`, 'g'), String(value));
        result = result.replace(new RegExp(`<%=(\s*${key}\s*)%>`, 'g'), String(value));
      }
    }
    
    // Substitui as variáveis no formato <%= variavel.propriedade %>
    result = result.replace(/<%=?\s*([a-zA-Z0-9_.]+)\s*%>/g, (match, varPath) => {
      const parts = varPath.split('.');
      let value = processedVars;
      
      for (const part of parts) {
        if (value && typeof value === 'object' && part in value) {
          value = value[part];
        } else {
          return '';
        }
      }
      
      return value !== undefined ? String(value) : '';
    });
    
    // Remove quaisquer tags EJS não processadas
    result = result.replace(/<%.*?%>/g, '');
    
    return result;
  }

  /**
   * Envia um e-mail com tentativas de repetição em caso de falha
   */
  /**
   * Envia um e-mail com tentativas de repetição em caso de falha
   */
  private async sendWithRetry(mailOptions: any, maxRetries = 3, delayMs = 5000): Promise<boolean> {
    let lastError: Error | null = null;

    for (let i = 0; i < maxRetries; i++) {
      try {
        await this.emailTransporter.sendMail(mailOptions);
        return true;
      } catch (error) {
        lastError = error as Error;
        console.warn(`⚠️ Tentativa ${i + 1} de ${maxRetries} falhou ao enviar e-mail:`, error);
        
        if (i < maxRetries - 1) {
          console.log(`⏳ Aguardando ${delayMs}ms antes de tentar novamente...`);
          await new Promise(resolve => setTimeout(resolve, delayMs));
          delayMs *= 2; // Aumenta o tempo de espera para a próxima tentativa
        }
      }
    }

    console.error(`❌ Falha ao enviar e-mail após ${maxRetries} tentativas:`, lastError);
    return false;
  }
}

export const alertSystem = new AlertSystem();
