import { fireEvent, screen } from '@testing-library/react';
import { renderScreen } from '@/utils/testUtils';
import { GamesScreen } from '..';
vi.mock('@/hooks/useRouteParams', () => ({ useRouteParams: () => ({ competitionId: 'c1' }) }));
vi.mock('@/services/gamesService', () => ({ gamesService: { context: async () => ({ phases: [{id:'f1',nome:'Fase 1'}], teams: [{id:'a',nome:'Águias'},{id:'b',nome:'Búfalos'}], games: [{id:'j1',fase_id:'f1',time_casa_id:'a',time_fora_id:'b',placar_casa:null,placar_fora:null,status:'pendente'}] }) } }));
it('filtra jogos e oferece acesso à súmula', async () => {
  renderScreen(<GamesScreen />);
  expect(await screen.findByRole('link', {name: /Águias/})).toHaveAttribute('href','/painel/competicoes/c1/jogos/j1/sumula');
  fireEvent.change(screen.getByLabelText('Status'), {target:{value:'encerrado'}});
  expect(screen.getByText('Nenhum jogo encontrado')).toBeInTheDocument();
});
