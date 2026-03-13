# Guia de Implementação TFLite (TensorFlow Lite)

Este projeto agora suporta a integração de modelos TensorFlow Lite para estimativa de peso offline no Android.

## Estrutura Atual
- `src/services/tflite.ts`: Abstração para inferência no dispositivo.
- `src/App.tsx`: Lógica de pesagem com fallback (TFLite Local -> API Cloud).
- `ml/train_export_tflite.py`: Script para treinar e exportar seu próprio modelo.

## Como Gerar o Modelo (`model.tflite`)

1. **Prepare o Dataset**:
   Organize suas fotos de animais em pastas por classe (ex: raças ou faixas de peso) dentro de uma pasta `dataset_raw/`.
   ```bash
   dataset_raw/
     nelore/
       img1.jpg
       img2.jpg
     angus/
       img3.jpg
   ```

2. **Divida o Dataset**:
   Use o script `ml/split_dataset.py` para criar as pastas de treino e validação.
   ```bash
   python ml/split_dataset.py --in dataset_raw --out ml/dataset --val 0.2
   ```

3. **Treine e Exporte**:
   Rode o script de treinamento (requer TensorFlow instalado).
   ```bash
   python ml/train_export_tflite.py --data ml/dataset --out ml/output --epochs 10
   ```

## Como Integrar no App Android

Para que o modelo funcione nativamente, siga estes passos:

1. **Mover o Modelo**:
   Copie o arquivo `model.tflite` gerado para:
   `android/app/src/main/assets/model.tflite`

2. **Configuração do Gradle**:
   Certifique-se de que o `build.gradle` do app não comprima arquivos `.tflite`:
   ```gradle
   android {
       aaptOptions {
           noCompress "tflite"
       }
   }
   ```

3. **Ponte Nativa**:
   Atualmente, o código em `src/services/tflite.ts` está preparado para chamar uma ponte nativa. Você pode implementar essa ponte no `MainActivity.java` usando a biblioteca `tensorflow-lite` do Android.

## Dependências (Python)
Instale as dependências para treinamento:
```bash
pip install tensorflow sklearn numpy
```
