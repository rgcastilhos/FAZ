import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.fazendaon.app',
  appName: 'FazendaOn',
  webDir: 'dist',
  server: {
    // Permite que o app carregue os arquivos .json e .bin da pasta local
    allowNavigation: ['*'],
    cleartext: true, // Necessário se você testar via IP na rede local
    androidScheme: 'https' // Recomendado para evitar bloqueios de segurança modernos
  },
  android: {
    allowMixedContent: true, // Útil para processamento de imagens e modelos
  }
};

export default config;
