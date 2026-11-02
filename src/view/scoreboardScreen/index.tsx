import { useState } from 'react';
import { ErrorStateGlobal } from '@/components/errorStateGlobal';
import { LiveBoardGlobal } from '@/components/liveBoardGlobal';
import { LoaderGlobal } from '@/components/loaderGlobal';
import { useLiveGame } from '@/hooks/useLiveGame';
import { useRouteParams } from '@/hooks/useRouteParams';
import { useWakeLock } from '@/hooks/useWakeLock';
import { liveBoardTeams, liveSituation, periodDurationMs, periodLabel } from '@/utils/liveSheet';
import { Fill, FullscreenButton, Screen } from './style';

// Telão (seção 6.5.1): placar, relógio de jogo e de posse, escudos e nomes em tela cheia, atualizando ao vivo.
export function ScoreboardScreen() {
  const { gameId } = useRouteParams('gameId');
  const { ctx, isLoading, error, refetch, relogio, jogoMs, posseMs, resumo } = useLiveGame(gameId);
  const [telaCheia, setTelaCheia] = useState(false);
  useWakeLock(true);

  if (isLoading) return <LoaderGlobal fullScreen label="Carregando o placar" />;
  if (error || !ctx) return <ErrorStateGlobal error={error} onRetry={() => void refetch()} />;

  const regras = ctx.competicao;
  const periodo = relogio?.periodo ?? 1;
  const entrarTelaCheia = () => {
    void document.documentElement
      .requestFullscreen?.()
      .then(() => setTelaCheia(true))
      .catch(() => undefined);
  };

  return (
    <Screen>
      <Fill>
        <LiveBoardGlobal
          tamanho="telao"
          {...liveBoardTeams(ctx, resumo)}
          periodo={periodLabel(periodo, regras)}
          jogoMs={relogio ? jogoMs : periodDurationMs(1, regras)}
          posseMs={relogio ? posseMs : null}
          rodando={Boolean(relogio?.rodando)}
          situacao={liveSituation(ctx.mesa?.status ?? null)}
        />
      </Fill>
      {!telaCheia && <FullscreenButton onClick={entrarTelaCheia}>Tela cheia</FullscreenButton>}
    </Screen>
  );
}
