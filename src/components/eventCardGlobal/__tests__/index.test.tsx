import { fireEvent, screen } from '@testing-library/react';
import type { IEvento, IJogoResumo } from '@/@types/event';
import { renderWithTheme } from '@/utils/testUtils';
import { EventCardGlobal } from '..';

const jogo = (id: string, casa: string, fora: string, hora: string): IJogoResumo =>
  ({
    id,
    time_casa_id: casa,
    time_fora_id: fora,
    casa: { nome: `Time ${casa}`, sigla: null },
    fora: { nome: `Time ${fora}`, sigla: null },
    fase: { nome: 'Fase 1' },
    grupo: null,
    serie: null,
    rodada: 1,
    numero_na_serie: null,
    status: 'agendado',
    inicio_previsto: hora,
  }) as IJogoResumo;

const event = (patch: Partial<IEvento> = {}): IEvento =>
  ({
    id: 'e1',
    competicao_id: 'c1',
    data: '2026-11-07',
    local: 'Ginásio',
    hora_inicio: '19:00:00',
    qtd_jogos: 3,
    intervalo_min: 90,
    status: 'rascunho',
    observacoes: null,
    jogos: [
      jogo('j1', 'A', 'B', '2026-11-07T22:00:00Z'),
      jogo('j2', 'C', 'D', '2026-11-07T23:30:00Z'),
      jogo('j3', 'A', 'E', '2026-11-08T01:00:00Z'),
    ],
    ...patch,
  }) as IEvento;

const handlers = () => ({
  onReorder: vi.fn(),
  onRemoveGame: vi.fn(),
  onSwap: vi.fn(),
  onRedraw: vi.fn(),
  onPublish: vi.fn(),
  onEdit: vi.fn(),
  onDelete: vi.fn(),
});

describe('EventCardGlobal', () => {
  it('lets the admin reorder, remove and publish a draft', () => {
    const h = handlers();
    renderWithTheme(<EventCardGlobal event={event()} {...h} />);
    expect(screen.getByText('Rascunho')).toBeInTheDocument();
    expect(screen.getByText(/^19:00 · Fase 1 · jogo duplo$/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Descer Time A x Time B' }));
    expect(h.onReorder).toHaveBeenCalledWith(['j2', 'j1', 'j3']);
    fireEvent.click(screen.getByRole('button', { name: 'Remover Time C x Time D' }));
    expect(h.onRemoveGame).toHaveBeenCalledWith('j2');
    fireEvent.click(screen.getByRole('button', { name: 'Publicar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Trocar jogo' }));
    fireEvent.click(screen.getByRole('button', { name: 'Sortear de novo' }));
    expect(h.onPublish).toHaveBeenCalled();
    expect(h.onSwap).toHaveBeenCalled();
    expect(h.onRedraw).toHaveBeenCalled();
  });

  it('shows a published day as read-only', () => {
    const h = handlers();
    renderWithTheme(<EventCardGlobal event={event({ status: 'publicado' })} {...h} />);
    expect(screen.getByText('Publicado')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Publicar' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Subir/ })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Excluir' }));
    expect(h.onDelete).toHaveBeenCalled();
    // Data, hora e local continuam editáveis depois de publicar.
    fireEvent.click(screen.getByRole('button', { name: 'Editar dia' }));
    expect(h.onEdit).toHaveBeenCalled();
  });

  it('offers the promo art only on a published day with games', () => {
    const onGenerateArt = vi.fn();
    const { rerender } = renderWithTheme(
      <EventCardGlobal event={event({ status: 'publicado' })} {...handlers()} onGenerateArt={onGenerateArt} />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Gerar Arte' }));
    expect(onGenerateArt).toHaveBeenCalled();

    rerender(<EventCardGlobal event={event()} {...handlers()} onGenerateArt={onGenerateArt} />);
    expect(screen.queryByRole('button', { name: 'Gerar Arte' })).not.toBeInTheDocument();
    rerender(<EventCardGlobal event={event({ status: 'publicado', jogos: [] })} {...handlers()} onGenerateArt={onGenerateArt} />);
    expect(screen.queryByRole('button', { name: 'Gerar Arte' })).not.toBeInTheDocument();
  });
});
