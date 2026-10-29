import { screen } from '@testing-library/react';
import { renderWithTheme } from '@/utils/testUtils';
import { BadgeGlobal } from '..';

describe('BadgeGlobal', () => {
  it('renders label', () => {
    renderWithTheme(<BadgeGlobal label="Ativo" tone="success" />);
    expect(screen.getByText('Ativo')).toBeInTheDocument();
  });
});
