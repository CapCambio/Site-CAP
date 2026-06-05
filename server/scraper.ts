import { createHash } from 'node:crypto';
import path from 'path';
import fs from 'fs/promises';
import * as cheerio from 'cheerio';
import { Currency } from '../shared/schema';

// Interface para os dados extraídos do scraping
export interface ScrapedCurrency {
  name: string;
  code: string;
  buyPrice: number;
  sellPrice: number;
}

// URL da fonte de dados - site real da CTR Câmbio
const SOURCE_URL = 'http://ctrcambio.com.br/tvcaxias/';

// Arquivo para armazenar o último hash
const HASH_FILE_PATH = path.join(process.cwd(), 'server', 'config', 'last-hash.json');

// Arquivo para cache dos dados de moedas
const CACHE_FILE_PATH = path.join(process.cwd(), 'server', 'config', 'currency-cache.json');

interface HashData {
  lastHash: string;
  lastUpdate: string;
}

interface CacheData {
  lastUpdate: string | null;
  currencies: ScrapedCurrency[];
}

/**
 * Gera um hash MD5 do conteúdo da tabela de preços
 */
function generateContentHash(tableContent: string): string {
  return createHash('md5').update(tableContent).digest('hex');
}

/**
 * Carrega o último hash salvo
 */
async function getLastHash(): Promise<string | null> {
  try {
    const data = await fs.readFile(HASH_FILE_PATH, 'utf-8');
    const hashData: HashData = JSON.parse(data);
    return hashData.lastHash;
  } catch (error) {
    console.log('Arquivo de hash não encontrado, será criado na primeira execução.');
    return null;
  }
}

/**
 * Salva o hash atual
 */
async function saveHash(hash: string): Promise<void> {
  try {
    const hashData: HashData = {
      lastHash: hash,
      lastUpdate: new Date().toISOString()
    };
    
    // Garante que o diretório existe
    const dir = path.dirname(HASH_FILE_PATH);
    await fs.mkdir(dir, { recursive: true });
    
    await fs.writeFile(HASH_FILE_PATH, JSON.stringify(hashData, null, 2));
    console.log('Hash salvo com sucesso.');
  } catch (error) {
    console.error('Erro ao salvar hash:', error);
  }
}

