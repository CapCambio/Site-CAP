import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sourceDir = path.join(__dirname, '..', 'server', 'config');
const destDir = path.join(__dirname, '..', 'dist', 'config');

// Criar diretório de destino
fs.mkdirSync(destDir, { recursive: true });

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

console.log('✅ Arquivos de configuração copiados para dist/config/');

// Verificação adicional
const destFiles = fs.readdirSync(destDir);
console.log('📋 Arquivos em dist/config/:', destFiles);

// Verificar conteúdo do email-config.json
const emailConfigPath = path.join(destDir, 'email-config.json');
if (fs.existsSync(emailConfigPath)) {
  const content = JSON.parse(fs.readFileSync(emailConfigPath, 'utf8'));
  console.log('✅ email-config.json encontrado com', content.authorizedEmails?.length, 'emails autorizados');
} else {
  console.error('❌ email-config.json NÃO foi copiado!');
}
