# Prompt de Debug Completo para CurrencyTracker

## Contexto do Projeto
Você está analisando o projeto CurrencyTracker - um aplicativo de rastreamento de cotações de moedas com:
- Frontend: React + TypeScript + Vite
- Backend: Node.js + TypeScript
- Scraping de dados de câmbio em tempo real
- Sistema de alertas por email
- Autenticação de usuários
- Gráficos históricos e conversor de moedas

## Objetivo da Análise
Faça uma análise completa de debug e identificação de melhorias para este projeto. Foque em:

### 1. **Problemas Críticos de Segurança**
- Injeção de dados (SQL, XSS, CSS)
- Validação de entrada sanitizada
- Exposição de dados sensíveis
- Configurações de segurança inadequadas

### 2. **Bugs Funcionais**
- Race conditions em scraping
- Tratamento de erros inconsistente
- Estados indefinidos na UI
- Problemas de sincronização de dados

### 3. **Problemas de Performance**
- Re-renders desnecessários
- Memory leaks
- Queries ineficientes
- Otimização de bundle

### 4. **Problemas de Arquitetura**
- Acoplamento excessivo
- Código duplicado
- Falta de padronização
- Escalabilidade comprometida

### 5. **Problemas de UX/Experiência**
- Estados de carregamento inconsistentes
- Feedback ao usuário inadequado
- Responsividade quebrada
- Acessibilidade comprometida

### 6. **Problemas de Manutenibilidade**
- Código "mágico" sem documentação
- Nomeação confusa
- Falta de tipagem forte
- Testes ausentes

## Metodologia de Análise

### Passo 1: Análise Estrutural
1. Mapeie a arquitetura geral do projeto
2. Identifique os principais fluxos de dados
3. Analise a separação de responsabilidades
4. Verifique a consistência de padrões

### Passo 2: Análise de Código Crítico
1. **Security Hotspots**: 
   - `server/scraper.ts` (injeção de dados externos)
   - `client/src/components/ui/chart.tsx` (dangerouslySetInnerHTML já corrigido)
   - Qualquer lugar com eval(),.innerHTML ou similar

2. **Data Flow**:
   - Sistema de scraping → cache → API → frontend
   - Sistema de alertas e notificações
   - Sistema de autenticação

3. **State Management**:
   - React Query consistency
   - Estado global vs local
   - Sincronização entre componentes

### Passo 3: Análise de Performance
1. Identifique gargalos no scraping
2. Analise queries React otimizadas
3. Verifique memory leaks em useEffect
4. Bundle size e loading strategies

### Passo 4: Análise de Erros
1. Tratamento de erros HTTP
2. Fallbacks para scraping failures
3. Estados de erro na UI
4. Logging e monitoramento

## Áreas Específicas para Investigar

### Backend (server/)
- **scraper.ts**: Validação de dados externos, tratamento de falhas
- **auth/**: Segurança na autenticação, tokens, sessões
- **emails/**: Injeção de conteúdo em templates
- **monitoring/**: Logs, health checks, performance

### Frontend (client/)
- **hooks/**: Custom hooks consistency, memory leaks
- **components/**: Re-renders, props drilling, estado local
- **lib/**: Utilitários, tipagem, validações
- **App.tsx**: Routing, estado global, error boundaries

### Integrações
- Comunicação frontend/backend
- Sistema de cache
- Sistema de alertas/email
- Sistema de autenticação

## Deliverables Esperados

### 1. **Relatório de Problemas Críticos**
- Lista priorizada de security issues
- Bugs funcionais com impacto no usuário
- Problemas de performance severos

### 2. **Relatório de Melhorias**
- Sugestões de refatoração
- Otimizações de performance
- Melhorias na arquitetura

### 3. **Plano de Ação**
- Priorização das correções
- Estimativa de esforço
- Dependências entre as melhorias

### 4. **Code Samples**
- Exemplos de código corrigido
- Padrões recomendados
- Boas práticas implementadas

## Instruções Específicas

1. **Seja sistemático**: Analise arquivo por arquivo quando necessário
2. **Pense em edge cases**: O que pode dar errado?
3. **Considere o contexto**: Este é um projeto financeiro - segurança é crítica
4. **Seja prático**: Foque em problemas reais, não teóricos
5. **Documente tudo**: Explique o "porquê" de cada problema

## Começo da Análise

Por favor, comece com uma visão geral da arquitetura e depois mergulhe nos problemas específicos. Use o thinking mode para explorar profundamente cada área antes de chegar a conclusões.

Estou pronto para sua análise completa do CurrencyTracker!
