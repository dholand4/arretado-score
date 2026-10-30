import { fireEvent, screen } from '@testing-library/react';
import { renderWithTheme } from '@/utils/testUtils';
import { SegmentedGlobal } from '..';

const options = [
  { value: 'a', label: 'Súmula completa' },
  { value: 'b', label: 'Só placar' },
];

describe('SegmentedGlobal', () => {
  it('marks the selected option and changes it', () => {
    const fn = vi.fn();
    renderWithTheme(<SegmentedGlobal ariaLabel="Tipo" options={options} value="a" onChange={fn} />);
    expect(screen.getByRole('radio', { name: 'Súmula completa' })).toHaveAttribute('aria-checked', 'true');
    fireEvent.click(screen.getByRole('radio', { name: 'Só placar' }));
    expect(fn).toHaveBeenCalledWith('b');
  });

  it('can be disabled', () => {
    renderWithTheme(<SegmentedGlobal ariaLabel="Tipo" options={options} value="a" onChange={() => {}} disabled />);
    expect(screen.getByRole('radio', { name: 'Só placar' })).toBeDisabled();
  });
});
