import { screen } from '@testing-library/react';
import { renderWithTheme } from '@/utils/testUtils';
import { LiveBoardGlobal } from '..';

const time = (nome: string, patch = {}) => ({
  nome,
  logoUrl: null,
  placar: 0,
  faltas: 0,
  emBonus: false,
  temposRestantes: 2,
  ...patch,
});

describe('LiveBoardGlobal', () => {
  it('shows teams, score, clocks and the live tag', () => {
    renderWithTheme(
      <LiveBoardGlobal
        casa={time('Okami BC', { placar: 19, logoUrl: 'https://x/okami.png' })}
        fora={time('QuixaRocks', { placar: 60, faltas: 5, emBonus: true })}
        periodo="2º período"
        jogoMs={125_000}
        posseMs={14_000}
        rodando
        situacao="AO VIVO"
        tamanho="telao"
      />,
    );
    expect(screen.getByLabelText('Pontos de Okami BC')).toHaveTextContent('19');
    expect(screen.getByLabelText('Pontos de QuixaRocks')).toHaveTextContent('60');
    expect(screen.getByLabelText('Tempo de jogo')).toHaveTextContent('02:05');
    expect(screen.getByLabelText('Relógio de posse')).toHaveTextContent('14');
    expect(screen.getByText('AO VIVO')).toBeInTheDocument();
    expect(screen.getByText('BÔNUS')).toBeInTheDocument();
    // Sem escudo, as iniciais no lugar.
    expect(screen.getByText('Q')).toBeInTheDocument();
  });

  it('hides the shot clock when there is less game time than possession time', () => {
    renderWithTheme(
      <LiveBoardGlobal casa={time('A')} fora={time('B')} periodo="4º período" jogoMs={8_000} posseMs={14_000} rodando={false} situacao="AO VIVO" />,
    );
    expect(screen.queryByLabelText('Relógio de posse')).not.toBeInTheDocument();
  });
});
