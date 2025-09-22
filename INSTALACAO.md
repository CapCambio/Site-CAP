
# GUIA DE INSTALAÇÃO DETALHADO

## ⚡ Instalação Rápida (1 minuto)

1. **Extrair o ZIP:**
   - Extrair o arquivo `cap-cotacoes.zip` 
   - Abrir terminal/prompt na pasta extraída

2. **Comando único:**
   ```bash
   npm install && npm run dev
   ```

3. **Acessar:**
   - Abrir navegador em `http://localhost:5000`

## 🔧 Instalação Passo a Passo

### Windows:
```cmd
# 1. Navegar para a pasta
cd cap-cotacoes

# 2. Instalar dependências
npm install

# 3. Executar
npm run dev
```

### Linux/Mac:
```bash
# 1. Navegar para a pasta
cd cap-cotacoes

# 2. Dar permissões (se necessário)
chmod -R 755 .

# 3. Instalar dependências
npm install

# 4. Executar
npm run dev
```

## ❌ Resolução de Problemas

### "npm não encontrado":
- Instalar Node.js de https://nodejs.org

### "Porta 5000 em uso":
```bash
npx kill-port 5000
```

### "Erro de permissões" (Linux/Mac):
```bash
sudo chmod -R 755 data/
sudo chmod -R 755 server/config/
```

### "Módulos não encontrados":
```bash
rm -rf node_modules package-lock.json
npm install
```

## ✅ Verificação de Funcionamento

Após executar `npm run dev`, você deve ver:
- Servidor rodando na porta 5000
- Mensagem "App running on http://localhost:5000"
- Interface carregando no navegador

## 🆘 Suporte de Emergência

Se nada funcionar, execute em sequência:
```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
npm run dev
```

---
**Este projeto foi configurado para funcionar imediatamente após download**
