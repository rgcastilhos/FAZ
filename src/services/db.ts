import Dexie, { Table } from 'dexie';

export interface Pesagem {
  id?: number;
  data: Date;
  animal: string;       // Classe detectada pelo YOLO (ex: Cattle)
  peso: number;         // Resultado do seu modelo de regressão
  fotoOriginal: string; // Base64 da foto completa
  fotoRecortada: string; // Base64 apenas do boi (gerada pelo YOLO)
  confianca: number;    // Nível de certeza da IA
  username?: string;
  metricasFisicas?: {
    alturaPixel: number;
    larguraPixel: number;
    areaOcupada: number;
    proporcaoCorpo: number;
  };
}

export interface TrainingData {
  id?: number;
  imageData: string;
  estimatedWeight: number;
  realWeight: number;
  animalType: string;
  createdAt: number;
  username?: string;
}

export interface GalleryItem {
  id?: number;
  data: string;
  createdAt: number;
  username?: string;
}

export interface Piquete {
  id?: number;
  nome: string;
  especieCapim: string;
  areaHa: number;
  dataSaidaGado?: Date;
  dataIdealRetorno?: Date;
  status: 'descanso' | 'pronto' | 'ocupado';
  username?: string;
}

export interface RegistroManejo {
  id?: number;
  piqueteId: number;
  data: Date;
  alturaCm: number;
  tipo: 'entrada' | 'saida' | 'medicao';
  username?: string;
}

export class MeuBanco extends Dexie {
  pesagens!: Table<Pesagem>;
  training_data!: Table<TrainingData>;
  images!: Table<GalleryItem>;
  piquetes!: Table<Piquete>;
  manejo_pasto!: Table<RegistroManejo>;

  constructor() {
    super('SistemaPecuario');
    this.version(2).stores({
      pesagens: '++id, data, animal, username',
      training_data: '++id, createdAt, username',
      images: '++id, createdAt, username',
      piquetes: '++id, nome, username',
      manejo_pasto: '++id, piqueteId, data, username'
    });
  }
}

export const db = new MeuBanco();

// Funções auxiliares para App.tsx (mantendo compatibilidade onde possível)

export const addHistory = async (data: any, username?: string) => {
  const pesagem: Pesagem = {
    data: new Date(),
    animal: data.animal || data.animalType || data.breed || 'Animal',
    peso: data.peso || data.weight || 0,
    fotoOriginal: data.fotoOriginal || data.imageData || '',
    fotoRecortada: data.fotoRecortada || data.imageData || '',
    confianca: data.confianca || data.yoloDetection?.score || 1.0,
    username,
    metricasFisicas: data.metricasFisicas
  };
  return db.pesagens.add(pesagem);
};

export const getHistory = async (username?: string) => {
  if (username) {
    return db.pesagens.where('username').equals(username).toArray();
  }
  return db.pesagens.toArray();
};

export const deleteHistory = async (id: number) => {
  return db.pesagens.delete(id);
};

export const addTrainingData = async (data: any, username?: string) => {
  return db.training_data.add({
    ...data,
    createdAt: Date.now(),
    username
  });
};

export const getTrainingData = async (username?: string) => {
  if (username) {
    return db.training_data.where('username').equals(username).toArray();
  }
  return db.training_data.toArray();
};

export const deleteTrainingData = async (id: number) => {
  return db.training_data.delete(id);
};

export const addImageToDB = async (imageData: string, username?: string) => {
  return db.images.add({
    data: imageData,
    createdAt: Date.now(),
    username
  });
};

export const getImagesFromDB = async (username?: string) => {
  if (username) {
    return db.images.where('username').equals(username).toArray();
  }
  return db.images.toArray();
};

export const deleteImageFromDB = async (id: number) => {
  return db.images.delete(id);
};
