import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { alertSystem } from "./alert-system";
import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import session from 'express-session';
import pg from 'pg';
import PgSession from 'connect-pg-simple';

// Importar refreshCurrencies para usar no timer
import { refreshCurrencies } from "./routes";

// Verificar variáveis de ambiente obrigatórias (apenas avisar se faltar)
const optionalEnvVars = [
  'EMAIL_USER',
  'EMAIL_PASS',
  'VAPID_PUBLIC_KEY',
  'VAPID_PRIVATE_KEY',
  'VAPID_EMAIL'
];

const missingVars = optionalEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.warn('⚠️ Variáveis de ambiente opcionais não definidas:');
  missingVars.forEach(varName => console.warn(`  - ${varName}`));
  console.warn('\nAlgumas funcionalidades podem não funcionar corretamente.\n');
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.set('trust proxy', 1);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const sessionSecret = process.env.SESSION_SECRET || 'fallback-secret-change-in-production';
if (process.env.NODE_ENV === 'production' && !process.env.SESSION_SECRET) {
  console.warn('⚠️ SESSION_SECRET não definido em produção. Usando valor padrão (não recomendado para produção).');
}

// Configurar PostgreSQL para sessões
let sessionStore;

if (process.env.DATABASE_URL) {
  const pgPool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  sessionStore = new (PgSession(session))({
    pool: pgPool,
    tableName: 'session',
    disableTouch: true
  });
  console.log('✅ PostgreSQL configurado para sessões');
} else {
  console.warn('⚠️ DATABASE_URL não definido. Usando MemoryStore (não recomendado para produção).');
}

// Configuração de sessão
app.use(session({
  store: sessionStore,
  secret: sessionSecret || 'fallback-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 horas
  }
}));

// Configuração do Service Worker
app.get('/sw.js', (req, res) => {
  res.set('Service-Worker-Allowed', '/');
  res.type('application/javascript');
  res.sendFile(path.join(__dirname, '../public/sw.js'));
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    
    // Em desenvolvimento, mostra mensagem detalhada
    if (app.get("env") === "development") {
      console.error("Development Error:", err);
      res.status(status).json({ 
        message: err.message || "Internal Server Error",
        stack: err.stack,
        details: err
      });
    } else {
      // Em produção, não expõe detalhes internos
      console.error("Production Error:", {
        message: err.message,
        status: status,
        timestamp: new Date().toISOString()
      });
      
      res.status(status).json({ 
        message: "Internal Server Error" 
      });
    }
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Usando a porta definida nas variáveis de ambiente ou 8080 como padrão
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 8080;
  
  // Sistema de alertas agora verifica apenas no momento da atualização (como a versão antiga)
  log("✅ Sistema de alertas ativado (verificação no momento da atualização)");
  
  // Timer para verificar cotações periodicamente (independente de acesso à página)
  const CHECK_INTERVAL_MINUTES = 1; // Verificar a cada 1 minuto
  log(`⏰ Iniciando verificação automática de cotações a cada ${CHECK_INTERVAL_MINUTES} minutos`);
  
  // Verificação inicial
  refreshCurrencies().catch(error => {
    console.error('Erro na verificação inicial de cotações:', error);
  });
  
  // Configura verificação periódica
  setInterval(() => {
    refreshCurrencies().catch(error => {
      console.error('Erro na verificação periódica de cotações:', error);
    });
  }, CHECK_INTERVAL_MINUTES * 60 * 1000);
  
  server.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port}`);
  });
})();