const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const inputFile = path.join(__dirname, '../client/public/optimized/cap-logo-fundo-optimized.webp');
const outputDir = path.join(__dirname, '../client/public/splash');

// Criar diretório de saída se não existir
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

console.log('🔍 Procurando arquivo de origem:', inputFile);
console.log('📁 Diretório de saída:', outputDir);

// Tamanhos de splash screen para iOS
const splashSizes = [
  { name: 'iphone5', width: 640, height: 1136 },
  { name: 'iphone6', width: 750, height: 1334 },
  { name: 'iphone6p', width: 1242, height: 2208 },
  { name: 'iphone12mini', width: 1080, height: 2340 },
  { name: 'iphone12', width: 1125, height: 2436 },
  { name: 'iphone12p', width: 1242, height: 2688 },
  { name: 'iphone14p', width: 1179, height: 2556 },
  { name: 'iphone14pm', width: 1290, height: 2796 },
];

console.log('🔄 Gerando splash screens para iOS...');

Promise.all(
  splashSizes.map(size => {
    const outputFile = path.join(outputDir, `${size.name}.png`);
    console.log(`  - Criando ${size.name} (${size.width}x${size.height})...`);
    
    return sharp(inputFile)
      .resize(size.width, size.height, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 1 }
      })
      .toFile(outputFile)
      .then(() => console.log(`    ✅ Splash ${size.name} criado com sucesso!`))
      .catch(err => console.error(`    ❌ Erro ao criar splash ${size.name}:`, err.message));
  })
).then(() => {
  console.log('\n🎉 Todos os splash screens foram gerados com sucesso!');  
  console.log('📍 Local: ' + outputDir);
  
  // Verificar se os arquivos foram criados
  console.log('\n📋 Arquivos gerados:');
  splashSizes.forEach(size => {
    const filePath = path.join(outputDir, `${size.name}.png`);
    console.log(`  - ${filePath} - ${fs.existsSync(filePath) ? '✅ OK' : '❌ FALHOU'}`);
  });
  
}).catch(err => {
  console.error('❌ Erro ao gerar splash screens:', err);
});
