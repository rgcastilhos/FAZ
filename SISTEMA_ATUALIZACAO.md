# 🔄 Sistema de Auto-Atualização - FAZ App

## 📋 Como Funciona

O aplicativo FAZ agora tem um **sistema de atualização automática** que verifica se há novas versões disponíveis e notifica o usuário para atualizar.

---

## 🚀 Como Usar o Sistema de Atualização

### **Quando Você Faz Uma Melhoria no Código:**

1. **Atualize a versão no `.env.local`:**
   ```
   APP_VERSION="1.0.2"  # Mude a versão
   ```

2. **Commit e push para GitHub:**
   ```bash
   git add -A
   git commit -m "Nova melhoria: [descrição]"
   git push origin main
   ```

3. **Redeploy no Render/GitHub Pages:**
   - O Render redeploy automaticamente quando você faz push
   - A versão é servida através do endpoint `/api/version`

---

## 👤 Para o Usuário Final

### **Na Tela do Aplicativo:**

1. **Um ícone aparece no canto superior direito quando há nova versão:**
   ```
   ┌─────────────────────────────────┐
   │ 🟢 Nova Versão Disponível v1.0.2│
   │     [Atualizar] [Depois]        │
   └─────────────────────────────────┘
   ```

2. **Opções:**
   - **Atualizar** - Baixa e instala a nova versão imediatamente
   - **Depois** - Fecha a notificação e verifica novamente em 60 segundos

---

## ⚙️ Configuração Técnica

### **Componentes do Sistema:**

#### 1. **Hook `useAppUpdate.ts`**
- Verifica versão a cada 60 segundos
- Compara versão local com a do servidor
- Gerencia estado de atualização

#### 2. **Componente `UpdateButton.tsx`**
- Mostra notificação visual
- Botões para atualizar ou descartar
- Animação suave (Motion/Framer)

#### 3. **Endpoint `/api/version` (server.ts)**
```javascript
GET /api/version
Response:
{
  "version": "1.0.1",
  "releaseDate": "2026-03-13T00:32:00Z",
  "changelog": "Melhorias de qualidade",
  "isRequired": false
}
```

---

## 📱 Fluxo de Atualização

```
┌─────────────────────────────────────────┐
│ 1. Você muda código no IDE              │
│    npm run build && git push            │
└────────────┬────────────────────────────┘
             ↓
┌─────────────────────────────────────────┐
│ 2. GitHub/Render redeploy automaticamente│
│    Nova versão live em ~2 min           │
└────────────┬────────────────────────────┘
             ↓
┌─────────────────────────────────────────┐
│ 3. App do usuário verifica /api/version │
│    A cada 60 segundos (periodicamente)  │
└────────────┬────────────────────────────┘
             ↓
┌─────────────────────────────────────────┐
│ 4. Versão nova é detectada              │
│    Notificação aparece na UI            │
└────────────┬────────────────────────────┘
             ↓
┌─────────────────────────────────────────┐
│ 5. Usuário clica "Atualizar"            │
│    Web: reload página                   │
│    APK: link para download novo         │
└─────────────────────────────────────────┘
```

---

## 🔧 Comandos de Referência

### **Fazer uma Nova Build com Atualização:**

```bash
# 1. Edite seu código em src/

# 2. Atualize a versão
# Edite .env.local:
# APP_VERSION="1.0.3"

# 3. Commit e push
git add -A
git commit -m "Feature: [descrição da melhoria]"
git push origin main

# 4. Pronto! Usuários receberão notificação automaticamente
```

---

## 📊 Versionamento Recomendado

Use **Semantic Versioning**:
- `1.0.0` - Release inicial
- `1.0.1` - Bug fixes pequenos
- `1.1.0` - Novas features
- `2.0.0` - Breaking changes

**Exemplo:**
```
1.0.0  →  Inicial
1.0.1  →  Corrige bug de localização
1.1.0  →  Adiciona Dr. Pasto
1.1.1  →  Corrige Dr. Pasto
2.0.0  →  Redesign completo
```

---

## 🎯 Features Avançadas

### **Atualizações Obrigatórias (Opcional)**

Se uma versão é crítica, você pode marcar como obrigatória:

No `server.ts`:
```javascript
app.get("/api/version", (req, res) => {
  res.json({
    version: "2.0.0",
    isRequired: true,  // ← Obriga atualizar
    changelog: "Correção de segurança crítica"
  });
});
```

---

## 🚨 Troubleshooting

### **"Notificação não aparece"**
- Verifique se `/api/version` está retornando dados
- Abra DevTools (F12) > Network > `/api/version`
- Verifique se `APP_VERSION` é diferente da versão atual

### **"Atualizar não funciona"**
- Limpe o cache do navegador (Ctrl+Shift+Delete)
- Reinicie o servidor `npm run dev`
- Verifique logs no console (F12 > Console)

### **"Sempre pede para atualizar"**
- Atualize `.env.local` com a versão correta
- Rebuild e redeploy
- Sync Capacitor para Android: `npx cap sync`

---

## 📝 Próximas Melhorias

- [ ] Atualização automática de APK no Android
- [ ] Mostrar changelog antes de atualizar
- [ ] Download em background
- [ ] Progresso de download
- [ ] Agendamento de atualização

---

**Sistema de atualização ativo e funcionando! 🎉**
