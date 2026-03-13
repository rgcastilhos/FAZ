import React, { useRef, useEffect, useState } from 'react';

interface YOLOPreviewProps {
  imageSrc: string; // URL Base64 da foto original
  detectionBox: number[] | null; // [ymin, xmin, ymax, xmax] normalizado (0 a 1)
  detectedClass: string | null; // Nome da classe (ex: "Cattle")
  confidence: number | null; // Pontuação de confiança (0 a 1)
}

const YOLOPreview: React.FC<YOLOPreviewProps> = ({ 
  imageSrc, 
  detectionBox, 
  detectedClass, 
  confidence 
}) => {
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Efeito para desenhar a caixa sempre que a imagem ou a detecção mudarem
  useEffect(() => {
    if (!imageLoaded || !detectionBox || !canvasRef.current || !imageRef.current) {
      // Se não houver detecção ou imagem não carregada, limpa o canvas
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (canvas && ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      return;
    }

    const image = imageRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 1. Ajustar o tamanho do Canvas para coincidir com a imagem exibida na tela (responsivo)
    const displayWidth = image.clientWidth;
    const displayHeight = image.clientHeight;
    
    // Evita loop de render se o tamanho não mudou significativamente
    if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
      canvas.width = displayWidth;
      canvas.height = displayHeight;
    }

    // 2. Limpar o canvas antes de desenhar
    ctx.clearRect(0, 0, displayWidth, displayHeight);

    // 3. Configurações de estilo do desenho
    const color = detectedClass === 'Cattle' || detectedClass === 'cattle' ? '#ef4444' : '#f97316'; // Vermelho para Gado, Laranja para outros
    ctx.strokeStyle = color; // Cor da linha (Tailwind red-500)
    ctx.lineWidth = 4; // Espessura da linha
    ctx.fillStyle = color; // Cor do fundo do texto
    ctx.font = 'bold 16px sans-serif'; // Fonte do texto
    ctx.textBaseline = 'top';

    // 4. Converter coordenadas normalizadas (0-1) para pixels da tela
    const [ymin, xmin, ymax, xmax] = detectionBox;
    const sx = xmin * displayWidth;
    const sy = ymin * displayHeight;
    const sWidth = (xmax - xmin) * displayWidth;
    const sHeight = (ymax - ymin) * displayHeight;

    // 5. Desenhar o retângulo (Bounding Box)
    ctx.strokeRect(sx, sy, sWidth, sHeight);

    // 6. Desenhar a etiqueta de texto (Classe + Confiança)
    if (detectedClass) {
        const label = `${detectedClass} ${(confidence! * 100).toFixed(0)}%`;
        const textWidth = ctx.measureText(label).width;
        const textHeight = 18; // aproximado
        
        // Fundo do texto
        ctx.fillRect(sx, sy - textHeight > 0 ? sy - textHeight : sy, textWidth + 10, textHeight);
        
        // Texto
        ctx.fillStyle = 'white';
        ctx.fillText(label, sx + 5, sy - textHeight > 0 ? sy - textHeight : sy);
    }
  }, [imageLoaded, detectionBox, detectedClass, confidence, imageSrc]);

  return (
    <div className="relative w-full max-w-2xl mx-auto overflow-hidden rounded-lg shadow-lg bg-gray-900 border-2 border-gray-700">
      <img
        ref={imageRef}
        src={imageSrc}
        alt="Preview YOLO"
        className="block w-full h-auto"
        onLoad={() => setImageLoaded(true)}
      />
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 pointer-events-none w-full h-full"
      />
      {!detectionBox && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 pointer-events-none">
          <p className="text-white text-sm font-medium px-3 py-1 bg-black bg-opacity-60 rounded-full">
            Aguardando detecção...
          </p>
        </div>
      )}
    </div>
  );
};

export default YOLOPreview;
