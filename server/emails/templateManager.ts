import path from 'path';
import ejs from 'ejs';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Função simples para escapar HTML (proteção contra XSS)
function escapeHtml(unsafe: string): string {
  if (typeof unsafe !== 'string') return String(unsafe);
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Extensões personalizadas para o EJS
// Para TypeScript, precisamos fazer um type assertion para acessar a propriedade filters
const ejsWithFilters = ejs as unknown as {
  filters: {
    formatCurrency: (value: number) => string;
    formatDate: (date: Date) => string;
  };
};

ejsWithFilters.filters = {
  formatCurrency: (value: number): string => {
    return value.toFixed(2).replace('.', ',');
  },
  formatDate: (date: Date): string => {
    return date.toLocaleString('pt-BR');
  }
};

class TemplateManager {
  private templateCache: Map<string, string> = new Map();
  private templatesDir: string;
  private cacheStats = { hits: 0, misses: 0 };

  constructor() {
    this.templatesDir = path.join(__dirname, 'templates');
  }

  /**
   * Renderiza um template de e-mail com os dados fornecidos
   */
  async render(templateName: string, data: Record<string, any> = {}): Promise<string> {
    try {
      // Sanitizar dados do usuário antes de passar para o template
      const sanitizedData: Record<string, any> = {};
      for (const [key, value] of Object.entries(data)) {
        if (typeof value === 'string') {
          // Escapar apenas caracteres perigosos, mantendo o restante
          sanitizedData[key] = escapeHtml(value);
        } else if (typeof value === 'number') {
          // Validar números
          sanitizedData[key] = isFinite(value) ? value : 0;
        } else {
          sanitizedData[key] = value;
        }
      }

      // Adiciona variáveis de ambiente e funções auxiliares aos dados do template
      const templateData = {
        ...sanitizedData,
        APP_URL: process.env.APP_URL || 'https://capcambio.com',
        APP_NAME: process.env.APP_NAME || 'CAP Câmbio',
        now: new Date(),
        // Funções auxiliares
        formatCurrency: (value: number) => value.toFixed(2).replace('.', ','),
        formatDate: (date: Date) => date.toLocaleString('pt-BR'),
        getVariationIcon: (variation: number) => variation > 0 ? '▲' : '▼',
        getVariationColor: (variation: number) => variation > 0 ? '#10b981' : '#ef4444'
      };

      // Tenta obter o template do cache
      let template = this.templateCache.get(templateName);
      
      // Se não estiver em cache, carrega do arquivo
      if (!template) {
        this.cacheStats.misses++;
        const templatePath = path.join(this.templatesDir, `${templateName}.html`);
        template = await fs.readFile(templatePath, 'utf-8');
        this.templateCache.set(templateName, template);
        console.log(`📄 Template ${templateName} carregado do arquivo (cache miss)`);
      } else {
        this.cacheStats.hits++;
      }

      // Renderiza o template com os dados
      return ejs.render(template, templateData, {
        views: [this.templatesDir],
        root: this.templatesDir,
        filename: `${templateName}.html`,
        cache: true,
        rmWhitespace: true,
        strict: true,
        async: false
      });
    } catch (error) {
      console.error(`❌ Erro ao renderizar o template ${templateName}:`, error);
      throw new Error(`Falha ao renderizar o template: ${templateName}`);
    }
  }

  /**
   * Renderiza um template de alerta de cotação
   */
  async renderAlertTemplate(data: {
    currencyCode: string;
    buyPrice: number;
    sellPrice: number;
    variation: number;
    alertType: 'subida' | 'descida';
    alertThreshold: number;
  }): Promise<string> {
    const variationFormatted = data.variation > 0 
      ? `+${data.variation.toFixed(2)}%` 
      : `${data.variation.toFixed(2)}%`;

    const alertTitles = {
      'subida': '📈 Alerta de Alta na Cotação',
      'descida': '📉 Alerta de Queda na Cotação'
    };

    // Formata os valores monetários para o formato brasileiro
    const formatCurrency = (value: number): string => {
      return value.toFixed(2).replace('.', ',');
    };

    return this.render('alert', {
      ...data,
      alert_title: alertTitles[data.alertType] || 'Alerta de Cotação',
      variation_formatted: variationFormatted,
      now: new Date(),
      formatCurrency,
      // Garante que o currencyCode seja sempre uma string
      currency_code: String(data.currencyCode).toUpperCase(),
      // Formata os preços para exibição
      buy_price: formatCurrency(data.buyPrice),
      sell_price: formatCurrency(data.sellPrice),
      // Adiciona informações adicionais úteis
      variation_icon: data.variation > 0 ? '▲' : '▼',
      variation_color: data.variation > 0 ? '#10b981' : '#ef4444',
      // Formata o tipo de alerta para exibição amigável
      alert_type_formatted: {
        'subida': 'Alta',
        'descida': 'Queda'
      }[data.alertType] || 'Alerta'
    });
  }
}

export const templateManager = new TemplateManager();
