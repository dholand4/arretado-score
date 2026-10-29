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
  it('mostra origens, placar, jogos e campeão', () => {
    state({ isPending: false, data: { competition: { nome: 'Liga' } }, champion: 'Tubarões', phases: [{ id: 'f', nome: 'Final', series: [{ id: 's', codigo: 'S1', melhor_de: 3, nameA: 'Tubarões', nameB: 'Vencedor S2', vitorias_a: 2, vitorias_b: 1, games: [{ id: 'j', numero_na_serie: 1, home: 'Tubarões', away: 'Falcões', placar_casa: 20, placar_fora: 10 }] }] }] });
    renderPage();
    expect(screen.getByText('Campeão: Tubarões')).toBeInTheDocument();
    expect(screen.getByText('Vencedor S2')).toBeInTheDocument();
    expect(screen.getByText(/Jogo 1: Tubarões 20 × 10 Falcões/)).toBeInTheDocument();
  });
});
