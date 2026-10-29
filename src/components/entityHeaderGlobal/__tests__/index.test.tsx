import { screen } from '@testing-library/react';
import { renderWithTheme } from '@/utils/testUtils';
import { EntityHeaderGlobal } from '..';

describe('EntityHeaderGlobal', () => {
  it('renders title, subtitle, badges and actions', () => {
    renderWithTheme(
      <EntityHeaderGlobal title="Tubarões" subtitle="Liga" badges={<span>TUB</span>} actions={<button>Editar</button>} />,
    );
    expect(screen.getByRole('heading', { level: 1, name: 'Tubarões' })).toBeInTheDocument();
    expect(screen.getByText('Liga')).toBeInTheDocument();
    expect(screen.getByText('TUB')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Editar' })).toBeInTheDocument();
  });
});
