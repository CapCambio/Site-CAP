import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { scrapeCurrencyData, updateCurrenciesWithScrapedData } from "./scraper";
import { InsertCurrencyHistory, currencyHistory } from "../shared/schema";
import { eq, desc, and, lt } from "drizzle-orm";
import { db } from "./db";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregar emails autorizados
function loadAuthorizedEmails() {
  try {
    const configPath = path.join(__dirname, "config", "authorized-emails.json");
    const data = fs.readFileSync(configPath, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Erro ao carregar emails autorizados:", error);
    return { authorizedEmails: [], adminEmails: [] };
  }
}

async function loadEmailConfig() {
    try {
      const configPath = path.join(__dirname, 'config', 'authorized-emails.json');
      const configData = await fs.readFile(configPath, 'utf-8');
      return JSON.parse(configData);
    } catch (error) {
      console.error('Erro ao carregar configuração de emails:', error);
      // Retorna configuração padrão se houver erro
      return {
        authorizedEmails: [],
        adminEmails: ["admin@example.com"]
      };
    }
  }

  async function saveEmailConfig(config: any) {
    try {
      const configPath = path.join(__dirname, 'config', 'authorized-emails.json');
      await fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf-8');
    } catch (error) {
      console.error('Erro ao salvar configuração de emails:', error);
      throw error;
    }
  }

export async function registerRoutes(app: Express): Promise<Server> {
  // Rotas de autenticação
  app.post("/api/auth/check-admin", (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ error: "Email é obrigatório" });
      }

      const { adminEmails } = loadAuthorizedEmails();
      const isAdmin = adminEmails.includes(email.toLowerCase());

      res.json({ isAdmin });
    } catch (error) {
      console.error("Erro ao verificar admin:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email) {
        return res.status(400).json({ error: "Email é obrigatório" });
      }

      const emailConfig = await loadEmailConfig();
      const emailLower = email.toLowerCase();

      const isAdminEmail = emailConfig.adminEmails.some(adminEmail => adminEmail === emailLower);
      const isAuthorizedEmail = emailConfig.authorizedEmails.some(authEmail => authEmail === emailLower);

      if (!isAdminEmail && !isAuthorizedEmail) {
        return res.status(401).json({ error: "Email não autorizado" });
      }

      if (isAdminEmail && password !== "passo2012") {
        return res.status(401).json({ error: "Senha incorreta para administrador" });
      }

      // Encontrar o nome do usuário
      let userName = emailLower.split('@')[0];

      if (isAdminEmail) {
        const adminUser = emailConfig.adminEmails.find(admin => 
          typeof admin === 'string' ? admin === emailLower : admin.email === emailLower
        );
        userName = typeof adminUser === 'string' ? 'CAP Câmbio' : adminUser?.name || 'CAP Câmbio';
      } else {
        const regularUser = emailConfig.authorizedEmails.find(user => 
          typeof user === 'string' ? user === emailLower : user.email === emailLower
        );
        userName = typeof regularUser === 'string' ? emailLower.split('@')[0] : regularUser?.name || emailLower.split('@')[0];
      }
        
      return res.json({
        user: {
          email: emailLower,
          name: userName,
          isAdmin: isAdminEmail
        }
      });
    } catch (error) {
      console.error("Erro no login:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // API routes
  app.get("/api/currencies", async (req, res) => {
    try {
      const currencies = await storage.getAllCurrencies();
      res.json(currencies);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch currencies" });
    }
  });

  app.get("/api/currencies/:code", async (req, res) => {
    try {
      const currency = await storage.getCurrencyByCode(req.params.code);
      if (!currency) {
        return res.status(404).json({ message: "Currency not found" });
      }
      res.json(currency);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch currency" });
    }
  });

  app.get("/api/history/:code", async (req, res) => {
    try {
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

      const history = await storage.getCurrencyHistory(
        req.params.code, 
        startDate, 
        endDate
      );

      res.json(history);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch currency history" });
    }
  });

  app.post("/api/currencies", async (req, res) => {
    try {
      const currency = await storage.upsertCurrency(req.body);
      res.status(201).json(currency);
    } catch (error) {
      res.status(500).json({ message: "Failed to create currency" });
    }
  });

  app.post("/api/history", async (req, res) => {
    try {
      const historyEntry = await storage.addCurrencyHistory(req.body);
      res.status(201).json(historyEntry);
    } catch (error) {
      res.status(500).json({ message: "Failed to add history record" });
    }
  });

  // Endpoint para forçar um scraping manual dos dados da fonte
  app.get("/api/refresh-currencies", async (req, res) => {
    try {
      const savedCurrencies = await refreshCurrencies();
      res.json({ message: "Currencies refreshed successfully", count: savedCurrencies.length });
    } catch (error) {
      console.error("Error refreshing currencies:", error);
      res.status(500).json({ message: "Failed to refresh currencies" });
    }
  });

  // Configuração de atualização automática a cada minuto
  const server = createServer(app);

  // Primeira atualização na inicialização
  console.log("Iniciando primeira atualização de moedas...");
  await refreshCurrencies();

  // Configura atualização a cada minuto
  setInterval(async () => {
    console.log("Executando atualização automática de moedas...");
    try {
      await refreshCurrencies();
      console.log("Atualização automática concluída. 16 moedas atualizadas.");
    } catch (error) {
      console.error("Erro na atualização automática:", error);
    }
  }, 60000); // 60 segundos

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "OK", timestamp: new Date().toISOString() });
  });

  // Admin email management routes
  app.get("/api/admin/emails", async (req, res) => {
    try {
      const authorizedEmails = loadAuthorizedEmails();
      res.json({
        authorized: authorizedEmails.authorizedEmails,
        admin: authorizedEmails.adminEmails
      });
    } catch (error) {
      res.status(500).json({ error: "Erro ao carregar emails" });
    }
  });

  app.post("/api/admin/emails", async (req, res) => {
    try {
      const { email, name, type } = req.body;

      if (!email || !type || !name) {
        return res.status(400).json({ error: "Email, nome e tipo são obrigatórios" });
      }

      const authorizedEmails = loadAuthorizedEmails();

      if (type === "authorized") {
        // Verificar se email já existe
        const existingIndex = authorizedEmails.authorizedEmails.findIndex(e => 
          typeof e === 'string' ? e === email : e.email === email
        );
        if (existingIndex === -1) {
          authorizedEmails.authorizedEmails.push({ email, name });
        }
      } else if (type === "admin") {
        // Verificar se email já existe
        const existingIndex = authorizedEmails.adminEmails.findIndex(e => 
          typeof e === 'string' ? e === email : e.email === email
        );
        if (existingIndex === -1) {
          authorizedEmails.adminEmails.push({ email, name });
        }
      }

      // Salvar no arquivo
      const configPath = path.join(__dirname, "config", "authorized-emails.json");
      fs.writeFileSync(configPath, JSON.stringify(authorizedEmails, null, 2));

      res.json({ message: "Email adicionado com sucesso" });
    } catch (error) {
      res.status(500).json({ error: "Erro ao adicionar email" });
    }
  });

  app.put("/api/admin/emails", async (req, res) => {
    try {
      const { oldEmail, newEmail, name, type } = req.body;

      if (!oldEmail || !newEmail || !name || !type) {
        return res.status(400).json({ error: "Todos os campos são obrigatórios" });
      }

      const authorizedEmails = loadAuthorizedEmails();

      if (type === "authorized") {
        const index = authorizedEmails.authorizedEmails.findIndex(e => 
          typeof e === 'string' ? e === oldEmail : e.email === oldEmail
        );
        if (index !== -1) {
          authorizedEmails.authorizedEmails[index] = { email: newEmail, name };
        }
      } else if (type === "admin") {
        const index = authorizedEmails.adminEmails.findIndex(e => 
          typeof e === 'string' ? e === oldEmail : e.email === oldEmail
        );
        if (index !== -1) {
          authorizedEmails.adminEmails[index] = { email: newEmail, name };
        }
      }

      // Salvar no arquivo
      const configPath = path.join(__dirname, "config", "authorized-emails.json");
      fs.writeFileSync(configPath, JSON.stringify(authorizedEmails, null, 2));

      res.json({ message: "Email editado com sucesso" });
    } catch (error) {
      res.status(500).json({ error: "Erro ao editar email" });
    }
  });

  app.delete("/api/admin/emails", async (req, res) => {
    try {
      const { email, type } = req.body;

      if (!email || !type) {
        return res.status(400).json({ error: "Email e tipo são obrigatórios" });
      }

      const authorizedEmails = loadAuthorizedEmails();

      if (type === "authorized") {
        authorizedEmails.authorizedEmails = authorizedEmails.authorizedEmails.filter(e => 
          typeof e === 'string' ? e !== email : e.email !== email
        );
      } else if (type === "admin") {
        authorizedEmails.adminEmails = authorizedEmails.adminEmails.filter(e => 
          typeof e === 'string' ? e !== email : e.email !== email
        );
      }

      // Salvar no arquivo
      const configPath = path.join(__dirname, "config", "authorized-emails.json");
      fs.writeFileSync(configPath, JSON.stringify(authorizedEmails, null, 2));

      res.json({ message: "Email removido com sucesso" });
    } catch (error) {
      res.status(500).json({ error: "Erro ao remover email" });
    }
  });

  // Rota para verificar se um email é admin
  app.post('/api/auth/check-admin', async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ error: 'Email é obrigatório' });
      }

      const config = await loadEmailConfig();
      const isAdmin = config.adminEmails.includes(email.toLowerCase());

      res.json({ isAdmin });
    } catch (error) {
      console.error('Erro ao verificar admin:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Rota para listar emails autorizados (apenas admins)
  app.get('/api/auth/authorized-emails', async (req, res) => {
    try {
      const config = await loadEmailConfig();

      const emails = [
        ...config.adminEmails.map(email => ({
          email,
          isAdmin: true,
          name: email.includes('capcambio') ? 'Administrador CAP Câmbio' : undefined
        })),
        ...config.authorizedEmails.map(email => ({
          email,
          isAdmin: false,
          name: undefined
        }))
      ];

      res.json({ emails });
    } catch (error) {
      console.error('Erro ao listar emails:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Rota para adicionar email autorizado (apenas admins)
  app.post('/api/auth/add-email', async (req, res) => {
    try {
      const { email, name } = req.body;

      if (!email) {
        return res.status(400).json({ error: 'Email é obrigatório' });
      }

      const config = await loadEmailConfig();
      const emailLower = email.toLowerCase();

      // Verificar se já existe
      if (config.authorizedEmails.includes(emailLower) || config.adminEmails.includes(emailLower)) {
        return res.status(400).json({ error: 'Email já está autorizado' });
      }

      // Adicionar à lista
      config.authorizedEmails.push(emailLower);
      await saveEmailConfig(config);

      res.json({ success: true, message: 'Email adicionado com sucesso' });
    } catch (error) {
      console.error('Erro ao adicionar email:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Rota para remover email autorizado (apenas admins)
  app.post('/api/auth/remove-email', async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ error: 'Email é obrigatório' });
      }

      const config = await loadEmailConfig();
      const emailLower = email.toLowerCase();

      // Não permitir remoção de admins
      if (config.adminEmails.includes(emailLower)) {
        return res.status(400).json({ error: 'Não é possível remover emails de administrador' });
      }

      // Remover da lista
      config.authorizedEmails = config.authorizedEmails.filter(e => e !== emailLower);
      await saveEmailConfig(config);

      res.json({ success: true, message: 'Email removido com sucesso' });
    } catch (error) {
      console.error('Erro ao remover email:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  return server;
}

// Função para atualizar as moedas (usada tanto no endpoint quanto no timer)
async function refreshCurrencies() {
  try {
    const scrapedData = await scrapeCurrencyData();
    const currentCurrencies = await storage.getAllCurrencies();
    const updatedCurrencies = updateCurrenciesWithScrapedData(currentCurrencies, scrapedData);

    const now = new Date();
    const savedCurrencies = [];

    for (const currency of updatedCurrencies) {
      // Verifica se houve mudança real na cotação
      const lastHistory = await storage.getLastCurrencyHistory(currency.code);
      let isNewPrice = !lastHistory || 
                      lastHistory.sellPrice !== currency.sellPrice || 
                      lastHistory.buyPrice !== currency.buyPrice;

      // Forçamos o cálculo da variação para todas as moedas, independente se o preço mudou
      // Busca o último registro com preço diferente para cálculo de variação (96 horas)
      let previousHistories = await db
        .select()
        .from(currencyHistory)
        .where(eq(currencyHistory.code, currency.code))
        .orderBy(desc(currencyHistory.timestamp))
        .limit(100);  // Pegamos vários registros para garantir que encontraremos um diferente

      // Encontra o registro mais recente com preço diferente
      let previousHistory = null;
      if (previousHistories.length > 1) {
        for (let i = 0; i < previousHistories.length; i++) {
          if (previousHistories[i].sellPrice !== currency.sellPrice) {
            previousHistory = previousHistories[i];
            break;
          }
        }
      }

      // Calcula variação
      let change = 0;
      if (previousHistory && 
          (now.getTime() - previousHistory.timestamp.getTime()) <= 96 * 60 * 60 * 1000) {
        change = ((currency.sellPrice - previousHistory.sellPrice) / previousHistory.sellPrice) * 100;
        change = Number(change.toFixed(2));
      }

      // Atualiza moeda sempre, mesmo que o preço não tenha mudado, para atualizar a variação
      const savedCurrency = await storage.upsertCurrency({
        ...currency,
        change,
        lastUpdate: now
      });

      // Adiciona ao histórico apenas se for um novo preço
      if (isNewPrice) {
        await storage.addCurrencyHistory({
          code: currency.code,
          buyPrice: currency.buyPrice,
          sellPrice: currency.sellPrice,
          timestamp: now
        });
      }

      savedCurrencies.push(savedCurrency);
    }

    return savedCurrencies;
  } catch (error) {
    console.error("Erro ao atualizar moedas:", error);
    throw error;
  }
}