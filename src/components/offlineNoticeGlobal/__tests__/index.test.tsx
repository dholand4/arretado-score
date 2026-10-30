import { act, screen } from '@testing-library/react';
import { renderWithTheme } from '@/utils/testUtils';
import { OfflineNoticeGlobal } from '..';

function setOnline(value: boolean) {
  Object.defineProperty(navigator, 'onLine', { configurable: true, get: () => value });
  act(() => {
    window.dispatchEvent(new Event(value ? 'online' : 'offline'));
  });
}

describe('OfflineNoticeGlobal', () => {
  afterEach(() => setOnline(true));

  it('stays hidden while online', () => {
    setOnline(true);
    renderWithTheme(<OfflineNoticeGlobal />);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('shows while offline and hides when the connection returns', () => {
    renderWithTheme(<OfflineNoticeGlobal />);
    setOnline(false);
    expect(screen.getByRole('status')).toHaveTextContent('Sem conexão.');
    setOnline(true);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
