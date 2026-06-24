# Plano de Migração: express-session + MemoryStore → JWT

## Objetivo
Substituir o sistema de sessões por JWT para eliminar qualquer egress de autenticação no Supabase, preparando o projeto para escalar para centenas de usuários.

## Contexto do Projeto
- Backend: Node.js + TypeScript + Express
- Banco: Supabase (PostgreSQL)
- Autenticação atual: express-session + MemoryStore (temporário)
- Bloqueio de sessões simultâneas: Map em memória (já implementado)

## Comportamento Esperado Após Migração

### Login
- Verifica email autorizado no banco
- Gera JWT
- Salva em cookie por 30 dias

### Requests
- Todos os requests verificam JWT localmente
- Zero banco de dados para autenticação
- Uma vez por dia por usuário ativo, faz query no Supabase para confirmar autorização
- Se cliente for removido, perde acesso em até 24 horas

### Sessões Simultâneas
- Bloqueio de acessos simultâneos continua funcionando com Map em memória atual

### Renovação Automática
- A cada acesso, se JWT tiver menos de 30 dias para expirar
- Emite novo JWT automaticamente com mais 30 dias
- Renovação transparente para o usuário
- Usuário só precisa fazer login se ficar 30 dias sem acessar

## O que NÃO Deve Mudar
- Alertas, histórico de cotações, preferências de ordem dos cards, idioma salvo — tudo continua no Supabase intacto
- Sistema de bloqueio de sessões simultâneas (Map em memória)
- Lógica de emails autorizados
- Frontend praticamente todo

---

## Arquivos que Precisam Ser Alterados

### Backend

#### 1. `server/index.ts`
**Mudanças:**
- Remover import de `session` (express-session)
- Adicionar middleware para extrair JWT de cookies
- Adicionar middleware para renovação automática de JWT
- Remover configuração de `app.use(session(...))`

**Linhas a remover:**
```typescript
import session from 'express-session';
// Linhas 43-78 (configuração de session)
```

**Linhas a adicionar:**
```typescript
import { jwtMiddleware } from './auth/JwtMiddleware';
import { jwtRenewalMiddleware } from './auth/JwtRenewalMiddleware';
app.use(jwtMiddleware);
app.use(jwtRenewalMiddleware);
```

---

#### 2. `server/auth/JwtService.ts` (NOVO)
**Responsabilidade:**
- Gerar JWT
- Validar JWT
- Extrair payload do JWT
- Verificar expiração

**Funções principais:**
```typescript
generateToken(user: User): string
verifyToken(token: string): User | null
decodeToken(token: string): any
isTokenExpired(token: string): boolean
```

**Configuração:**
- JWT_SECRET do .env
- Tempo de expiração: 30 dias
- Algoritmo: HS256

---

#### 3. `server/auth/JwtMiddleware.ts` (NOVO)
**Responsabilidade:**
- Extrair JWT do cookie
- Validar JWT
- Adicionar usuário ao request se válido
- Verificar bloqueio de sessões simultâneas (Map em memória)
- Validar autorização do usuário (cache de 24h)

**Comportamento:**
- Se JWT válido → adiciona `req.user` e continua
- Se JWT inválido → 401
- Se JWT expirado → 401
- Verifica `activeSessions` Map para bloqueio de sessões simultâneas
- Verifica cache de validação de usuário (24h TTL)

---

#### 4. `server/auth/JwtRenewalMiddleware.ts` (NOVO)
**Responsabilidade:**
- Verificar se JWT tem menos de 30 dias para expirar
- Se sim, gerar novo JWT com 30 dias
- Atualizar cookie com novo JWT
- Renovação transparente para o usuário

**Comportamento:**
- Executa após `JwtMiddleware`
- Se `req.user` existe e JWT < 30 dias → renova
- Atualiza cookie com novo JWT
- Log de renovação para debug (com rate limiting)

---

#### 5. `server/auth/UserValidationCache.ts` (NOVO)
**Responsabilidade:**
- Cache em memória de usuários autorizados
- TTL de 24 horas por usuário
- Query diária ao Supabase para validar autorização

**Estrutura:**
```typescript
userValidationCache: Map<string, { valid: boolean, lastCheck: Date }>
isUserAuthorized(email: string): Promise<boolean>
refreshUserAuthorization(email: string): Promise<void>
cleanupExpiredEntries(): void
```

**Comportamento:**
- Primeira verificação: query ao banco
- Verificações subsequentes (24h): usa cache
- Limpeza automática de entradas expiradas
- Thread-safe para múltiplas requisições simultâneas

---

