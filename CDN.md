# Configuração de CDN para Assets Estáticos

## 📋 Visão Geral

Este projeto está configurado para usar CDN (Content Delivery Network) para servir assets estáticos como imagens, JavaScript e CSS. Isso melhora a performance para usuários fora do Brasil, reduzindo a latência e melhorando o tempo de carregamento.

## 🚀 Como Funciona

### Configuração Atual

O projeto usa o Vite com configuração de `base` URL que pode ser definida via variável de ambiente:

```typescript
// vite.config.ts
base: process.env.CDN_URL || '/',
```

### Assets Estáticos Atuais

**Localização:** `public/optimized/`

- `android-chrome-192x192.webp` - Ícone Android 192x192
- `android-chrome-512x512.webp` - Ícone Android 512x512
- `apple-touch-icon.webp` - Ícone Apple Touch
- `cap-logo-fundo-optimized.webp` - Logo otimizado
- `cap-logo-fundo.webp` - Logo original
- `favicon-16x16.webp` - Favicon 16x16
- `favicon-32x32.webp` - Favicon 32x32
- `favicon-64x64.webp` - Favicon 64x64
- `favicon.webp` - Favicon principal

## 🔧 Configuração

### 1. Configurar Variável de Ambiente

**Desenvolvimento (sem CDN):**
```bash
# .env
CDN_URL=
```

**Produção (com CDN):**
```bash
# .env.production
CDN_URL=https://cdn.seudominio.com/
```

**Exemplos de CDN:**
- Cloudflare CDN: `https://cdn.seudominio.com/`
- AWS CloudFront: `https://d1234567890.cloudfront.net/`
- Azure CDN: `https://seuaccount.azureedge.net/`
- BunnyCDN: `https://seuaccount.b-cdn.net/`

### 2. Build com CDN

```bash
# Build de produção com CDN
npm run build
```

O Vite irá automaticamente prefixar todos os assets com a URL do CDN configurada.

## 📦 Upload para CDN

### Cloudflare CDN

1. Crie uma conta no Cloudflare
2. Adicione seu domínio
3. Configure o CDN para servir a pasta `dist/public`
4. Defina a URL do CDN na variável `CDN_URL`

### AWS CloudFront

1. Crie um bucket S3
2. Faça upload da pasta `dist/public`
3. Crie uma distribuição CloudFront
4. Configure o comportamento de cache
5. Defina a URL do CDN na variável `CDN_URL`

### BunnyCDN (Recomendado - Baixo Custo)

1. Crie uma conta no BunnyCDN
2. Crie uma "Storage Zone"
3. Faça upload da pasta `dist/public`
4. Crie um "Pull Zone" ou "Push Zone"
5. Defina a URL do CDN na variável `CDN_URL`

**Vantagens do BunnyCDN:**
- 💰 Custo baixo (~$1/mês para 1TB)
- 🌍 Rede global
- ⚡ Alta performance
- 🔒 SSL gratuito
- 📊 Analytics detalhado

## 🎯 Benefícios

### Para Clientes no Brasil
- ⚡ Carregamento rápido (latência baixa)
- 🎯 CDN opcional (pode usar servidor local)

### Para Clientes Fora do Brasil
- 🌍 Redução significativa de latência
- ⚡ Carregamento 2-5x mais rápido
- 💾 Cache inteligente
- 🔄 Auto-failover

## 📊 Comparação de Performance

### Sem CDN (Servidor no Brasil)
- **Brasil:** ~50ms
- **EUA:** ~200ms
- **Europa:** ~250ms
- **Ásia:** ~300ms

### Com CDN (Cloudflare/BunnyCDN)
- **Brasil:** ~30ms
- **EUA:** ~50ms
- **Europa:** ~60ms
- **Ásia:** ~100ms

**Melhoria média:** 3-5x mais rápido para clientes internacionais

## 🔍 Verificação

### Verificar se CDN está funcionando

1. Abra o DevTools (F12)
2. Vá na aba "Network"
3. Recarregue a página
4. Verifique as URLs dos assets:
   - Sem CDN: `https://seudominio.com/optimized/logo.webp`
   - Com CDN: `https://cdn.seudominio.com/optimized/logo.webp`

### Testar Performance

Use ferramentas como:
- Google PageSpeed Insights
- GTmetrix
- WebPageTest

## 💡 Recomendações

### Quando Usar CDN
- ✅ 20%+ dos clientes fora do Brasil
- ✅ Tráfego internacional significativo
- ✅ Necessidade de alta performance
- ✅ Escalabilidade global

### Quando Não Usar CDN
- ❌ 100% dos clientes no Brasil
- ❌ Tráfego apenas local
- ❌ Orçamento limitado
- ❌ Complexidade não justificada

## 🚨 Considerações

### Cache
- CDN cacheia assets automaticamente
- Tempo de cache padrão: 1 hora
- Pode ser configurado por CDN

### Invalidação de Cache
- Ao fazer novo build, mude o nome dos assets (Vite faz isso automaticamente)
- Use cache-busting: `logo.webp?v=2`
- Invalidação manual via painel do CDN

### SSL
- Use HTTPS obrigatoriamente
- CDN deve ter SSL válido
- Certificado gratuito disponível na maioria dos CDNs

## 📝 Exemplo de Configuração Completa

### .env.production
```bash
NODE_ENV=production
PORT=8080
APP_URL=https://ctrcambio.com.br
CDN_URL=https://cdn.ctrcambio.com.br/

# Outras configurações...
EMAIL_ENABLED=true
EMAIL_HOST=smtp-relay.brevo.com
EMAIL_PORT=587
# ...
```

### Deploy com CDN

```bash
# 1. Build do projeto
npm run build

# 2. Upload para CDN (exemplo com BunnyCDN)
# Use FTP, S3 CLI, ou API do CDN

# 3. Deploy do backend
npm start
```

## 🎉 Conclusão

A configuração de CDN está pronta para uso. Basta:

1. Escolher um provedor de CDN (Cloudflare, BunnyCDN, AWS, etc.)
2. Configurar a variável `CDN_URL`
3. Fazer upload dos assets para o CDN
4. Testar a performance

**Custo estimado:** $1-5/mês para tráfego moderado
**Benefício:** 3-5x mais rápido para clientes internacionais
**Complexidade:** Baixa (configuração simples)
