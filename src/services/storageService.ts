import type { ImageChange } from '@/@types/competition';
import type { BucketName } from '@/constants/storage';
import { resizeImage } from '@/utils/image';
import { supabase } from './supabaseService';

export const storageService = {
  async uploadImage(bucket: BucketName, path: string, file: File): Promise<string> {
    const blob = await resizeImage(file);
    const { error } = await supabase.storage
      .from(bucket)
      .upload(path, blob, { upsert: true, contentType: 'image/webp', cacheControl: '3600' });
    if (error) throw error;
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    // Mesmo caminho a cada troca: o parâmetro de versão evita a imagem antiga em cache.
    return `${data.publicUrl}?v=${Date.now()}`;
  },

  async remove(bucket: BucketName, path: string): Promise<void> {
    const { error } = await supabase.storage.from(bucket).remove([path]);
    if (error) throw error;
  },

  // Aplica a mudança de imagem e devolve a nova URL (undefined = manter a atual).
  async applyImageChange(
    change: ImageChange,
    bucket: BucketName,
    path: string,
  ): Promise<string | null | undefined> {
    if (change.kind === 'replace') return this.uploadImage(bucket, path, change.file);
    if (change.kind === 'remove') {
      await this.remove(bucket, path);
      return null;
    }
    return undefined;
  },
};
