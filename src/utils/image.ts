import { IMAGE_MAX_SIDE, IMAGE_QUALITY, MAX_UPLOAD_BYTES } from '@/constants/storage';
import { AppError } from './appError';

export function fitWithin(width: number, height: number, maxSide = IMAGE_MAX_SIDE) {
  const scale = Math.min(1, maxSide / Math.max(width, height));
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

export function validateImageFile(file: File): string | null {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return 'Use uma imagem JPEG, PNG ou WebP.';
  if (file.size > MAX_UPLOAD_BYTES * 4) return 'Imagem grande demais.';
  return null;
}

// Redimensiona no navegador (máx. 800 px no maior lado) e converte para WebP ~0,8 (seção 10.3).
export async function resizeImage(file: File): Promise<Blob> {
  const invalid = validateImageFile(file);
  if (invalid) throw new AppError(invalid);

  const bitmap = await createImageBitmap(file);
  const { width, height } = fitWithin(bitmap.width, bitmap.height);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) throw new AppError('Não foi possível processar a imagem.');
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', IMAGE_QUALITY));
  if (!blob) throw new AppError('Não foi possível processar a imagem.');
  if (blob.size > MAX_UPLOAD_BYTES) throw new AppError('A imagem continua maior que 5 MB depois de reduzida.');
  return blob;
}

// Baixa uma imagem para desenhar em canvas sem "sujá-lo" (o Storage libera CORS); nulo se falhar.
export async function loadImageBitmap(url: string): Promise<ImageBitmap | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    return await createImageBitmap(await response.blob());
  } catch {
    return null;
  }
}
