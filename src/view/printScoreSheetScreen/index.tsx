import { ButtonGlobal } from '@/components/buttonGlobal';
import { ErrorStateGlobal } from '@/components/errorStateGlobal';
import { LinkButtonGlobal } from '@/components/linkButtonGlobal';
import { LoaderGlobal } from '@/components/loaderGlobal';
import { ScoreSheetPrintGlobal } from '@/components/scoreSheetPrintGlobal';
import { useRouteParams } from '@/hooks/useRouteParams';
import { usePrintableSheet } from '@/hooks/useScoreSheet';
import { paths } from '@/routes/types';
import { Hint, Page, Paper, Toolbar } from './style';

// Súmula em papel para levar ao jogo: abre fora do painel e imprime (ou salva em PDF).
export function PrintScoreSheetScreen() {
  const { competitionId, gameId } = useRouteParams('competitionId', 'gameId');
  const { sheet, isLoading, error, refetch } = usePrintableSheet(gameId);

  const renderContent = () => {
    if (isLoading) return <LoaderGlobal label="Montando súmula" />;
    if (error || !sheet) return <ErrorStateGlobal error={error} onRetry={() => void refetch()} />;
    return (
      <Paper>
        <ScoreSheetPrintGlobal sheet={sheet} />
      </Paper>
    );
  };

  return (
    <Page>
      <Toolbar>
        <LinkButtonGlobal to={paths.gameScoreSheet(competitionId, gameId)} label="← Súmula" size="sm" variant="ghost" />
        <ButtonGlobal label="Imprimir ou salvar PDF" size="sm" disabled={!sheet} onClick={() => window.print()} />
        <Hint>Jogadores sem número saem com a casa em branco para preencher à mão.</Hint>
      </Toolbar>
      {renderContent()}
    </Page>
  );
}
