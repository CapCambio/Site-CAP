import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sourceDir = path.join(__dirname, '..', 'server', 'emails', 'templates');
const destDir = path.join(__dirname, '..', 'dist', 'emails', 'templates');

// Criar diretório de destino
fs.mkdirSync(destDir, { recursive: true });

// Verificar se diretório de origem existe
if (!fs.existsSync(sourceDir)) {
  console.log('⚠️  server/emails/templates/ não encontrado — pulando cópia de templates');
  console.log('✅ dist/emails/templates/ criado (vazio)');
  process.exit(0);
}

// Copiar arquivos
const files = fs.readdirSync(sourceDir);
files.forEach(file => {
  const sourcePath = path.join(sourceDir, file);
  const destPath = path.join(destDir, file);
  
  if (fs.statSync(sourcePath).isFile()) {
    fs.copyFileSync(sourcePath, destPath);
    console.log(`Copiado: ${file}`);
  }
});

console.log('✅ Templates de email copiados para dist/emails/templates/');

// Verificação adicional
const destFiles = fs.readdirSync(destDir);
console.log('📋 Templates copiados:', destFiles);
