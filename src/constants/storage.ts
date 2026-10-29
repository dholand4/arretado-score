export const BUCKETS = {
  logos: 'logos',
  fotosJogadores: 'fotos-jogadores',
  comprovantes: 'comprovantes',
} as const;

export type BucketName = (typeof BUCKETS)[keyof typeof BUCKETS];

export const IMAGE_MAX_SIDE = 800;
export const IMAGE_QUALITY = 0.8;
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
export const ACCEPTED_IMAGE_TYPES = 'image/jpeg,image/png,image/webp';

// Caminho dos arquivos: {competicao_id}/{entidade}/{id}.{ext} (seção 10.3).
export const storagePaths = {
  competitionLogo: (competicaoId: string) => `${competicaoId}/competicao/${competicaoId}.webp`,
  teamLogo: (competicaoId: string, timeId: string) => `${competicaoId}/times/${timeId}.webp`,
  playerPhoto: (competicaoId: string, jogadorId: string) => `${competicaoId}/jogadores/${jogadorId}.webp`,
};
