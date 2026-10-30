import { fireEvent, screen } from '@testing-library/react';
import type { IFaseForm } from '@/@types/phase';
import { renderWithTheme } from '@/utils/testUtils';
import { analyzeFormat, newPhase } from '@/utils/phaseFormat';
import { PhaseFormGlobal } from '..';

const league = (): IFaseForm => ({ ...newPhase(0), nome: 'Fase 1', classificam: 4 });
const knockout = (patch: Partial<IFaseForm> = {}): IFaseForm => ({
  ...newPhase(1),
  nome: 'Semifinal',
  melhor_de: 3,
  ...patch,
});

describe('PhaseFormGlobal', () => {
  it('edits a league phase and hides knockout for the first phase', () => {
    const onChange = vi.fn();
    renderWithTheme(<PhaseFormGlobal phase={league()} index={0} isLast={false} onChange={onChange} />);
    expect(screen.queryByRole('option', { name: 'Mata-mata' })).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Quantos avançam'), { target: { value: '6' } });
    expect(onChange).toHaveBeenCalledWith({ classificam: 6 });
    fireEvent.change(screen.getByLabelText('Turnos'), { target: { value: '2' } });
    expect(onChange).toHaveBeenCalledWith({ turnos: 2 });
  });

  it('asks for best losers only when the knockout is not the last phase', () => {
    const onChange = vi.fn();
    const { rerender } = renderWithTheme(
      <PhaseFormGlobal phase={knockout({ cruzamento: 'por_campanha' })} index={1} isLast={false} onChange={onChange} />,
    );
    fireEvent.change(screen.getByLabelText('Melhores perdedores'), { target: { value: '1' } });
    expect(onChange).toHaveBeenCalledWith({ melhores_extras: 1 });

    rerender(
      <PhaseFormGlobal phase={knockout({ cruzamento: 'por_campanha', melhores_extras: 1 })} index={1} isLast={false} onChange={onChange} />,
    );
    expect(screen.getByText(/Avançam os vencedores e o melhor perdedor/)).toBeInTheDocument();

    rerender(<PhaseFormGlobal phase={knockout({ cruzamento: 'por_campanha' })} index={1} isLast onChange={onChange} />);
    expect(screen.queryByLabelText('Melhores perdedores')).not.toBeInTheDocument();
  });

  it('shows the generated series of a knockout phase', () => {
    const phases = [league(), knockout()];
    const analysis = analyzeFormat(phases, 5);
    renderWithTheme(
      <PhaseFormGlobal
        phase={phases[1]}
        index={1}
        isLast
        analysis={analysis.phases[1]}
        previousName="Fase 1"
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByText(/Chegam 4 times da fase anterior/)).toBeInTheDocument();
    const series = screen.getByRole('list', { name: 'Séries da fase 2' });
    expect(series).toHaveTextContent('S1: 1º colocado da Fase 1 x 4º colocado da Fase 1');
    expect(series).toHaveTextContent('S2: 2º colocado da Fase 1 x 3º colocado da Fase 1');
  });

  it('lets the admin pick manual origins', () => {
    const onChange = vi.fn();
    const phases = [league(), knockout({ cruzamento: 'manual' })];
    const analysis = analyzeFormat(phases, 5);
    renderWithTheme(
      <PhaseFormGlobal
        phase={phases[1]}
        index={1}
        isLast
        analysis={analysis.phases[1]}
        previousName="Fase 1"
        onChange={onChange}
      />,
    );
    expect(screen.getAllByRole('group')).toHaveLength(2);
    fireEvent.change(screen.getAllByLabelText('Melhor campanha')[0], { target: { value: 'posicao:1:1' } });
    expect(onChange).toHaveBeenCalledWith({
      confrontos: [
        { origem_a: { tipo: 'posicao', fase_ordem: 1, posicao: 1 }, origem_b: null },
        { origem_a: null, origem_b: null },
      ],
    });
  });

  it('locks structural fields of a phase that already started', () => {
    const onRemove = vi.fn();
    renderWithTheme(
      <PhaseFormGlobal
        phase={{ ...league(), iniciada: true }}
        index={0}
        isLast={false}
        onChange={vi.fn()}
        onRemove={onRemove}
      />,
    );
    expect(screen.getByText('Já começou')).toBeInTheDocument();
    expect(screen.getByLabelText('Tipo')).toBeDisabled();
    expect(screen.getByLabelText('Nome da fase')).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Remover fase 1' })).toBeDisabled();
  });

  it('takes winners or losers from an earlier knockout phase', () => {
    const terceiro: IFaseForm = {
      ...newPhase(2, 'mata_mata'),
      nome: '3º lugar',
      cruzamento: 'outra_fase',
      fase_origem: 2,
      resultado_origem: 'perdedores',
    };
    const final: IFaseForm = { ...terceiro, nome: 'Final', resultado_origem: 'vencedores' };
    const phases = [league(), knockout(), terceiro, final];
    const analysis = analyzeFormat(phases, 5);
    expect(analysis.errors).toEqual([]);
    const earlier = phases.slice(0, 2).map((p, i) => ({ ordem: i + 1, nome: p.nome, tipo: p.tipo, fase_origem: null }));
    const onChange = vi.fn();
    renderWithTheme(
      <PhaseFormGlobal
        phase={terceiro}
        index={2}
        isLast={false}
        analysis={analysis.phases[2]}
        earlierPhases={earlier}
        onChange={onChange}
      />,
    );
    expect(screen.getByLabelText('Fase de origem')).toHaveValue('2');
    expect(screen.getByLabelText('Quem entra')).toHaveValue('perdedores');
    expect(screen.getByRole('list', { name: 'Séries da fase 3' })).toHaveTextContent('Perdedor da S1 x Perdedor da S2');
    fireEvent.change(screen.getByLabelText('Quem entra'), { target: { value: 'vencedores' } });
    expect(onChange).toHaveBeenCalledWith({ resultado_origem: 'vencedores' });
    expect(analysis.phases[3].series[0]).toMatchObject({
      origem_a: { tipo: 'vencedor', serie: 'S1' },
      origem_b: { tipo: 'vencedor', serie: 'S2' },
    });
  });

  it('suggests the same origin as the 3rd place phase for the final', () => {
    const final = { ...newPhase(3, 'mata_mata'), nome: 'Final' };
    const onChange = vi.fn();
    renderWithTheme(
      <PhaseFormGlobal
        phase={final}
        index={3}
        isLast
        earlierPhases={[
          { ordem: 1, nome: 'Fase 1', tipo: 'todos_contra_todos', fase_origem: null },
          { ordem: 2, nome: 'Semifinal', tipo: 'mata_mata', fase_origem: null },
          { ordem: 3, nome: '3º lugar', tipo: 'mata_mata', fase_origem: 2 },
        ]}
        onChange={onChange}
      />,
    );
    fireEvent.change(screen.getByLabelText('Confrontos'), { target: { value: 'outra_fase' } });
    expect(onChange).toHaveBeenCalledWith({ cruzamento: 'outra_fase', fase_origem: 2, resultado_origem: 'vencedores' });
  });

  it('refuses losers in the last phase', () => {
    const ultima: IFaseForm = {
      ...newPhase(2, 'mata_mata'),
      nome: '3º lugar',
      cruzamento: 'outra_fase',
      fase_origem: 2,
      resultado_origem: 'perdedores',
    };
    const analysis = analyzeFormat([league(), knockout(), ultima], 5);
    expect(analysis.errors.map((e) => e.message)).toContain(
      'A última fase define o campeão: use os vencedores (o 3º lugar vem antes da final).',
    );
  });
});
