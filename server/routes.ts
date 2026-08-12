import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { scrapeCurrencyData, updateCurrenciesWithScrapedData, hasContentChanged } from "./scraper";
import { InsertCurrencyHistory } from "../shared/schema";
import { jsonStorage } from "./json-storage";
import { alertSystem } from "./init-alert-system";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { authService } from './auth/AuthService';
import { authenticate, requireAdmin, optionalAuth } from './auth/JwtMiddleware';
import { JwtService } from './auth/JwtService';
import monitoringRoutes from './monitoring/MonitoringRoutes';
import * as db from './db';

// Map em memória para controle de sessões ativas (email -> { sessionId, lastActivity })
interface ActiveSession {
  sessionId: string;
  lastActivity: number;
}
const activeSessions = new Map<string, ActiveSession>();

// Exportar para uso no AuthMiddleware
(global as any).activeSessions = activeSessions;

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

// Cache em memória para moedas
let currenciesCache: any[] = [];
let currenciesCacheTime = 0;
const CURRENCIES_CACHE_TTL = 30 * 1000; // 30 segundos

// Cache em memória para histórico do dia anterior (reduz queries ao banco)
let yesterdayCache = new Map<string, number>(); // code -> lastSellPrice
let yesterdayCacheDate = '';

// Cache em memória para hash do conteúdo (evita scraping quando conteúdo não mudou)
let lastContentHash = '';

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
    // Usa banco de dados para carregar configuração
    const authorizedEmails = await db.getAuthorizedEmails();
    const adminEmails = await db.getAdminEmails();

    console.log('✅ Emails autorizados carregados do banco de dados:', authorizedEmails.length);
    console.log('✅ Admins carregados do banco de dados:', adminEmails.length);

    return {
      authorizedEmails: authorizedEmails,
      adminEmails: adminEmails
    };
  } catch (error) {
    console.error('Erro ao carregar configuração de emails do banco de dados:', error);
    // Retorna configuração padrão se houver erro
    return {
      authorizedEmails: [],
      adminEmails: []
    };
  }
}

  
  /**
 * Atualiza o último acesso do usuário
 * @param email E-mail do usuário (em minúsculas)
 * @param isAdmin Indica se o usuário é administrador
 */
