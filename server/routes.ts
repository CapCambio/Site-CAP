import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { scrapeCurrencyData, updateCurrenciesWithScrapedData } from "./scraper";
import { InsertCurrencyHistory, currencyHistory } from "../shared/schema";
import { eq, desc } from "drizzle-orm";
import { db } from "./db";

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