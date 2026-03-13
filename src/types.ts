// Shared types for the entire application

export interface User {
  username: string;
  password?: string;
  name: string;
  role: 'admin' | 'user';
  createdAt?: number;
  expiresAt?: number;
  viewingUser?: string;
}

export interface GalleryItem {
  id: number;
  data: string;
  createdAt: number;
}

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  photo?: string;
  categoryId: string;
  createdAt: number;
  isSelectedForSum: boolean;
  tickProtocolDays?: number;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
}

export interface CardOptions {
  showPhoto: boolean;
  showRef: boolean;
  showQuantity: boolean;
  showDate: boolean;
  showCheckbox: boolean;
}

export interface AppSettings {
  theme: string;
  farmName: string;
  backgroundImage?: string;
  userEmail?: string;
  cardOptions?: CardOptions;
  dashboardBgColor?: string;
  loginBgImage?: string;
  lastLocation?: { latitude: number; longitude: number };
  rainMm?: string;
  heatC?: string;
  coldC?: string;
  notes?: string;
}

export interface MapGroundingLink {
  uri: string;
  title?: string;
  snippet?: string;
}

export interface WeatherData {
  fetchedAt: number;
  tz: string;
  locationName: string;
  current: {
    time?: string;
    temperatureC?: number;
    apparentTemperatureC?: number;
    humidityPct?: number;
    precipitationMm?: number;
    windSpeedKmh?: number;
    windDirectionDeg?: number;
    weatherCode?: number;
  };
}

export interface TrainingData {
  id?: string;
  imagePath?: string;
  realWeight: number;
  estimatedWeight: number;
  timestamp?: number;
}

export interface DrPastoAnalysis {
  assessment: string;
  recommendations: string[];
  riskLevel: 'baixo' | 'médio' | 'alto';
}
