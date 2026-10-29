import { fireEvent, screen, within } from '@testing-library/react';
import type { IFaseForm } from '@/@types/phase';
import { newPhase } from '@/utils/phaseFormat';
import { renderWithTheme } from '@/utils/testUtils';
import { PhasesEditorGlobal } from '..';

const phases = (): IFaseForm[] => [
  { ...newPhase(0), nome: 'Fase 1', classificam: 4 },
  { ...newPhase(1), nome: 'Semifinal', melhor_de: 3 },
  { ...newPhase(2), nome: 'Final', melhor_de: 3, cruzamento: 'vencedores' },
];

describe('PhasesEditorGlobal', () => {
  it('shows the visual summary and saves the payload', () => {
    const onSave = vi.fn();
    renderWithTheme(<PhasesEditorGlobal initialPhases={phases()} teamsCount={5} onSave={onSave} />);
    expect(screen.getByRole('list', { name: /Resumo do formato/ })).toHaveAccessibleName(
      'Resumo do formato: Fase 1: 5 times, todos contra todos, 10 jogos → 4 avançam → Semifinal melhor de 3: 1º x 4º, 2º x 3º → Final melhor de 3',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Salvar e continuar' }));
    expect(onSave).toHaveBeenCalledWith(
      [
        expect.objectContaining({ nome: 'Fase 1', tipo: 'todos_contra_todos', classificam: 4 }),
        expect.objectContaining({ nome: 'Semifinal', tipo: 'mata_mata', cruzamento: 'por_campanha', melhor_de: 3, classificam: null }),
        expect.objectContaining({ nome: 'Final', cruzamento: 'vencedores' }),
      ],
      true,
    );
  });

  it('blocks saving when the knockout gets an odd number of teams', () => {
    const onSave = vi.fn();
    const initial = phases();
    initial[0].classificam = 3;
    renderWithTheme(<PhasesEditorGlobal initialPhases={initial} teamsCount={5} onSave={onSave} />);
    fireEvent.click(screen.getByRole('button', { name: 'Salvar rascunho' }));
    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByText('O mata-mata precisa de número par de times (chegam 3).')).toBeInTheDocument();
  });

  it('adds and removes phases', () => {
    renderWithTheme(<PhasesEditorGlobal initialPhases={[]} teamsCount={0} onSave={vi.fn()} />);
    const list = screen.getByRole('list', { name: 'Fases' });
    expect(within(list).getAllByRole('listitem')).toHaveLength(1);
    expect(screen.getByText(/Cadastre ao menos 2 times/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar fase' }));
    expect(screen.getByRole('button', { name: 'Remover fase 2' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Remover fase 2' }));
    expect(screen.queryByRole('button', { name: 'Remover fase 2' })).not.toBeInTheDocument();
  });

  it('is read-only when the structure is locked', () => {
    renderWithTheme(<PhasesEditorGlobal initialPhases={phases()} teamsCount={5} locked onSave={vi.fn()} />);
    expect(screen.getByText(/estrutura está travada/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Salvar rascunho' })).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Adicionar fase' })).not.toBeInTheDocument();
  });
});
