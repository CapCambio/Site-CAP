# Debug Prompt para CurrencyTracker - SWE-1.6 Slow

## Contexto
Projeto CurrencyTracker: app de rastreamento de cotações com React/Node.js, scraping em tempo real, alertas por email, autenticação.

## Tarefa Focada
Faça uma análise sistemática para encontrar e corrigir problemas específicos. SWE-1.6 funciona melhor com tarefas bem definidas.

## Análise Estruturada - Execute em Ordem

### 1. Security Analysis (Prioridade Alta)
**Arquivos para analisar:**
- `server/scraper.ts` - Injeção de dados externos
- `server/emails/` - Templates de email
- `server/auth/` - Autenticação
- `client/src/components/ui/chart.tsx` - dangerouslySetInnerHTML

**O que procurar:**
- XSS, injeção de SQL/CSS
- Validação de entrada
- Dados sensíveis expostos
- Sanitização inadequada

### 2. HTTP Client Inconsistency (Já parcialmente corrigido)
**Verificar se ainda existe fetch direto:**
- Busque por `fetch(` em todos os arquivos .ts/.tsx
- Compare com `client/src/lib/http.ts` (já criado)
- Identifique chamadas não padronizadas

### 3. Error Handling Analysis
**Arquivos críticos:**
- `server/index.ts` - Tratamento de erros globais
- `client/src/hooks/` - Custom hooks
- Componentes com useQuery/useMutation

**O que procurar:**
- Erros não tratados
- Fallbacks ausentes
- Mensagens de erro inadequadas

### 4. Performance Issues
**Foco em:**
- `server/scraper.ts` - Gargalos de scraping
- `client/src/components/` - Re-renders
- React Query queries não otimizadas
- Memory leaks em useEffect

### 5. State Management Problems
**Verificar:**
- Sincronização entre componentes
- Estado global vs local inconsistente
- Props drilling excessivo
- Race conditions

## Instruções Específicas para SWE-1.6

### Para cada problema encontrado:
1. **Identifique o arquivo e linha exata**
2. **Explique o impacto específico**
3. **Forneça o código corrigido**
4. **Teste a correção se possível**

### Exemplo de formato:
```
## Problema 1: XSS em ChartStyle
**Arquivo:** client/src/components/ui/chart.tsx:81
**Problema:** dangerouslySetInnerHTML sem validação
**Impacto:** Injeção de CSS/HTML malicioso
**Correção:** [código corrigido]
```

## Áreas Prioritárias

### Backend (server/)
1. **scraper.ts** - Validação de dados externos
2. **auth/** - Segurança de autenticação
3. **emails/** - Injeção em templates
4. **index.ts** - Error handling global

### Frontend (client/)
1. **hooks/** - Memory leaks, estado inconsistente
2. **components/** - Re-renders, props drilling
3. **lib/** - Tipagem, validações
4. **App.tsx** - Estado global, error boundaries

## Problemas Conhecidos a Verificar

### Já Corrigidos (verificar se está completo):
- ✅ Bug crypto.createHash → createHash (server/scraper.ts:38)
- ✅ dangerouslySetInnerHTML em ChartStyle (client/src/components/ui/chart.tsx)
- ✅ HTTP Client inconsistency (parcialmente corrigido)

### Possíveis Problemas:
- Race conditions no scraping
- Memory leaks em useEffect
- Tratamento de 401/403 inconsistente
- Validação de entrada de usuário
- Performance de queries React

## Método de Trabalho

1. **Análise arquivo por arquivo** - Seja metódico
2. **Problemas críticos primeiro** - Security, bugs funcionais
3. **Forneça código corrigido** - Não apenas descrição
4. **Seja específico** - Linhas, arquivos, impacto exato
5. **Teste as correções** - Verifique se funcionam

## Deliverable Final
Lista de problemas encontrados com:
- Arquivo e linha específica
- Descrição do problema
- Código corrigido
- Impacto da correção

Comece pela análise de segurança, depois HTTP consistency, e depois os outros itens em ordem de prioridade.
