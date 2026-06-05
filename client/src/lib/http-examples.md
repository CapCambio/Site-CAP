# Exemplos de Uso da API Padronizada

## Como usar a nova camada de HTTP

A partir de agora, todas as chamadas HTTP devem usar as funções padronizadas em `@/lib/http` em vez de `fetch` direto.

### Importação
```typescript
import { http, api } from '@/lib/http';
```

### Exemplos de Uso

#### 1. Buscar dados (GET)
```typescript
// ❌ Antes (fetch direto)
const response = await fetch('/api/currencies');
if (!response.ok) throw new Error('Failed to fetch');
const data = await response.json();

// ✅ Agora (http.get)
const data = await http.get<Currency[]>('/api/currencies');

// Ou usando funções específicas
const currencies = await api.currencies.getAll();
```

#### 2. Enviar dados (POST)
```typescript
// ❌ Antes
const response = await fetch('/api/alerts/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(alertData)
});
if (!response.ok) throw new Error('Failed to create');
return response.json();

// ✅ Agora
const result = await http.post('/api/alerts/create', alertData);
```

#### 3. Deletar dados (DELETE)
```typescript
// ❌ Antes
const response = await fetch(`/api/alerts/${email}/${currencyCode}`, {
  method: 'DELETE'
});
if (!response.ok) throw new Error('Failed to delete');
return response.json();

// ✅ Agora
const result = await api.alerts.removeAlert(email, currencyCode);
```

#### 4. Em React Query
```typescript
// ❌ Antes
const { data } = useQuery({
  queryKey: ['/api/currencies'],
  queryFn: async () => {
    const response = await fetch('/api/currencies');
    if (!response.ok) throw new Error('Failed to fetch');
    return response.json();
  }
});

// ✅ Agora
const { data } = useQuery({
  queryKey: ['/api/currencies'],
  queryFn: () => api.currencies.getAll()
});
```

### Vantagens

1. **Padronização**: Todas as chamadas usam o mesmo padrão
2. **Tratamento de erro**: Erros são tratados consistentemente
3. **Credentials**: Inclui automaticamente `credentials: "include"`
4. **TypeScript**: Tipagem forte para as respostas
5. **Manutenibilidade**: Centraliza a lógica HTTP

### Funções Disponíveis

#### http.*
- `http.get<T>(url)` - GET requests
- `http.post<T>(url, data)` - POST requests  
- `http.put<T>(url, data)` - PUT requests
- `http.delete<T>(url)` - DELETE requests
- `http.patch<T>(url, data)` - PATCH requests

#### api.*
- `api.currencies.getAll()` - Todas as moedas
- `api.currencies.getCurrent(code)` - Moeda específica
- `api.history.getForCurrency(code, start, end)` - Histórico
- `api.alerts.getUserAlerts(email)` - Alerts do usuário
- `api.alerts.createAlert(email, code, data)` - Criar alert
- `api.alerts.removeAlert(email, code)` - Remover alert
- `api.alerts.updateAlert(email, code, data)` - Atualizar alert
- `api.auth.*` - Autenticação

### Migração

Para migrar código existente:
1. Importe `http` ou `api`
2. Substitua chamadas `fetch` diretas
3. Remova tratamento manual de erro (já está incluído)
4. Use TypeScript para tipagem forte
