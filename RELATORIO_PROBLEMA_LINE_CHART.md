# Relatório: Problema no Line Chart - Apenas Bolinha no Dia Atual

## Data: 17/08/2026
## Status: Pendente de Solução
## Prioridade: Alta

---

## Descrição do Problema

O gráfico de linha (line chart) do componente `CurrencyMiniChart` não está sendo construído corretamente. Em vez de mostrar uma linha conectando os pontos de dados históricos do mês, o gráfico exibe apenas uma única bolinha no dia atual.

### Comportamento Atual
- Gráfico mostra apenas um ponto (bolinha) no dia de hoje
- Linha conectando os pontos não é renderizada
- Dados históricos não são exibidos no gráfico
- Apenas o preço atual do dia aparece

### Comportamento Esperado
- Gráfico deve mostrar linha conectando todos os dias do mês com dados históricos
- Pontos devem ser exibidos para cada dia com preço registrado
- Linha deve mostrar a tendência de variação do preço ao longo do mês
- Todos os dias do mês selecionado devem aparecer no eixo X

---

## Contexto Técnico

### Componente Afetado
- **Arquivo**: `client/src/components/CurrencyMiniChart.tsx`
- **Biblioteca**: Recharts (AreaChart, Area, XAxis, YAxis, Tooltip)
- **Hook de dados**: React Query (`@tanstack/react-query`)
- **Manipulação de datas**: date-fns

### Fluxo de Dados
1. Componente busca dados históricos via API: `/api/history/mini`
2. Dados são mapeados para cada dia do mês selecionado
3. Array `chartData` é construído com pontos para cada dia
4. Recharts renderiza o gráfico com os dados

---

## Tentativas de Correção Anteriores

### Tentativa 1: Ajuste na Query de Dados Históricos
**Data**: 13/08/2026
**Alteração**: Modificada a query para usar `adjustedMonthEnd` em vez de `monthEnd` para evitar problemas de cache e busca de dados futuros.

**Resultado**: Sem melhoria no problema do gráfico.

**Código alterado**:
```typescript
// Antes:
queryKey: ['/api/history/mini', currencyCode, monthStart.toISOString().split('T')[0], monthEnd.toISOString().split('T')[0]]

// Depois:
queryKey: ['/api/history/mini', currencyCode, monthStart.toISOString().split('T')[0], adjustedMonthEnd.toISOString().split('T')[0]]
```

### Tentativa 2: Adição de Logs de Debug
**Data**: 13/08/2026
**Alteração**: Adicionados console.log statements para verificar dados recebidos e dados finais do gráfico.

**Resultado**: Logs mostram que dados estão sendo recebidos, mas gráfico ainda não renderiza corretamente.

**Logs adicionados**:
```typescript
console.log('🔍 CurrencyMiniChart Debug:');
console.log('Currency:', currencyCode);
console.log('Selected Month:', selectedMonth);
console.log('Historical Data:', historicalData);
console.log('Historical Data length:', historicalData?.length);
console.log('Chart Data Final:');
console.log('Chart Data length:', chartData.length);
console.log('Chart Data with valid prices:', chartData.filter(d => d.sellPrice !== null));
```

---

## Análise do Código Atual

### Lógica de Mapeamento de Dados (Linhas 176-225)

```typescript
const allChartData = daysInMonth.map(day => {
  const dayDate = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), day);
  const formattedDay = format(dayDate, 'dd/MM');

  // Se a data for no futuro, não incluir dados
  if (dayDate > today) {
    return {
      date: formattedDay,
      day: day.toString(),
      sellPrice: null,
      buyPrice: null,
      hasRealData: false
    };
  }

  // Se for o dia atual, usar preço mais recente disponível
  if (isSameDay(dayDate, today)) {
    const todaysSellPrice = currentPrice || currentCurrencyData?.sellPrice;
    const todaysBuyPrice = currentCurrencyData?.buyPrice;
    
    if (todaysSellPrice) {
      return {
        date: formattedDay,
        day: day.toString(),
        sellPrice: todaysSellPrice,
        buyPrice: todaysBuyPrice,
        hasRealData: true
      };
    }
  }

  // Procurar se há dados históricos para este dia
  const historyEntry = historicalData?.find((entry: CurrencyHistory) => {
    const entryDate = new Date(entry.timestamp);
    return entryDate.getDate() === dayDate.getDate() &&
           entryDate.getMonth() === dayDate.getMonth() &&
           entryDate.getFullYear() === dayDate.getFullYear();
  });

  return {
    date: formattedDay,
    day: day.toString(),
    sellPrice: historyEntry?.sellPrice || null,
    buyPrice: historyEntry?.buyPrice || null,
    hasRealData: !!historyEntry
  };
});
```

