import { fireEvent, screen, within } from '@testing-library/react';
import type { ICategoria, ICompeticao } from '@/@types/competition';
import { renderWithTheme } from '@/utils/testUtils';
import { CompetitionReviewGlobal } from '..';

const competition = {
  id: 'c',
  nome: 'Liga',
  slug: 'liga',
  modalidade: 'basquete',
  local_padrao: 'Ginásio',
  intervalo_jogos_min: 90,
  pontos_vitoria: 2,
  pontos_derrota: 1,
  pontos_derrota_wo: 0,
  permite_empate: false,
  pontos_empate: 0,
  wo_placar_vencedor: 20,
  wo_placar_perdedor: 0,
  criterios_desempate: ['confronto_direto', 'saldo'],
  qtd_periodos: 4,
  duracao_periodo_min: 10,
  duracao_prorrogacao_min: 5,
  faltas_bonus_equipe: 4,
  faltas_exclusao_jogador: 5,
  tempos_primeira_metade: 2,
  tempos_segunda_metade: 3,
  tempos_prorrogacao: 1,
  relogio_posse: true,
  posse_segundos: 24,
  posse_reset_curto: 14,
  falta_para_relogio: false,
} as ICompeticao;

const categories = [
  { id: 'p', nome: 'Pontos', sigla: 'PTS', titulo_ranking: 'Cestinha', ativa: true },
  { id: 'r', nome: 'Rebotes', sigla: 'REB', titulo_ranking: 'Reboteiro', ativa: false },
] as ICategoria[];

describe('CompetitionReviewGlobal', () => {
  it('summarizes the configuration', () => {
    renderWithTheme(
      <CompetitionReviewGlobal competition={competition} categories={categories} teamsCount={1} onEditStep={() => {}} />,
    );
    expect(screen.getByText('/c/liga')).toBeInTheDocument();
    expect(screen.getByText('Confronto direto → Saldo')).toBeInTheDocument();
    expect(screen.getByText('20 x 0')).toBeInTheDocument();
    expect(screen.getByText(/Cestinha/)).toBeInTheDocument();
    expect(screen.getByText('1 categoria inativa.')).toBeInTheDocument();
    expect(screen.getByText(/necessários ao menos 2/)).toBeInTheDocument();
  });

  it('summarizes the match rules and jumps to their step', () => {
    const fn = vi.fn();
    renderWithTheme(
      <CompetitionReviewGlobal competition={competition} categories={categories} teamsCount={5} onEditStep={fn} />,
    );
    const card = screen.getByRole('heading', { name: 'Regras da partida' }).closest('section') as HTMLElement;
    expect(within(card).getByText('4 × 10 min (prorrogação 5 min)')).toBeInTheDocument();
    expect(within(card).getByText('24 s (curta 14 s)')).toBeInTheDocument();
    expect(within(card).getByText('Não')).toBeInTheDocument();
    fireEvent.click(within(card).getByRole('button', { name: 'Editar' }));
    expect(fn).toHaveBeenCalledWith('regras');
  });

  it('jumps to a step', () => {
    const fn = vi.fn();
    renderWithTheme(
      <CompetitionReviewGlobal competition={competition} categories={categories} teamsCount={5} onEditStep={fn} />,
    );
    const card = screen.getByRole('heading', { name: 'Pontuação e W.O.' }).closest('section') as HTMLElement;
    fireEvent.click(within(card).getByRole('button', { name: 'Editar' }));
    expect(fn).toHaveBeenCalledWith('pontuacao');
  });
});
