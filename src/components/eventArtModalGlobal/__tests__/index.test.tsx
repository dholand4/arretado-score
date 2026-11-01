import { fireEvent, screen, waitFor } from '@testing-library/react';
import type { IEvento } from '@/@types/event';
import { useEventArt } from '@/hooks/useEventArt';
import { renderWithTheme } from '@/utils/testUtils';
import { EventArtModalGlobal } from '..';

vi.mock('@/hooks/useEventArt');

const event = { id: 'e1', data: '2026-11-01', jogos: [] } as unknown as IEvento;
const league = { nome: 'Liga', logo_url: null };
const team = (name: string) => ({ name, logo: null, placeholder: name.startsWith('Perdedor') });
const game = (id: string, order: string, home: string, away: string, finished: boolean) => ({
  id,
  order,
  home: team(home),
  away: team(away),
  center: finished ? '50 x 40' : '13:00',
  time: '13:00',
  finished,
  details: 'Fase 1',
});

const art = (patch: Partial<ReturnType<typeof useEventArt>> = {}): ReturnType<typeof useEventArt> => ({
  url: 'blob:arte',
  loading: false,
  error: null,
  fileName: 'jogos-2026-11-01-post.png',
  games: [
    game('j1', 'JOGO 1', 'Okami BC', 'QuixaRocks', true),
    game('j2', 'JOGO 2', 'Perdedor Jogo 1', 'Estadual', false),
  ],
  download: vi.fn(),
  share: vi.fn().mockResolvedValue('shared'),
  ...patch,
});

describe('EventArtModalGlobal', () => {
  it('shows the preview and lets the admin share or download the PNG', async () => {
    const current = art();
    vi.mocked(useEventArt).mockReturnValue(current);
    renderWithTheme(<EventArtModalGlobal open event={event} league={league} onClose={vi.fn()} />);

    expect(screen.getByRole('dialog', { name: 'Arte do dia dom., 01/11/2026' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /Arte dos jogos de dom., 01\/11\/2026/ })).toHaveAttribute('src', 'blob:arte');
    fireEvent.click(screen.getByRole('button', { name: 'Compartilhar' }));
    expect(current.share).toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Baixar PNG' }));
    expect(current.download).toHaveBeenCalled();
    expect(await screen.findByText('Imagem baixada: jogos-2026-11-01-post.png')).toBeInTheDocument();
  });

  it('tells when sharing fell back to a download', async () => {
    vi.mocked(useEventArt).mockReturnValue(art({ share: vi.fn().mockResolvedValue('downloaded') }));
    renderWithTheme(<EventArtModalGlobal open event={event} league={league} onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Compartilhar' }));
    await waitFor(() => expect(screen.getByText(/Imagem baixada/)).toBeInTheDocument());
  });

  it('switches between post and story, with times or only the teams', () => {
    vi.mocked(useEventArt).mockReturnValue(art());
    renderWithTheme(<EventArtModalGlobal open event={event} league={league} onClose={vi.fn()} />);
    expect(useEventArt).toHaveBeenLastCalledWith(event, league, 'post', 'games', null);
    expect(screen.getByRole('radio', { name: 'Com horários' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByText(/1080 × 1350 px/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('radio', { name: 'Story (9:16)' }));
    expect(useEventArt).toHaveBeenLastCalledWith(event, league, 'story', 'games', null);
    expect(screen.getByText(/1080 × 1920 px/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('radio', { name: 'Só os times' }));
    expect(useEventArt).toHaveBeenLastCalledWith(event, league, 'story', 'teams', null);
  });

  it('blocks the buttons while the art is being generated', () => {
    vi.mocked(useEventArt).mockReturnValue(art({ url: null, loading: true }));
    renderWithTheme(<EventArtModalGlobal open event={event} league={league} onClose={vi.fn()} />);
    expect(screen.getByText('Gerando a arte')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Compartilhar' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Baixar PNG' })).toBeDisabled();
  });

  it('shows the error when the art fails', () => {
    vi.mocked(useEventArt).mockReturnValue(art({ url: null, error: 'Não foi possível gerar a arte neste navegador.' }));
    renderWithTheme(<EventArtModalGlobal open event={event} league={league} onClose={vi.fn()} />);
    expect(screen.getByText('Não foi possível gerar a arte neste navegador.')).toBeInTheDocument();
  });

  it('picks the game happening now for the spotlight and lets the admin choose another', () => {
    vi.mocked(useEventArt).mockReturnValue(art());
    renderWithTheme(<EventArtModalGlobal open event={event} league={league} onClose={vi.fn()} />);
    expect(screen.queryByLabelText('Confronto')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('radio', { name: 'Agora em quadra' }));
    expect(screen.getByLabelText('Confronto')).toHaveValue('j2');
    expect(screen.getByRole('option', { name: 'Jogo 2: Perdedor Jogo 1 x Estadual' })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Confronto'), { target: { value: 'j1' } });
    expect(useEventArt).toHaveBeenLastCalledWith(event, league, 'post', 'game', 'j1');
  });
});
