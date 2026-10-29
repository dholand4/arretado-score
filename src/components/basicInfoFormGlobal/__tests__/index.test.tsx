import { fireEvent, screen } from '@testing-library/react';
import { renderWithTheme } from '@/utils/testUtils';
import { BasicInfoFormGlobal } from '..';

const empty = { nome: '', slug: '', modalidade: 'basquete' as const, descricao: '', local_padrao: '', intervalo_jogos_min: 90 };

describe('BasicInfoFormGlobal', () => {
  it('generates the slug from the name while creating', () => {
    renderWithTheme(<BasicInfoFormGlobal initialValues={empty} isNew onSave={() => {}} />);
    fireEvent.change(screen.getByLabelText('Nome da competição'), { target: { value: 'Copa Verão 2026' } });
    expect(screen.getByLabelText('Endereço público (slug)')).toHaveValue('copa-verao-2026');
  });

  it('validates and saves with advance flag', () => {
    const onSave = vi.fn();
    renderWithTheme(<BasicInfoFormGlobal initialValues={empty} isNew onSave={onSave} />);
    fireEvent.click(screen.getByRole('button', { name: 'Salvar e continuar' }));
    expect(screen.getByText('Informe o nome da competição.')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Nome da competição'), { target: { value: 'Liga' } });
    fireEvent.click(screen.getByRole('button', { name: 'Criar rascunho' }));
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ nome: 'Liga', slug: 'liga', intervalo_jogos_min: 90 }),
      { kind: 'keep' },
      false,
    );
  });

  it('keeps the slug when editing an existing competition', () => {
    renderWithTheme(
      <BasicInfoFormGlobal initialValues={{ ...empty, nome: 'Liga', slug: 'liga-antiga' }} isNew={false} onSave={() => {}} />,
    );
    fireEvent.change(screen.getByLabelText('Nome da competição'), { target: { value: 'Liga Nova' } });
    expect(screen.getByLabelText('Endereço público (slug)')).toHaveValue('liga-antiga');
  });
});
