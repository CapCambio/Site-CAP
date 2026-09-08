import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sourceDir = path.join(__dirname, '..', 'public', 'homepage');
const destDir = path.join(__dirname, '..', 'dist', 'public', 'homepage');

// Função para copiar recursivamente
function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();

  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach((childItemName) => {
      copyRecursiveSync(
        path.join(src, childItemName),
        path.join(dest, childItemName)
      );
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

// Copiar diretório homepage inteiro
copyRecursiveSync(sourceDir, destDir);

console.log('✅ Homepage assets copiados para dist/public/homepage/');

// Verificação
if (fs.existsSync(destDir)) {
  const files = fs.readdirSync(destDir, { recursive: true });
  console.log('📋 Arquivos copiados:', files.length);
} else {
  console.error('❌ Falha ao copiar homepage assets');
}
