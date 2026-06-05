import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const inputPath = path.resolve('public/optimized/cap-logo-fundo.webp');
const outputPath = path.resolve('public/optimized/cap-logo-fundo-optimized.webp');

async function optimizeImage() {
  try {
    // Otimizar a imagem
    await sharp(inputPath)
      .webp({ quality: 80, effort: 6 })
      .toFile(outputPath);

    // Verificar os tamanhos
    const originalSize = fs.statSync(inputPath).size / 1024;
    const optimizedSize = fs.statSync(outputPath).size / 1024;
    const savings = ((originalSize - optimizedSize) / originalSize * 100).toFixed(2);

    console.log('✅ Imagem otimizada com sucesso!');
    console.log(`📊 Tamanho original: ${originalSize.toFixed(2)} KB`);
    console.log(`📉 Tamanho otimizado: ${optimizedSize.toFixed(2)} KB`);
    console.log(`💾 Economia: ${savings}%`);

  } catch (error) {
    console.error('❌ Erro ao otimizar a imagem:', error);
  }
}

optimizeImage();
