import { fireEvent, screen } from '@testing-library/react';
import { renderWithTheme } from '@/utils/testUtils';
import { ShareButtonGlobal } from '..';

describe('ShareButtonGlobal', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('opens the native share sheet when available', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { ...navigator, share });
    renderWithTheme(<ShareButtonGlobal title="Liga X" text="Veja a tabela" url="https://x.com/c/liga-x" />);
    fireEvent.click(screen.getByRole('button', { name: 'Compartilhar' }));
    expect(share).toHaveBeenCalledWith({ title: 'Liga X', text: 'Veja a tabela', url: 'https://x.com/c/liga-x' });
  });

  it('copies the link when there is no share sheet', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { ...navigator, share: undefined, clipboard: { writeText } });
    renderWithTheme(<ShareButtonGlobal title="Liga X" url="https://x.com/c/liga-x" />);
    fireEvent.click(screen.getByRole('button', { name: 'Compartilhar' }));
    expect(await screen.findByRole('button', { name: 'Link copiado!' })).toBeInTheDocument();
    expect(writeText).toHaveBeenCalledWith('https://x.com/c/liga-x');
  });

  it('ignores a cancelled share', async () => {
    const share = vi.fn().mockRejectedValue(new DOMException('cancel', 'AbortError'));
    vi.stubGlobal('navigator', { ...navigator, share });
    renderWithTheme(<ShareButtonGlobal title="Liga X" />);
    fireEvent.click(screen.getByRole('button', { name: 'Compartilhar' }));
    expect(share).toHaveBeenCalledWith(expect.objectContaining({ url: window.location.href }));
    expect(screen.getByRole('button', { name: 'Compartilhar' })).toBeInTheDocument();
  });
});
