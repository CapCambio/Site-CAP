import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join, basename } from 'path';
import { existsSync, mkdirSync, statSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Criar diretório de saída se não existir
const outputDir = join(__dirname, '../public/optimized');
if (!existsSync(outputDir)) {
  mkdirSync(outputDir, { recursive: true });
}

// Configurações de otimização
const imageConfigs = [
  {
    input: join(__dirname, '../public/favicon.png'),
    output: join(outputDir, 'favicon.webp'),
    width: 64,
    quality: 80
  },
  {
    input: join(__dirname, '../attached_assets/cap logo fundo.png'),
    output: join(outputDir, 'cap-logo-fundo.webp'),
    width: 200,
    quality: 80
  }
];

// Função para otimizar uma única imagem
async function optimizeImage({ input, output, width, quality }) {
  try {
    await sharp(input)
      .resize({ width })
      .webp({ quality, effort: 6 })
      .toFile(output);
    
    const originalSize = (statSync(input).size / 1024).toFixed(2);
    const optimizedSize = (statSync(output).size / 1024).toFixed(2);
    const reduction = ((1 - (parseFloat(optimizedSize) / parseFloat(originalSize))) * 100).toFixed(2);
    
    console.log(`✅ ${basename(input)}: ${originalSize}KB → ${optimizedSize}KB (${reduction}% menor)`);
    return true;
  } catch (error) {
    console.error(`❌ Erro ao processar ${input}:`, error.message);
    return false;
  }
}

// Otimizar todas as imagens
async function optimizeAll() {
  console.log('🔄 Iniciando otimização de imagens...');
  
  const results = await Promise.all(
    imageConfigs.map(config => optimizeImage(config))
  );
  
  const successCount = results.filter(Boolean).length;
  console.log(`\n✅ ${successCount} de ${imageConfigs.length} imagens otimizadas com sucesso!`);
  
  if (successCount < imageConfigs.length) {
    process.exit(1);
  }
}

optimizeAll();
