import { fireEvent, screen, waitFor } from '@testing-library/react';
import { renderScreen } from '@/utils/testUtils';
import { ScoreSheetScreen } from '..';
const save = vi.fn().mockResolvedValue(undefined);
vi.mock('@/hooks/useRouteParams', () => ({ useRouteParams: () => ({ competitionId:'c1', gameId:'j1' }) }));
vi.mock('@/services/gamesService', () => ({ gamesService: { sheet: async () => ({ game:{id:'j1',fase_id:'f1',time_casa_id:'a',time_fora_id:'b',status:'pendente',so_placar:false}, competition:{wo_placar_vencedor:20,wo_placar_perdedor:0}, phases:[{id:'f1',ordem:1}],games:[], teams:[{id:'a',nome:'Águias'},{id:'b',nome:'Búfalos'}],players:[{id:'p1',time_id:'a',nome:'Ana',numero:4},{id:'p2',time_id:'b',nome:'Bia',numero:5}],categories:[{id:'pts',sigla:'PTS',soma_no_placar:true}],presence:[],statistics:[] }), save: (...args: unknown[]) => save(...args) } }));
it('marcar pontos registra presença e atualiza o placar', async () => {
  renderScreen(<ScoreSheetScreen />);
  fireEvent.change(await screen.findByLabelText('PTS — Ana'),{target:{value:'12'}});
  expect(screen.getByLabelText('4 · Ana — jogou')).toBeChecked();
  expect(screen.getByText(/Águias 12 × 0 Búfalos/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button',{name:'Salvar resultado'}));
  await waitFor(() => expect(save).toHaveBeenCalledWith('j1','completa',null,null,null,[{jogador_id:'p1',valores:{pts:12}}]));
});
it('permite escolher W.O.', async () => {
  renderScreen(<ScoreSheetScreen />);
  fireEvent.change(await screen.findByLabelText('Tipo de lançamento'),{target:{value:'wo'}});
  expect(screen.getByLabelText('Quem faltou?')).toBeInTheDocument();
});
