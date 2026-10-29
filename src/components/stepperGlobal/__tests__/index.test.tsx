import { fireEvent, screen } from '@testing-library/react';
import { renderWithTheme } from '@/utils/testUtils';
import { StepperGlobal } from '..';

const steps = [
  { key: 'a', label: 'Dados' },
  { key: 'b', label: 'Fases', disabled: true },
  { key: 'c', label: 'Revisão' },
];

describe('StepperGlobal', () => {
  it('marks the current step and selects others', () => {
    const fn = vi.fn();
    renderWithTheme(<StepperGlobal steps={steps} current="a" onSelect={fn} />);
    expect(screen.getByRole('button', { name: /Dados/ })).toHaveAttribute('aria-current', 'step');
    fireEvent.click(screen.getByRole('button', { name: /Revisão/ }));
    expect(fn).toHaveBeenCalledWith('c');
  });

  it('does not select disabled steps', () => {
    const fn = vi.fn();
    renderWithTheme(<StepperGlobal steps={steps} current="a" onSelect={fn} />);
    fireEvent.click(screen.getByRole('button', { name: /Fases/ }));
    expect(fn).not.toHaveBeenCalled();
  });
});
