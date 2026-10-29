import { screen } from '@testing-library/react';
import { renderWithRouter } from '@/utils/testUtils';
import { SubNavGlobal } from '..';

describe('SubNavGlobal', () => {
  it('marks the active item', () => {
    renderWithRouter(
      <SubNavGlobal
        ariaLabel="Competição"
        items={[
          { to: '/painel/competicoes/1', label: 'Visão geral', end: true },
          { to: '/painel/competicoes/1/times', label: 'Times' },
        ]}
      />,
      '/painel/competicoes/1/times',
    );
    expect(screen.getByRole('link', { name: 'Times' })).toHaveClass('active');
    expect(screen.getByRole('link', { name: 'Visão geral' })).not.toHaveClass('active');
  });
});
