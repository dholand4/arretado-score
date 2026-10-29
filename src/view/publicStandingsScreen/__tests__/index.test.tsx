import { screen } from '@testing-library/react';
import { renderScreen } from '@/utils/testUtils';
import { PublicStandingsScreen } from '..';
vi.mock('@/hooks/useRouteParams', () => ({ useRouteParams: () => ({ slug:'liga' }) }));
vi.mock('@/services/gamesService', () => ({ gamesService: { standings: async () => ({competition:{nome:'Liga',permite_empate:false},phases:[{id:'f1',nome:'Fase 1',tipo:'todos_contra_todos',classificam:1}],groups:[]}), classification: async () => [{posicao:1,time_id:'t1',nome:'Águias',j:1,v:1,e:0,d:0,wo:0,pts:1,pf:10,pc:5,saldo:5,aproveitamento:1,empate_tecnico:true}] } }));
it('mostra classificação e empate técnico para visitante', async () => {
  renderScreen(<PublicStandingsScreen />);
  expect(await screen.findByText('Águias *')).toBeInTheDocument();
  expect(screen.getByText('* Empate técnico')).toBeInTheDocument();
  expect(screen.queryByRole('columnheader',{name:'E'})).not.toBeInTheDocument();
});
