const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const inputFile = path.join(__dirname, '../public/favicon.png');
const outputDir = path.join(__dirname, '../public');

// Criar diretório de saída se não existir
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

console.log('🔍 Procurando arquivo de origem:', inputFile);
console.log('📁 Diretório de saída:', outputDir);

// Gerar ícones em diferentes tamanhos
const sizes = [192, 512];

console.log('🔄 Gerando ícones...');

Promise.all(
  sizes.map(size => {
    const outputFile = path.join(outputDir, `icon-${size}x${size}.png`);
    console.log(`  - Criando ${outputFile}...`);
    
    return sharp(inputFile)
      .resize(size, size)
      .toFile(outputFile)
      .then(() => console.log(`    ✅ Ícone ${size}x${size} criado com sucesso!`))
      .catch(err => console.error(`    ❌ Erro ao criar ícone ${size}x${size}:`, err.message));
  })
).then(() => {
  console.log('\n🎉 Todos os ícones foram gerados com sucesso!');  
  console.log('📍 Local: ' + outputDir);
  
  // Verificar se os arquivos foram criados
  console.log('\n📋 Arquivos gerados:');
  sizes.forEach(size => {
    const filePath = path.join(outputDir, `icon-${size}x${size}.png`);
    console.log(`  - ${filePath} - ${fs.existsSync(filePath) ? '✅ OK' : '❌ FALHOU'}`);
  });
  
}).catch(err => {
  console.error('❌ Erro ao gerar ícones:', err);
});
