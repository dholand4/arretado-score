import { fireEvent, screen } from '@testing-library/react';
import { renderWithTheme } from '@/utils/testUtils';
import { ErrorStateGlobal } from '..';

describe('ErrorStateGlobal', () => {
  it('shows a friendly message and retries', () => {
    const fn = vi.fn();
    renderWithTheme(<ErrorStateGlobal error={{ code: '42501' }} onRetry={fn} />);
    expect(screen.getByText('Você não tem permissão para esta ação.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(fn).toHaveBeenCalled();
  });
});
