import { AlertGlobal } from '@/components/alertGlobal';
import { ButtonGlobal } from '@/components/buttonGlobal';
import { LoaderGlobal } from '@/components/loaderGlobal';
import { ModalGlobal } from '@/components/modalGlobal';
import { ShareButtonGlobal } from '@/components/shareButtonGlobal';
import { Actions, Body, LinkBox, Text } from './style';
import type { IMesaLinkModalProps } from './types';

// Link para o mesário operar a súmula ao vivo deste jogo sem login; o resultado vai para a aprovação.
export function MesaLinkModalGlobal({
  open,
  url,
  expiraEm,
  loading = false,
  busy = false,
  error,
  onGenerate,
  onCancelLink,
  onClose,
}: IMesaLinkModalProps) {
  return (
    <ModalGlobal open={open} title="Link do mesário" onClose={onClose}>
      <Body>
        <Text>
          Quem tiver o link opera a súmula ao vivo só deste jogo, sem login. Ao encerrar, o resultado fica aguardando a sua
          aprovação antes de entrar na tabela.
        </Text>
        {loading && <LoaderGlobal size="sm" label="Carregando o link" />}
        {!loading && url && (
          <>
            <LinkBox aria-label="Endereço do link">{url}</LinkBox>
            {expiraEm && <Text>Vale até {expiraEm}, ou até você aprovar o resultado.</Text>}
            <Actions>
              <ShareButtonGlobal title="Súmula ao vivo" text="Link da mesa do jogo" url={url} />
              <ButtonGlobal label="Gerar outro" size="sm" variant="outline" loading={busy} onClick={onGenerate} />
              <ButtonGlobal label="Cancelar link" size="sm" variant="ghost" disabled={busy} onClick={onCancelLink} />
            </Actions>
          </>
        )}
        {!loading && !url && (
          <Actions>
            <ButtonGlobal label="Gerar link" loading={busy} onClick={onGenerate} />
          </Actions>
        )}
        {error && <AlertGlobal variant="error" message={error} />}
      </Body>
    </ModalGlobal>
  );
}

export type { IMesaLinkModalProps } from './types';
