import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import type { IEvento, IMontagemEvento } from '@/@types/event';
import { useCompetition } from '@/hooks/useCompetitions';
import { useEventCandidates, useEvents } from '@/hooks/useEvents';
import { renderScreen } from '@/utils/testUtils';
import { EventsScreen } from '..';

vi.mock('@/hooks/useCompetitions');
vi.mock('@/hooks/useEvents');

const mutation = () => ({ mutate: vi.fn(), reset: vi.fn(), isPending: false, error: null });

const montagem = (patch: Partial<IMontagemEvento>): IMontagemEvento => ({
  precisa_confirmar: false,
  max_sem_repeticao: 2,
  candidatos: 8,
  pedido: 3,
  jogo_duplo: false,
  jogos: [],
  evento_id: 'e9',
  ...patch,
});

const event: IEvento = {
  id: 'e1',
  competicao_id: 'c1',
  data: '2026-11-07',
  local: 'Ginásio',
  hora_inicio: '19:00:00',
  qtd_jogos: 2,
  intervalo_min: 90,
  status: 'rascunho',
  observacoes: null,
  created_at: '',
  jogos: [
    {
      id: 'j1',
      time_casa_id: 'a',
      time_fora_id: 'b',
      casa: { nome: 'Tubarões', sigla: 'TUB' },
      fora: { nome: 'Falcões', sigla: 'FAL' },
      fase: { nome: 'Fase 1' },
      grupo: null,
      serie: null,
      rodada: 1,
      numero_na_serie: null,
      status: 'agendado',
      inicio_previsto: '2026-11-07T22:00:00Z',
    },
  ],
} as unknown as IEvento;

function setup(status = 'em_andamento', events: IEvento[] = [event]) {
  vi.mocked(useCompetition).mockReturnValue({
    competition: { id: 'c1', nome: 'Liga', status, local_padrao: 'Ginásio Municipal', intervalo_jogos_min: 90 },
    isLoading: false,
    error: null,
  } as unknown as ReturnType<typeof useCompetition>);
  const hooks = {
    events,
    isLoading: false,
    error: null,
    createEvent: mutation(),
    redrawEvent: mutation(),
    reorderEvent: mutation(),
    swapGame: mutation(),
    removeGame: mutation(),
    publishEvent: mutation(),
    deleteEvent: mutation(),
  };
  vi.mocked(useEvents).mockReturnValue(hooks as unknown as ReturnType<typeof useEvents>);
  vi.mocked(useEventCandidates).mockReturnValue({ candidates: [], isLoading: false, error: null });
  renderScreen(
    <Routes>
      <Route path="/painel/competicoes/:competitionId/eventos" element={<EventsScreen />} />
    </Routes>,
    '/painel/competicoes/c1/eventos',
  );
  return hooks;
}

describe('EventsScreen', () => {
  it('asks to start the competition first', () => {
    setup('rascunho', []);
    expect(screen.getByRole('heading', { level: 1, name: 'Dias de jogos' })).toBeInTheDocument();
    expect(screen.getByText('Competição ainda não iniciada')).toBeInTheDocument();
  });

  it('creates a day and asks before allowing a double game', async () => {
    const hooks = setup('em_andamento', []);
    hooks.createEvent.mutate.mockImplementation((_vars, options) =>
      options.onSuccess(montagem({ precisa_confirmar: true, evento_id: null })),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Novo dia de jogos' }));
    expect(screen.getByLabelText('Local')).toHaveValue('Ginásio Municipal');
    fireEvent.change(screen.getByLabelText('Quantidade de jogos'), { target: { value: '3' } });
    fireEvent.click(screen.getByRole('button', { name: 'Montar dia' }));
    expect(hooks.createEvent.mutate).toHaveBeenCalledWith(
      { input: expect.objectContaining({ qtd_jogos: 3, local: 'Ginásio Municipal' }), permitirDuplo: false },
      expect.any(Object),
    );
    const dialog = await screen.findByRole('dialog', { name: 'Jogo duplo' });
    expect(within(dialog).getByText('Só é possível montar 2 jogos sem repetir time. Deseja permitir jogo duplo?')).toBeInTheDocument();

    hooks.createEvent.mutate.mockImplementation((_vars, options) =>
      options.onSuccess(montagem({ jogos: ['1', '2', '3'], jogo_duplo: true })),
    );
    fireEvent.click(within(dialog).getByRole('button', { name: 'Permitir jogo duplo' }));
    expect(hooks.createEvent.mutate).toHaveBeenLastCalledWith(
      { input: expect.objectContaining({ qtd_jogos: 3 }), permitirDuplo: true },
      expect.any(Object),
    );
    await waitFor(() => expect(screen.getByText(/montado com jogo duplo/)).toBeInTheDocument());
  });

  it('limits the day to the games that fit without repeating teams', async () => {
    const hooks = setup('em_andamento', []);
    hooks.createEvent.mutate.mockImplementationOnce((_vars, options) =>
      options.onSuccess(montagem({ precisa_confirmar: true, evento_id: null })),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Novo dia de jogos' }));
    fireEvent.change(screen.getByLabelText('Quantidade de jogos'), { target: { value: '3' } });
    fireEvent.click(screen.getByRole('button', { name: 'Montar dia' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Montar só 2 jogos' }));
    expect(hooks.createEvent.mutate).toHaveBeenLastCalledWith(
      { input: expect.objectContaining({ qtd_jogos: 2 }), permitirDuplo: false },
      expect.any(Object),
    );
  });

  it('publishes, deletes and edits a draft day', async () => {
    const hooks = setup();
    expect(screen.getByText('Tubarões x Falcões')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Publicar' }));
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Publicar' }));
    expect(hooks.publishEvent.mutate).toHaveBeenCalledWith('e1', expect.any(Object));

    fireEvent.click(screen.getByRole('button', { name: 'Remover Tubarões x Falcões' }));
    expect(hooks.removeGame.mutate).toHaveBeenCalledWith('j1', expect.any(Object));

    fireEvent.click(screen.getByRole('button', { name: 'Sortear de novo' }));
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Sortear de novo' }));
    expect(hooks.redrawEvent.mutate).toHaveBeenCalledWith(
      { eventoId: 'e1', permitirDuplo: false, qtdJogos: undefined },
      expect.any(Object),
    );
  });

  it('opens the swap modal with the candidates', () => {
    setup();
    fireEvent.click(screen.getByRole('button', { name: 'Trocar jogo' }));
    expect(screen.getByRole('dialog', { name: 'Trocar jogo' })).toBeInTheDocument();
    expect(screen.getByText(/Não há outros jogos disponíveis/)).toBeInTheDocument();
    expect(useEventCandidates).toHaveBeenLastCalledWith('c1', true);
  });
});
