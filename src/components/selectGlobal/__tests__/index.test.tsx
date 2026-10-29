import { fireEvent, screen } from '@testing-library/react';
import { renderWithTheme } from '@/utils/testUtils';
import { SelectGlobal } from '..';

const options = [
  { value: 'a', label: 'Opção A' },
  { value: 'b', label: 'Opção B' },
];

describe('SelectGlobal', () => {
  it('renders options', () => {
    renderWithTheme(<SelectGlobal label="Papel" options={options} />);
    expect(screen.getByRole('option', { name: 'Opção B' })).toBeInTheDocument();
  });

  it('fires onChange with the selected value', () => {
    const fn = vi.fn();
    renderWithTheme(<SelectGlobal label="Papel" options={options} onChange={(e) => fn(e.target.value)} />);
    fireEvent.change(screen.getByLabelText('Papel'), { target: { value: 'b' } });
    expect(fn).toHaveBeenCalledWith('b');
  });
});
