// Utility functions for formatting and data manipulation

export const toInputDate = (value?: number): string => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().split('T')[0];
};

export const toDisplayDate = (value?: number): string => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('pt-BR');
};

export const formatNumber = (v?: number, digits = 0): string => {
  if (typeof v !== 'number' || !Number.isFinite(v)) return 'n/d';
  return v.toFixed(digits);
};

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export const describeWeatherCode = (code?: number): string => {
  if (!code) return 'Desconhecido';
  if (code === 0) return 'Céu limpo';
  if (code === 1 || code === 2) return 'Parcialmente nublado';
  if (code === 3) return 'Nublado';
  if (code === 45 || code === 48) return 'Nevoeiro';
  if (code === 51 || code === 53 || code === 55) return 'Garoa';
  if (code === 56 || code === 57) return 'Garoa congelante';
  if (code === 61 || code === 63 || code === 65) return 'Chuva';
  if (code === 66 || code === 67) return 'Chuva congelante';
  if (code === 71 || code === 73 || code === 75) return 'Neve';
  if (code === 77) return 'Granizo (neve)';
  if (code === 80 || code === 81 || code === 82) return 'Pancadas de chuva';
  if (code === 85 || code === 86) return 'Pancadas de neve';
  if (code === 95) return 'Trovoadas';
  if (code === 96 || code === 99) return 'Trovoadas com granizo';
  return `Código ${code}`;
};

export const encodeBase64 = (str: string): string => {
  try {
    return btoa(unescape(encodeURIComponent(str)));
  } catch (e) {
    console.error('Erro ao codificar Base64:', e);
    return '';
  }
};

export const decodeBase64 = (str: string): string => {
  try {
    return decodeURIComponent(escape(atob(str)));
  } catch (e) {
    console.error('Erro ao decodificar Base64:', e);
    return '';
  }
};

export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

export const resizeBase64Image = (base64: string, maxWidth = 128, maxHeight = 128, quality = 0.5): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onerror = () => reject(new Error('Falha ao processar a imagem.'));
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      } else {
        resolve(base64); // fallback
      }
    };
    img.src = base64;
  });
};

export const resizeImageFile = (file: File, maxWidth = 1024, maxHeight = 1024, quality = 0.7): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Falha ao ler a imagem.'));
    reader.onload = (event) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Falha ao processar a imagem.'));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        } else {
          resolve(event.target?.result as string); // fallback
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
};

export const cropBase64Image = (base64: string, box: number[], padding = 0.1): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onerror = () => reject(new Error('Falha ao processar a imagem.'));
    img.onload = () => {
      // YOLO box format: [x_center, y_center, width, height] in normalized coordinates (0 to 640)
      // Note: My current parseYOLOOutput returns raw values from the model which is 640x640
      
      const [x_center, y_center, w, h] = box;
      
      // Calculate top-left and bottom-right in 640x640 space
      let x1 = x_center - w / 2;
      let y1 = y_center - h / 2;
      let x2 = x_center + w / 2;
      let y2 = y_center + h / 2;

      // Add padding (as percentage of box size)
      const padW = w * padding;
      const padH = h * padding;
      x1 = Math.max(0, x1 - padW);
      y1 = Math.max(0, y1 - padH);
      x2 = Math.min(640, x2 + padW);
      y2 = Math.min(640, y2 + padH);

      // Convert from 640x640 space to original image space
      const scaleX = img.width / 640;
      const scaleY = img.height / 640;

      const sx = x1 * scaleX;
      const sy = y1 * scaleY;
      const sWidth = (x2 - x1) * scaleX;
      const sHeight = (y2 - y1) * scaleY;

      const canvas = document.createElement('canvas');
      canvas.width = sWidth;
      canvas.height = sHeight;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, sWidth, sHeight);
        // Return a slightly higher quality crop, can be resized later if needed
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      } else {
        resolve(base64);
      }
    };
    img.src = base64;
  });
};

export const isNativeRuntime = (): boolean => {
  try {
    const Cap = (window as any).Capacitor;
    return !!(Cap && Cap.isNativePlatform);
  } catch (e) {
    return false;
  }
};
