import { fireEvent, screen } from '@testing-library/react';
import { renderWithTheme } from '@/utils/testUtils';
import { ModalGlobal } from '..';

describe('ModalGlobal', () => {
  it('renders nothing when closed', () => {
    renderWithTheme(<ModalGlobal open={false} title="T" onClose={() => {}}>x</ModalGlobal>);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders a labelled dialog when open', () => {
    renderWithTheme(
      <ModalGlobal open title="Novo usuário" onClose={() => {}} footer={<button>Salvar</button>}>
        corpo
      </ModalGlobal>,
    );
    expect(screen.getByRole('dialog', { name: 'Novo usuário' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Salvar' })).toBeInTheDocument();
  });

  it('closes on button and Escape', () => {
    const fn = vi.fn();
    renderWithTheme(<ModalGlobal open title="T" onClose={fn}>x</ModalGlobal>);
    fireEvent.click(screen.getByRole('button', { name: 'Fechar' }));
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(fn).toHaveBeenCalledTimes(2);
  });
});
