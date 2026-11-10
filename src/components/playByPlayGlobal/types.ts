import type { ILivePlayItem } from '@/components/livePlayLogGlobal';

export interface IPlayByPlayProps {
  // Do mais recente para o mais antigo.
  itens: ILivePlayItem[];
  // Aviso acima da lista (ex.: placar corrigido depois do jogo).
  note?: string;
}
