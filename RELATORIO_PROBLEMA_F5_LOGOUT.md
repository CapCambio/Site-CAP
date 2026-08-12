# Relatório Técnico: Problema de Logout ao Dar F5

## Descrição do Problema

Ao dar F5 (refresh) na página, o usuário é deslogado automaticamente e redirecionado para a página de login. Ao tentar fazer login novamente, o sistema retorna a mensagem: "Já existe uma sessão ativa em outro dispositivo", impedindo o acesso.

## Ambiente de Produção

- **Plataforma**: Railway
- **Protocolo**: HTTPS com proxy reverso
- **Frontend**: React + Vite
- **Backend**: Node.js + Express
- **Autenticação**: JWT em cookies httpOnly

## Código Atual

### 1. Configuração de Cookie no Login (server/routes.ts)

```typescript
// Definir cookie JWT
const isProduction = process.env.NODE_ENV === 'production';
const cookieConfig = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? 'none' : 'lax',
  maxAge: 30 * 24 * 60 * 60 * 1000,
  path: '/'
};

console.log(`[Login] Configuração de cookie:`, {
  NODE_ENV: process.env.NODE_ENV,
  isProduction,
  secure: cookieConfig.secure,
  sameSite: cookieConfig.sameSite
});

res.cookie('jwt', token, cookieConfig);
```

### 2. Middleware JWT (server/auth/JwtMiddleware.ts)

```typescript
export const jwtMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies?.jwt;

  console.log(`[JWT Middleware] Path: ${req.path}, Token existe: ${!!token}`);
  console.log(`[JWT Middleware] Cookies:`, Object.keys(req.cookies || {}));
  console.log(`[JWT Middleware] NODE_ENV: ${process.env.NODE_ENV}`);

  if (!token) {
    console.log(`[JWT Middleware] Nenhum token encontrado, continuando sem usuário`);
    return next();
  }

  const user = JwtService.verifyToken(token);

  if (!user) {
    console.log(`[JWT Middleware] Token inválido ou expirado`);
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }

  (req as any).user = user;
  next();
};
```

### 3. Controle de Sessões (server/routes.ts)

```typescript
const activeSessions = new Map<string, {
  sessionId: string;
  lastActivity: number;
}>();

// No login
if (!isAdminEmail) {
  activeSessions.set(emailLower, {
    sessionId: Date.now().toString(),
    lastActivity: Date.now()
  });
}

// No logout
if (email && !isAdmin) {
  activeSessions.delete(emailLower);
}

// No login - verificação de sessão ativa
const HEARTBEAT_TIMEOUT = 30 * 1000; // 30 segundos
const activeSession = activeSessions.get(emailLower);

if (activeSession) {
  const timeSinceLastActivity = now - activeSession.lastActivity;
  if (timeSinceLastActivity < HEARTBEAT_TIMEOUT) {
    return res.status(409).json({
      error: 'Já existe uma sessão ativa em outro dispositivo'
    });
  }
}
```

### 4. Configuração do Express (server/index.ts)

```typescript
const app = express();
app.set('trust proxy', 1);
```

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

### Tentativa 2: Configuração Condicional (ATUAL)
```typescript
res.cookie('jwt', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: 30 * 24 * 60 * 60 * 1000,
  path: '/'
});
```
**Resultado**: Continua com o mesmo problema em produção após deploy

## Comportamento Observado

1. Usuário faz login normalmente
2. Cookie JWT é definido no navegador
3. Usuário dá F5 na página
4. Navegador redireciona para página de login
5. Ao tentar login novamente: "Já existe uma sessão ativa em outro dispositivo"
6. Após ~30 segundos, o login funciona novamente (timeout de heartbeat)

## Perguntas para Análise

1. **Por que o cookie não está sendo enviado após F5 mesmo com a configuração condicional?**
   - O Railway está reconhecendo NODE_ENV como 'production'?
   - A configuração `secure: true` e `sameSite: 'none'` está correta para HTTPS com proxy reverso?
   - O navegador está bloqueando o_cookie por algum motivo?

2. **A configuração `sameSite: 'none'` é necessária?**
   - Frontend e API estão no mesmo domínio ou em domínios diferentes?
   - Se estiverem no mesmo domínio, `sameSite: 'lax'` seria suficiente?

3. **Problema com proxy reverso?**
   - O `app.set('trust proxy', 1)` está funcionando corretamente?
   - O proxy reverso do Railway está interferindo com os cookies?

4. **Problema com o frontend?**
   - O React está fazendo algum redirecionamento indevido?
   - O cookie está sendo definido mas o navegador não está enviando?

## Logs Adicionados

Adicionei logs detalhados para debug:
- `[Login] Configuração de cookie:` - mostra NODE_ENV, secure, sameSite
- `[JWT Middleware] Path:` - mostra se o cookie está sendo enviado
- `[JWT Middleware] Cookies:` - mostra quais cookies estão chegando
- `[JWT Middleware] NODE_ENV:` - mostra o ambiente

## Próximos Passos

1. Verificar logs do Railway após o deploy para ver:
   - Qual NODE_ENV está sendo usado
   - Qual configuração de cookie está sendo aplicada
   - Se o cookie está sendo enviado após F5

2. Testar diferentes configurações de cookie:
   - `sameSite: 'lax'` em produção
   - Adicionar `domain` ao cookie
   - Testar sem `secure: true` temporariamente

3. Considerar alternativas:
   - Mover controle de sessões para Redis
   - Usar localStorage como fallback
   - Implementar refresh token diferente
