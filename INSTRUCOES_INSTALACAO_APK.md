# 📱 Instruções de Instalação do APK - FAZ App

## Arquivo APK Disponível
**Nome:** `FAZ-app-debug.apk`
**Tamanho:** ~7.4 MB
**Versão:** Debug Build

---

## ✅ Requisitos
- Android 6.0 ou superior
- Espaço livre: ~50 MB
- USB Debug Mode habilitado (opcional para instalação por computador)

---

## 🚀 Como Instalar

### **Opção 1: Instalação por Computador (Windows)**

1. **Conecte seu celular ao computador** via USB
2. **Ative o Debug USB** no celular:
   - Vá em Configurações > Sobre o Dispositivo
   - Toque 7 vezes em "Número de compilação"
   - Volte e abra Opções do Desenvolvedor
   - Ative "Depuração por USB"

3. **Instale o Android SDK Platform Tools** (se não tiver):
   - Ou use o arquivo APK diretamente

4. **Execute este comando no PowerShell:**
   ```powershell
   adb install FAZ-app-debug.apk
   ```

5. **Ou copie o arquivo para o celular e instale:**
   - Transfira o `FAZ-app-debug.apk` para seu celular
   - Abra um gerenciador de arquivos
   - Toque no arquivo APK
   - Clique em "Instalar"

---

### **Opção 2: Instalação Direta (Celular)**

1. **Transfira o arquivo APK para seu celular** (via email, Google Drive, Bluetooth, etc.)

2. **Abra o gerenciador de arquivos** no celular

3. **Localize o arquivo `FAZ-app-debug.apk`**

4. **Toque no arquivo** para iniciar a instalação

5. **Clique em "Instalar"** e aguarde a conclusão

6. **Clique em "Abrir"** para iniciar o app

---

## ⚙️ Configurações Necessárias

### Permissões Necessárias
O app precisa das seguintes permissões:
- ✅ **Câmera** - Para estimar peso dos animais e diagnóstico
- ✅ **Galeria** - Para selecionar fotos do celular
- ✅ **Localização** - Para alertas climáticos precisos
- ✅ **Armazenamento** - Para salvar dados localmente

### Primeira Vez
1. Abra o app
2. Permita as permissões solicitadas
3. Acesse a tela de Login
4. Use suas credenciais

---

## 🔍 Funcionalidades Testadas

✅ **Todos os componentes funcionando:**
- Login e Autenticação
- Estimar Peso de Animais (IA)
- Dr. Pasto (Diagnóstico de Pastos)
- Alertas Climáticos
- Gerenciamento de Inventário
- Histórico de Ações
- Sincronização de Dados
- Modo Offline
- Temas Personalizáveis

---

## 📋 Troubleshooting

### "Não é possível instalar"
- Verifique se já existe versão antiga instalada
- Se sim, desinstale primeiro

### "App fecha inesperadamente"
- Force o encerramento do app
- Limpe o cache: Configurações > Apps > FAZ > Armazenamento > Limpar Cache

### "Câmera/Galeria não funcionam"
- Vá em Configurações > Apps > FAZ
- Permita as permissões de Câmera e Galeria

### "Dados não sincronizam"
- Verifique sua conexão de internet
- O app sincroniza automaticamente quando online

---

## 📞 Suporte

Para problemas ou dúvidas:
1. Verifique os logs no app
2. Consult e a documentação em README.md
3. Verifique em: https://github.com/rgcastilhos/FAZ

---

## 📦 Versão da Build

- **Data de Build:** 13/03/2026
- **Tipo:** Debug APK (inclui logs e sem otimização final)
- **Plataforma:** Android
- **Node.js:** 20.x
- **React:** 19.0.0

---

**Bom uso! 🎉**
