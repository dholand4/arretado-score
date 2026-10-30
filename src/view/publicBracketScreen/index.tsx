import { useMemo } from 'react';
import { BracketGlobal } from '@/components/bracketGlobal';
import { EmptyStateGlobal } from '@/components/emptyStateGlobal';
import { ErrorStateGlobal } from '@/components/errorStateGlobal';
import { LoaderGlobal } from '@/components/loaderGlobal';
import { PageHeaderGlobal } from '@/components/pageHeaderGlobal';
import { usePublicBracket } from '@/hooks/usePublicBracket';
import { useRouteParams } from '@/hooks/useRouteParams';
import { buildBracketLayout } from '@/utils/bracketLayout';

// Chaveamento dos playoffs; usado também no painel do admin e do dono do time.
export function BracketContent({ slug }: { slug: string }) {
  const { phases, champion, isPending, error, refetch } = usePublicBracket(slug);
  const layout = useMemo(() => buildBracketLayout(phases), [phases]);

  if (isPending) return <LoaderGlobal label="Carregando playoffs" />;
  if (error) return <ErrorStateGlobal error={error} onRetry={() => void refetch()} />;
  if (!layout.final) return <EmptyStateGlobal title="Ainda não há playoffs" />;
  return <BracketGlobal layout={layout} champion={champion} />;
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
