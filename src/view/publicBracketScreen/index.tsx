import { useMemo } from 'react';
import { BracketGlobal } from '@/components/bracketGlobal';
import { EmptyStateGlobal } from '@/components/emptyStateGlobal';
import { ErrorStateGlobal } from '@/components/errorStateGlobal';
import { LoaderGlobal } from '@/components/loaderGlobal';
import { PageHeaderGlobal } from '@/components/pageHeaderGlobal';
import { usePublicBracket } from '@/hooks/usePublicBracket';
import { useRouteParams } from '@/hooks/useRouteParams';
import { paths, type RoutePath } from '@/routes/types';
import { buildBracketLayout } from '@/utils/bracketLayout';

// Chaveamento dos playoffs; usado também no painel do admin e do dono do time.
// gameLink: para onde leva cada jogo da série (padrão: página pública do jogo).
export function BracketContent({ slug, gameLink }: { slug: string; gameLink?: (gameId: string) => RoutePath }) {
  const { phases, champion, isPending, error, refetch } = usePublicBracket(slug);
  const layout = useMemo(() => buildBracketLayout(phases), [phases]);

  if (isPending) return <LoaderGlobal label="Carregando playoffs" />;
  if (error) return <ErrorStateGlobal error={error} onRetry={() => void refetch()} />;
  if (!layout.final) return <EmptyStateGlobal title="Ainda não há playoffs" />;
  return (
    <BracketGlobal
      layout={layout}
      champion={champion}
      gameLink={gameLink ?? ((gameId) => paths.publicGame(slug, gameId))}
    />
  );
}

export function PublicBracketScreen() {
  const { slug } = useRouteParams('slug');
  return (
    <>
      <PageHeaderGlobal title="Playoffs" />
      <BracketContent slug={slug} />
    </>
  );
}
