import { screen, within } from '@testing-library/react';
import type { ISumulaImpressa } from '@/@types/game';
import { renderWithTheme } from '@/utils/testUtils';
import { ScoreSheetPrintGlobal } from '..';

const sheet: ISumulaImpressa = {
  competicao: { nome: 'Liga Quixadaense', logo_url: 'https://example.com/logo.webp' },
  casa: 'Falcões',
  fora: 'Trovão',
  fase: 'Fase de classificação',
  grupo: null,
  inicioPrevisto: '2026-11-07T22:00:00Z',
  evento: { data: '2026-11-07', local: 'Ginásio Municipal' },
  casaJogadores: [
    { id: 'a1', nome: 'Ana Souza', numero: 4 },
    { id: 'a2', nome: 'Bia Lima', numero: null },
  ],
  foraJogadores: [{ id: 'b1', nome: 'Carla Dias', numero: 10 }],
};

describe('ScoreSheetPrintGlobal', () => {
  it('shows the league logo and the game info', () => {
    renderWithTheme(<ScoreSheetPrintGlobal sheet={sheet} />);
    expect(screen.getByRole('img', { name: 'Logo Liga Quixadaense' })).toHaveAttribute('src', sheet.competicao.logo_url);
    expect(screen.getByText('07/11/2026')).toBeInTheDocument();
    expect(screen.getByText('19:00')).toBeInTheDocument();
    expect(screen.getByText('Ginásio Municipal')).toBeInTheDocument();
  });

  it('fills each roster with names and numbers, leaving missing numbers blank', () => {
    renderWithTheme(<ScoreSheetPrintGlobal sheet={sheet} />);
    const equipeA = screen.getByRole('region', { name: 'Equipe A' });
    const linhaAna = within(equipeA).getByText('Ana Souza').closest('tr') as HTMLElement;
    expect(within(linhaAna).getByText('4')).toBeInTheDocument();
    const linhaBia = within(equipeA).getByText('Bia Lima').closest('tr') as HTMLElement;
    expect(linhaBia.querySelectorAll('td')[2]).toHaveTextContent('');
    const equipeB = screen.getByRole('region', { name: 'Equipe B' });
    expect(within(equipeB).getByText('Carla Dias')).toBeInTheDocument();
  });

  it('skips the logo when the league has none', () => {
    renderWithTheme(<ScoreSheetPrintGlobal sheet={{ ...sheet, competicao: { ...sheet.competicao, logo_url: null } }} />);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});
