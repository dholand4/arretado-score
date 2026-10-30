import { fireEvent, screen } from '@testing-library/react';
import { renderWithTheme } from '@/utils/testUtils';
import { InactiveLeagueNoticeGlobal } from '..';

describe('InactiveLeagueNoticeGlobal', () => {
  it('explains the state and reactivates', () => {
    const onReactivate = vi.fn();
    renderWithTheme(<InactiveLeagueNoticeGlobal onReactivate={onReactivate} />);
    expect(screen.getByText('Liga desativada')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Reativar liga' }));
    expect(onReactivate).toHaveBeenCalledTimes(1);
  });
});
