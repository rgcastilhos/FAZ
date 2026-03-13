import argparse
import sys

try:
    from ultralytics import YOLO
except ImportError:
    print("ERRO: A biblioteca 'ultralytics' nao esta instalada.")
    print("Instale-a usando: pip install ultralytics")
    sys.exit(1)

def export_model(model_path):
    """
    Exporta um modelo YOLOv8/v9/v10/v11 para o formato TFLite com quantizacao INT8.
    """
    print(f"Carregando modelo: {model_path}")
    model = YOLO(model_path)
    
    print("Iniciando exportacao para TFLite com quantizacao INT8...")
    # O comando solicitado pelo usuario:
    model.export(format='tflite', int8=True)
    
    print("\nExportacao concluida!")
    print("O arquivo .tflite estara na mesma pasta do modelo original (ex: runs/detect/train/weights/best_saved_model/best_int8.tflite)")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Exportar modelo YOLO para TFLite INT8")
    parser.add_argument("--model", type=str, default="best.pt", help="Caminho para o arquivo .pt (ex: best.pt)")
    
    args = parser.parse_args()
    export_model(args.model)
