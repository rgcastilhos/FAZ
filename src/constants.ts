// Constants and configuration

export const ADMIN_CODE = import.meta.env.VITE_ADMIN_CODE || "ADMIN123";

export const DEFAULT_CATEGORIES = [
  { id: 'cat-1', name: 'Gado de Corte', icon: 'cow' },
  { id: 'cat-2', name: 'Maquinário', icon: 'tractor' },
  { id: 'cat-3', name: 'Insumos', icon: 'wheat' },
];

export const DEFAULT_CARD_OPTIONS = {
  showPhoto: true,
  showRef: true,
  showQuantity: true,
  showDate: false,
  showCheckbox: true,
};

export const THEMES = {
  rural: { 
    primary: 'bg-[#5a5a40]', 
    hover: 'hover:bg-[#4a4a35]', 
    dark: 'bg-[#3a3a2a]', 
    text: 'text-[#d2b48c]', 
    light: 'bg-[#5a5a40]/10', 
    border: 'border-[#5a5a40]/50', 
    shadow: 'shadow-[#5a5a40]/20', 
    accent: 'text-[#f5deb3]' 
  },
  emerald: { 
    primary: 'bg-emerald-600', 
    hover: 'hover:bg-emerald-700', 
    dark: 'bg-emerald-900', 
    text: 'text-emerald-400', 
    light: 'bg-emerald-500/10', 
    border: 'border-emerald-500/50', 
    shadow: 'shadow-emerald-500/20' 
  },
  blue: { 
    primary: 'bg-blue-600', 
    hover: 'hover:bg-blue-700', 
    dark: 'bg-blue-900', 
    text: 'text-blue-400', 
    light: 'bg-blue-500/10', 
    border: 'border-blue-500/50', 
    shadow: 'shadow-blue-500/20' 
  },
} as const;

export const API_BASE_URL = typeof window !== 'undefined' ? window.location.origin : '';

export const STORAGE_KEYS = {
  USER: 'faz_current_user',
  SETTINGS: 'faz_settings',
  INVENTORY: 'faz_inventory',
  TRAINING_DATA: 'faz_training_data',
  WEATHER: 'faz_weather',
  SYNC_CODE: 'faz_sync_code',
} as const;

export const HTTP_TIMEOUT = 10000; // 10 seconds
export const MAX_IMAGE_SIZE = 8 * 1024 * 1024; // 8 MB
export const GEOLOCATION_TIMEOUT = 10000;
export const GEOLOCATION_ACCURACY = 'enableHighAccuracy';
