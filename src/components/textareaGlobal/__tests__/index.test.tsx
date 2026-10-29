import { fireEvent, screen } from '@testing-library/react';
import { renderWithTheme } from '@/utils/testUtils';
import { TextareaGlobal } from '..';

describe('TextareaGlobal', () => {
  it('renders labelled textarea and fires onChange', () => {
    const fn = vi.fn();
    renderWithTheme(<TextareaGlobal label="Descrição" onChange={fn} />);
    fireEvent.change(screen.getByLabelText('Descrição'), { target: { value: 'Liga' } });
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
