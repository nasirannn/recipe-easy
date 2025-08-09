import { ImageModel,ImageSize,ImageStyle } from '@/lib/types';

export interface ImageGenParams {
  prompt: string;
  style?: ImageStyle;
  negativePrompt?: string;
  size?: ImageSize;
  n?: number;
  model?: ImageModel;
  userId?: string;
  isAdmin?: boolean;
  language?: string;
}

export type ImageGenResponse = {
  success: boolean;
  imagePath?: string;
  images?: string[];
  error?: string;
  taskId?: string;
  status?: string;
}; 