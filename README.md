
# CAP Cotações - Dashboard de Câmbio

Sistema completo de cotações de moedas em tempo real com conversão, histórico e alertas.

## 🚀 Instalação e Execução Local

### Pré-requisitos
- Node.js (versão 18 ou superior)
- npm ou yarn

### Passos para executar:

1. **Extrair o projeto:**
   ```bash
   # Extrair o arquivo ZIP e navegar para a pasta
   cd cap-cotacoes
   ```

2. **Instalar dependências:**
   ```bash
   npm install
   ```

3. **Executar o projeto:**
   ```bash
   npm run dev
   ```

4. **Acessar a aplicação:**
   - Abrir o navegador em: `http://localhost:5000`

### Scripts disponíveis:
- `npm run setup` - Instala todas as dependências
- `npm run dev` - Executa em modo desenvolvimento (Linux/Mac)
- `npm run dev:win` - Executa em modo desenvolvimento (Windows)
- `npm run build` - Gera build de produção
- `npm run start` - Executa build de produção

## 📁 Estrutura do Projeto

```
cap-cotacoes/
├── client/                 # Frontend React
│   ├── src/
│   │   ├── components/     # Componentes React
│   │   ├── pages/          # Páginas da aplicação
│   │   └── hooks/          # Hooks customizados
├── server/                 # Backend Express
│   ├── config/            # Configurações
│   └── routes.ts          # Rotas da API
├── shared/                # Tipos compartilhados
└── PostgreSQL             # Banco de dados (alertas, sessões, histórico)
```

## 🔧 Configuração

### Variáveis de Ambiente
O arquivo `.env` já está configurado com valores padrão. Você pode modificá-lo se necessário:

```env
NODE_ENV=development
PORT=5000
APP_NAME="CAP Cotações"
APP_URL="http://localhost:5000"
```

### Dados Iniciais
O projeto já vem com dados iniciais pré-configurados na pasta `/data/`:
- Cotações de 16 moedas principais
- Histórico de variações
- Configurações de usuários autorizados

## 🌟 Funcionalidades

- ✅ Cotações em tempo real de 16 moedas
- ✅ Conversão de moedas com BRL obrigatório
- ✅ Gráficos históricos interativos
- ✅ Sistema de alertas por email
- ✅ Painel administrativo
- ✅ Interface responsiva
- ✅ Armazenamento em PostgreSQL

## 🔒 Acesso Administrativo

Para acessar o painel administrativo, use:
- Email: `capcambiocx@gmail.com`

## 🛠️ Resolução de Problemas

### Erro de porta em uso:
```bash
# Matar processos na porta 5000
npx kill-port 5000
# Ou usar outra porta modificando o arquivo .env
```

### Problemas com dependências:
```bash
# Limpar cache e reinstalar
rm -rf node_modules package-lock.json
npm install
```

### Permissões de arquivo:
```bash
# Linux/Mac - dar permissões de escrita na pasta data
chmod -R 755 data/
```

## 🏠 Como editar a Homepage

A homepage institucional (`/homepage/`) tem seu próprio projeto em `homepage-src/`, separado do app principal.

**Importante:** O Railway **NÃO** recompila `homepage-src/` automaticamente. Você precisa buildar manualmente antes de commitar.

**Fluxo correto:**
```bash
# 1. Editar arquivos em homepage-src/
# (faça suas alterações nos arquivos)

# 2. Buildar a homepage
cd homepage-src
npm run build

# 3. Voltar e commitar tudo
cd ..
git add homepage-src/ public/homepage/
git commit -m "chore: atualiza homepage"
git push
```

**O que acontece:**
- `npm run build` em `homepage-src/` gera os arquivos em `public/homepage/`
- O Railway copia `public/homepage/` para `dist/public/homepage/` durante o deploy
- Se você esquecer de buildar, a homepage não atualiza (mas o app principal continua funcionando)

## 📞 Suporte

- WhatsApp: Botão flutuante na interface
- Email: suporte através do sistema de contato

---

**Sistema de cotações com armazenamento em PostgreSQL e integração com serviços externos (Brevo para e-mails, VAPID para push)**
