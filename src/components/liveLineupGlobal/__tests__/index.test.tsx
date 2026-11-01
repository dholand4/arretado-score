import { fireEvent, screen } from '@testing-library/react';
import { renderWithTheme } from '@/utils/testUtils';
import { LiveLineupGlobal, type ILiveLineupProps } from '..';

const oficiais = { apontador: '', cronometrista: '', operador_24: '', arbitro: '', fiscal: '' };
const props = (patch: Partial<ILiveLineupProps> = {}): ILiveLineupProps => ({
  times: [
    { id: 'a', nome: 'Okami BC', jogadores: [{ id: 'a1', rotulo: '#7 Bebeto' }, { id: 'a2', rotulo: '#9 Mateus' }] },
    { id: 'b', nome: 'QuixaRocks', jogadores: [{ id: 'b1', rotulo: '#4 Daniel' }] },
  ],
  escalados: [],
  oficiais,
  submitLabel: 'Começar o jogo',
  onSubmit: vi.fn(),
  ...patch,
});

describe('LiveLineupGlobal', () => {
  it('requires at least one player per team', () => {
    const p = props();
    renderWithTheme(<LiveLineupGlobal {...p} />);
    fireEvent.click(screen.getByLabelText('#7 Bebeto'));
    fireEvent.click(screen.getByRole('button', { name: 'Começar o jogo' }));
    expect(screen.getByText('Marque ao menos um jogador de QuixaRocks.')).toBeInTheDocument();
    expect(p.onSubmit).not.toHaveBeenCalled();
  });

  it('submits the lineup and the officials', () => {
    const p = props();
    renderWithTheme(<LiveLineupGlobal {...p} />);
    fireEvent.click(screen.getAllByRole('button', { name: 'Marcar todos' })[0]);
    fireEvent.click(screen.getByLabelText('#4 Daniel'));
    fireEvent.change(screen.getByLabelText('Árbitro'), { target: { value: 'Carlos' } });
    fireEvent.click(screen.getByRole('button', { name: 'Começar o jogo' }));
    expect(p.onSubmit).toHaveBeenCalledWith(['a1', 'a2', 'b1'], { ...oficiais, arbitro: 'Carlos' });
  });

  it('keeps players with plays locked', () => {
    renderWithTheme(<LiveLineupGlobal {...props({ escalados: ['a1'], travados: ['a1'] })} />);
    expect(screen.getByLabelText('#7 Bebeto')).toBeDisabled();
  });
});
