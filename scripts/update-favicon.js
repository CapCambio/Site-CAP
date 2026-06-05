import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, mkdirSync, statSync, unlinkSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Caminhos dos arquivos
const outputDir = join(__dirname, '../public/optimized');
const faviconPath = join(outputDir, 'favicon.webp');

// Tamanhos necessários para favicon
const faviconSizes = [
  { size: 16, name: 'favicon-16x16.webp' },
  { size: 32, name: 'favicon-32x32.webp' },
  { size: 64, name: 'favicon-64x64.webp' },
  { size: 192, name: 'android-chrome-192x192.webp' },
  { size: 512, name: 'android-chrome-512x512.webp' },
  { size: 180, name: 'apple-touch-icon.webp' }
  // Vamos lidar com o .ico separadamente
];

// Função para processar o favicon
async function processFavicon(inputPath) {
  try {
    // Criar diretório de saída se não existir
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }

    console.log('🔄 Processando favicon...');
    
    // Processar cada tamanho necessário
    for (const { size, name } of faviconSizes) {
      const outputPath = join(outputDir, name);
      
      // Gerar todas as versões em WebP
      await sharp(inputPath)
        .resize(size, size)
        .webp({ quality: 90, effort: 6 })
        .toFile(outputPath);
        
      const fileSize = (statSync(outputPath).size / 1024).toFixed(2);
      console.log(`✅ Gerado ${name} (${size}x${size}px) - ${fileSize}KB`);
    }
    
    console.log('\n⚠️  Para melhor compatibilidade, você pode querer converter uma das imagens para .ico manualmente.');
    console.log('   Recomendo usar um conversor online como https://icoconvert.com/');
    console.log('   Salve o arquivo como favicon.ico em /public/optimized/');
    
    console.log('\n✨ Favicon atualizado com sucesso!');
    return true;
    
  } catch (error) {
    console.error('❌ Erro ao processar o favicon:', error.message);
    return false;
  }
}

// Verificar se o caminho da imagem foi fornecido
const args = process.argv.slice(2);
if (args.length === 0) {
  console.log('❌ Por favor, forneça o caminho para a imagem do novo favicon');  console.log('   Exemplo: node scripts/update-favicon.js caminho/para/sua/imagem.png');
  process.exit(1);
}

const inputImagePath = args[0];
if (!existsSync(inputImagePath)) {
  console.error(`❌ Arquivo não encontrado: ${inputImagePath}`);
  process.exit(1);
}

// Executar o processamento
processFavicon(inputImagePath);
