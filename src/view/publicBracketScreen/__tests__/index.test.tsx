import { fireEvent, screen } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { usePublicBracket } from '@/hooks/usePublicBracket';
import { renderScreen } from '@/utils/testUtils';
import { PublicBracketScreen } from '..';

vi.mock('@/hooks/usePublicBracket');
const refetch = vi.fn();
const state = (value: object) => vi.mocked(usePublicBracket).mockReturnValue(value as ReturnType<typeof usePublicBracket>);
const renderPage = () => renderScreen(<Routes><Route path="/c/:slug/playoffs" element={<PublicBracketScreen />} /></Routes>, '/c/liga/playoffs');

describe('PublicBracketScreen', () => {
  it('mostra carregamento', () => {
    state({ isPending: true, phases: [] });
    renderPage();
    expect(screen.getByRole('status')).toHaveTextContent('Carregando playoffs');
  });
  it('permite tentar novamente quando ocorre erro', () => {
    state({ isPending: false, error: new Error('Falha'), phases: [], refetch });
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(refetch).toHaveBeenCalled();
  });
  it('mostra estado vazio', () => {
    state({ isPending: false, phases: [] });
    renderPage();
    expect(screen.getByText('Ainda não há playoffs')).toBeInTheDocument();
  });
  it('monta a chave com a final no centro e o campeão', () => {
    state({
      isPending: false,
      champion: 'Tubarões',
      phases: [
        {
          id: 'f',
          nome: 'Final',
          series: [
            {
              id: 's',
              codigo: 'S1',
              melhor_de: 3,
              origem_a: { tipo: 'posicao', fase_ordem: 1, posicao: 1 },
              origem_b: { tipo: 'posicao', fase_ordem: 1, posicao: 2 },
              time_a_id: 't1',
              time_b_id: null,
              nameA: 'Tubarões',
              nameB: '2º colocado da Fase 1',
              vitorias_a: 2,
              vitorias_b: 1,
              vencedor_id: 't1',
              games: [{ id: 'j', numero_na_serie: 1, status: 'encerrado', time_casa_id: 't1', home: 'Tubarões', away: 'Falcões', placar_casa: 20, placar_fora: 10 }],
            },
          ],
        },
      ],
    });
    renderPage();
    expect(screen.getByText('Tubarões', { selector: 'strong' })).toBeInTheDocument();
    expect(screen.getByText('2º colocado da Fase 1')).toBeInTheDocument();
    expect(screen.getByText('Melhor de 3')).toBeInTheDocument();
  });
});
