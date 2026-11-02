export interface ILiveBoardTeam {
  nome: string;
  logoUrl: string | null;
  placar: number;
  faltas: number;
  emBonus: boolean;
  temposRestantes: number;
}

export interface ILiveBoardProps {
  casa: ILiveBoardTeam;
  fora: ILiveBoardTeam;
  periodo: string;
  jogoMs: number;
  // Nulo quando a liga não usa o relógio de posse.
  posseMs: number | null;
  rodando: boolean;
  // Faixa de situação ("AO VIVO", "FINAL", "Aguardando aprovação").
  situacao: string;
  // telao: tela inteira para o segundo tablet (de frente para a quadra); compacto: dentro da página do jogo.
  tamanho?: 'telao' | 'compacto';
}
