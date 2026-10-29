import { fireEvent, screen } from '@testing-library/react';
import { renderWithTheme } from '@/utils/testUtils';
import { CheckboxGlobal } from '..';

describe('CheckboxGlobal', () => {
  it('toggles through its label', () => {
    const fn = vi.fn();
    renderWithTheme(<CheckboxGlobal label="Permite empate" description="Futsal" onChange={(e) => fn(e.target.checked)} />);
    fireEvent.click(screen.getByText('Permite empate'));
    expect(fn).toHaveBeenCalledWith(true);
    expect(screen.getByRole('checkbox', { name: /Permite empate/ })).toBeInTheDocument();
  });
});
