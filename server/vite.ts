import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config.js";
import { nanoid } from "nanoid";

const viteLogger = createLogger();

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  const serverOptions: any = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html",
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(import.meta.dirname, "public");
  const optimizedPath = path.resolve(import.meta.dirname, "..", "public", "optimized");
  const homepagePath = path.resolve(import.meta.dirname, "..", "public", "homepage");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  // Servir assets da homepage institucional em /homepage/*
  app.use('/homepage', express.static(homepagePath));

  // Servir assets da homepage também na raiz para compatibilidade com o build
  app.use('/assets', express.static(path.join(homepagePath, 'assets')));
  app.use('/fonts', express.static(path.join(homepagePath, 'fonts')));

  // Middleware para servir assets da homepage quando acessados via rota raiz
  app.use((req, res, next) => {
    if (req.path.startsWith('/assets/') || req.path.startsWith('/fonts/')) {
      const assetPath = path.join(homepagePath, req.path);
      if (fs.existsSync(assetPath)) {
        return res.sendFile(assetPath);
      }
    }
    next();
  });

  // Servir arquivos estáticos do app React (assets, sw.js, manifests, etc.)
  app.use(express.static(distPath));

  // Servir arquivos da pasta optimized
  app.use('/optimized', express.static(optimizedPath));

  // Redirecionamento de /auth para /precos (botao "Acessar plataforma" da homepage)
  app.get('/auth', (req, res) => {
    res.redirect('/precos');
  });

  // Rotas do React app (plataforma, TV, auth) → index.html do React
  const reactAppRoutes = ['/precos', '/tv'];
  for (const route of reactAppRoutes) {
    app.use(route, (_req, res) => {
      res.sendFile(path.resolve(distPath, "index.html"));
    });
  }

  // Raiz e todas as outras rotas → homepage institucional estática
  app.use("*", (_req, res) => {
    const homepageIndex = path.resolve(homepagePath, "index.html");
    if (fs.existsSync(homepageIndex)) {
      res.sendFile(homepageIndex);
    } else {
      // fallback para o React se a homepage não existir
      res.sendFile(path.resolve(distPath, "index.html"));
    }
  });
}
