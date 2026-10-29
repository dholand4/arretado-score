import { fireEvent, screen } from '@testing-library/react';
import { renderWithTheme } from '@/utils/testUtils';
import { GroupsDistributionModalGlobal } from '..';

const teams = ['Tubarões', 'Falcões', 'Leões', 'Panteras'].map((nome, i) => ({ id: `t${i + 1}`, nome }));

describe('GroupsDistributionModalGlobal', () => {
  it('starts balanced and confirms the chosen groups', () => {
    const onConfirm = vi.fn();
    renderWithTheme(
      <GroupsDistributionModalGlobal open groupNames={['A', 'B']} teams={teams} onConfirm={onConfirm} onClose={vi.fn()} />,
    );
    expect(screen.getByText('Grupo A: 2 · Grupo B: 2')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Falcões'), { target: { value: 'A' } });
    fireEvent.change(screen.getByLabelText('Leões'), { target: { value: 'B' } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar grupos' }));
    expect(onConfirm).toHaveBeenCalledWith({ A: ['t1', 't2'], B: ['t3', 't4'] });
  });

  it('requires at least 2 teams per group', () => {
    const onConfirm = vi.fn();
    renderWithTheme(
      <GroupsDistributionModalGlobal open groupNames={['A', 'B']} teams={teams} onConfirm={onConfirm} onClose={vi.fn()} />,
    );
    fireEvent.change(screen.getByLabelText('Falcões'), { target: { value: 'A' } });
    fireEvent.change(screen.getByLabelText('Panteras'), { target: { value: 'A' } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar grupos' }));
    expect(onConfirm).not.toHaveBeenCalled();
    expect(screen.getByText('Cada grupo precisa de pelo menos 2 times.')).toBeInTheDocument();
  });
});
