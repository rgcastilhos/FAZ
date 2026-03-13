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
