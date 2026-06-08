import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { scrapeCurrencyData, updateCurrenciesWithScrapedData } from "./scraper";
import { InsertCurrencyHistory } from "../shared/schema";
import { jsonStorage } from "./json-storage";
import { alertSystem } from "./init-alert-system";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { authService } from './auth/AuthService';
import { authenticate, requireAdmin, optionalAuth } from './auth/AuthMiddleware';
import { sessionRegistry } from './auth/SessionRegistry';
import monitoringRoutes from './monitoring/MonitoringRoutes';

// Interface para tipar os administradores
interface AdminUser {
  email: string;
  name?: string;
  lastAccess?: string;
}

// Interface para o objeto de configuração
interface EmailConfig {
  adminEmails: (string | AdminUser)[];
  userEmails?: (string | AdminUser)[];
}

// Interface para o objeto de erro
interface ErrorWithMessage extends Error {
  message: string;
  status?: number;
}

// Declare session type
declare module 'express-session' {
  interface SessionData {
    user?: {
      email: string;
      name: string;
      isAdmin: boolean;
    };
  }
}

// Interface para o tipo Alert
interface Alert {
  tipo: 'subida' | 'descida' | 'valor-especifico';
  ativo: boolean;
  ultimoValor?: number;
  validade: string | null;
  limite?: number;
  valor?: number;
  valorEspecifico?: number;
  condicaoValor?: 'acima' | 'abaixo';
}

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Usar sistema JSON integrado
function loadAuthorizedEmails() {
  try {
    const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'config', 'authorized-emails.json'), 'utf-8'));
    console.log('Configuração carregada do arquivo:', config);
    return {
      authorizedEmails: config.authorizedEmails || [],
      adminEmails: config.adminEmails || []
    };
  } catch (error) {
    console.error('Erro ao carregar emails do arquivo:', error);
    return {
      authorizedEmails: [],
      adminEmails: []
    };
  }
}

async function loadEmailConfig() {
  try {
    // Primeiro tenta ler da variável de ambiente (para Railway/produção)
    const authorizedEmailsEnv = process.env.AUTHORIZED_EMAILS;
    console.log('🔍 Verificando AUTHORIZED_EMAILS:', authorizedEmailsEnv ? 'EXISTS' : 'NOT FOUND');
    if (authorizedEmailsEnv) {
      try {
        const emails = JSON.parse(authorizedEmailsEnv);
        console.log('✅ Emails autorizados carregados da variável de ambiente:', emails);
        return {
          authorizedEmails: emails,
          adminEmails: emails // Usa a mesma lista para admins por enquanto
        };
      } catch (parseError) {
        console.error('❌ Erro ao fazer parse de AUTHORIZED_EMAILS:', parseError);
      }
    }

    // Se não tiver variável de ambiente, tenta ler do arquivo
    // Tenta múltiplos caminhos para funcionar tanto em dev quanto em produção
    const possiblePaths = [
      path.join(__dirname, 'config', 'email-config.json'), // dist/config/ (produção)
      path.join(__dirname, '..', 'server', 'config', 'email-config.json'), // server/config/ (dev)
      path.join(process.cwd(), 'server', 'config', 'email-config.json'), // caminho absoluto
    ];
    
    let configPath = null;
    for (const testPath of possiblePaths) {
      console.log('📁 Testando caminho:', testPath);
      console.log('📁 Arquivo existe?', fs.existsSync(testPath));
      if (fs.existsSync(testPath)) {
        configPath = testPath;
        console.log('✅ Arquivo encontrado em:', configPath);
        break;
      }
    }
    
    if (!configPath) {
      console.log('⚠️ Arquivo email-config.json não encontrado em nenhum caminho, usando lista vazia');
      return { authorizedEmails: [], adminEmails: [] };
    }
    
    // Verifica se o arquivo existe
    try {
      await fs.promises.access(configPath, fs.constants.F_OK);
    } catch (err) {
      // Se o arquivo não existir, retorna um objeto vazio
      console.log('⚠️ Arquivo email-config.json não encontrado, usando lista vazia');
      return { authorizedEmails: [], adminEmails: [] };
    }
    
    // Se o arquivo existir, lê e retorna o conteúdo
    const configData = await fs.promises.readFile(configPath, 'utf-8');
    const config = JSON.parse(configData);
    
    // Garante que as propriedades necessárias existam
    return {
      authorizedEmails: config.authorizedEmails || [],
      adminEmails: config.adminEmails || []
    };
  } catch (error) {
    console.error('Erro ao carregar configuração de emails:', error);
    // Retorna configuração padrão se houver erro
    return {
      authorizedEmails: [],
      adminEmails: []
    };
  }
}

  // Caminho para o arquivo de configuração de e-mails
  const configPath = path.join(__dirname, 'config', 'email-config.json');

  async function saveEmailConfig(config: any) {
    try {
      // Garante que o diretório existe
      await fs.promises.mkdir(path.dirname(configPath), { recursive: true });
      
      // Salva o arquivo de configuração
      await fs.promises.writeFile(configPath, JSON.stringify(config, null, 2));
      console.log('Arquivo de configuração salvo em:', configPath);
    } catch (error) {
      console.error('Erro ao salvar configuração de e-mails:', error);
      throw error; // Re-throw para que o chamador saiba que houve um erro
    }
  }
  
  /**
 * Atualiza o último acesso do usuário
 * @param email E-mail do usuário (em minúsculas)
 * @param isAdmin Indica se o usuário é administrador
 */
