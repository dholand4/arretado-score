import { fireEvent, screen } from '@testing-library/react';
import { renderWithTheme } from '@/utils/testUtils';
import { LiveScoreboardGlobal, type ILiveScoreboardProps } from '..';

const time = { placar: 0, faltas: 0, emBonus: false, temposUsados: 0, temposLimite: 2 };
const props = (patch: Partial<ILiveScoreboardProps> = {}): ILiveScoreboardProps => ({
  casa: { ...time, nome: 'Okami BC', placar: 12, faltas: 4, emBonus: true },
  fora: { ...time, nome: 'QuixaRocks', placar: 9, temposUsados: 1 },
  periodo: '2º período',
  jogoMs: 425_000,
  posseMs: 24_000,
  posseSegundos: 24,
  posseCurta: 14,
  rodando: false,
  onToggle: vi.fn(),
  onAjustarJogo: vi.fn(),
  onPosse: vi.fn(),
  onAjustarPosse: vi.fn(),
  ...patch,
});

describe('LiveScoreboardGlobal', () => {
  it('shows score, fouls, bonus, timeouts and clocks', () => {
    renderWithTheme(<LiveScoreboardGlobal {...props()} />);
    expect(screen.getByLabelText('Pontos de Okami BC')).toHaveTextContent('12');
    expect(screen.getByText('BÔNUS')).toBeInTheDocument();
    expect(screen.getByText('Tempos 1/2')).toBeInTheDocument();
    expect(screen.getByLabelText('Cronômetro do jogo')).toHaveTextContent('07:05');
    expect(screen.getByLabelText('Relógio de posse')).toHaveTextContent('24');
  });

  it('starts, resets the shot clock and adjusts the stopped clock', () => {
    const p = props();
    renderWithTheme(<LiveScoreboardGlobal {...p} />);
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar' }));
    fireEvent.click(screen.getByRole('button', { name: '14' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cronômetro mais 1 segundo' }));
    expect(p.onToggle).toHaveBeenCalled();
    expect(p.onPosse).toHaveBeenCalledWith(14);
    expect(p.onAjustarJogo).toHaveBeenCalledWith(1000);
  });

  it('hides adjustments while running and the shot clock when unused', () => {
    renderWithTheme(<LiveScoreboardGlobal {...props({ rodando: true, posseMs: null })} />);
    expect(screen.getByRole('button', { name: 'Pausar' })).toBeInTheDocument();
    expect(screen.queryByLabelText('Cronômetro mais 1 segundo')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Relógio de posse')).not.toBeInTheDocument();
  });
});
