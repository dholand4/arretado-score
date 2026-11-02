import { fireEvent, screen } from '@testing-library/react';
import { renderWithTheme } from '@/utils/testUtils';
import { MesaLinkModalGlobal } from '..';

const props = { open: true, expiraEm: null, onGenerate: vi.fn(), onCancelLink: vi.fn(), onClose: vi.fn() };

describe('MesaLinkModalGlobal', () => {
  it('generates a link when there is none', () => {
    const onGenerate = vi.fn();
    renderWithTheme(<MesaLinkModalGlobal {...props} url={null} onGenerate={onGenerate} />);
    fireEvent.click(screen.getByRole('button', { name: 'Gerar link' }));
    expect(onGenerate).toHaveBeenCalled();
  });

  it('shows the active link with share, new and cancel', () => {
    const onCancelLink = vi.fn();
    renderWithTheme(
      <MesaLinkModalGlobal {...props} url="https://app/mesa/abc" expiraEm="01/11/2026, 23:00" onCancelLink={onCancelLink} />,
    );
    expect(screen.getByLabelText('Endereço do link')).toHaveTextContent('https://app/mesa/abc');
    expect(screen.getByText(/Vale até 01\/11\/2026, 23:00/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Compartilhar' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar link' }));
    expect(onCancelLink).toHaveBeenCalled();
  });
});
