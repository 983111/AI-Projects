export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  image: string;
  description: string;
  seller: string;
}

export interface OutfitSuggestion {
  name: string;
  reason: string;
  estimatedPrice: string;
  color: string;
}

export interface TrendReport {
  trendName: string;
  description: string;
  popularityScore: number; // 0-100
  keyKeywords: string[];
}

export enum AppView {
  HOME = 'HOME',
  MARKETPLACE = 'MARKETPLACE',
  OUTFIT_COMPOSER = 'OUTFIT_COMPOSER',
  TREND_DETECTOR = 'TREND_DETECTOR',
  VIRTUAL_TRY_ON = 'VIRTUAL_TRY_ON',
  IMAGE_ENHANCER = 'IMAGE_ENHANCER',
}

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';