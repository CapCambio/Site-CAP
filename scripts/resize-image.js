import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const inputPath = path.resolve('public/optimized/cap-logo-fundo.webp');
const outputPath = path.resolve('public/optimized/cap-logo-fundo-optimized.webp');

async function resizeImage() {
  try {
    // Obter metadados da imagem original
    const metadata = await sharp(inputPath).metadata();
    
    // Definir largura máxima (por exemplo, 800px)
    const maxWidth = 800;
    let width = metadata.width;
    let height = metadata.height;
    
    // Redimensionar apenas se a largura for maior que o máximo
    if (width > maxWidth) {
      const ratio = maxWidth / width;
      width = maxWidth;
      height = Math.round(height * ratio);
    }

    // Redimensionar e otimizar a imagem
    await sharp(inputPath)
      .resize(width, height, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .webp({ 
        quality: 80,
        effort: 6,
        alphaQuality: 80
      })
      .toFile(outputPath);

    // Verificar os tamanhos
    const originalSize = fs.statSync(inputPath).size / 1024;
    const optimizedSize = fs.statSync(outputPath).size / 1024;
    const savings = ((originalSize - optimizedSize) / originalSize * 100).toFixed(2);

    console.log('✅ Imagem redimensionada e otimizada com sucesso!');
    console.log(`📐 Dimensões: ${width}x${height}px`);
    console.log(`📊 Tamanho original: ${originalSize.toFixed(2)} KB`);
    console.log(`📉 Tamanho otimizado: ${optimizedSize.toFixed(2)} KB`);
    console.log(`💾 Economia: ${savings}%`);

  } catch (error) {
    console.error('❌ Erro ao processar a imagem:', error);
  }
}

resizeImage();
