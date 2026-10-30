import { ButtonGlobal } from '@/components/buttonGlobal';
import { Box, ErrorText, Texts } from './style';
import type { IInactiveLeagueNoticeProps } from './types';

// Faixa no topo das páginas de uma liga desativada: explica o estado e oferece reativar.
export function InactiveLeagueNoticeGlobal({ onReactivate, loading = false, error }: IInactiveLeagueNoticeProps) {
  return (
    <Box role="status">
      <Texts>
        <strong>Liga desativada</strong>
        <span>Não aparece para o público nem para as equipes. Aqui no painel fica só para consulta até ser reativada.</span>
        {error && <ErrorText>{error}</ErrorText>}
      </Texts>
      <ButtonGlobal label="Reativar liga" loading={loading} onClick={onReactivate} />
    </Box>
  );
}

export type { IInactiveLeagueNoticeProps } from './types';
