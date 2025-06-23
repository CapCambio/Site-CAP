import { db } from "./db";
import { currencies, currencyHistory } from "../shared/schema";
import { jsonStorage } from "./json-storage";

export async function migrateToJSON() {
  try {
    console.log('🔄 Iniciando migração do PostgreSQL para JSON...');
    
    // Buscar todas as moedas do PostgreSQL
    const pgCurrencies = await db.select().from(currencies);
    console.log(`📊 Encontradas ${pgCurrencies.length} moedas no PostgreSQL`);
    
    // Buscar todo o histórico do PostgreSQL
    const pgHistory = await db.select().from(currencyHistory);
    console.log(`📈 Encontrados ${pgHistory.length} registros históricos no PostgreSQL`);
    
    // Importar dados para JSON
    await jsonStorage.importFromPostgreSQL(pgCurrencies, pgHistory);
    
    console.log('✅ Migração concluída com sucesso!');
    console.log('📝 Dados agora disponíveis em:');
    console.log('   - ./data/currencies.json');
    console.log('   - ./data/history.json');
    console.log('   - ./data/emails.json');
    
    return true;
  } catch (error) {
    console.error('❌ Erro durante a migração:', error);
    return false;
  }
}