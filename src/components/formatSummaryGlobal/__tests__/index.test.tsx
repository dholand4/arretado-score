import { screen } from '@testing-library/react';
import { renderWithTheme } from '@/utils/testUtils';
import { FormatSummaryGlobal } from '..';

describe('FormatSummaryGlobal', () => {
  it('renders phases and transitions in order', () => {
    renderWithTheme(
      <FormatSummaryGlobal
        steps={[
          { kind: 'fase', label: 'Fase 1: 5 times, todos contra todos, 10 jogos' },
          { kind: 'transicao', label: '4 avançam' },
          { kind: 'fase', label: 'Final melhor de 3' },
        ]}
      />,
    );
    const flow = screen.getByRole('list', { name: /Resumo do formato/ });
    expect(flow).toHaveAccessibleName(
      'Resumo do formato: Fase 1: 5 times, todos contra todos, 10 jogos → 4 avançam → Final melhor de 3',
    );
    expect(screen.getByText('4 avançam')).toBeInTheDocument();
  });

  it('shows the empty text', () => {
    renderWithTheme(<FormatSummaryGlobal steps={[]} emptyText="Sem fases" />);
    expect(screen.getByText('Sem fases')).toBeInTheDocument();
  });
});
