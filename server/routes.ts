import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { scrapeCurrencyData, updateCurrenciesWithScrapedData } from "./scraper";
import { InsertCurrencyHistory } from "../shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
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
      const scrapedData = await scrapeCurrencyData();
      const currentCurrencies = await storage.getAllCurrencies();
      const updatedCurrencies = updateCurrenciesWithScrapedData(currentCurrencies, scrapedData);
      
      // Atualiza as moedas no storage
      const savedCurrencies = await Promise.all(
        updatedCurrencies.map(currency => storage.upsertCurrency(currency))
      );
      
      // Adiciona entradas ao histórico para cada moeda atualizada
      const now = new Date();
      await Promise.all(
        savedCurrencies.map(currency => {
          const historyEntry: InsertCurrencyHistory = {
            code: currency.code,
            buyPrice: currency.buyPrice,
            sellPrice: currency.sellPrice,
            timestamp: now
          };
          return storage.addCurrencyHistory(historyEntry);
        })
      );
      
      res.json({
        message: "Currencies refreshed successfully",
        count: savedCurrencies.length,
        currencies: savedCurrencies
      });
    } catch (error) {
      console.error("Error refreshing currencies:", error);
      res.status(500).json({ 
        message: "Failed to refresh currencies",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Configura o timer para atualização automática a cada minuto
  const setupAutoRefresh = async () => {
    try {
      console.log("Iniciando primeira atualização de moedas...");
      const scrapedData = await scrapeCurrencyData();
      const currentCurrencies = await storage.getAllCurrencies();
      const updatedCurrencies = updateCurrenciesWithScrapedData(currentCurrencies, scrapedData);
      
      // Atualiza as moedas no storage
      const savedCurrencies = await Promise.all(
        updatedCurrencies.map(currency => storage.upsertCurrency(currency))
      );
      
      // Adiciona entradas ao histórico para cada moeda atualizada
      const now = new Date();
      await Promise.all(
        savedCurrencies.map(currency => {
          const historyEntry: InsertCurrencyHistory = {
            code: currency.code,
            buyPrice: currency.buyPrice,
            sellPrice: currency.sellPrice,
            timestamp: now
          };
          return storage.addCurrencyHistory(historyEntry);
        })
      );
      
      console.log(`Atualização automática inicial concluída. ${savedCurrencies.length} moedas atualizadas.`);
    } catch (error) {
      console.error("Erro na atualização automática inicial:", error);
    }
    
    // Define o intervalo para atualização automática (1 minuto = 60000 ms)
    setInterval(async () => {
      try {
        console.log("Executando atualização automática de moedas...");
        const scrapedData = await scrapeCurrencyData();
        const currentCurrencies = await storage.getAllCurrencies();
        const updatedCurrencies = updateCurrenciesWithScrapedData(currentCurrencies, scrapedData);
        
        // Atualiza as moedas no storage
        const savedCurrencies = await Promise.all(
          updatedCurrencies.map(currency => storage.upsertCurrency(currency))
        );
        
        // Adiciona entradas ao histórico para cada moeda atualizada
        const now = new Date();
        await Promise.all(
          savedCurrencies.map(currency => {
            const historyEntry: InsertCurrencyHistory = {
              code: currency.code,
              buyPrice: currency.buyPrice,
              sellPrice: currency.sellPrice,
              timestamp: now
            };
            return storage.addCurrencyHistory(historyEntry);
          })
        );
        
        console.log(`Atualização automática concluída. ${savedCurrencies.length} moedas atualizadas.`);
      } catch (error) {
        console.error("Erro na atualização automática:", error);
      }
    }, 60000); // Atualiza a cada 1 minuto
  };
  
  // Inicia o processo de atualização automática
  setupAutoRefresh();

  const httpServer = createServer(app);
  return httpServer;
}