#### 6. `server/routes.ts`
**Mudanças:**
- Remover `import { authenticate } from './auth/AuthMiddleware'`
- Adicionar `import { authenticate } from './auth/JwtMiddleware'`
- Remover endpoints de sessão (`/api/auth/release-stale`)
- Modificar `/api/auth/login` para gerar JWT em vez de criar sessão
- Modificar `/api/auth/logout` para limpar cookie (não há nada no servidor)
- Modificar `/api/auth/me` para validar JWT (já feito pelo middleware)
- Remover `activeSessions` Map (movido para JwtMiddleware)

**Endpoints modificados:**

**POST /api/auth/login:**
```typescript
// Antes:
await authService.authenticate(email);
session.user = { email, name, isAdmin };
res.json({ user: session.user });

// Depois:
const user = await authService.authenticate(email);
if (!user) return 401;
const token = jwtService.generateToken(user);
res.cookie('jwt', token, { 
  httpOnly: true, 
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 30 * 24 * 60 * 60 * 1000 // 30 dias
});
res.json({ user });
```

**POST /api/auth/logout:**
```typescript
// Antes:
session.destroy(...);

// Depois:
res.clearCookie('jwt');
res.json({ success: true });
```

**GET /api/auth/me:**
```typescript
// Antes:
const sessionUser = authService.getSessionUser(req.session);

// Depois:
// Já validado pelo JwtMiddleware, req.user já existe
res.json({ user: req.user });
```

**Remover:**
- `POST /api/auth/release-stale` (endpoint inteiro)

---

#### 7. `server/auth/AuthService.ts`
**Mudanças:**
- Remover métodos relacionados a sessão:
  - `createSession()`
  - `destroySession()`
  - `getSessionUser()`
- Adicionar método `validateUserAuthorization(email: string): Promise<boolean>` (opcional, pode usar cache)

**Métodos removidos:**
```typescript
createSession(user: User, session: Session): void
destroySession(session: Session): Promise<void>
getSessionUser(session: Session): User | null
```

**Método adicionado (opcional):**
```typescript
async validateUserAuthorization(email: string): Promise<boolean> {
  // Query direta ao banco para validar autorização
  // Usado pelo UserValidationCache
}
```

---

#### 8. `server/auth/AuthMiddleware.ts`
**Mudanças:**
- Remover arquivo inteiro (funcionalidade movida para JwtMiddleware)
- Ou renomear para `LegacyAuthMiddleware.ts` e marcar como deprecated

---

#### 9. `package.json`
**Mudanças:**
- Remover `express-session` das dependências
- Adicionar `jsonwebtoken` e `@types/jsonwebtoken`

```json
{
  "dependencies": {
    "jsonwebtoken": "^9.0.0"
  },
  "devDependencies": {
    "@types/jsonwebtoken": "^9.0.0"
  }
}
```

---

#### 10. `.env`
**Mudanças:**
- Adicionar `JWT_SECRET` (obrigatório em produção)
- Remover `SESSION_SECRET` (não mais necessário)

```env
JWT_SECRET=seu-secret-aqui-muito-seguro
```

---

### Frontend

#### 11. `client/src/lib/http.ts`
**Mudanças:**
- Remover `credentials: 'include'` de todas as requisições
- JWT é enviado automaticamente via cookie (httpOnly)

**Antes:**
```typescript
const res = await fetch(url, {
  credentials: 'include',
  // ...
});
```

**Depois:**
```typescript
const res = await fetch(url, {
  // credentials removido
  // ...
});
```

---

#### 12. `client/src/lib/queryClient.ts`
**Mudanças:**
- Remover `credentials: 'include'` de `apiRequest` e `getQueryFn`

**Antes:**
```typescript
const res = await fetch(url, {
  credentials: 'include',
  // ...
});
```

**Depois:**
```typescript
const res = await fetch(url, {
  // credentials removido
  // ...
});
```

---

#### 13. `client/src/hooks/use-auth.tsx`
**Mudanças:**
- Remover lógica de tratamento de erro 409 (SESSION_ALREADY_ACTIVE)
- Simplificar tratamento de erros de autenticação
- Remover chamada a `/api/auth/release-stale`

**Linhas a remover:**
```typescript
if (response.status === 409) {
  throw new Error('SESSION_ALREADY_ACTIVE');
}
// Linhas 85-95 (release-stale logic)
```

---

#### 14. `client/src/hooks/useCurrencyData.ts`
**Mudanças:**
- Nenhuma (usa `/api/currencies` que já usa middleware de autenticação)

---

#### 15. `client/src/App.tsx`
**Mudanças:**
- Nenhuma (não interage diretamente com autenticação)