async function updateLastAccess(email: string, isAdmin: boolean): Promise<void> {
  try {
    // Garante que o email está em minúsculas
    const emailLower = email.toLowerCase();
    
    // Carrega a configuração atual
    const config = await loadEmailConfig();
    const now = new Date().toISOString();

    console.log(`[${new Date().toISOString()}] Atualizando último acesso para: ${emailLower}, isAdmin: ${isAdmin}`);
    
    let updated = false;

    if (isAdmin) {
      // Atualizar último acesso do admin
      for (let i = 0; i < config.adminEmails.length; i++) {
        const admin = config.adminEmails[i];
        const adminEmail = typeof admin === 'string' ? admin : admin.email;
        
        if (adminEmail && adminEmail.toLowerCase() === emailLower) {
          // Se for uma string, converte para objeto
          if (typeof config.adminEmails[i] === 'string') {
            config.adminEmails[i] = {
              email: config.adminEmails[i] as string,
              name: 'CAP Câmbio',
              lastAccess: now,
              isAdmin: true
            };
          } else {
            // Atualiza apenas o lastAccess, mantendo outras propriedades
            config.adminEmails[i] = {
              ...config.adminEmails[i],
              lastAccess: now,
              isAdmin: true
            };
          }
          console.log(`Admin atualizado:`, config.adminEmails[i]);
          updated = true;
          break;
        }
      }
    } else {
      // Atualizar último acesso do usuário comum
      for (let i = 0; i < config.authorizedEmails.length; i++) {
        const user = config.authorizedEmails[i];
        const userEmail = typeof user === 'string' ? user : user.email;
        
        if (userEmail && userEmail.toLowerCase() === emailLower) {
          // Se for uma string, converte para objeto
          if (typeof config.authorizedEmails[i] === 'string') {
            config.authorizedEmails[i] = {
              email: config.authorizedEmails[i] as string,
              name: emailLower.split('@')[0],
              lastAccess: now,
              createdAt: now,
              isAdmin: false
            };
          } else {
            // Atualiza apenas o lastAccess, mantendo outras propriedades
            config.authorizedEmails[i] = {
              ...config.authorizedEmails[i],
              lastAccess: now,
              isAdmin: false
            };
          }
          console.log(`Usuário atualizado:`, config.authorizedEmails[i]);
          updated = true;
          break;
        }
      }
    }

    if (updated) {
      // Salva as alterações
      await saveEmailConfig(config);
      console.log(`[${new Date().toISOString()}] Último acesso atualizado para ${emailLower}`);
    } else {
      console.warn(`[${new Date().toISOString()}] Usuário não encontrado: ${emailLower}, isAdmin: ${isAdmin}`);
      
      // Se não encontrou o usuário, tenta adicioná-lo (pode ser um novo usuário)
      try {
        if (isAdmin) {
          config.adminEmails.push({
            email: emailLower,
            name: 'CAP Câmbio',
            lastAccess: now,
            createdAt: now,
            isAdmin: true
          });
        } else {
          config.authorizedEmails.push({
            email: emailLower,
            name: emailLower.split('@')[0],
            lastAccess: now,
            createdAt: now,
            isAdmin: false
          });
        }
        await saveEmailConfig(config);
        console.log(`[${new Date().toISOString()}] Novo usuário adicionado: ${emailLower}`);
      } catch (addError) {
        console.error(`[${new Date().toISOString()}] Erro ao adicionar novo usuário ${emailLower}:`, addError);
      }
    }
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Erro ao atualizar último acesso para ${email}:`, error);
    // Não lança o erro para não quebrar o fluxo de login
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Rotas de autenticação
  app.post("/api/auth/check-admin", async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ error: "Email é obrigatório" });
      }

      // Mantém a mesma fonte de verdade usada no login: email-config.json
      const emailConfig = await loadEmailConfig();
      const emailLower = String(email).toLowerCase();

      const isAdmin = emailConfig.adminEmails.some((admin: { email: string; name?: string } | string) =>
        typeof admin === 'string' ? admin === emailLower : admin.email === emailLower
      );

      res.json({ isAdmin });
    } catch (error) {
      console.error("Erro ao verificar admin:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  function loadAdminPasswords(): Record<string, string> {
    try {
      const raw = process.env.ADMIN_PASSWORDS_JSON;
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return {};

      const normalized: Record<string, string> = {};
      for (const [email, pass] of Object.entries(parsed)) {
        if (typeof email === 'string' && typeof pass === 'string') {
          normalized[email.toLowerCase()] = pass;
        }
      }

      return normalized;
    } catch (error) {
      console.error('Erro ao carregar ADMIN_PASSWORDS_JSON:', error);
      return {};
    }
  }

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email) {
        return res.status(400).json({ error: "Email é obrigatório" });
      }

      const emailConfig = await loadEmailConfig();
      const emailLower = email.toLowerCase();

      console.log("Login attempt for:", emailLower);

      // Verificar se é admin
      const adminUser = emailConfig.adminEmails.find((admin: { email: string; name?: string } | string) => 
        typeof admin === 'string' ? admin === emailLower : admin.email === emailLower
      );

      // Verificar se é usuário autorizado
      const regularUser = emailConfig.authorizedEmails.find((user: { email: string; name?: string } | string) => 
        typeof user === 'string' ? user === emailLower : user.email === emailLower
      );

      const isAdminEmail = !!adminUser;
      const isAuthorizedEmail = !!regularUser;

      if (!isAdminEmail && !isAuthorizedEmail) {
        return res.status(401).json({ error: "Email não autorizado" });
      }

      // Verificar senha para admins
      if (isAdminEmail) {
        const adminPasswords = loadAdminPasswords();
        const expectedPassword = adminPasswords[emailLower];

        if (!expectedPassword) {
          console.error(`Senha de admin não configurada para ${emailLower} (ADMIN_PASSWORDS_JSON)`);
          return res.status(500).json({ error: "Senha de administrador não configurada" });
        }

        if (password !== expectedPassword) {
          return res.status(401).json({ error: "Senha incorreta para administrador" });
        }
      }

      // Determinar o nome do usuário
      let userName;

      if (isAdminEmail) {
        if (typeof adminUser === 'object' && adminUser.name) {
          userName = adminUser.name;
        } else {
          userName = 'CAP Câmbio';
        }
      } else {
        if (typeof regularUser === 'object' && regularUser.name) {
          userName = regularUser.name;
        } else {
          userName = (typeof emailLower === 'string' ? emailLower : String(emailLower)).split('@')[0];
        }
      }

      console.log("User name resolved to:", userName);

      // Usuários comuns: primeira sessão prevalece — bloqueia novo login se já houver sessão ativa
      if (!isAdminEmail) {
        const canLogin = await sessionRegistry.canLogin(
          emailLower,
          req.sessionStore,
          req.sessionID
        );
        if (!canLogin) {
          return res.status(409).json({
            error: 'SESSION_ALREADY_ACTIVE',
            message:
              'Não foi possível entrar. Já existe uma sessão ativa com este usuário no momento.',
          });
        }
      }

      // Atualizar último acesso
      try {
        await updateLastAccess(emailLower, isAdminEmail);
      } catch (error) {
        console.error("Erro ao atualizar último acesso:", error);
      }

      // Definir dados da sessão
      req.session.user = {
        email: emailLower,
        name: userName,
        isAdmin: isAdminEmail
      };

      await new Promise<void>((resolve, reject) => {
        req.session.save((err) => (err ? reject(err) : resolve()));
      });

      if (!isAdminEmail) {
        sessionRegistry.setActive(emailLower, req.sessionID);
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

  app.get("/api/auth/me", authenticate, (req, res) => {
    res.json({ user: req.user });
  });

  app.post("/api/auth/release-stale", async (req, res) => {
    try {
      const { email, orphan } = req.body;
      if (!email || typeof email !== 'string') {
        return res.status(400).json({ error: 'Email é obrigatório' });
      }

      const emailLower = email.toLowerCase();
      const released = orphan === true
        ? await sessionRegistry.releaseOrphan(
            emailLower,
            req.sessionStore,
            req.sessionID
          )
        : await sessionRegistry.tryReleaseStale(
            emailLower,
            req.sessionStore,
            req.sessionID
          );

      res.json({
        released,
        message: released
          ? 'Sessão anterior liberada'
          : 'Ainda existe uma sessão ativa em outro dispositivo',
      });
    } catch (error) {
      console.error('Erro ao liberar sessão:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    const email = req.session?.user?.email;
    const isAdmin = req.session?.user?.isAdmin;
    const sessionId = req.sessionID;

    req.session.destroy((err) => {
      if (err) {
        console.error('Erro ao destruir sessão:', err);
        return res.status(500).json({ error: 'Erro ao fazer logout' });
      }

      if (email && !isAdmin) {
        sessionRegistry.release(email, sessionId);
      }

      res.json({ message: 'Logout realizado com sucesso' });
    });
  });

  // API routes
  app.get("/api/currencies", async (req, res) => {
    try {
      const currencies = await jsonStorage.getAllCurrencies();
      res.json(currencies);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch currencies" });
    }
  });

  app.get("/api/currencies/:code", async (req, res) => {
    try {
      const currency = await jsonStorage.getCurrencyByCode(req.params.code);
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
      let startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      let endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

      // Limitar consultas a no máximo 1 ano atrás
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

      // Se startDate for anterior a 1 ano, ajustar para 1 ano atrás
      if (startDate && startDate < oneYearAgo) {
        startDate = oneYearAgo;
      }

      // Se endDate for no futuro, ajustar para agora
      const now = new Date();
      if (endDate && endDate > now) {
        endDate = now;
      }

      // Se não foi fornecida startDate, limitar a 1 ano atrás
      if (!startDate) {
        startDate = oneYearAgo;
      }

      const history = await jsonStorage.getCurrencyHistory(
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
      const currency = await jsonStorage.upsertCurrency(req.body);
      res.status(201).json(currency);
    } catch (error) {
      res.status(500).json({ message: "Failed to create currency" });
    }
  });

  app.post("/api/history", async (req, res) => {
    try {
      const historyEntry = await jsonStorage.addCurrencyHistory(req.body);
      res.status(201).json(historyEntry);
    } catch (error) {
      res.status(500).json({ message: "Failed to add history record" });
    }
  });

  // Endpoint para estatísticas de alertas do admin
  app.get("/api/alerts/admin/stats", authenticate, requireAdmin, async (req, res) => {
    try {
      const { month } = req.query;

      const allAlerts = alertSystem.getAllAlerts();

      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

      let monthStart: Date;
      let monthEnd: Date;

      if (month) {
        const [year, monthNum] = String(month).split('-');
        monthStart = new Date(parseInt(year, 10), parseInt(monthNum, 10) - 1, 1, 0, 0, 0, 0);
        monthEnd = new Date(parseInt(year, 10), parseInt(monthNum, 10), 0, 23, 59, 59, 999);
      } else {
        monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
        monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      }

      let todayCount = 0;
      let monthCount = 0;
      let totalCount = 0;

      for (const userData of Object.values(allAlerts) as any[]) {
        if (!userData?.lastNotificationSent) continue;
        totalCount++;

        const lastSent = new Date(userData.lastNotificationSent);
        if (lastSent >= todayStart && lastSent <= todayEnd) {
          todayCount++;
        }

        if (lastSent >= monthStart && lastSent <= monthEnd) {
          monthCount++;
        }
      }

      res.json({
        today: todayCount,
        month: monthCount,
        total: totalCount,
        selectedMonth: month || null,
      });
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
      res.status(500).json({ error: 'Erro ao carregar estatísticas' });
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

  // Endpoint para salvar ordem dos cards do usuário
  app.post("/api/user/card-order", authenticate, async (req: Request, res: Response) => {
    try {
      const { order } = req.body;
      
      if (!Array.isArray(order)) {
        return res.status(400).json({ error: 'Ordem inválida' });
      }
      
      // Salvar ordem usando o alertSystem
      const userEmail = req.user?.email;
      if (!userEmail) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }
      
      alertSystem.saveCardOrder(userEmail, order);
      
      console.log(`✅ Ordem dos cards salva para ${userEmail}:`, order);
      
      res.json({ success: true, order });
    } catch (error) {
      console.error('Erro ao salvar ordem dos cards:', error);
      res.status(500).json({ error: 'Erro ao salvar ordem dos cards' });
    }
  });

  // Endpoint para carregar ordem dos cards do usuário
  app.get("/api/user/card-order", authenticate, async (req: Request, res: Response) => {
    try {
      const userEmail = req.user?.email;
      if (!userEmail) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const order = alertSystem.getCardOrder(userEmail);

      console.log(`📋 Carregando ordem dos cards para ${userEmail}:`, order);

      res.json({ order });
    } catch (error) {
      console.error('Erro ao carregar ordem dos cards:', error);
      res.status(500).json({ error: 'Erro ao carregar ordem dos cards' });
    }
  });

  // Endpoint para salvar idioma preferido do usuário
  app.post("/api/user/language", authenticate, async (req: Request, res: Response) => {
    try {
      const { language } = req.body;
      const userEmail = req.user?.email;

      if (!userEmail) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      if (!language || !['pt', 'en', 'es', 'fr'].includes(language)) {
        return res.status(400).json({ error: 'Idioma inválido' });
      }

      alertSystem.saveLanguage(userEmail, language);

      console.log(`✅ Idioma salvo para ${userEmail}:`, language);

      res.json({ success: true, language });
    } catch (error) {
      console.error('Erro ao salvar idioma:', error);
      res.status(500).json({ error: 'Erro ao salvar idioma' });
    }
  });

  // Endpoint para carregar idioma preferido do usuário
  app.get("/api/user/language", authenticate, async (req: Request, res: Response) => {
    try {
      const userEmail = req.user?.email;
      if (!userEmail) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const language = alertSystem.getLanguage(userEmail);

      console.log(`📋 Carregando idioma para ${userEmail}:`, language);

      res.json({ language });
    } catch (error) {
      console.error('Erro ao carregar idioma:', error);
      res.status(500).json({ error: 'Erro ao carregar idioma' });
    }
  });

  // Configuração de atualização automática a cada minuto
  const server = createServer(app);

  // Limpeza inicial do histórico antigo
  try {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const deletedCount = await jsonStorage.cleanupOldHistory(oneYearAgo);
    if (deletedCount > 0) {
      console.log(`🗑️ Limpeza inicial: ${deletedCount} registros antigos removidos.`);
    }
  } catch (error) {
    console.error("Erro na limpeza inicial do histórico:", error);
  }

  // Configurar limpeza automática do histórico a cada 24 horas
  setInterval(async () => {
    console.log('🧹 Executando limpeza automática do histórico...');
    try {
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      const deletedCount = await jsonStorage.cleanupOldHistory(oneYearAgo);
      if (deletedCount > 0) {
        console.log(`🗑️ Limpeza automática: ${deletedCount} registros antigos removidos.`);
      } else {
        console.log('✅ Nenhum registro antigo encontrado para remoção.');
      }
    } catch (error) {
      console.error("Erro na limpeza automática do histórico:", error);
    }
  }, 24 * 60 * 60 * 1000); // 24 horas

  // Configurar limpeza automática de emails inativos a cada 7 dias
  setInterval(async () => {
    console.log('📧 Executando limpeza automática de emails inativos...');
    try {
      const removedCount = await cleanupInactiveEmails();
      if (removedCount > 0) {
        console.log(`📧 Limpeza de emails: ${removedCount} emails inativos removidos.`);
      } else {
        console.log('✅ Nenhum email inativo encontrado para remoção.');
      }
    } catch (error) {
      console.error("Erro na limpeza automática de emails:", error);
    }
  }, 7 * 24 * 60 * 60 * 1000); // 7 dias

  // Rotas de monitoramento
  app.use("/api/monitoring", monitoringRoutes);
  
  // Health check endpoint (redireciona para novo sistema)
  app.get("/api/health", async (req, res) => {
    try {
      const { healthChecker } = await import('./monitoring/HealthChecker');
      const health = await healthChecker.runHealthChecks();
      res.json({ 
        status: health.status, 
        timestamp: health.timestamp,
        uptime: health.uptime 
      });
    } catch (error) {
      res.status(500).json({ 
        status: "unhealthy", 
        timestamp: new Date().toISOString() 
      });
    }
  });

  // Admin route to get all user alerts
  app.get("/api/alerts/admin/all", authenticate, requireAdmin, async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = (page - 1) * limit;

      // Carregar todos os alertas usando o alertSystem
      const allAlerts = alertSystem.getAllAlerts();
      
      // Filtrar apenas usuários que têm alertas configurados
      const usersWithAlerts = Object.entries(allAlerts).filter(([email, userData]: [string, any]) => 
        userData && userData.alerts && Object.keys(userData.alerts).length > 0
      );

      // Calcular paginação
      const total = usersWithAlerts.length;
      const totalPages = Math.ceil(total / limit);
      const paginatedUsers = usersWithAlerts.slice(offset, offset + limit);

      // Construir resposta paginada
      const paginatedAlerts: any = {};
      paginatedUsers.forEach(([email, userData]) => {
        paginatedAlerts[email] = userData;
      });

      res.json({
        alerts: paginatedAlerts,
        pagination: {
          page,
          limit,
          total,
          totalPages
        }
      });
    } catch (error) {
      console.error('Erro ao carregar alertas:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Admin email management routes
  app.get("/api/admin/emails", authenticate, requireAdmin, async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = (page - 1) * limit;

      // Usar loadEmailConfig() em vez de loadAuthorizedEmails()
      const emailConfig = await loadEmailConfig();

      // Converter para formato uniforme e adicionar informações de último acesso
      const allEmails = [
        ...emailConfig.authorizedEmails.map((item: any) => {
          console.log('Processando email autorizado:', item);
          return {
            email: typeof item === 'string' ? item : item.email,
            name: typeof item === 'string' ? 'Cliente' : (item.name || 'Cliente'),
            lastAccess: (typeof item === 'object' && item.lastAccess) ? item.lastAccess : null,
            isAdmin: false
          };
        }),
        ...emailConfig.adminEmails.map((item: any) => {
          console.log('Processando email admin:', item);
          return {
            email: typeof item === 'string' ? item : item.email,
            name: typeof item === 'string' ? 'CAP Câmbio' : (item.name || 'CAP Câmbio'),
            lastAccess: (typeof item === 'object' && item.lastAccess) ? item.lastAccess : null,
            isAdmin: true
          };
        })
      ];

      console.log('Todos os emails processados:', allEmails);

      // Ordenar por último acesso (mais recente primeiro), null por último
      allEmails.sort((a, b) => {
        if (!a.lastAccess && !b.lastAccess) return 0;
        if (!a.lastAccess) return 1;
        if (!b.lastAccess) return -1;
        return new Date(b.lastAccess).getTime() - new Date(a.lastAccess).getTime();
      });

      // Aplicar paginação
      const totalEmails = allEmails.length;
      const paginatedEmails = allEmails.slice(offset, offset + limit);

      res.json({
        emails: paginatedEmails,
        pagination: {
          page,
          limit,
          total: totalEmails,
          totalPages: Math.ceil(totalEmails / limit)
        }
      });
    } catch (error) {
      res.status(500).json({ error: "Erro ao carregar emails" });
    }
  });

  app.post("/api/admin/emails", authenticate, requireAdmin, async (req, res) => {
    try {
      const { email, name, type } = req.body;

      if (!email || !type || !name) {
        return res.status(400).json({ error: "Email, nome e tipo são obrigatórios" });
      }

      const emailConfig = await loadEmailConfig();

      if (type === "authorized") {
        // Verificar se email já existe
        const existingIndex = emailConfig.authorizedEmails?.findIndex((e: { email: string; name?: string } | string) => 
          typeof e === 'string' ? e === email : e.email === email
        ) ?? -1;
        if (existingIndex === -1) {
          if (!emailConfig.authorizedEmails) {
            emailConfig.authorizedEmails = [];
          }
          emailConfig.authorizedEmails.push({ email, name });
        }
      } else if (type === "admin") {
        // Verificar se email já existe
        const existingIndex = emailConfig.adminEmails.findIndex((e: { email: string; name?: string } | string) => 
          typeof e === 'string' ? e === email : e.email === email
        );
        if (existingIndex === -1) {
          emailConfig.adminEmails.push({ email, name });
        }
      }

      // Salvar no arquivo
      await saveEmailConfig(emailConfig);

      res.json({ message: "Email adicionado com sucesso" });
    } catch (error) {
      console.error("Erro ao adicionar email:", error);
      res.status(500).json({ error: "Erro ao adicionar email" });
    }
  });

  app.put("/api/admin/emails", authenticate, requireAdmin, async (req, res) => {
    try {
      const { oldEmail, newEmail, name, type } = req.body;

      if (!oldEmail || !newEmail || !name || !type) {
        return res.status(400).json({ error: "Todos os campos são obrigatórios" });
      }

      const emailConfig = await loadEmailConfig();

      if (type === "authorized") {
        const index = emailConfig.authorizedEmails?.findIndex((e: { email: string; name?: string } | string) => 
          typeof e === 'string' ? e === oldEmail : e.email === oldEmail
        ) ?? -1;
        if (index !== -1) {
          if (!emailConfig.authorizedEmails) {
            emailConfig.authorizedEmails = [];
          }
          emailConfig.authorizedEmails[index] = { email: newEmail, name };
        }
      } else if (type === "admin") {
        const index = emailConfig.adminEmails.findIndex((e: { email: string; name?: string } | string) => 
          typeof e === 'string' ? e === oldEmail : e.email === oldEmail
        );
        if (index !== -1) {
          emailConfig.adminEmails[index] = { email: newEmail, name };
        }
      }

      // Salvar no arquivo
      await saveEmailConfig(emailConfig);

      res.json({ message: "Email editado com sucesso" });
    } catch (error) {
      console.error("Erro ao editar email:", error);
      res.status(500).json({ error: "Erro ao editar email" });
    }
  });

  app.delete("/api/admin/emails", authenticate, requireAdmin, async (req, res) => {
    try {
      const { email, type } = req.body;

      if (!email || !type) {
        return res.status(400).json({ error: "Email e tipo são obrigatórios" });
      }

      const emailConfig = await loadEmailConfig();

      // Não permitir remoção de admins
      if (type === "admin") {
        return res.status(400).json({ error: "Não é possível remover emails de administrador" });
      }

      if (type === "authorized") {
        if (emailConfig.authorizedEmails) {
          emailConfig.authorizedEmails = emailConfig.authorizedEmails.filter((e: string | { email: string; name?: string }) => 
            typeof e === 'string' ? e !== email : e.email !== email
          );
        }
        
        // Remover todos os alertas do usuário excluído
        try {
          alertSystem.removeAllUserAlerts(email);
          console.log(`✅ Todos os alertas do usuário ${email} foram removidos`);
        } catch (error) {
          console.error('Erro ao remover alertas do usuário:', error);
        }
      }

      // Salvar no arquivo
      await saveEmailConfig(emailConfig);

      res.json({ message: "Email removido com sucesso" });
    } catch (error) {
      console.error("Erro ao remover email:", error);
      res.status(500).json({ error: "Erro ao remover email" });
    }
  });

  // Função para limpeza automática de emails inativos
  async function cleanupInactiveEmails() {
    try {
      const config = await loadEmailConfig();
      const now = new Date();
      const oneYearAgo = new Date(now.getTime() - 1 * 365 * 24 * 60 * 60 * 1000); // 1 ano
      const sixMonthsAgo = new Date(now.getTime() - 6 * 30 * 24 * 60 * 60 * 1000); // 6 meses

      let removedCount = 0;

      // Filtrar emails autorizados (não admins)
      const originalCount = config.authorizedEmails.length;

      config.authorizedEmails = config.authorizedEmails.filter((user: { email: string; lastAccess?: string; createdAt?: string } | string) => {
        const email = typeof user === 'string' ? user : user.email;
        const lastAccess = typeof user === 'object' && user.lastAccess ? new Date(user.lastAccess) : null;
        const createdAt = typeof user === 'object' && user.createdAt ? new Date(user.createdAt) : null;

        // Se nunca acessou, verificar data de criação
        if (!lastAccess) {
          if (createdAt) {
            // Se temos data de criação, verificar se passou 6 meses
            if (createdAt < sixMonthsAgo) {
              console.log(`🗑️ Removendo email sem acesso criado há mais de 6 meses: ${email} (criado em ${createdAt.toLocaleDateString()})`);
              return false;
            }
          } else {
            // Para emails antigos sem createdAt, assumir que são antigos e remover
            console.log(`🗑️ Removendo email antigo sem registro de acesso: ${email}`);
            return false;
          }
        } else {
          // Se acessou há mais de 1 ano, remove
          if (lastAccess < oneYearAgo) {
            console.log(`🗑️ Removendo email inativo há mais de 1 ano: ${email}`);
            return false;
          }
        }

        return true;
      });

      removedCount = originalCount - config.authorizedEmails.length;

      if (removedCount > 0) {
        await saveEmailConfig(config);
        console.log(`🧹 Limpeza de emails: ${removedCount} emails inativos removidos`);
      }

      return removedCount;
    } catch (error) {
      console.error('Erro na limpeza de emails:', error);
      return 0;
    }
  }



  // Rota para listar emails autorizados (apenas admins)
  app.get('/api/auth/authorized-emails', async (req, res) => {
    try {
      const config = await loadEmailConfig();

      const emails = [
        ...config.adminEmails.map((email: string | { email: string; name?: string }) => ({
          email: typeof email === 'string' ? email : email.email,
          isAdmin: true,
          name: (typeof email === 'string' ? (email.includes('capcambio') ? 'Administrador CAP Câmbio' : undefined) : email.name)
        })),
        ...config.authorizedEmails.map((email: string | { email: string; name?: string }) => ({
          email: typeof email === 'string' ? email : email.email,
          isAdmin: false,
          name: typeof email === 'object' ? email.name : undefined
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

      // Adicionar à lista com data de criação
      const newEmail = {
        email: emailLower,
        name: emailLower.split('@')[0],
        createdAt: new Date().toISOString()
      };
      config.authorizedEmails.push(newEmail);
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
      config.authorizedEmails = config.authorizedEmails.filter((e: string | { email: string; name?: string }) => 
        typeof e === 'string' ? e !== emailLower : e.email !== emailLower
      );
      await saveEmailConfig(config);

      res.json({ success: true, message: 'Email removido com sucesso' });
    } catch (error) {
      console.error('Erro ao remover email:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Rotas do sistema de alertas

  // Obter chave VAPID pública para push notifications
  app.get('/api/alerts/vapid-key', (req, res) => {
    res.json({ publicKey: alertSystem.getVapidPublicKey() });
  });

  // Registrar push subscription
  app.post('/api/alerts/register-push', (req, res) => {
    try {
      const { email, subscription } = req.body;
      console.log('📥 Recebendo requisição de registro push:');
      console.log(`   Email: ${email}`);
      console.log(`   Subscription endpoint: ${subscription?.endpoint?.substring(0, 60)}...`);
      
      alertSystem.registerPushSubscription(email, subscription);
      
      console.log(`✅ Push subscription registrada para ${email}`);
      res.json({ success: true, message: 'Push subscription registrada' });
    } catch (error) {
      console.error('❌ Erro ao registrar push subscription:', error);
      res.status(500).json({ error: 'Erro ao registrar push subscription' });
    }
  });

  // Criar alerta
  app.post("/api/alerts/create", async (req, res) => {
    try {
      const { 
        email, 
        currencyCode, 
        tipo, 
        valor, 
        validade
      } = req.body;

      if (!email || !currencyCode || !tipo) {
        return res.status(400).json({ error: "Campos obrigatórios não fornecidos" });
      }

      // Valida o tipo de alerta
      if (!['subida', 'descida', 'valor-especifico'].includes(tipo)) {
        return res.status(400).json({ 
          error: "Tipo de alerta inválido. Use 'subida', 'descida' ou 'valor-especifico'" 
        });
      }
      
      // Valida se o valor foi fornecido para o tipo 'valor-especifico'
      if (tipo === 'valor-especifico' && (valor === undefined || valor === null)) {
        return res.status(400).json({ 
          error: "Valor específico é obrigatório para este tipo de alerta" 
        });
      }

      // Valida a data de validade se fornecida
      if (validade && typeof validade === 'string') {
        const dataValidade = new Date(validade);
        if (isNaN(dataValidade.getTime())) {
          return res.status(400).json({ error: "Data de validade inválida. Use o formato YYYY-MM-DD" });
        }
      }

      // Para alertas do tipo 'valor-especifico', determinar automaticamente se deve monitorar acima ou abaixo
      let condicaoAutomatica: 'acima' | 'abaixo' = 'acima'; // Valor padrão
      
      if (tipo === 'valor-especifico') {
        try {
          // Obter a moeda para saber o preço atual
          const currency = await jsonStorage.getCurrencyByCode(currencyCode);
          if (!currency) {
            return res.status(404).json({ error: "Moeda não encontrada" });
          }
          
          // Determinar o preço atual (usando apenas preço de venda)
          const precoAtual = currency.sellPrice;
          const valorAlvo = Number(valor);
          
          // Determinar automaticamente se deve monitorar acima ou abaixo
          if (valorAlvo > precoAtual) {
            condicaoAutomatica = 'acima';    // Alerta quando o preço SUBIR
            console.log(`📈 Valor alvo (${valorAlvo}) é maior que preço atual (${precoAtual}) - monitorando SUBIDA`);
          } else if (valorAlvo < precoAtual) {
            condicaoAutomatica = 'abaixo';   // Alerta quando o preço CAIR
            console.log(`📉 Valor alvo (${valorAlvo}) é menor que preço atual (${precoAtual}) - monitorando QUEDA`);
          } else {
            // Se forem iguais, padrão é acima
            console.log(`⚖️  Valor alvo é igual ao preço atual - usando padrão ACIMA`);
          }
        } catch (error) {
          console.error('Erro ao determinar condição automática:', error);
          // Em caso de erro, mantém o valor padrão 'acima'
        }
      }

      // Criar o alerta usando o sistema atualizado
      alertSystem.createAlert(
        email, 
        currencyCode, 
        tipo, 
        validade || null,
        tipo === 'subida' || tipo === 'descida' ? valor || 0 : undefined, // limite apenas para subida/descida
        tipo === 'valor-especifico' ? Number(valor) : undefined, // valor específico
        tipo === 'valor-especifico' ? condicaoAutomatica : undefined // condição (acima/abaixo)
      );

      res.json({ 
        success: true, 
        message: "Alerta criado com sucesso!",
        data: {
          email,
          currencyCode,
          tipo,
          valor: tipo === 'valor-especifico' ? Number(valor) : undefined,
          validade: validade || null,
          condicao: tipo === 'valor-especifico' ? condicaoAutomatica : null
        }
      });
    } catch (error) {
      console.error("Erro ao criar alerta:", error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      res.status(500).json({ error: `Erro ao criar alerta: ${errorMessage}` });
    }
  });

  // Remover alerta
  app.delete('/api/alerts/:email/:currencyCode', (req, res) => {
    try {
      const { email, currencyCode } = req.params;
      alertSystem.removeAlert(email, currencyCode);
      res.json({ success: true, message: 'Alerta removido' });
    } catch (error) {
      console.error('Erro ao remover alerta:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      res.status(500).json({ error: `Erro ao remover alerta: ${errorMessage}` });
    }
  });

  // Obter alertas do usuário
  app.get('/api/alerts/:email', (req, res) => {
    try {
      const { email } = req.params;
      if (!email) {
        return res.status(400).json({ error: 'Email é obrigatório' });
      }
      const alerts = alertSystem.getUserAlerts(email);
      res.json(alerts || { email, alerts: {} });
    } catch (error) {
      console.error('Erro ao buscar alertas:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      res.status(500).json({ error: `Erro ao buscar alertas: ${errorMessage}` });
    }
  });

  // Rota para obter usuários (apenas admin)
  app.get('/api/users', async (req, res) => {
    try {
      // Implemente a lógica para obter usuários aqui
      // Exemplo: const users = await jsonStorage.getAllUsers();
      // Por enquanto, retornando um array vazio
      res.json([]);
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      res.status(500).json({ error: `Erro ao buscar usuários: ${errorMessage}` });
    }
  });

  return server;
}

// Função para atualizar as moedas (usada tanto no endpoint quanto no timer)
export async function refreshCurrencies() {
  try {
    const scrapedData = await scrapeCurrencyData();
    const currentCurrencies = await jsonStorage.getAllCurrencies();
    const updatedCurrencies = updateCurrenciesWithScrapedData(currentCurrencies, scrapedData);
    const now = new Date();
    const savedCurrencies: any[] = [];
    
    // NOVO: Acumular todos os alertas antes de enviar
    const allAlertsByEmail = new Map<string, Array<{
      currencyCode: string;
      buyPrice: number;
      sellPrice: number;
      variacao: number;
      alertType: string;
      alert: Alert;
    }>>();

    // Obter preços anteriores para verificação de alertas
    const previousPrices = new Map<string, { buyPrice: number, sellPrice: number }>();
    
    for (const currency of currentCurrencies) {
      previousPrices.set(currency.code, {
        buyPrice: currency.buyPrice,
        sellPrice: currency.sellPrice
      });
    }

    for (const currency of updatedCurrencies) {
      // Verifica se houve mudança real na cotação
      const lastHistory = await jsonStorage.getLastCurrencyHistory(currency.code);
      let isNewPrice = !lastHistory || 
                      lastHistory.sellPrice !== currency.sellPrice || 
                      lastHistory.buyPrice !== currency.buyPrice;

      
      // Calcula variação baseada no último preço do dia anterior
      let change = 0;
      
      // Definir datas para cálculo de variação
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Buscar último preço do dia anterior
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const dayBeforeYesterday = new Date(yesterday);
      dayBeforeYesterday.setDate(dayBeforeYesterday.getDate() - 1);
      
      const yesterdayHistory = await jsonStorage.getCurrencyHistory(currency.code, dayBeforeYesterday, today);
      const yesterdayRecords = yesterdayHistory
        .filter((record: { timestamp: string | Date }) => {
          const recordDate = new Date(record.timestamp);
          return recordDate >= dayBeforeYesterday && recordDate < today;
        })
        .sort((a: { timestamp: string | Date }, b: { timestamp: string | Date }) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        ); // Mais recente primeiro
      
      if (yesterdayRecords.length > 0) {
        // Usar o último preço registrado do dia anterior
        const lastPriceYesterday = yesterdayRecords[0].sellPrice;
        change = ((currency.sellPrice - lastPriceYesterday) / lastPriceYesterday) * 100;
        change = Number(change.toFixed(2));
      } else {
        // Fallback: se não há dados de ontem, variação = 0
        change = 0;
      }

      // Atualiza moeda sempre, mesmo que o preço não tenha mudado, para atualizar a variação
      const savedCurrency = await jsonStorage.upsertCurrency({
        ...currency,
        change,
        lastUpdate: now.toISOString()
      });

      // Adiciona ao histórico sempre que o preço mudou (respeitando a verificação por hash)
      if (isNewPrice && currency.code) {
        const history: InsertCurrencyHistory = {
          code: currency.code,
          buyPrice: currency.buyPrice,
          sellPrice: currency.sellPrice,
          timestamp: now.toISOString()
        };

        try {
          await jsonStorage.addCurrencyHistory(history);
          savedCurrencies.push(currency);
          
          // VERIFICAÇÃO DE ALERTAS NO MOMENTO EXATO DA ATUALIZAÇÃO (lógica da versão antiga)
          if (previousPrices.has(currency.code)) {
            const previous = previousPrices.get(currency.code)!;
            // Verifica se o preço de venda mudou
            if (previous.sellPrice !== currency.sellPrice) {
              try {
                console.log(`🔔 Verificando alertas para ${currency.code} (${previous.sellPrice} -> ${currency.sellPrice})`);
                
                // Calcular variação para o alerta
                const variacao = ((currency.sellPrice - previous.sellPrice) / previous.sellPrice) * 100;
                
                // Verificar alertas para todos os usuários
                for (const [email, userData] of Object.entries(alertSystem.getAllAlerts())) {
                  const userAlerts = userData.alerts || {};
                  const alert = userAlerts[currency.code];
                  if (!alert || !alert.ativo) continue;

                  let shouldAlert = false;
                  
                  // Verifica se o alerta deve ser disparado baseado no tipo
                  switch (alert.tipo) {
                    case 'subida':
                      shouldAlert = variacao > 0; // Avisa sempre que subir
                      break;
                    case 'descida':
                      shouldAlert = variacao < 0; // Avisa sempre que descer
                      break;
                    case 'valor-especifico':
                      // Verifica se o preço atual atende à condição do valor específico definido
                      if (alert.valor !== undefined && alert.condicaoValor) {
                        const targetPrice = currency.sellPrice;
                        const conditionMet = alert.condicaoValor === 'acima' 
                          ? targetPrice >= alert.valor
                          : targetPrice <= alert.valor;
                        shouldAlert = conditionMet && (previous.sellPrice !== currency.sellPrice);
                      }
                      break;
                  }

                  if (shouldAlert) {
                    if (!allAlertsByEmail.has(email)) {
                      allAlertsByEmail.set(email, []);
                    }
                    allAlertsByEmail.get(email)!.push({
                      currencyCode: currency.code,
                      buyPrice: currency.buyPrice,
                      sellPrice: currency.sellPrice,
                      variacao,
                      alertType: alert.tipo,
                      alert: { ...alert }
                    });
                  }
                }
              } catch (error) {
                console.error(`Erro ao verificar alertas para ${currency.code}:`, error);
              }
            }
          }
        } catch (error) {
          console.error(`Erro ao salvar histórico para ${currency.code}:`, error);
        }
      }
    }

    // Envia um único email por usuário com todos os alertas coletados
    for (const [email, alerts] of Array.from(allAlertsByEmail.entries())) {
      if (alerts.length > 0) {
        await alertSystem.sendAlert(email, alerts);
      }
    }

    return savedCurrencies;
  } catch (error) {
    console.error("Erro ao atualizar moedas:", error);
    throw error;
  }
}