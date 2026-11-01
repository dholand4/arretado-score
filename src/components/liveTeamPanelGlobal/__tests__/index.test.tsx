import { fireEvent, screen } from '@testing-library/react';
import { renderWithTheme } from '@/utils/testUtils';
import { LiveTeamPanelGlobal, type ILiveTeamPanelProps } from '..';

const props = (patch: Partial<ILiveTeamPanelProps> = {}): ILiveTeamPanelProps => ({
  nome: 'Okami BC',
  jogadores: [
    { id: 'p1', rotulo: '#7 Bebeto', pontos: 10, faltas: 2, excluido: false },
    { id: 'p2', rotulo: '#9 Mateus', pontos: 4, faltas: 5, excluido: true },
  ],
  faltasExclusao: 5,
  temposRestantes: 1,
  onPonto: vi.fn(),
  onFalta: vi.fn(),
  onOutraFalta: vi.fn(),
  onTempo: vi.fn(),
  ...patch,
});

describe('LiveTeamPanelGlobal', () => {
  it('registers points, fouls and timeouts', () => {
    const p = props();
    renderWithTheme(<LiveTeamPanelGlobal {...p} />);
    fireEvent.click(screen.getByRole('button', { name: '3 pontos para #7 Bebeto' }));
    fireEvent.click(screen.getByRole('button', { name: 'Falta de #7 Bebeto' }));
    fireEvent.click(screen.getByRole('button', { name: 'Outras faltas de #7 Bebeto' }));
    fireEvent.click(screen.getByRole('button', { name: 'Tempo (1)' }));
    expect(p.onPonto).toHaveBeenCalledWith('p1', 3);
    expect(p.onFalta).toHaveBeenCalledWith('p1');
    expect(p.onOutraFalta).toHaveBeenCalledWith('p1');
    expect(p.onTempo).toHaveBeenCalled();
  });

  it('blocks an excluded player and timeouts when none are left', () => {
    renderWithTheme(<LiveTeamPanelGlobal {...props({ temposRestantes: 0 })} />);
    expect(screen.getByText('Excluído')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '1 ponto para #9 Mateus' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Tempo (0)' })).toBeDisabled();
    expect(screen.getByLabelText('2 faltas')).toBeInTheDocument();
  });
});