---

#### 16. `client/src/pages/Home.tsx`
**Mudanças:**
- Nenhuma (usa hooks de autenticação)

---

### Banco de Dados

#### 17. Supabase - Tabela `session`
**Ação:**
- Remover tabela `session` (opcional, pode deixar para rollback)
- Se remover, também remover do `db.ts`

**Comando SQL:**
```sql
DROP TABLE IF EXISTS session;
```

---

#### 18. `server/db.ts`
**Mudanças:**
- Remover qualquer referência à tabela `session` (se optar por remover)

---

## Ordem de Implementação

### Fase 1: Preparação (1 hora)
1. Adicionar dependências (`jsonwebtoken`, `@types/jsonwebtoken`)
2. Adicionar `JWT_SECRET` ao `.env`
3. Criar estrutura de arquivos novos:
   - `server/auth/JwtService.ts`
   - `server/auth/JwtMiddleware.ts`
   - `server/auth/JwtRenewalMiddleware.ts`
   - `server/auth/UserValidationCache.ts`

### Fase 2: Implementação Backend JWT (3-4 horas)
4. Implementar `JwtService.ts` (gerar, validar, decodificar JWT)
5. Implementar `UserValidationCache.ts` (cache de validação de usuários)
6. Implementar `JwtMiddleware.ts` (extrair e validar JWT)
7. Implementar `JwtRenewalMiddleware.ts` (renovação automática)
8. Modificar `server/index.ts` para usar novos middlewares
9. Modificar `/api/auth/login` para gerar JWT
10. Modificar `/api/auth/logout` para limpar cookie
11. Modificar `/api/auth/me` para usar JWT
12. Remover `/api/auth/release-stale`
13. Mover `activeSessions` Map para `JwtMiddleware.ts`

### Fase 3: Limpeza Backend (1 hora)
14. Remover `express-session` de `server/index.ts`
15. Remover métodos de sessão de `AuthService.ts`
16. Remover `AuthMiddleware.ts` (ou renomear)
17. Atualizar imports em `routes.ts`

### Fase 4: Implementação Frontend (1-2 horas)
18. Remover `credentials: 'include'` de `http.ts`
19. Remover `credentials: 'include'` de `queryClient.ts`
20. Remover lógica de SESSION_ALREADY_ACTIVE de `use-auth.tsx`
21. Remover chamada a `/api/auth/release-stale`

### Fase 5: Limpeza Banco de Dados (30 minutos)
22. Opcional: Remover tabela `session` do Supabase
23. Opcional: Remover referências de `session` de `db.ts`

### Fase 6: Testes (2-3 horas)
24. Testar login com JWT
25. Testar logout
26. Testar persistência de cookie
27. Testar renovação automática de JWT
28. Testar expiração de JWT (simular 30 dias)
29. Testar bloqueio de sessões simultâneas
30. Testar validação de usuário (cache de 24h)
31. Testar endpoints protegidos
32. Testar em produção (Railway)

### Fase 7: Deploy e Monitoramento (1 hora)
33. Deploy no Railway
34. Monitorar egress do Supabase (deve ser zero para autenticação)
35. Verificar logs de erros
36. Rollback se necessário

---

## Riscos e Pontos de Atenção

### Riscos Críticos

**1. Perda de sessões ativas durante migração**
- **Risco:** Usuários logados serão desconectados
- **Mitigação:** Avisar usuários antecipadamente, fazer migração em horário de baixo tráfego
- **Rollback:** Manter código antigo em branch separado para rollback rápido
- **Nota:** Como já estamos usando MemoryStore, sessões já são perdidas ao reiniciar, então o impacto é menor

**2. Problemas com cookie em diferentes domínios**
- **Risco:** Cookie não funciona se frontend e backend estiverem em domínios diferentes
- **Mitigação:** Verificar configuração de `sameSite` e `secure` em produção
- **Teste:** Testar em ambiente de produção antes de migrar
- **Nota:** Atualmente funciona com `sameSite: 'none'` em produção, manter essa configuração

**3. Expiração de JWT não funcionar como esperado**
- **Risco:** Usuários ficam logados indefinidamente ou perdem acesso prematuramente
- **Mitigação:** Testar exata configuração de `maxAge` e expiração
- **Teste:** Simular passagem de 30 dias para verificar renovação
- **Nota:** Renovação automática deve ser testada exaustivamente

**4. Cache de validação de usuários não atualizar**
- **Risco:** Usuário removido continua tendo acesso por 24h
- **Mitigação:** Documentar claramente esse comportamento para o cliente
- **Melhoria futura:** Implementar webhook do Supabase para invalidação imediata
- **Nota:** Aceitável para MVP, pode ser melhorado posteriormente

