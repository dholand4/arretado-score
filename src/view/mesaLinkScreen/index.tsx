import { ErrorStateGlobal } from '@/components/errorStateGlobal';
import { LoaderGlobal } from '@/components/loaderGlobal';
import { useMesaByToken } from '@/hooks/useMesaLink';
import { useRouteParams } from '@/hooks/useRouteParams';
import { LiveSheetView } from '@/view/liveScoreSheetScreen';
import { Page } from './style';

// Mesário pelo link (seção 6.5.1): opera a súmula ao vivo só deste jogo, sem login.
export function MesaLinkScreen() {
  const { token } = useRouteParams('token');
  const { jogo, isLoading, error, refetch } = useMesaByToken(token);
  if (isLoading) return <LoaderGlobal fullScreen label="Abrindo a mesa" />;
  if (error || !jogo) {
    return (
      <Page>
        <ErrorStateGlobal title="Link de mesa indisponível" error={error} onRetry={() => void refetch()} />
      </Page>
    );
  }
  return <LiveSheetView competitionId={jogo.competicaoId} gameId={jogo.jogoId} token={token} />;
}
