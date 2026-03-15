
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
    // Desativado por enquanto
    return false;
  }

  /**
   * Executa a inferência de peso em uma imagem base64.
   */
  static async estimateWeight(base64Image: string): Promise<TFLiteResult | null> {
    // Desativado por enquanto
    return null;
  }

  static isAvailable(): boolean {
    // TF Flow desativado por solicitação do usuário
    return false;
  }
}
