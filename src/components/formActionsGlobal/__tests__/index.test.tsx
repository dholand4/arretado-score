import { screen } from '@testing-library/react';
import { renderWithTheme } from '@/utils/testUtils';
import { FormActionsGlobal } from '..';

describe('FormActionsGlobal', () => {
  it('renders note and actions', () => {
    renderWithTheme(
      <FormActionsGlobal note="Salvo na hora">
        <button>Continuar</button>
      </FormActionsGlobal>,
    );
    expect(screen.getByText('Salvo na hora')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continuar' })).toBeInTheDocument();
  });
});
