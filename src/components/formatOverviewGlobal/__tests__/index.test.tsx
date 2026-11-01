import { screen } from '@testing-library/react';
import type { IFase } from '@/@types/phase';
import { renderWithTheme } from '@/utils/testUtils';
import { FormatOverviewGlobal } from '..';

const fase = (patch: Partial<IFase>) => ({ grupos: [], series: [], ...patch }) as IFase;

const fases = [
  fase({
    id: 'f1',
    ordem: 1,
    nome: 'Fase de grupos',
    tipo: 'grupos',
    status: 'em_andamento',
    grupos: [
      { id: 'g1', nome: 'A', grupo_times: [{ time_id: 't1', time: { nome: 'Falcões' } }, { time_id: 't2', time: { nome: 'Leões' } }] },
      { id: 'g2', nome: 'B', grupo_times: [{ time_id: 't3', time: { nome: 'Tubarões' } }] },
    ],
  }),
  fase({ id: 'f2', ordem: 2, nome: 'Final', tipo: 'mata_mata', status: 'aguardando' }),
];

describe('FormatOverviewGlobal', () => {
  it('lists the phases with their status', () => {
    renderWithTheme(<FormatOverviewGlobal fases={fases} resumo={[]} />);
    expect(screen.getByText(/1\. Fase de grupos/)).toBeInTheDocument();
    expect(screen.getByText('Em andamento')).toBeInTheDocument();
    expect(screen.getByText(/2\. Final/)).toBeInTheDocument();
    expect(screen.getByText('Aguardando')).toBeInTheDocument();
  });

  it('shows the format flow', () => {
    renderWithTheme(
      <FormatOverviewGlobal
        fases={fases}
        resumo={[
          { kind: 'fase', label: 'Fase de grupos: 3 times, 2 grupos' },
          { kind: 'transicao', label: '2 avançam (1 por grupo)' },
          { kind: 'fase', label: 'Final jogo único' },
        ]}
      />,
    );
    expect(screen.getByText('2 avançam (1 por grupo)')).toBeInTheDocument();
    expect(screen.getByText('Final jogo único')).toBeInTheDocument();
  });

  it('shows the teams of each drawn group', () => {
    renderWithTheme(<FormatOverviewGlobal fases={fases} resumo={[]} />);
    expect(screen.getByText('Grupos — Fase de grupos')).toBeInTheDocument();
    expect(screen.getByText('Falcões, Leões')).toBeInTheDocument();
    expect(screen.getByText('Tubarões')).toBeInTheDocument();
  });

  it('hides the groups block when no group was drawn', () => {
    renderWithTheme(<FormatOverviewGlobal fases={[fase({ ...fases[0], grupos: [] })]} resumo={[]} />);
    expect(screen.queryByText(/Grupos —/)).not.toBeInTheDocument();
  });
});
