const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Configurando HTTPS local...');

try {
  // Verificar se o mkcert está instalado
  try {
    execSync('mkcert --version');
    console.log('✅ mkcert já está instalado');
  } catch (e) {
    console.log('⚠️ mkcert não encontrado. Instalando...');
    execSync('choco install mkcert -y', { stdio: 'inherit' });
  }

  // Criar diretório para certificados
  const certsDir = path.join(__dirname, '../certs');
  if (!fs.existsSync(certsDir)) {
    fs.mkdirSync(certsDir, { recursive: true });
  }

  // Instalar certificado raiz
  console.log('🔐 Instalando certificado raiz...');
  execSync('mkcert -install', { stdio: 'inherit' });

  // Gerar certificados
  console.log('🔑 Gerando certificados SSL...');
  execSync(`mkcert -cert-file ${certsDir}/cert.pem -key-file ${certsDir}/key.pem localhost 127.0.0.1 ::1`, { stdio: 'inherit' });

  console.log('\n✅ Configuração HTTPS concluída!');
  console.log('Certificados gerados em:', certsDir);
  console.log('\nPara iniciar o servidor com HTTPS, execute:');
  console.log('  npm run dev:https\n');

} catch (error) {
  console.error('❌ Erro ao configurar HTTPS:', error.message);
  process.exit(1);
}
