# Requisitos Técnicos para Deploy - CAP Cotações

## 📋 Informações para Empresa Terceirizada

### Requisitos Mínimos de Servidor

#### 1. **Runtime Node.js**
- **Versão mínima**: Node.js 18.0.0 ou superior
- **Gerenciador de pacotes**: npm 8.0.0 ou superior
- **Tipo**: Suporte a ES Modules (type: "module")

#### 2. **Recursos do Servidor**
- **CPU**: Mínimo 1 vCPU (recomendado 2+)
- **RAM**: Mínimo 512MB (recomendado 1GB+)
- **Armazenamento**: Mínimo 500MB para aplicação + logs

#### 3. **Portas de Rede**
- **Porta HTTP**: 80 (ou porta customizada)
- **Porta HTTPS**: 443 (se usar SSL)
- **Firewall**: Permitir tráfego de entrada/saída nas portas configuradas

#### 4. **Sistema de Arquivos**
- **Permissões de escrita**: Necessário para pasta `data/` (armazenamento JSON local)
- **Logs**: Permissão para escrita em pasta `server/logs/`
- **Temporários**: Acesso para arquivos temporários do sistema

#### 5. **Variáveis de Ambiente**
O servidor deve suportar configuração via variáveis de ambiente:
- `NODE_ENV=production`
- `PORT=8080` (ou porta configurada)
- `APP_URL=https://seu-dominio.com`
- `SESSION_SECRET` (segredo de sessão)
- Configurações de email SMTP
- Chaves VAPID para notificações push

#### 6. **HTTPS/SSL**
- **Recomendado**: Certificado SSL para produção
- **Suporte**: Servidor deve suportar HTTPS
- **Proxy**: Possível uso de Nginx/Apache como proxy reverso

#### 7. **Acesso Externo**
- **Scraping**: Acesso à internet para coletar cotações de câmbio
- **Email**: Acesso a servidor SMTP (porta 587 ou 465)
- **Push Notifications**: Suporte a Web Push API

#### 8. **Process Management**
- **PM2** ou equivalente para gerenciamento de processo Node.js
- **Auto-restart** em caso de falha
- **Logs** de aplicação

## 🔒 Considerações de Segurança

### Proteção de Código Fonte
- **Deploy**: Apenas build de produção (pasta `dist/`)
- **Código fonte**: Não será fornecido (proteção de propriedade intelectual)
- **Configurações**: Variáveis de ambiente separadas

### Acesso Administrativo
- **Email admin**: capcambiocx@gmail.com
- **Painel**: Acesso via autenticação na aplicação

## 📦 Arquivos Fornecidos para Deploy

### Obrigatórios
- `dist/` - Build de produção minificado
- `public/` - Assets estáticos
- `.env` - Variáveis de ambiente (configurado pelo cliente)
- `package.json` - Para verificação de dependências

### Não Fornecidos
- `client/src/` - Código fonte React
- `server/` - Código fonte TypeScript (exceto build)
- Scripts de desenvolvimento

## 🚀 Processo de Deploy Sugerido

### Opção 1: Deploy Direto pelo Cliente
1. Cliente faz upload dos arquivos de produção
2. Configura variáveis de ambiente
3. Inicia o serviço com PM2
4. Configura proxy reverso (Nginx/Apache)

### Opção 2: Deploy pela Empresa Terceirizada
1. Empresa recebe apenas build de produção
2. Empresa configura ambiente
3. Empresa inicia serviço
4. **Importante**: Contrato de confidencialidade (NDA)

## ❓ Perguntas para a Empresa Terceirizada

1. **Suporta Node.js 18+?** Sim/Não
2. **Qual versão do Node.js está disponível?**
3. **Permite execução de processos Node.js?** Sim/Não
4. **Tem PM2 ou equivalente instalado?** Sim/Não
5. **Permite configuração de variáveis de ambiente?** Sim/Não
6. **Suporta HTTPS/SSL?** Sim/Não
7. **Quais portas estão disponíveis?**
8. **Permite escrita em sistema de arquivos local?** Sim/Não
9. **Tem firewall restritivo?** Se sim, quais portas estão bloqueadas?
10. **Oferece suporte a proxy reverso (Nginx/Apache)?** Sim/Não

## 📞 Contato para Dúvidas

- **Email**: capcambiocx@gmail.com
- **Projeto**: CAP Cotações - Sistema de Câmbio

---

**Versão**: 1.0.0  
**Data**: 03/06/2026
