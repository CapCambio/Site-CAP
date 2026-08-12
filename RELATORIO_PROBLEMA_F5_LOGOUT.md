# Relatório Técnico: Problema de Logout ao Dar F5

## Descrição do Problema

Ao dar F5 (refresh) na página, o usuário era deslogado automaticamente e redirecionado para a página de login. Ao tentar fazer login novamente, o sistema retornava a mensagem: "Já existe uma sessão ativa em outro dispositivo", impedindo o acesso.

## Status

✅ **RESOLVIDO** - O problema foi corrigido em 12/08/2026

## Causa Raiz

O servidor Express não tinha o middleware `cookie-parser` configurado. Isso causava:

1. `req.cookies` estava sempre vazio (`{}`)
2. O middleware JWT não conseguia extrair o token JWT dos cookies
3. Mesmo que o navegador enviasse o cookie corretamente, o servidor não conseguia lê-lo
4. O usuário era deslogado após F5 porque o servidor não encontrava o token

## Solução Aplicada

### 1. Instalar cookie-parser

```bash
npm install cookie-parser
```

### 2. Configurar no servidor (server/index.ts)

```typescript
import cookieParser from 'cookie-parser';

const app = express();
app.set('trust proxy', 1);
app.use(cookieParser()); // ← ADICIONADO
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
```

### 3. Ajustar configuração de SameSite

Como frontend e backend estão no mesmo domínio (`web-production-b9ae9.up.railway.app`), mudamos de `SameSite='none'` para `SameSite='lax'`:

```typescript
const cookieConfig = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const, // Mudado de 'none' para 'lax'
  maxAge: 30 * 24 * 60 * 60 * 1000,
  path: '/'
};
```

## Ambiente de Produção

- **Plataforma**: Railway
- **Protocolo**: HTTPS com proxy reverso
- **Frontend**: React + Vite
- **Backend**: Node.js + Express
- **Autenticação**: JWT em cookies httpOnly

## Histórico de Tentativas

### Tentativa 1: Configuração Fixa para Railway
```typescript
res.cookie('jwt', token, {
  httpOnly: true,
  secure: true,
  sameSite: 'none',
  maxAge: 30 * 24 * 60 * 60 * 1000,
  path: '/'
});
```
**Resultado**: Funcionou em produção, mas quebrou em localhost (HTTP não envia cookies com secure: true)

### Tentativa 2: Configuração Condicional
```typescript
res.cookie('jwt', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: 30 * 24 * 60 * 60 * 1000,
  path: '/'
});
```
**Resultado**: Continuou com o mesmo problema em produção após deploy

### Tentativa 3: Mudança de SameSite para 'lax'
```typescript
res.cookie('jwt', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 30 * 24 * 60 * 60 * 1000,
  path: '/'
});
```
**Resultado**: Continuou com o mesmo problema

### Tentativa 4: Adicionar cookie-parser (SOLUÇÃO FINAL)
```typescript
import cookieParser from 'cookie-parser';

const app = express();
app.use(cookieParser());
```
**Resultado**: ✅ PROBLEMA RESOLVIDO - O servidor agora consegue ler os cookies das requisições

## Lições Aprendidas

1. **cookie-parser é essencial**: O Express não lê cookies automaticamente. É necessário configurar o middleware `cookie-parser` antes de poder acessar `req.cookies`.

2. **SameSite='lax' vs 'none'**: `SameSite='none'` só é necessário quando frontend e backend estão em domínios diferentes (cross-site). Quando estão no mesmo domínio, `SameSite='lax'` é suficiente e mais seguro.

3. **Debug sistemático**: A abordagem de debug com endpoint `/api/debug/cookie` e logs detalhados foi crucial para identificar que o problema não estava na configuração do cookie, mas na leitura dos cookies pelo servidor.

## Commits Relacionados

- `eb4935a` - Tornar configuracoes de cookie condicionais (localhost vs Railway)
- `9456626` - Adicionar logs detalhados para debug de cookie JWT
- `e9f0aba` - Adicionar endpoint /api/debug/cookie para debug de cookie JWT
- `3944667` - Adicionar debug info na resposta do login para verificar cookie
- `678732b` - Mudar SameSite de 'none' para 'lax' em produção (frontend/backend no mesmo domínio)
- `50cd6d3` - Adicionar cookie-parser para ler cookies das requisições
- `c228bb1` - Remover código de debug temporário
