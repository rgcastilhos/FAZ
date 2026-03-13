
import { isNativeRuntime } from '../utils/formatters';

export interface TFLiteResult {
  weight_kg: number;
  confidence: number;
  class_name: string;
}

/**
 * Serviço de abstração para inferência TensorFlow Lite no dispositivo.
 * Atualmente atua como uma ponte para futuras implementações nativas (Capacitor/Android).
 */
export class TFLiteService {
  private static modelLoaded = false;

  /**
   * Tenta inicializar o modelo TFLite.
   * No Android nativo, isso carregaria o model.tflite da pasta assets.
   */
  static async loadModel(): Promise<boolean> {
    if (!isNativeRuntime()) {
      console.log("[TFLite] Rodando no navegador, inferência local desativada.");
      return false;
    }

    try {
      // TODO: Integrar com plugin nativo ou via Capacitor.NativeBridge
      // Por enquanto, apenas preparamos a estrutura.
      console.log("[TFLite] Tentando carregar modelo local...");
      this.modelLoaded = true;
      return true;
    } catch (e) {
      console.error("[TFLite] Erro ao carregar modelo:", e);
      return false;
    }
  }

  /**
   * Executa a inferência de peso em uma imagem base64.
   */
  static async estimateWeight(base64Image: string): Promise<TFLiteResult | null> {
    if (!this.modelLoaded) {
      const loaded = await this.loadModel();
      if (!loaded) return null;
    }

    try {
      // No futuro, aqui chamaremos o método nativo:
      // const result = await Capacitor.NativeBridge.runTFLite(base64Image);
      
      console.log("[TFLite] Executando inferência local...");
      
      // Mock de resposta enquanto o modelo nativo não está integrado
      // Retornamos null para forçar o fallback para a API Cloud por enquanto
      return null;
    } catch (e) {
      console.error("[TFLite] Falha na inferência local:", e);
      return null;
    }
  }

  static isAvailable(): boolean {
    return isNativeRuntime();
  }
}
