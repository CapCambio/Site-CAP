import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logoPath = path.join(__dirname, 'public', 'favicon.png');
const outputDir = path.join(__dirname, 'client', 'public', 'optimized');

async function cropAndResizeIcons() {
  // Obter metadados do logo original
  const metadata = await sharp(logoPath).metadata();
  console.log('Logo original:', metadata.width, 'x', metadata.height);
  
  // Calcular o crop central (quadrado)
  const cropSize = Math.min(metadata.width, metadata.height);
  const left = Math.floor((metadata.width - cropSize) / 2);
  const top = Math.floor((metadata.height - cropSize) / 2);
  
  console.log('Crop:', { left, top, width: cropSize, height: cropSize });
  
  // Primeiro fazer o crop central
  const cropped = await sharp(logoPath)
    .extract({ left, top, width: cropSize, height: cropSize })
    .toBuffer();
  
  // Tamanhos dos ícones
  const sizes = [96, 144, 192, 512, 180];
  
  for (const size of sizes) {
    const outputPath = path.join(outputDir, `android-chrome-${size}x${size}.png`);
    
    await sharp(cropped)
      .resize(size, size, {
        fit: 'cover',
        position: 'center'
      })
      .toFile(outputPath);
    
    console.log(`Created: android-chrome-${size}x${size}.png`);
  }
  
  // Criar apple-touch-icon.png (180x180)
  const appleIconPath = path.join(outputDir, 'apple-touch-icon.png');
  await sharp(cropped)
    .resize(180, 180, {
      fit: 'cover',
      position: 'center'
    })
    .toFile(appleIconPath);
  console.log('Created: apple-touch-icon.png');
}

cropAndResizeIcons().catch(console.error);
