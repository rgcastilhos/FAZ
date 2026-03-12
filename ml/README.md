## Modelo TFLite (Doencas em Bovinos)

Este diretorio contem scripts para treinar um classificador de imagens e exportar um modelo `.tflite` para rodar no Android (offline).

### 1) Organize o dataset

Formato esperado:

```
dataset/
  train/
    sadios/
      img1.jpg
    dermatite/
      img2.jpg
  val/
    sadios/
    dermatite/
  test/            (opcional)
    sadios/
    dermatite/
```

As pastas (`sadios`, `dermatite`, etc.) sao as classes (doencas).

Se voce ainda nao tem `val/`, use o script de split:

```powershell
python .\ml\split_dataset.py --in .\dataset_raw --out .\dataset --val 0.15 --test 0.05
```

### 2) Instale dependencias (na sua maquina)

Requer Python 3.10+ (recomendado). Em Windows, instale tambem o Visual C++ Runtime se precisar.

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r .\ml\requirements.txt
```

### 3) Treinar e exportar `.tflite`

```powershell
python .\ml\train_export_tflite.py --data .\dataset --out .\ml_out --img 224 --epochs 15
```

Saidas:
- `ml_out/model.tflite` (modelo)
- `ml_out/labels.txt` (rotulos na ordem do modelo)
- `ml_out/metrics.json` (metricas basicas)

### Observacoes importantes
- Quanto mais consistente o dataset (mesma regiao do corpo, iluminacao, distancia), melhor o modelo.
- Evite "vazamento" de dados: fotos muito parecidas do mesmo animal devem ficar todas no mesmo split (train OU val).
- Para doencas, a rotulagem precisa ser muito boa (ideal: laudo/confirmacao veterinaria). Caso contrario o modelo aprende errado.
