import { act, renderHook, waitFor } from '@testing-library/react';
import type { IEvento } from '@/@types/event';
import { useEventArt } from '@/hooks/useEventArt';
import { renderEventArt } from '@/utils/eventArt';

vi.mock('@/utils/eventArt', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/utils/eventArt')>()),
  renderEventArt: vi.fn(),
}));

const event = {
  id: 'e1',
  data: '2026-11-01',
  local: 'Ginásio',
  hora_inicio: '12:00:00',
  status: 'publicado',
  jogos: [],
} as unknown as IEvento;
const league = { nome: 'Liga', logo_url: null };

describe('useEventArt', () => {
  let clicks: string[];

  beforeEach(() => {
    clicks = [];
    vi.mocked(renderEventArt).mockResolvedValue(new Blob(['png'], { type: 'image/png' }));
    URL.createObjectURL = vi.fn(() => 'blob:arte');
    URL.revokeObjectURL = vi.fn();
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      clicks.push(this.download);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    Reflect.deleteProperty(navigator, 'share');
    Reflect.deleteProperty(navigator, 'canShare');
  });

  it('renders the art for the chosen format and content', async () => {
    const { result, rerender } = renderHook(({ format, layout }) => useEventArt(event, league, format, layout), {
      initialProps: { format: 'post', layout: 'games' } as { format: 'post' | 'story'; layout: 'games' | 'teams' },
    });
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.url).toBe('blob:arte'));
    expect(renderEventArt).toHaveBeenLastCalledWith(expect.objectContaining({ leagueName: 'Liga' }), 'post', 'games', null);

    rerender({ format: 'story', layout: 'games' });
    expect(result.current.url).toBeNull();
    await waitFor(() => expect(result.current.url).toBe('blob:arte'));
    expect(renderEventArt).toHaveBeenLastCalledWith(expect.anything(), 'story', 'games', null);
    expect(result.current.fileName).toBe('jogos-2026-11-01-story.png');

    rerender({ format: 'story', layout: 'teams' });
    expect(result.current.url).toBeNull();
    await waitFor(() => expect(result.current.url).toBe('blob:arte'));
    expect(renderEventArt).toHaveBeenLastCalledWith(expect.anything(), 'story', 'teams', null);
    expect(result.current.fileName).toBe('times-2026-11-01-story.png');
  });

  it('shares the PNG file through the phone menu when supported', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { share, canShare: () => true });
    const { result } = renderHook(() => useEventArt(event, league, 'post', 'games'));
    await waitFor(() => expect(result.current.url).not.toBeNull());

    const delivery = await act(() => result.current.share());
    expect(delivery).toBe('shared');
    const [file] = share.mock.calls[0][0].files as File[];
    expect([file.name, file.type]).toEqual(['jogos-2026-11-01-post.png', 'image/png']);
    expect(clicks).toEqual([]);
  });

  it('downloads when sharing files is not supported', async () => {
    const { result } = renderHook(() => useEventArt(event, league, 'post', 'games'));
    await waitFor(() => expect(result.current.url).not.toBeNull());
    expect(await act(() => result.current.share())).toBe('downloaded');
    act(() => result.current.download());
    expect(clicks).toEqual(['jogos-2026-11-01-post.png', 'jogos-2026-11-01-post.png']);
  });

  it('does nothing when the person cancels the share menu', async () => {
    Object.assign(navigator, {
      share: vi.fn().mockRejectedValue(new DOMException('cancelado', 'AbortError')),
      canShare: () => true,
    });
    const { result } = renderHook(() => useEventArt(event, league, 'post', 'games'));
    await waitFor(() => expect(result.current.url).not.toBeNull());
    expect(await act(() => result.current.share())).toBe('cancelled');
    expect(clicks).toEqual([]);
  });

  it('shows the error when the art cannot be generated', async () => {
    vi.mocked(renderEventArt).mockRejectedValue(new Error('sem canvas'));
    const { result } = renderHook(() => useEventArt(event, league, 'post', 'games'));
    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(result.current.loading).toBe(false);
  });
});