// Cache em memória para performance
let memoryCache: { data: ScrapedCurrency[]; timestamp: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

/**
 * Carrega dados do cache (memória primeiro, depois arquivo)
 */
async function getCachedData(): Promise<ScrapedCurrency[]> {
  const now = Date.now();
  
  // Verifica cache em memória primeiro
  if (memoryCache && (now - memoryCache.timestamp) < CACHE_TTL) {
    console.log(`⚡ Cache memória: ${memoryCache.data.length} moedas (idade: ${Math.round((now - memoryCache.timestamp) / 1000)}s)`);
    return memoryCache.data;
  }
  
  try {
    const data = await fs.readFile(CACHE_FILE_PATH, 'utf-8');
    const cacheData: CacheData = JSON.parse(data);
    
    if (cacheData.currencies && cacheData.currencies.length > 0) {
      // Atualiza cache em memória
      memoryCache = {
        data: cacheData.currencies,
        timestamp: now
      };
      
      console.log(`📦 Cache arquivo: ${cacheData.currencies.length} moedas (última atualização: ${cacheData.lastUpdate})`);
      return cacheData.currencies;
    }
  } catch (error) {
    console.log('Cache não encontrado ou inválido.');
  }
  
  return [];
}

/**
 * Salva dados no cache (memória + arquivo)
 */
async function saveCachedData(currencies: ScrapedCurrency[]): Promise<void> {
  try {
    const now = Date.now();
    
    // Atualiza cache em memória primeiro
    memoryCache = {
      data: currencies,
      timestamp: now
    };
    
    const cacheData: CacheData = {
      lastUpdate: new Date().toISOString(),
      currencies
    };
    
    // Garante que o diretório existe
    const dir = path.dirname(CACHE_FILE_PATH);
    await fs.mkdir(dir, { recursive: true });
    
    // Salva em arquivo de forma assíncrona (não bloqueia)
    fs.writeFile(CACHE_FILE_PATH, JSON.stringify(cacheData, null, 2))
      .then(() => console.log(`💾 Cache atualizado com ${currencies.length} moedas.`))
      .catch(error => console.error('Erro ao salvar cache:', error));
      
  } catch (error) {
    console.error('Erro ao salvar cache:', error);
  }
}

/**
 * Verifica se houve mudança no conteúdo da página
 */
async function hasContentChanged(): Promise<{ changed: boolean; tableContent?: string }> {
  console.log('Verificando mudanças no conteúdo da página...');

  try {
    // Busca conteúdo da URL
    console.log(`🌐 Buscando página: ${SOURCE_URL}`);
    const response = await fetch(SOURCE_URL);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const html = await response.text();
    console.log(`📄 Página recebida com ${html.length} caracteres`);
    const $ = cheerio.load(html);
    
    console.log(`🔍 Encontradas ${$('table').length} tabelas no HTML`);

    // Extrai apenas o conteúdo relevante da tabela de preços
    let tableContent = '';
    
    $('table').each((tableIndex: number, tableElement: any) => {
      const rows = $(tableElement).find('tr');
      if (rows.length > 0) {
        const headerTexts: string[] = [];
        $(rows[0]).find('th, td').each((i: number, cell: any) => {
          headerTexts.push($(cell).text().trim());
        });

        const headerText = headerTexts.join(' ').toLowerCase();
        if (
          headerText.includes('moeda') || 
          headerText.includes('valor') || 
          headerText.includes('compra') || 
          headerText.includes('venda') ||
          headerText.includes('câmbio') ||
          headerText.includes('cotação')
        ) {
          // Esta é a tabela de cotações, extrair todo o conteúdo
          $(rows).each((rowIndex: number, row: any) => {
            const cells = $(row).find('td, th');
            const rowContent: string[] = [];
            
            cells.each((cellIndex: number, cell: any) => {
              rowContent.push($(cell).text().trim());
            });
            
            tableContent += rowContent.join('|') + '\n';
          });
        }
      }
    });

    if (!tableContent) {
      console.log('Tabela de cotações não encontrada, usando conteúdo da página como fallback.');
      // Se não encontrou a tabela, usa elementos que possam conter cotações
      tableContent = $('div:contains("USD"), div:contains("EUR"), div:contains("R$")').text();
    }

    // Gera o hash do conteúdo
    const currentHash = generateContentHash(tableContent);
    console.log(`Hash atual: ${currentHash}`);

    // Compara com o último hash salvo
    const lastHash = await getLastHash();
    console.log(`Último hash: ${lastHash || 'N/A'}`);

    const changed = currentHash !== lastHash;
    
    if (changed) {
      console.log('🔄 Conteúdo da página mudou! Iniciando scraping...');
      await saveHash(currentHash);
      return { changed: true, tableContent };
    } else {
      console.log('✅ Nenhuma mudança detectada no conteúdo.');
      return { changed: false };
    }

  } catch (error) {
    console.error('Erro ao verificar mudanças:', error);
    // Em caso de erro, assume que houve mudança para tentar fazer o scraping
    return { changed: true };
  }
}

/**
 * Função para extrair dados de câmbio usando Cheerio com verificação de hash
 */
export async function scrapeCurrencyData(): Promise<ScrapedCurrency[]> {
  // Primeiro verifica se houve mudança no conteúdo
  const { changed } = await hasContentChanged();
  
  if (!changed) {
    console.log('📋 Sem mudanças detectadas. Tentando carregar do cache...');
    
    // Tenta carregar do cache
    const cachedData = await getCachedData();
    if (cachedData.length > 0) {
      return cachedData;
    }
    
    console.log('Cache vazio, fazendo scraping completo...');
  }

  console.log('🔄 Mudanças detectadas ou cache vazio. Iniciando extração de dados com Cheerio...');

  try {
    // Busca conteúdo da URL
    console.log(`🌐 Buscando página: ${SOURCE_URL}`);
    const response = await fetch(SOURCE_URL);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const html = await response.text();
    
    // Limitar tamanho do HTML (proteção contra DoS)
    const MAX_HTML_SIZE = 5 * 1024 * 1024; // 5MB
    if (html.length > MAX_HTML_SIZE) {
      throw new Error(`HTML muito grande (${html.length} bytes), possivel ataque DoS`);
    }
    
    const $ = cheerio.load(html);

    console.log('Página carregada, analisando conteúdo...');

    // Depuração básica da estrutura da página
    console.log(`Título da página: ${$('title').text()}`);
    console.log(`Número de tabelas: ${$('table').length}`);

    // Analisando as tabelas
    if ($('table').length > 0) {
      console.log('Analisando tabelas...');

      // Tentando extrair cotações de tabelas
      const results: ScrapedCurrency[] = [];
      let tableFound = false;

      $('table').each((tableIndex: number, tableElement: any) => {
        console.log(`Analisando tabela ${tableIndex + 1}:`);

        // Verifica o número de linhas da tabela
        const rows = $(tableElement).find('tr');
        console.log(`- Tabela ${tableIndex + 1} tem ${rows.length} linhas`);

        // Verifica estrutura da primeira linha (cabeçalho potencial)
        if (rows.length > 0) {
          const headerTexts: string[] = [];
          $(rows[0]).find('th, td').each((i: number, cell: any) => {
            headerTexts.push($(cell).text().trim());
          });
          console.log(`- Cabeçalhos potenciais: ${headerTexts.join(' | ')}`);

          // Se a primeira linha tem conteúdo que indicam ser uma tabela de cotações
          const headerText = headerTexts.join(' ').toLowerCase();
          if (
            headerText.includes('moeda') || 
            headerText.includes('valor') || 
            headerText.includes('compra') || 
            headerText.includes('venda') ||
            headerText.includes('câmbio') ||
            headerText.includes('cotação')
          ) {
            console.log('Tabela de cotações encontrada!');
            tableFound = true;

            // Definindo índices das colunas relevantes (nome/código, compra, venda)
            let nameIndex = -1;
            let buyIndex = -1;
            let sellIndex = -1;

            // Identifica índices das colunas relevantes pelo cabeçalho
            headerTexts.forEach((text, index) => {
              const lowerText = text.toLowerCase();
              if (lowerText.includes('moeda') || lowerText.includes('descrição') || lowerText.includes('nome')) {
                nameIndex = index;
              } else if (lowerText.includes('compra')) {
                buyIndex = index;
              } else if (lowerText.includes('venda')) {
                sellIndex = index;
              }
            });

            // Se não conseguiu determinar pelos cabeçalhos, assume os índices padrão (0, 1, 2)
            if (nameIndex === -1 || buyIndex === -1 || sellIndex === -1) {
              console.log('Usando índices padrão para as colunas (moeda: 0, compra: 1, venda: 2)');
              nameIndex = 0;
              buyIndex = 1;
              sellIndex = 2;
            }

            // Para cada linha após o cabeçalho
            $(rows).each((rowIndex: number, row: any) => {
              // Pula o cabeçalho
              if (rowIndex === 0 && headerTexts.some(h => h.toLowerCase().includes('moeda') || h.toLowerCase().includes('compra'))) {
                return; // Equivalente a continue no loop each do jQuery
              }

              const cells = $(row).find('td');

              // Verifica se tem células suficientes
              if (cells.length < Math.max(nameIndex, buyIndex, sellIndex) + 1) {
                return;
              }

              try {
                // Extrai o conteúdo de cada célula relevante
                const nameText = $(cells[nameIndex]).text().trim();
                const buyText = $(cells[buyIndex]).text().trim().replace('R$', '').replace(',', '.').trim();
                const sellText = $(cells[sellIndex]).text().trim().replace('R$', '').replace(',', '.').trim();

                // Log para debug - mostrar linha e conteúdo exato extraído
                console.log(`Linha ${rowIndex}: "${nameText}" | "${buyText}" | "${sellText}"`);

                // Tentar extrair o código da moeda e nome
                let code = '';
                let name = nameText;

                // Formato: "Nome Moeda (XXX)" - extrai o código entre parênteses
                const codeMatch = nameText.match(/\(([A-Z]{3})\)/);
                if (codeMatch) {
                  code = codeMatch[1];
                  name = nameText.replace(/\s*\([A-Z]{3}\)/, '').trim();
                } 
                // Formato: "XXX - Nome da Moeda" - extrai o código no início
                else if (nameText.match(/^[A-Z]{3}\s*[-–—]\s*.+/)) {
                  const parts = nameText.split(/[-–—]/);
                  code = parts[0].trim();
                  name = parts.slice(1).join('-').trim();
                }
                // Formato: "Nome da Moeda - XXX" - extrai o código no final
                else if (nameText.match(/.+\s*[-–—]\s*[A-Z]{3}$/)) {
                  const parts = nameText.split(/[-–—]/);
                  code = parts[parts.length - 1].trim();
                  name = parts.slice(0, -1).join('-').trim();
                }
                // Verifica se o texto é apenas o código
                else if (/^[A-Z]{3}$/.test(nameText)) {
                  code = nameText;

                  // Mapeamento de códigos para nomes
                  const codeToName: Record<string, string> = {
                    'USD': 'Dólar Americano',
                    'EUR': 'Euro',
                    'GBP': 'Libra Esterlina',
                    'CAD': 'Dólar Canadense',
                    'AUD': 'Dólar Australiano',
                    'ARS': 'Peso Argentino',
                    'CLP': 'Peso Chileno',
                    'UYU': 'Peso Uruguaio',
                    'CHF': 'Franco Suíço',
                    'JPY': 'Iene Japonês',
                    'CNY': 'Yuan Chinês',
                    'MXN': 'Peso Mexicano',
                    'PYG': 'Guarani Paraguaio',
                    'PEN': 'Novo Sol Peruano',
                    'BOB': 'Boliviano',
                    'COP': 'Peso Colombiano'
                  };

                  name = codeToName[code] || code;
                }
                // Tentativa de extrair por palavras-chave conhecidas
                else {
                  const lowerName = nameText.toLowerCase();

                  if (lowerName.includes('dólar') || lowerName.includes('dolar')) {
                    if (lowerName.includes('australiano') || lowerName.includes('aud')) {
                      code = 'AUD';
                      name = 'Dólar Australiano';
                    } else if (lowerName.includes('canadense') || lowerName.includes('cad')) {
                      code = 'CAD';
                      name = 'Dólar Canadense';
                    } else if (lowerName.includes('neozelandês') || lowerName.includes('neozelandes') || lowerName.includes('nzd')) {
                      code = 'NZD';
                      name = 'Dólar Neozelandês';
                    } else {
                      code = 'USD';
                      name = 'Dólar Americano';
                    }
                  } else if (lowerName.includes('euro')) {
                    code = 'EUR';
                    name = 'Euro';
                  } else if (lowerName.includes('libra')) {
                    code = 'GBP';
                    name = 'Libra Esterlina';
                  } else if (lowerName.includes('iene') || lowerName.includes('japones') || lowerName.includes('japonês')) {
                    code = 'JPY';
                    name = 'Iene Japonês';
                  } else if (lowerName.includes('yuan') || lowerName.includes('chines') || lowerName.includes('chinês')) {
                    code = 'CNY';
                    name = 'Yuan Chinês';
                  } else if (lowerName.includes('peso')) {
                    if (lowerName.includes('argentino') || lowerName.includes('arg')) {
                      code = 'ARS';
                      name = 'Peso Argentino';
                    } else if (lowerName.includes('chileno') || lowerName.includes('chile')) {
                      code = 'CLP';
                      name = 'Peso Chileno';
                    } else if (lowerName.includes('uruguaio') || lowerName.includes('uruguai')) {
                      code = 'UYU';
                      name = 'Peso Uruguaio';
                    } else if (lowerName.includes('mexicano') || lowerName.includes('mexico')) {
                      code = 'MXN';
                      name = 'Peso Mexicano';
                    } else if (lowerName.includes('colombiano') || lowerName.includes('colombia')) {
                      code = 'COP';
                      name = 'Peso Colombiano';
                    }
                  } else if (lowerName.includes('franco') || lowerName.includes('suiço') || lowerName.includes('suíço')) {
                    code = 'CHF';
                    name = 'Franco Suíço';
                  } else if (lowerName.includes('guarani') || lowerName.includes('paraguaio')) {
                    code = 'PYG';
                    name = 'Guarani Paraguaio';
                  } else if (lowerName.includes('sol') || lowerName.includes('peruano')) {
                    code = 'PEN';
                    name = 'Novo Sol Peruano';
                  } else if (lowerName.includes('boliviano') || lowerName.includes('bolivia')) {
                    code = 'BOB';
                    name = 'Boliviano';
                  } else if (lowerName.includes('rand') || lowerName.includes('africano') || lowerName.includes('áfrica') || lowerName.includes('africa')) {
                    code = 'ZAR';
                    name = 'Rand Africano';
                  }
                }

                // Tratamento específico para moedas que precisam de corrções manuais
                if (rowIndex === 6 && nameText.includes("Neozelandês")) {
                  code = "NZD";
                  name = "Dólar Neozelandês";
                } else if (rowIndex === 16 && nameText.includes("Rand")) {
                  code = "ZAR";
                  name = "Rand Africano";
                }

                // Se conseguiu extrair um código
                if (code) {
                  // Converte os textos para valores numéricos
                  const buyPrice = parseFloat(buyText);
                  const sellPrice = parseFloat(sellText);

                  // Validação numérica melhorada
                  if (!isFinite(buyPrice) || !isFinite(sellPrice) || isNaN(buyPrice) || isNaN(sellPrice)) {
                    console.log(`Valores não numéricos: Compra: ${buyText}, Venda: ${sellText}`);
                    return; // return funciona como continue em callbacks do Cheerio
                  }

                  // Limites razoáveis para preços (evitar valores absurdos)
                  if (buyPrice < 0 || buyPrice > 1000 || sellPrice < 0 || sellPrice > 1000) {
                    console.log(`Valores fora dos limites razoáveis: Compra: ${buyPrice}, Venda: ${sellPrice}`);
                    return; // return funciona como continue em callbacks do Cheerio
                  }

                  // Adiciona à lista somente se os valores são válidos
                  if (buyPrice > 0 && sellPrice > 0) {
                    console.log(`Extraído: ${name} (${code}), Compra: ${buyPrice}, Venda: ${sellPrice}`);

                    results.push({
                      name,
                      code,
                      buyPrice,
                      sellPrice
                    });
                  } else {
                    console.log(`Valores inválidos: Compra: ${buyText}/${buyPrice}, Venda: ${sellText}/${sellPrice}`);
                  }
                } else {
                  console.log(`Não foi possível extrair o código da moeda: ${nameText}`);
                }
              } catch (err) {
                console.error(`Erro ao processar linha ${rowIndex}:`, err);
              }
            });
          }
        }
      });

      // Se encontrou moedas na tabela
      if (tableFound && results.length > 0) {
        console.log(`Extração concluída. Encontradas ${results.length} moedas.`);
        
        // Salva no cache
        await saveCachedData(results);
        
        return results;
      }
    }

    // Tenta outros métodos se a análise de tabela falhou
    console.log('Tentando extrair moedas de outros elementos...');

    // Se não encontrou dados na tabela, procura por elementos específicos com palavras-chave
    const currencyElements = $('div:contains("USD"), div:contains("EUR"), span:contains("USD"), span:contains("EUR")');
    console.log(`Encontrados ${currencyElements.length} elementos com menções a moedas.`);

    if (currencyElements.length > 0) {
      console.log('Analisando elementos com menções a moedas...');

      // Tenta extrair mais informações para depuração
      currencyElements.each((i: number, element: any) => {
        if (i < 5) { // Limita a análise para não sobrecarregar os logs
          console.log(`Elemento ${i}: ${$(element).text().trim().substring(0, 100)}...`);
        }
      });
    }

    console.log('Não foi possível extrair os dados da página. Verificando cache...');
    
    // Tenta carregar do cache antes de usar os valores hardcoded
    const cachedData = await getCachedData();
    if (cachedData.length > 0) {
      console.log('Usando dados do cache como fallback.');
      return cachedData;
    }
    
    // Se não houver cache, usa os valores hardcoded como último recurso
    console.log('Nenhum dado em cache encontrado. Usando valores de fallback hardcoded.');
    
    // Lista de moedas na ordem exata da página fonte (valores hardcoded como último recurso)
    const currencies: ScrapedCurrency[] = [
      { name: "Dólar Americano", code: "USD", buyPrice: 5.55, sellPrice: 5.92 },
      { name: "Euro", code: "EUR", buyPrice: 6.40, sellPrice: 6.81 },
      { name: "Libra Esterlina", code: "GBP", buyPrice: 7.45, sellPrice: 8.19 },
      { name: "Dólar Australiano", code: "AUD", buyPrice: 3.52, sellPrice: 3.96 },
      { name: "Peso Argentino", code: "ARS", buyPrice: 0.004, sellPrice: 0.006 },
      { name: "Dólar Neozelandês", code: "NZD", buyPrice: 3.25, sellPrice: 3.64 },
      { name: "Dólar Canadense", code: "CAD", buyPrice: 4.00, sellPrice: 4.46 },
      { name: "Franco Suíço", code: "CHF", buyPrice: 6.60, sellPrice: 7.40 },
      { name: "Peso Uruguaio", code: "UYU", buyPrice: 0.135, sellPrice: 0.17 },
      { name: "Peso Chileno", code: "CLP", buyPrice: 0.0059, sellPrice: 0.0071 },
      { name: "Peso Mexicano", code: "MXN", buyPrice: 0.28, sellPrice: 0.35 },
      { name: "Peso Colombiano", code: "COP", buyPrice: 0.0014, sellPrice: 0.00185 },
      { name: "Yuan Chinês", code: "CNY", buyPrice: 0.75, sellPrice: 0.90 },
      { name: "Iene Japonês", code: "JPY", buyPrice: 0.032, sellPrice: 0.0453 },
      { name: "Sol Peruano", code: "PEN", buyPrice: 1.63, sellPrice: 1.74 },
      { name: "Rand Africano", code: "ZAR", buyPrice: 0.28, sellPrice: 0.356 }
    ];
    
    // Salva os valores hardcoded no cache para uso futuro
    await saveCachedData(currencies);
    
    return currencies;
  } catch (error) {
    console.error('Erro ao fazer scraping dos dados de moedas:', error);

    // Em caso de erro, tenta usar o cache primeiro
    console.log('Erro na extração. Verificando cache...');
    
    try {
      const cachedData = await getCachedData();
      if (cachedData.length > 0) {
        console.log('Usando dados do cache após falha no scraping.');
        return cachedData;
      }
      console.log('Nenhum dado em cache disponível.');
    } catch (cacheError) {
      console.error('Erro ao acessar cache:', cacheError);
    }

    // Se não houver cache, usa os valores hardcoded como último recurso
    console.log('Usando valores de fallback hardcoded.');
    
    // Lista de moedas na ordem exata da página fonte (valores hardcoded como último recurso)
    const currencies: ScrapedCurrency[] = [
      { name: "Dólar Americano", code: "USD", buyPrice: 5.55, sellPrice: 5.92 },
      { name: "Euro", code: "EUR", buyPrice: 6.40, sellPrice: 6.81 },
      { name: "Libra Esterlina", code: "GBP", buyPrice: 7.45, sellPrice: 8.19 },
      { name: "Dólar Australiano", code: "AUD", buyPrice: 3.52, sellPrice: 3.96 },
      { name: "Peso Argentino", code: "ARS", buyPrice: 0.004, sellPrice: 0.006 },
      { name: "Dólar Neozelandês", code: "NZD", buyPrice: 3.25, sellPrice: 3.64 },
      { name: "Dólar Canadense", code: "CAD", buyPrice: 4.00, sellPrice: 4.46 },
      { name: "Franco Suíço", code: "CHF", buyPrice: 6.60, sellPrice: 7.40 },
      { name: "Peso Uruguaio", code: "UYU", buyPrice: 0.135, sellPrice: 0.17 },
      { name: "Peso Chileno", code: "CLP", buyPrice: 0.0059, sellPrice: 0.0071 },
      { name: "Peso Mexicano", code: "MXN", buyPrice: 0.28, sellPrice: 0.35 },
      { name: "Peso Colombiano", code: "COP", buyPrice: 0.0014, sellPrice: 0.00185 },
      { name: "Yuan Chinês", code: "CNY", buyPrice: 0.75, sellPrice: 0.90 },
      { name: "Iene Japonês", code: "JPY", buyPrice: 0.032, sellPrice: 0.0453 },
      { name: "Sol Peruano", code: "PEN", buyPrice: 1.63, sellPrice: 1.74 },
      { name: "Rand Africano", code: "ZAR", buyPrice: 0.28, sellPrice: 0.356 }
    ];
    
    // Tenta salvar no cache para uso futuro (se possível)
    try {
      await saveCachedData(currencies);
    } catch (saveError) {
      console.error('Não foi possível salvar no cache:', saveError);
    }
    
    return currencies;
  }
}

/**
 * Função auxiliar para calcular a variação percentual entre valores
 */
export function calculateChange(currentValue: number, previousValue: number): number | undefined {
  if (previousValue === 0 || isNaN(previousValue) || !isFinite(previousValue)) {
    return undefined;
  }
  const change = ((currentValue / previousValue) - 1) * 100;
  return isFinite(change) ? change : undefined;
}

/**
 * Função para atualizar moedas com base nos dados extraídos
 */
export function updateCurrenciesWithScrapedData(
  currentCurrencies: Currency[],
  scrapedData: ScrapedCurrency[]
): Omit<Currency, 'id'>[] {
  const now = new Date();

  // Mapeia as moedas existentes pelo código para acesso rápido
  const currencyMap = new Map<string, Currency>();
  currentCurrencies.forEach(currency => {
    currencyMap.set(currency.code, currency);
  });

  // Atualiza ou cria cada moeda com base nos dados extraídos
  return scrapedData.map((scraped, index) => {
    const existing = currencyMap.get(scraped.code);
    // Atribui a ordem de exibição baseada na ordem da lista que vem da página fonte
    const displayOrder = index + 1;

    // Se a moeda existir, calcula a variação em relação à cotação anterior
    if (existing) {
      const change = calculateChange(scraped.buyPrice, existing.buyPrice);

      return {
        // id será gerenciado pelo storage
        name: scraped.name,
        code: existing.code,
        buyPrice: scraped.buyPrice,
        sellPrice: scraped.sellPrice,
        change,
        lastUpdate: now.toISOString(),
        displayOrder // Mantém a ordem da página fonte
      };
    }

    // Se for uma nova moeda, cria sem variação (será undefined)
    return {
      // id será gerenciado pelo storage
      name: scraped.name,
      code: scraped.code,
      buyPrice: scraped.buyPrice,
      sellPrice: scraped.sellPrice,
      // Não definimos change para novas moedas (será undefined por padrão)
      lastUpdate: now.toISOString(),
      displayOrder // Mantém a ordem da página fonte
    };
  });
}