**5. Bloqueio de sessões simultâneas com Map em memória**
- **Risco:** Perde funcionalidade se tiver múltiplas instâncias
- **Mitigação:** Documentar que só funciona com 1 instância
- **Melhoria futura:** Mover bloqueio para Redis se escalar
- **Nota:** Para escalar para centenas de usuários, provavelmente precisará de Redis

### Pontos de Atenção

**1. Segurança do JWT_SECRET**
- **Atenção:** JWT_SECRET deve ser forte e aleatório
- **Ação:** Usar gerador de secrets seguros, não commitar no git
- **Verificação:** Adicionar verificação no startup se JWT_SECRET está definido

**2. Tamanho do cookie**
- **Atenção:** JWT pode ficar grande se tiver muitos dados no payload
- **Ação:** Manter payload mínimo (apenas email, name, isAdmin)
- **Limite:** Browser limita cookies a ~4KB

**3. Renovação automática de JWT**
- **Atenção:** Pode gerar muitos logs se houver muitos acessos
- **Ação:** Adicionar rate limiting para logs de renovação
- **Monitoramento:** Monitorar frequência de renovações

**4. Compatibilidade com Service Worker**
- **Atenção:** Service Worker pode ter problemas com cookies
- **Ação:** Testar PWA com novo sistema de autenticação
- **Verificação:** Verificar se push notifications ainda funcionam

**5. Testes em produção**
- **Atenção:** Comportamento pode ser diferente em produção vs local
- **Ação:** Testar exaustivamente em ambiente de staging
- **Monitoramento:** Monitorar logs de erros nas primeiras 24h

**6. Escalabilidade com Map em memória**
- **Atenção:** Map em memória não escala com múltiplas instâncias
- **Ação:** Documentar limitação atual
- **Planejamento:** Considerar Redis para bloqueio de sessões se escalar horizontalmente

**7. Cache de validação de usuários**
- **Atenção:** Map em memória pode crescer indefinidamente
- **Ação:** Implementar limpeza automática de entradas expiradas
- **Monitoramento:** Monitorar tamanho do cache em memória

---

## Estimativa de Tempo

| Fase | Tempo Estimado |
|------|----------------|
| Fase 1: Preparação | 1 hora |
| Fase 2: Implementação Backend JWT | 3-4 horas |
| Fase 3: Limpeza Backend | 1 hora |
| Fase 4: Implementação Frontend | 1-2 horas |
| Fase 5: Limpeza Banco de Dados | 30 minutos |
| Fase 6: Testes | 2-3 horas |
| Fase 7: Deploy e Monitoramento | 1 hora |
| **Total** | **9.5-12.5 horas** |

---

## Checklist de Validação Pós-Migração

- [ ] Login funciona e gera JWT
- [ ] JWT é salvo em cookie httpOnly
- [ ] Cookie tem duração de 30 dias
- [ ] Logout limpa cookie
- [ ] Endpoints protegidos funcionam com JWT
- [ ] Bloqueio de sessões simultâneas funciona
- [ ] Renovação automática de JWT funciona
- [ ] Cache de validação de usuários funciona (24h TTL)
- [ ] Egress do Supabase foi reduzido a zero para autenticação
- [ ] Alertas continuam funcionando
- [ ] Histórico de cotações continua funcionando
- [ ] Preferências de ordem dos cards continuam funcionando
- [ ] Idioma salvo continua funcionando
- [ ] PWA continua funcionando
- [ ] Push notifications continuam funcionando
- [ ] Service Worker continua funcionando
- [ ] Não há erros nos logs
- [ ] Usuários conseguem fazer login normalmente
- [ ] Sistema escala para centenas de usuários

---

## Diferenças em relação ao plano anterior (connect-pg-simple)

**Mudanças:**
- Não há mais tabela `session` para remover (MemoryStore não usa banco)
- Não há `connect-pg-simple` para remover do package.json
- Impacto de perda de sessões é menor (já acontece com MemoryStore)
- Menos dependências para remover

**Simplificações:**
- Fase 5 (Limpeza Banco de Dados) é opcional e mais simples
- Menos arquivos para modificar no backend
- Rollback é mais simples (basta reverter para MemoryStore)

**Benefícios adicionais:**
- Já estamos preparados para perda de sessões ao reiniciar
- Menos risco de problemas de compatibilidade
- Migração mais simples e segura

---

## Data de Criação
16 de Junho de 2026

## Status
Planejado - Não implementado ainda
