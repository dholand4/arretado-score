import { useState } from 'react';
import { AlertGlobal } from '@/components/alertGlobal';
import { ButtonGlobal } from '@/components/buttonGlobal';
import { LoaderGlobal } from '@/components/loaderGlobal';
import { ModalGlobal } from '@/components/modalGlobal';
import { SegmentedGlobal } from '@/components/segmentedGlobal';
import { SelectGlobal } from '@/components/selectGlobal';
import { EVENT_ART_FORMATS, EVENT_ART_LAYOUTS, type EventArtFormat, type EventArtLayout } from '@/constants/eventArt';
import { useEventArt } from '@/hooks/useEventArt';
import { currentGameId } from '@/utils/eventArt';
import { formatEventDate } from '@/utils/eventSchedule';
import { Content, Hint, Image, Preview } from './style';
import type { IEventArtModalProps } from './types';

const FORMAT_OPTIONS = (Object.keys(EVENT_ART_FORMATS) as EventArtFormat[]).map((value) => ({
  value,
  label: EVENT_ART_FORMATS[value].label,
}));

const LAYOUT_OPTIONS = (Object.keys(EVENT_ART_LAYOUTS) as EventArtLayout[]).map((value) => ({
  value,
  label: EVENT_ART_LAYOUTS[value],
}));

// Prévia da arte de divulgação do dia (seção 9.3), com compartilhar (celular) e baixar PNG.
export function EventArtModalGlobal({ open, event, league, onClose }: IEventArtModalProps) {
  const [format, setFormat] = useState<EventArtFormat>('post');
  const [layout, setLayout] = useState<EventArtLayout>('games');
  const [gameId, setGameId] = useState<string | null>(null);
  const [downloaded, setDownloaded] = useState(false);
  const { url, loading, error, fileName, games, download, share } = useEventArt(event, league, format, layout, gameId);
  const selectedGame = gameId ?? currentGameId({ games });
  const { width, height } = EVENT_ART_FORMATS[format];
  const day = formatEventDate(event.data);

  return (
    <ModalGlobal
      open={open}
      title={`Arte do dia ${day}`}
      onClose={onClose}
      footer={
        <>
          <ButtonGlobal
            label="Baixar PNG"
            variant="outline"
            disabled={!url}
            onClick={() => {
              download();
              setDownloaded(true);
            }}
          />
          <ButtonGlobal
            label="Compartilhar"
            disabled={!url}
            onClick={() => void share().then((result) => setDownloaded(result === 'downloaded'))}
          />
        </>
      }
    >
      <Content>
        <SegmentedGlobal
          ariaLabel="Conteúdo da arte"
          options={LAYOUT_OPTIONS}
          value={layout}
          onChange={(value) => {
            setLayout(value);
            setDownloaded(false);
          }}
        />
        {layout === 'game' && (
          <SelectGlobal
            label="Confronto"
            value={selectedGame ?? ''}
            options={games.map((g) => ({
              value: g.id,
              label: `${g.order ? `${g.order.charAt(0)}${g.order.slice(1).toLowerCase()}: ` : ''}${g.home.name} x ${g.away.name}`,
            }))}
            onChange={(e) => {
              setGameId(e.target.value);
              setDownloaded(false);
            }}
          />
        )}
        <SegmentedGlobal
          ariaLabel="Formato da arte"
          options={FORMAT_OPTIONS}
          value={format}
          onChange={(value) => {
            setFormat(value);
            setDownloaded(false);
          }}
        />
        <Preview $ratio={width / height}>
          {url && <Image src={url} alt={`Arte dos jogos de ${day} para o Instagram`} />}
          {loading && <LoaderGlobal label="Gerando a arte" />}
        </Preview>
        {error && <AlertGlobal variant="error" message={error} />}
        {downloaded ? (
          <Hint aria-live="polite">Imagem baixada: {fileName}</Hint>
        ) : (
          <Hint>
            {width} × {height} px. No celular, “Compartilhar” abre o menu para postar no Instagram ou mandar no WhatsApp.
          </Hint>
        )}
      </Content>
    </ModalGlobal>
  );
}

export type { IEventArtModalProps } from './types';