async function updateLastAccess(email: string, isAdmin: boolean): Promise<void> {
  try {
    const emailLower = email.toLowerCase();
    const now = new Date().toISOString();
    
    console.log(`[${new Date().toISOString()}] Atualizando último acesso para: ${emailLower}, isAdmin: ${isAdmin}`);
    
    // Tenta atualizar usuário existente
    const existingUser = await db.getUserByEmail(emailLower);
    
    if (existingUser) {
      await db.updateUser(emailLower, { last_access: now });
      console.log(`[${new Date().toISOString()}] Último acesso atualizado para ${emailLower}`);
    } else {
      // Se não encontrou, adiciona novo usuário
      console.warn(`[${new Date().toISOString()}] Usuário não encontrado: ${emailLower}, isAdmin: ${isAdmin}`);
      
      try {
        await db.addUser({
          email: emailLower,
          name: isAdmin ? 'CAP Câmbio' : emailLower.split('@')[0],
          is_admin: isAdmin,
          last_access: now,
          created_at: now
        });
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

      // Usa banco de dados para verificar admin
      const adminEmails = await db.getAdminEmails();
      const emailLower = String(email).toLowerCase();

      const isAdmin = adminEmails.some((admin: db.User) =>
        admin.email === emailLower
      );

      res.json({ isAdmin });
    } catch (error) {
      console.error("Erro ao verificar admin:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  async function loadAdminPasswords(): Promise<Record<string, string>> {
    try {
      // Usa banco de dados para carregar senhas de admin
      const adminEmails = await db.getAdminEmails();
      const passwords: Record<string, string> = {};

      for (const admin of adminEmails) {
        if (admin.password) {
          passwords[admin.email.toLowerCase()] = admin.password;
        }
      }

      if (Object.keys(passwords).length > 0) {
        console.log('✅ Senhas de admin carregadas do banco de dados:', Object.keys(passwords));
        return passwords;
      }

      console.log('⚠️ Nenhuma senha de admin encontrada no banco de dados');
      return {};
    } catch (error) {
      console.error('Erro ao carregar senhas de admin do banco de dados:', error);
      return {};
    }
  }

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email) {
        return res.status(400).json({ error: "Email é obrigatório" });
      }

      const emailLower = email.toLowerCase();

      console.log("Login attempt for:", emailLower);

      // Verificar se é admin usando banco de dados
      const adminEmails = await db.getAdminEmails();
      const adminUser = adminEmails.find((admin: db.User) => 
        admin.email === emailLower
      );

      // Verificar se é usuário autorizado usando banco de dados
      const authorizedEmails = await db.getAuthorizedEmails();
      const regularUser = authorizedEmails.find((user: db.User) => 
        user.email === emailLower
      );

      const isAdminEmail = !!adminUser;
      const isAuthorizedEmail = !!regularUser;

      if (!isAdminEmail && !isAuthorizedEmail) {
        return res.status(401).json({ error: "Email não autorizado" });
      }

      // Verificar senha para admins
      if (isAdminEmail) {
        const adminPasswords = await loadAdminPasswords();
        const expectedPassword = adminPasswords[emailLower];

        console.log(`🔐 Verificando senha para ${emailLower}:`);
        console.log(`   Senha esperada: "${expectedPassword}"`);
        console.log(`   Senha recebida: "${password}"`);
        console.log(`   Senhas conferem: ${password === expectedPassword}`);

        if (!expectedPassword) {
          console.error(`Senha de admin não configurada para ${emailLower}`);
          return res.status(500).json({ error: "Senha de administrador não configurada" });
        }

        if (password !== expectedPassword) {
          return res.status(401).json({ error: "Senha incorreta para administrador" });
        }
      }

      // Determinar o nome do usuário
      let userName;

      if (isAdminEmail) {
        userName = adminUser.name || 'CAP Câmbio';
      } else if (regularUser) {
        userName = regularUser.name || emailLower.split('@')[0];
      } else {
        userName = emailLower.split('@')[0];
      }

      console.log("User name resolved to:", userName);

      // Usuários comuns: verificar se já existe sessão ativa em outro dispositivo
      if (!isAdminEmail) {
        const HEARTBEAT_TIMEOUT = 30 * 1000; // 30 segundos
        const activeSession = activeSessions.get(emailLower);
        const now = Date.now();

        if (activeSession) {
          const timeSinceLastActivity = now - activeSession.lastActivity;
          if (timeSinceLastActivity < HEARTBEAT_TIMEOUT) {
            // Sessão ativa com heartbeat recente — bloqueia login
            return res.status(409).json({
              error: 'Já existe uma sessão ativa em outro dispositivo'
            });
          } else {
            // Sem heartbeat por mais de 30 segundos — derruba sessão anterior
            console.log(`🔓 Sessão inativa derrubada para ${emailLower} (${Math.round(timeSinceLastActivity / 1000)}s sem heartbeat)`);
            activeSessions.delete(emailLower);
          }
        }
      }

      // Atualizar último acesso
      try {
        await updateLastAccess(emailLower, isAdminEmail);
      } catch (error) {
        console.error("Erro ao atualizar último acesso:", error);
      }

      // Gerar JWT
      const user = {
        email: emailLower,
        name: userName,
        isAdmin: isAdminEmail
      };
      const token = JwtService.generateToken(user);

      console.log(`[Login] Gerando token para ${emailLower}`);
      console.log(`[Login] NODE_ENV: ${process.env.NODE_ENV}`);
      console.log(`[Login] Token gerado: ${token.substring(0, 20)}...`);

      // Definir cookie JWT
      const isProduction = process.env.NODE_ENV === 'production';
      const cookieConfig = {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax' as const, // Usar 'lax' mesmo em produção pois frontend/backend estão no mesmo domínio
        maxAge: 30 * 24 * 60 * 60 * 1000,
        path: '/'
      };

      console.log(`[Login] Configuração de cookie:`, {
        NODE_ENV: process.env.NODE_ENV,
        isProduction,
        secure: cookieConfig.secure,
        sameSite: cookieConfig.sameSite
      });

      res.cookie('jwt', token, cookieConfig);

      console.log(`[Login] Cookie JWT definido para ${emailLower}`);
      console.log(`[Login] Headers de resposta:`, res.getHeaders());

      // Registrar nova sessão no Map (apenas para usuários regulares)
      if (!isAdminEmail) {
        activeSessions.set(emailLower, {
          sessionId: Date.now().toString(), // Usar timestamp como ID único
          lastActivity: Date.now()
        });
      }

      // Retornar informações de debug sobre o cookie
      return res.json({
        user,
        debug: {
          cookieConfig: {
            httpOnly: cookieConfig.httpOnly,
            secure: cookieConfig.secure,
            sameSite: cookieConfig.sameSite,
            maxAge: cookieConfig.maxAge,
            path: cookieConfig.path
          },
          tokenPreview: token.substring(0, 20) + '...',
          NODE_ENV: process.env.NODE_ENV
        }
      });
    } catch (error) {
      console.error("Erro no login:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.get("/api/auth/me", authenticate, (req, res) => {
    res.json({ user: (req as any).user });
  });

  app.post("/api/auth/logout", (req, res) => {
    const user = (req as any).user;
    const email = user?.email || req.body?.email;
    const isAdmin = user?.isAdmin;

    // Remover sessão do Map (apenas para usuários regulares)
    if (email && !isAdmin) {
      activeSessions.delete(email);
      console.log(`🔓 Sessão removida do Map para ${email}`);
    }

    // Limpar cookie JWT
    res.clearCookie('jwt', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const, // Usar 'lax' mesmo em produção pois frontend/backend estão no mesmo domínio
    });

    res.json({ message: 'Logout realizado com sucesso' });
  });

  // Endpoint de debug para verificar cookie
  app.get("/api/debug/cookie", (req, res) => {
    res.json({
      hasJwt: !!req.cookies?.jwt,
      cookies: Object.keys(req.cookies || {}),
      protocol: req.protocol,
      secure: req.secure,
      hostname: req.hostname,
      origin: req.headers.origin || null,
      referer: req.headers.referer || null,
      NODE_ENV: process.env.NODE_ENV
    });
  });

  app.post("/api/auth/heartbeat", (req, res) => {
    const user = (req as any).user;
    const email = user?.email;
    const isAdmin = user?.isAdmin;

    if (!email || isAdmin) {
      return res.json({ success: false });
    }

    const activeSession = activeSessions.get(email);
    if (activeSession) {
      activeSession.lastActivity = Date.now();
      console.log(`💓 Heartbeat recebido para ${email}`);
    }

    res.json({ success: true });
  });

// API routes
app.get("/api/currencies", async (req, res) => {
  try {
    const now = Date.now();
    
    // Usar cache se ainda válido
    if (currenciesCache.length > 0 && (now - currenciesCacheTime) < CURRENCIES_CACHE_TTL) {
      return res.json(currenciesCache);
    }
    
    // Tentar obter do jsonStorage (fallback)
    const currencies = await jsonStorage.getAllCurrencies();
    
    // Atualizar cache
    currenciesCache = currencies;
    currenciesCacheTime = now;
    
    res.json(currencies);
  } catch (error) {
    // Se houver erro, tentar usar o cache mesmo se expirado
    if (currenciesCache.length > 0) {
      console.warn('Usando cache expirado devido a erro:', error);
      return res.json(currenciesCache);
    }
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
  app.post("/api/user/card-order", async (req: Request, res: Response) => {
    try {
      const { order } = req.body;

      if (!Array.isArray(order)) {
        return res.status(400).json({ error: 'Ordem inválida' });
      }

      // Verificar autenticação manualmente
      const userEmail = (req as any).user?.email;
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
  app.get("/api/user/card-order", async (req: Request, res: Response) => {
    try {
      // Verificar autenticação manualmente
      const userEmail = (req as any).user?.email;
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
  app.post("/api/user/language", async (req: Request, res: Response) => {
    try {
      const { language } = req.body;
      // Verificar autenticação manualmente
      const userEmail = (req as any).user?.email;

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
  app.get("/api/user/language", async (req: Request, res: Response) => {
    try {
      // Verificar autenticação manualmente
      const userEmail = (req as any).user?.email;
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

  // Limpeza inicial do histórico antigo (manter apenas 1 ano)
  try {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const deletedCount = await db.deleteCurrencyHistoryOlderThan(oneYearAgo);
    if (deletedCount > 0) {
      console.log(`🗑️ Limpeza inicial: ${deletedCount} registros antigos removidos (mais de 1 ano).`);
    }
  } catch (error) {
    console.error("Erro na limpeza inicial do histórico:", error);
  }

  // Configurar limpeza automática do histórico a cada 24 horas (manter apenas 1 ano)
  setInterval(async () => {
    try {
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      const deletedCount = await db.deleteCurrencyHistoryOlderThan(oneYearAgo);
      if (deletedCount > 0) {
        console.log(`🗑️ Limpeza automática: ${deletedCount} registros antigos removidos (mais de 1 ano).`);
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

      // Usar banco de dados
      const authorizedEmails = await db.getAuthorizedEmails();
      const adminEmails = await db.getAdminEmails();

      // Converter para formato uniforme e adicionar informações de último acesso
      const allEmails = [
        ...authorizedEmails.map((user: db.User) => {
          return {
            email: user.email,
            name: user.name || 'Cliente',
            lastAccess: user.last_access,
            isAdmin: false
          };
        }),
        ...adminEmails.map((admin: db.User) => {
          return {
            email: admin.email,
            name: admin.name || 'CAP Câmbio',
            lastAccess: admin.last_access,
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

      const emailLower = email.toLowerCase();

      if (type === "authorized") {
        // Verificar se email já existe
        const existingUser = await db.getUserByEmail(emailLower);
        if (!existingUser) {
          await db.addUser({
            email: emailLower,
            name,
            is_admin: false,
            created_at: new Date().toISOString()
          });
        }
      } else if (type === "admin") {
        // Verificar se email já existe
        const existingUser = await db.getUserByEmail(emailLower);
        if (!existingUser) {
          await db.addUser({
            email: emailLower,
            name,
            is_admin: true,
            created_at: new Date().toISOString()
          });
        } else {
          // Se existe, atualiza para admin
          await db.updateUser(emailLower, { is_admin: true });
        }
      }

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

      const oldEmailLower = oldEmail.toLowerCase();
      const newEmailLower = newEmail.toLowerCase();

      // Atualizar email no banco de dados
      await db.updateUser(oldEmailLower, { email: newEmailLower, name });

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

      const emailLower = email.toLowerCase();

      // Não permitir remoção de admins
      if (type === "admin") {
        return res.status(400).json({ error: "Não é possível remover emails de administrador" });
      }

      if (type === "authorized") {
        await db.deleteUser(emailLower);
        
        // Remover todos os alertas do usuário excluído
        try {
          await db.deleteAlertsByUser(emailLower);
          console.log(`✅ Todos os alertas do usuário ${email} foram removidos`);
        } catch (error) {
          console.error('Erro ao remover alertas do usuário:', error);
        }
      }

      res.json({ message: "Email removido com sucesso" });
    } catch (error) {
      console.error("Erro ao remover email:", error);
      res.status(500).json({ error: "Erro ao remover email" });
    }
  });

  // Função para limpeza automática de emails inativos
  async function cleanupInactiveEmails() {
    try {
      const now = new Date();
      const oneYearAgo = new Date(now.getTime() - 1 * 365 * 24 * 60 * 60 * 1000); // 1 ano
      const sixMonthsAgo = new Date(now.getTime() - 6 * 30 * 24 * 60 * 60 * 1000); // 6 meses

      let removedCount = 0;

      // Buscar usuários não admins
      const users = await db.getUsers();
      const nonAdminUsers = users.filter(user => !user.is_admin);

      for (const user of nonAdminUsers) {
        const lastAccess = user.last_access ? new Date(user.last_access) : null;
        const createdAt = user.created_at ? new Date(user.created_at) : null;

        let shouldRemove = false;

        // Se nunca acessou, verificar data de criação
        if (!lastAccess) {
          if (createdAt) {
            // Se temos data de criação, verificar se passou 6 meses
            if (createdAt < sixMonthsAgo) {
              console.log(`🗑️ Removendo email sem acesso criado há mais de 6 meses: ${user.email} (criado em ${createdAt.toLocaleDateString()})`);
              shouldRemove = true;
            }
          } else {
            // Para emails antigos sem createdAt, assumir que são antigos e remover
            console.log(`🗑️ Removendo email antigo sem registro de acesso: ${user.email}`);
            shouldRemove = true;
          }
        } else {
          // Se acessou há mais de 1 ano, remove
          if (lastAccess < oneYearAgo) {
            console.log(`🗑️ Removendo email inativo há mais de 1 ano: ${user.email}`);
            shouldRemove = true;
          }
        }

        if (shouldRemove) {
          await db.deleteUser(user.email);
          removedCount++;
        }
      }

      if (removedCount > 0) {
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
      const adminEmails = await db.getAdminEmails();
      const authorizedEmails = await db.getAuthorizedEmails();

      const emails = [
        ...adminEmails.map((admin: db.User) => ({
          email: admin.email,
          isAdmin: true,
          name: admin.name
        })),
        ...authorizedEmails.map((user: db.User) => ({
          email: user.email,
          isAdmin: false,
          name: user.name
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

      const emailLower = email.toLowerCase();
      const userName = name || emailLower.split('@')[0];

      // Verificar se já existe
      const existingUser = await db.getUserByEmail(emailLower);
      if (existingUser) {
        return res.status(400).json({ error: 'Email já está autorizado' });
      }

      // Adicionar ao banco de dados
      await db.addUser({
        email: emailLower,
        name: userName,
        is_admin: false,
        created_at: new Date().toISOString()
      });

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

      const emailLower = email.toLowerCase();

      // Não permitir remoção de admins
      const existingUser = await db.getUserByEmail(emailLower);
      if (existingUser && existingUser.is_admin) {
        return res.status(400).json({ error: 'Não é possível remover emails de administrador' });
      }

      // Remover do banco de dados
      await db.deleteUser(emailLower);

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
  app.post('/api/alerts/register-push', async (req, res) => {
    try {
      const { email, subscription } = req.body;
      console.log('📥 Recebendo requisição de registro push:');
      console.log(`   Email: ${email}`);
      console.log(`   Subscription endpoint: ${subscription?.endpoint?.substring(0, 60)}...`);
      
      await db.addPushSubscription({
        email: email.toLowerCase(),
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        timestamp: new Date().toISOString()
      });
      
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

      // Criar o alerta usando o banco de dados
      await db.addAlert({
        user_email: email.toLowerCase(),
        currency_code: currencyCode,
        tipo: tipo,
        ativo: true,
        valor: tipo === 'valor-especifico' ? Number(valor) : null,
        condicao_valor: tipo === 'valor-especifico' ? condicaoAutomatica : null
      });

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
  app.delete('/api/alerts/:email/:currencyCode', async (req, res) => {
    try {
      const { email, currencyCode } = req.params;
      const emailLower = email.toLowerCase();
      
      // Buscar alerta do usuário
      const alerts = await db.getAlertsByUser(emailLower);
      const alert = alerts.find(a => a.currency_code === currencyCode);
      
      if (alert) {
        await db.deleteAlert(alert.id);
      }
      
      res.json({ success: true, message: 'Alerta removido' });
    } catch (error) {
      console.error('Erro ao remover alerta:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      res.status(500).json({ error: `Erro ao remover alerta: ${errorMessage}` });
    }
  });

  // Obter alertas do usuário
  app.get('/api/alerts/:email', async (req, res) => {
    try {
      const { email } = req.params;
      if (!email) {
        return res.status(400).json({ error: 'Email é obrigatório' });
      }
      const alerts = await db.getAlertsByUser(email.toLowerCase());
      
      // Converter para o formato esperado pelo frontend
      const alertsFormatted = alerts.reduce((acc: any, alert) => {
        if (!acc[alert.currency_code]) {
          acc[alert.currency_code] = {
            tipo: alert.tipo,
            ativo: alert.ativo,
            valor: alert.valor,
            condicaoValor: alert.condicao_valor
          };
        }
        return acc;
      }, {});
      
      res.json({ email, alerts: alertsFormatted });
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
    // OTIMIZAÇÃO 3: Verificar hash do conteúdo antes de fazer scraping
    const { changed } = await hasContentChanged();
    if (!changed) {
      console.log('✅ Conteúdo não mudou, encerrando refreshCurrencies() sem operações no banco');
      return [];
    }
    
    const scrapedData = await scrapeCurrencyData();
    const currentCurrencies = await jsonStorage.getAllCurrencies();
    const updatedCurrencies = updateCurrenciesWithScrapedData(currentCurrencies, scrapedData);
    const now = new Date();
    const savedCurrencies: any[] = [];
    
    // Invalidar cache de moedas
    currenciesCache = [];
    currenciesCacheTime = 0;
    
    // OTIMIZAÇÃO 2: Cachear histórico do dia anterior em memória
    const todayStr = new Date().toISOString().split('T')[0];
    if (yesterdayCacheDate !== todayStr) {
      console.log('🔄 Atualizando cache de histórico do dia anterior...');
      yesterdayCache = new Map();
      yesterdayCacheDate = todayStr;
      
      // Buscar histórico do dia anterior para todas as moedas
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const dayBeforeYesterday = new Date(yesterday);
      dayBeforeYesterday.setDate(dayBeforeYesterday.getDate() - 1);
      
      // Buscar histórico para todas as moedas de uma vez
      const allHistory = await db.getCurrencyHistory(undefined, dayBeforeYesterday, today);
      
      // Processar e cachear o último preço de cada moeda do dia anterior
      const historyByCode = new Map<string, any[]>();
      allHistory.forEach((record: any) => {
        if (!historyByCode.has(record.code)) {
          historyByCode.set(record.code, []);
        }
        historyByCode.get(record.code)!.push(record);
      });
      
      // Para cada moeda, pegar o último preço do dia anterior
      for (const [code, records] of Array.from(historyByCode.entries())) {
        const sortedRecords = records
          .filter((record: { timestamp: string | Date }) => {
            const recordDate = new Date(record.timestamp);
            return recordDate >= dayBeforeYesterday && recordDate < today;
          })
          .sort((a: { timestamp: string | Date }, b: { timestamp: string | Date }) => 
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );
        
        if (sortedRecords.length > 0) {
          yesterdayCache.set(code, sortedRecords[0].sell_price);
        }
      }
      
      console.log(`✅ Cache de histórico atualizado com ${yesterdayCache.size} moedas`);
    }
    
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
      // Verifica se houve mudança real na cotação comparando com a última moeda salva
      const existingCurrency = currentCurrencies.find(c => c.code === currency.code);
      let isNewPrice = !existingCurrency || 
                      existingCurrency.sellPrice !== currency.sellPrice || 
                      existingCurrency.buyPrice !== currency.buyPrice;

      
      // Calcula variação baseada no último preço do dia anterior (usando cache em memória)
      let change = 0;
      
      // OTIMIZAÇÃO 2: Usa cache em memória em vez de query ao banco
      const lastPriceYesterday = yesterdayCache.get(currency.code);
      if (lastPriceYesterday) {
        change = ((currency.sellPrice - lastPriceYesterday) / lastPriceYesterday) * 100;
        change = Number(change.toFixed(2));
      } else {
        // Fallback: se não há dados no cache, variação = 0
        change = 0;
      }

      // OTIMIZAÇÃO 1: Só faz upsert quando o preço mudou
      if (isNewPrice) {
        const savedCurrency = await jsonStorage.upsertCurrency({
          ...currency,
          change,
          lastUpdate: now.toISOString()
        });
      }

      // Adiciona ao histórico sempre que o preço mudou
      if (isNewPrice && currency.code) {
        const history: InsertCurrencyHistory = {
          code: currency.code,
          buyPrice: currency.buyPrice,
          sellPrice: currency.sellPrice,
          timestamp: now.toISOString()
        };

        try {
          await db.addCurrencyHistory({
            code: currency.code,
            buy_price: currency.buyPrice,
            sell_price: currency.sellPrice,
            timestamp: now.toISOString()
          });
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