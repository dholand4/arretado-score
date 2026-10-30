import { screen, within } from '@testing-library/react';
import type { IClassificacaoLinha } from '@/@types/game';
import { renderWithTheme } from '@/utils/testUtils';
import { StandingsTableGlobal } from '..';

const row = (overrides: Partial<IClassificacaoLinha>): IClassificacaoLinha => ({
  posicao: 1,
  time_id: 't1',
  nome: 'Falcões',
  j: 2,
  v: 2,
  e: 0,
  d: 0,
  wo: 0,
  pts: 4,
  pf: 150,
  pc: 120,
  saldo: 30,
  aproveitamento: 1,
  empate_tecnico: false,
  ...overrides,
});

describe('StandingsTableGlobal', () => {
  it('highlights qualified teams and hides draws when not allowed', () => {
    renderWithTheme(
      <StandingsTableGlobal
        rows={[row({}), row({ posicao: 2, time_id: 't2', nome: 'Trovão', v: 0, d: 2, pts: 2, aproveitamento: 0 })]}
        showDraws={false}
        qualifiedCount={1}
      />,
    );
    expect(screen.queryByRole('columnheader', { name: 'E' })).not.toBeInTheDocument();
    const rows = screen.getAllByRole('row');
    expect(within(rows[1]).getByText('Falcões')).toBeInTheDocument();
    expect(within(rows[1]).getByText('100%')).toBeInTheDocument();
    expect(screen.getByText(/classificados para a próxima fase/)).toBeInTheDocument();
  });

  it('marks technical ties only after games are played', () => {
    const { rerender } = renderWithTheme(
      <StandingsTableGlobal rows={[row({ j: 0, empate_tecnico: true })]} showDraws qualifiedCount={0} />,
    );
    expect(screen.queryByText(/Empate técnico/)).not.toBeInTheDocument();
    rerender(<StandingsTableGlobal rows={[row({ empate_tecnico: true })]} showDraws qualifiedCount={0} />);
    expect(screen.getByText(/Empate técnico/)).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'E' })).toBeInTheDocument();
  });
});
