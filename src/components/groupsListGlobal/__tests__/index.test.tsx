import { screen } from '@testing-library/react';
import { renderWithTheme } from '@/utils/testUtils';
import { GroupsListGlobal } from '..';

describe('GroupsListGlobal', () => {
  it('lists each group with its teams in alphabetical order', () => {
    renderWithTheme(
      <GroupsListGlobal
        grupos={[
          { id: 'g1', nome: 'A', grupo_times: [{ time_id: 't2', time: { nome: 'Tubarões' } }, { time_id: 't1', time: { nome: 'Falcões' } }] },
          { id: 'g2', nome: 'B', grupo_times: [] },
        ]}
      />,
    );
    expect(screen.getByText('Grupo A')).toBeInTheDocument();
    expect(screen.getByText('Falcões, Tubarões')).toBeInTheDocument();
    expect(screen.getByText('Sem times')).toBeInTheDocument();
  });
});
