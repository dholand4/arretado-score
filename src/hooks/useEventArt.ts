import { useCallback, useEffect, useMemo, useState } from 'react';
import type { IEvento } from '@/@types/event';
import { EVENT_ART_MIME, type EventArtFormat, type EventArtLayout } from '@/constants/eventArt';
import { getErrorMessage } from '@/utils/appError';
import {
  eventArtContent,
  eventArtFileName,
  renderEventArt,
  spotlightGame,
  type IEventArtContent,
} from '@/utils/eventArt';

// Resultado da última geração, com o conteúdo e o formato de origem para não mostrar arte velha.
type IArtResult = { content: IEventArtContent; format: EventArtFormat; layout: EventArtLayout; gameId: string | null } & (
  | { blob: Blob; url: string; error?: undefined }
  | { error: string; blob?: undefined; url?: undefined }
);

export type EventArtDelivery = 'shared' | 'downloaded' | 'cancelled';

// Gera no navegador a arte de divulgação do dia (seção 9.3) e entrega por compartilhar ou baixar.
export function useEventArt(
  event: IEvento,
  league: { nome: string; logo_url: string | null },
  format: EventArtFormat,
  layout: EventArtLayout,
  // Confronto da opção "Agora em quadra"; nulo = o jogo da vez.
  gameId: string | null = null,
) {
  const { nome, logo_url: logoUrl } = league;
  const content = useMemo(() => eventArtContent(event, { nome, logo_url: logoUrl }), [event, nome, logoUrl]);
  const [result, setResult] = useState<IArtResult | null>(null);

  useEffect(() => {
    let active = true;
    let url: string | null = null;
    renderEventArt(content, format, layout, gameId)
      .then((blob) => {
        if (!active) return;
        url = URL.createObjectURL(blob);
        setResult({ content, format, layout, gameId, blob, url });
      })
      .catch((err: unknown) => {
        if (active) setResult({ content, format, layout, gameId, error: getErrorMessage(err) });
      });
    return () => {
      active = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [content, format, layout, gameId]);

  const current =
    result?.content === content && result.format === format && result.layout === layout && result.gameId === gameId
      ? result
      : null;
  const ready = current?.blob ? current : null;
  const fileName = eventArtFileName(event, format, layout, spotlightGame(content, gameId));

  const download = useCallback(() => {
    if (!ready) return;
    const link = document.createElement('a');
    link.href = ready.url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
  }, [ready, fileName]);

  // Menu de compartilhar do celular com o arquivo; sem suporte (a maioria dos computadores), baixa.
  const share = useCallback(async (): Promise<EventArtDelivery> => {
    if (!ready) return 'cancelled';
    const file = new File([ready.blob], fileName, { type: EVENT_ART_MIME });
    // Só o arquivo: com texto junto, alguns apps (Instagram, WhatsApp) ignoram a imagem.
    const data = { files: [file] };
    if (typeof navigator.share === 'function' && navigator.canShare?.(data)) {
      try {
        await navigator.share(data);
        return 'shared';
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return 'cancelled';
      }
    }
    download();
    return 'downloaded';
  }, [ready, fileName, download]);

  return { url: ready?.url ?? null, loading: !current, error: current?.error ?? null, fileName, games: content.games, download, share };
}
