import { fireEvent, screen } from '@testing-library/react';
import { renderWithTheme } from '@/utils/testUtils';
import { ScoreSheetTeamGlobal } from '..';

const props = {
  teamName: 'Falcões',
  score: 12,
  players: [{ id: 'j1', nome: 'Carlos Barbosa', apelido: null, numero: 4 }],
  categories: [
    { id: 'pts', nome: 'Pontos', sigla: 'PTS' },
    { id: 'reb', nome: 'Rebotes', sigla: 'REB' },
  ],
  present: [],
  values: { j1: { pts: '12' } },
};

describe('ScoreSheetTeamGlobal', () => {
  it('renders one compact row per player with the team score', () => {
    renderWithTheme(<ScoreSheetTeamGlobal {...props} onTogglePresent={() => {}} onChangeValue={() => {}} />);
    expect(screen.getByRole('heading', { name: /Falcões/ })).toHaveTextContent('12 pts');
    expect(screen.getByRole('columnheader', { name: 'REB' })).toBeInTheDocument();
    expect(screen.getByLabelText('PTS de Carlos Barbosa')).toHaveValue(12);
  });

  it('reports presence and value changes', () => {
    const onTogglePresent = vi.fn();
    const onChangeValue = vi.fn();
    renderWithTheme(<ScoreSheetTeamGlobal {...props} onTogglePresent={onTogglePresent} onChangeValue={onChangeValue} />);
    fireEvent.click(screen.getByRole('checkbox', { name: 'Carlos Barbosa jogou' }));
    fireEvent.change(screen.getByLabelText('REB de Carlos Barbosa'), { target: { value: '5' } });
    expect(onTogglePresent).toHaveBeenCalledWith('j1', true);
    expect(onChangeValue).toHaveBeenCalledWith('j1', 'reb', '5');
  });
});
