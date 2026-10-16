# Guia de Deploy no Railway - CAP Cotações

## 🚀 Passo a Passo para Deploy

### 1. Criar Conta no Railway
1. Acesse: https://railway.app
2. Clique em "Start for Free"
3. Faça login com GitHub, GitLab ou email
4. Você terá 30 dias com $5 de créditos grátis

### 2. Preparar Repositório Git
```bash
# No diretório do projeto
git init
git add .
git commit -m "Initial commit - CAP Cotações"
```

### 3. Conectar Projeto no Railway
1. No dashboard do Railway, clique em "New Project"
2. Selecione "Deploy from GitHub repo"
3. Conecte sua conta do GitHub
4. Selecione o repositório do projeto
5. Clique em "Deploy Now"

### 4. Configurar Variáveis de Ambiente
No Railway, vá em:
- Settings → Variables
- Adicione as seguintes variáveis:

```
NODE_ENV=production
PORT=8080
APP_NAME=CAP Cotações
APP_URL=https://seu-projeto.railway.app

# Obrigatórias — o app NÃO sobe sem estas (db.ts e JwtService.ts dão throw no boot)
DATABASE_URL=postgresql://postgres:SU-SENHA@db.SEU-REF.supabase.co:5432/postgres
JWT_SECRET=gere-um-segredo-longo-e-aleatorio (ex.: openssl rand -hex 32)

# Chaves VAPID (push) — gere o par com "node scripts/generate-vapid-keys.js";
# são opcionais no boot (só warn), mas o push não funciona sem elas.
VAPID_PUBLIC_KEY=<chave pública gerada pelo script>
VAPID_PRIVATE_KEY=<chave privada gerada pelo script — NUNCA commitar o valor real>
VAPID_EMAIL=seu-email@dominio.com

# Email (Brevo - configure após criar conta)
EMAIL_ENABLED=true
EMAIL_HOST=smtp-relay.brevo.com
EMAIL_PORT=587
EMAIL_USER=seu-usuario-brevo
EMAIL_PASS=sua-chave-brevo
EMAIL_FROM="CAP Câmbio <no-reply@capcambio.com>"
EMAIL_SECURE=false

# Admin — NÃO existe variável de senha admin. Administradores ficam na tabela
# `users` do Postgres com senha em bcrypt. ADMIN_PASSWORDS_JSON é config morta
# (nenhum código a lê) e não deve ser definida.
```

### 5. Configurar Brevo (Email)
1. Acesse: https://www.brevo.com
2. Crie conta gratuita (até 300 emails/dia)
3. Vá em SMTP & API
4. Copie SMTP User e SMTP Key
5. Adicione às variáveis de ambiente acima

### 6. Aguardar Deploy
- Railway fará build automático
- Demora ~3-5 minutos
- Acompanhe na aba "Deploys"
- Verde = sucesso

### 7. Acessar Aplicação
- URL será: `https://seu-projeto.railway.app`
- Teste todas as funcionalidades
- Verifique logs em "Logs"

### 8. Incorporar no Site (via Iframe)
```html
<iframe 
  src="https://seu-projeto.railway.app" 
  width="100%" 
  height="800px" 
  frameborder="0"
  style="border-radius: 8px;">
</iframe>
```

## 🔧 Troubleshooting

### Build Falhou
- Verifique logs em "Deploys"
- Confirme que todas as variáveis de ambiente estão configuradas

### Aplicação não inicia
- Verifique "Logs" em tempo real
- Confirme que `JWT_SECRET` está configurado

### Scraping não funciona
- Verifique se há firewall bloqueando acesso externo
- Confirme logs de scraping

### Email não envia
- Verifique configurações SMTP do Brevo
- Confirme que EMAIL_USER e EMAIL_PASS estão corretos

## 💰 Custos

- **Trial 30 dias**: $5 grátis
- **Após trial**: $5/mês (plano Hobby)
- **Cancelamento**: A qualquer momento sem multa

## 📊 Monitoramento

- Acompanhe uso em "Usage"
- Verifique logs em "Logs"
- Monitore métricas em "Metrics"

## 🔄 Atualizações

- Para atualizar: `git push` no repositório
- Railway faz deploy automático
- Zero downtime com rolling updates

---

**Suporte**: capcambiocx@gmail.com