### Configuração do Recharts (Linhas 459-570)

```typescript
<AreaChart data={activeChartData} margin={isMobile ? { top: 10, right: 5, left: 5, bottom: 25 } : { top: 10, right: 15, left: 15, bottom: 25 }}>
  <Area
    type="monotone"
    dataKey="sellPrice"
    stroke="#f3b234"
    fillOpacity={1}
    fill="url(#colorSell)"
    strokeWidth={2}
    connectNulls={false}
    dot={chartType === 'day' ? 
      (validDataCount === 1 || isConstantPrice ? { fill: '#f3b234', strokeWidth: 1, r: 2 } : false) :
      { fill: '#f3b234', strokeWidth: 1, r: 2 }
    }
  />
</AreaChart>
```

---

## Possíveis Causas Identificadas

### 1. Problema com `connectNulls={false}`
A propriedade `connectNulls={false}` no componente `Area` pode estar impedindo que a linha seja desenhada quando há valores `null` entre pontos.

### 2. Comparação de Datas com Timezone
A comparação manual de datas (`getDate()`, `getMonth()`, `getFullYear()`) pode estar falhando devido a diferenças de timezone entre os dados históricos e a data selecionada.

### 3. Formato dos Dados Históricos
Os dados históricos podem estar em um formato diferente do esperado, fazendo com que o `find` não encontre correspondências.

### 4. Problema no Eixo X
A configuração do eixo X com `type="category"` e `scale="point"` pode estar causando problemas na renderização dos pontos.

### 5. Valores Null no Array
Se o array `chartData` contém muitos valores `null`, o Recharts pode não conseguir desenhar a linha corretamente.

---

## Informações de Ambiente

### Stack Tecnológico
- **Frontend**: React 19.2.1 + TypeScript
- **Biblioteca de Gráficos**: Recharts 2.15.2
- **Manipulação de Dados**: date-fns 4.1.0
- **Gerenciamento de Estado**: React Query 5.90.2
- **Backend**: Express + PostgreSQL

### Navegadores Testados
- Chrome (Desktop)
- Safari (iOS)
- Chrome (Android PWA)

### Período de Teste
- **Início**: 13/08/2026
- **Duração**: 5 dias
- **Resultado**: Problema persiste em todos os navegadores

---

## Logs de Debug (Exemplo)

```
🔍 CurrencyMiniChart Debug:
Currency: USD
Selected Month: 2026-08-01T00:00:00.000Z
Historical Data: [{timestamp: "2026-08-01T12:00:00.000Z", sell_price: 5.45, buy_price: 5.35}, ...]
Historical Data length: 15

Dates in history: [
  {raw: "2026-08-01T12:00:00.000Z", parsed: 2026-08-01T12:00:00.000Z, day: 1, month: 7, year: 2026, sellPrice: 5.45},
  ...
]

🔍 Chart Data Final:
Chart Data length: 31
Chart Data with valid prices: [{date: "17/08", day: "17", sellPrice: 5.47, buyPrice: 5.37, hasRealData: true}]
```

---

## Próximos Passos Sugeridos

1. **Investigar formato dos dados históricos retornados pela API**
2. **Testar com `connectNulls={true}`** para ver se a linha é desenhada
3. **Usar comparação de datas com `isSameDay` do date-fns** em vez de comparação manual
4. **Verificar se há dados históricos suficientes no banco de dados**
5. **Testar renderização com dados mockados** para isolar o problema
6. **Revisar configuração do eixo X do Recharts**

---

## Solicitação de Ajuda

Este relatório foi preparado para solicitar assistência técnica especializada nos seguintes canais:
- **ChatGPT (OpenAI)**
- **DeepSeek**

Objetivo: Identificar a causa raiz do problema e implementar uma solução definitiva para o line chart.
