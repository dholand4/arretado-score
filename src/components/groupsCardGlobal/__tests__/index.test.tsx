import { fireEvent, screen } from '@testing-library/react';
import type { IFase } from '@/@types/phase';
import { renderWithTheme } from '@/utils/testUtils';
import { GroupsCardGlobal } from '..';

const phase = (patch: Partial<IFase> = {}) =>
  ({
    id: 'f1',
    nome: 'Fase de grupos',
    sorteio_grupos: 'aleatorio',
    grupos: [
      { id: 'g1', nome: 'A', grupo_times: [{ time_id: 't2', time: { nome: 'Tubarões' } }, { time_id: 't1', time: { nome: 'Falcões' } }] },
      { id: 'g2', nome: 'B', grupo_times: [{ time_id: 't3', time: { nome: 'Leões' } }] },
    ],
    ...patch,
  }) as IFase;

describe('GroupsCardGlobal', () => {
  it('lists the groups and redraws', () => {
    const onRedraw = vi.fn();
    renderWithTheme(<GroupsCardGlobal phase={phase()} onRedraw={onRedraw} />);
    expect(screen.getByText('Falcões, Tubarões')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Sortear de novo' }));
    expect(onRedraw).toHaveBeenCalled();
  });

  it('explains why it cannot redraw', () => {
    renderWithTheme(
      <GroupsCardGlobal phase={phase({ sorteio_grupos: 'manual' })} blockedReason="Já há súmula lançada." onRedraw={vi.fn()} />,
    );
    expect(screen.getByRole('button', { name: 'Redistribuir' })).toBeDisabled();
    expect(screen.getByText('Já há súmula lançada.')).toBeInTheDocument();
  });
});
