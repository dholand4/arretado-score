import { screen, within } from '@testing-library/react';
import type { ILinhaMataMata } from '@/@types/game';
import { renderWithTheme } from '@/utils/testUtils';
import { KnockoutTableGlobal } from '..';

const row = (overrides: Partial<ILinhaMataMata>): ILinhaMataMata => ({
  posicao: 1,
  time_id: 't1',
  nome: 'Falcões',
  serie: 'S1',
  situacao: 'venceu',
  vitorias: 2,
  derrotas: 0,
  jogos: 2,
  pf: 160,
  pc: 140,
  saldo: 20,
  perdeu_wo: false,
  campanha: 1,
  classificado: true,
  ...overrides,
});

describe('KnockoutTableGlobal', () => {
  it('lists winners and the best loser as qualified', () => {
    renderWithTheme(
      <KnockoutTableGlobal
        provisional={false}
        rows={[
          row({}),
          row({ posicao: 2, time_id: 't2', nome: 'Trovão', situacao: 'repescagem', vitorias: 1, derrotas: 2, saldo: -3 }),
          row({ posicao: 3, time_id: 't3', nome: 'Raio', situacao: 'eliminado', vitorias: 1, derrotas: 2, saldo: 29, perdeu_wo: true, classificado: false }),
        ]}
      />,
    );
    const linhas = screen.getAllByRole('row').slice(1);
    expect(within(linhas[0]).getByText('Venceu a série')).toBeInTheDocument();
    expect(within(linhas[1]).getByText('Melhor perdedor')).toBeInTheDocument();
    expect(within(linhas[2]).getByText('Raio (W.O.)')).toBeInTheDocument();
    expect(within(linhas[2]).getByText('Eliminado')).toBeInTheDocument();
    expect(screen.queryByText(/provisória/)).not.toBeInTheDocument();
  });

  it('warns that the repescagem is provisional while series are running', () => {
    renderWithTheme(<KnockoutTableGlobal provisional rows={[row({ situacao: 'em_disputa', classificado: false })]} />);
    expect(screen.getByText('Em disputa')).toBeInTheDocument();
    expect(screen.getByText('Repescagem provisória: ainda há série em andamento.')).toBeInTheDocument();
  });
});
