# Manual do Usuário - CurrencyTracker

## 📋 Índice
1. [Pré-requisitos](#-pré-requisitos)
2. [Iniciando o Servidor](#-iniciando-o-servidor)
3. [Comandos Úteis](#-comandos-úteis)
4. [Solução de Problemas](#-solução-de-problemas)
5. [Dicas Importantes](#-dicas-importantes)

---

## 🛠️ Pré-requisitos
- Node.js (versão 14 ou superior)
- npm (vem com o Node.js)
- Acesso ao diretório do projeto

## 🚀 Iniciando o Servidor

1. **Abra o Terminal (PowerShell)**
   - Pressione `Win + X` e selecione "Windows PowerShell"

2. **Navegue até o diretório do projeto**
   ```powershell
   cd C:\Users\User\Desktop\CurrencyTracker
   ```

3. **Instale as dependências** (apenas na primeira vez)
   ```powershell
   npm install
   ```

4. **Inicie o servidor**
   ```powershell
   npm run dev
   ```
   
   *Alternativa se o comando acima não funcionar:*
   ```powershell
   $env:NODE_ENV="development"; npx tsx server/index.ts
   ```

5. **Acesse o aplicativo**
   - Abra seu navegador e acesse: [http://localhost:8080](http://localhost:8080)

## ⚙️ Comandos Úteis

| Comando | Descrição |
|---------|-----------|
| `Ctrl + C` | Para o servidor |
| `netstat -ano | findstr :8080` | Verifica processos na porta 8080 |
| `taskkill /F /PID <NÚMERO>` | Encerra um processo específico |

## 🔍 Solução de Problemas

### Porta em Uso
```powershell
netstat -ano | findstr :8080
taskkill /F /PID <NÚMERO_DO_PROCESSO>
```

### Módulos não Encontrados
```powershell
npm install
```

## 💡 Dicas Importantes
- Mantenha o terminal aberto durante o uso
- O servidor recarrega automaticamente em desenvolvimento
- Verifique as versões instaladas:
  ```powershell
  node -v
  npm -v
  ```

## ⚠️ Configurações Atuais
- **Porta:** 8080
- **Ambiente:** development
- **Host:** 0.0.0.0

---

📅 Última atualização: 29/09/2025  
✉️ Suporte: [seu-email@exemplo.com](mailto:seu-email@exemplo.com)
