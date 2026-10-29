import { fireEvent, screen, waitFor } from '@testing-library/react';
import { renderScreen } from '@/utils/testUtils';
import { StandingsAdjustGlobal } from '..';
const adjust = vi.fn().mockResolvedValue(undefined);
vi.mock('@/services/gamesService', () => ({ gamesService: { classification: async () => [{time_id:'a',nome:'Águias',empate_tecnico:true}], adjust: (...args: unknown[]) => adjust(...args) } }));
it('registra prioridade para empate técnico', async () => {
  renderScreen(<StandingsAdjustGlobal phase="f" group={null} />);
  fireEvent.change(await screen.findByLabelText('Prioridade de Águias'), {target:{value:'1'}});
  fireEvent.click(screen.getByRole('button',{name:'Salvar ajuste'}));
  await waitFor(() => expect(adjust).toHaveBeenCalledWith('f',null,'a',1));
});
