# Android Signing (Sempre a Mesma Assinatura)

Para o cliente conseguir atualizar "por cima" (sem desinstalar), o app precisa manter:

- O mesmo `applicationId` (package): hoje e sempre `com.fazendaon.app`.
- A mesma chave de assinatura (o mesmo `.jks`) em todas as releases.

Este projeto foi configurado para exigir assinatura em builds `release` via `android/keystore.properties`.

## 1) Criar o keystore (uma vez)

Exemplo (Windows / JDK instalado):

```powershell
keytool -genkeypair -v -keystore release.jks -alias release -keyalg RSA -keysize 2048 -validity 10000
```

Guarde o arquivo `release.jks` e as senhas em local seguro (backup). Se perder, não consegue atualizar os apps já instalados.

## 2) Colocar o keystore no projeto (não versionar)

- Coloque o arquivo em `android/keystore/release.jks` (pasta sugerida).
- Copie `android/keystore.properties.example` para `android/keystore.properties` e preencha:

```properties
storeFile=keystore/release.jks
storePassword=...
keyAlias=release
keyPassword=...
```

## 3) Gerar release assinado

```powershell
cd android
.\gradlew assembleRelease
```

APK de saída:

- `android/app/build/outputs/apk/release/app-release.apk` (assinado, se o keystore estiver configurado)

