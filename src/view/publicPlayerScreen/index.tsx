import { BadgeGlobal } from '@/components/badgeGlobal';
import { EmptyStateGlobal } from '@/components/emptyStateGlobal';
import { EntityHeaderGlobal } from '@/components/entityHeaderGlobal';
import { ErrorStateGlobal } from '@/components/errorStateGlobal';
import { LinkButtonGlobal } from '@/components/linkButtonGlobal';
import { LoaderGlobal } from '@/components/loaderGlobal';
import { PlayerGameLogGlobal } from '@/components/playerGameLogGlobal';
import { usePublicCompetition, usePublicPlayer } from '@/hooks/usePublic';
import { useRouteParams } from '@/hooks/useRouteParams';
import { paths } from '@/routes/types';
import { AppError } from '@/utils/appError';
import { formatAverage, sortPlayerGames } from '@/utils/publicView';
import { NumberAverage, NumberLabel, Numbers, NumberTile, NumberValue, Section, SectionTitle, Stack } from './style';

// Página do jogador: cabeçalho, números na competição e jogo a jogo (seção 6.7.1).
export function PublicPlayerScreen() {
  const { slug, playerId } = useRouteParams('slug', 'playerId');
  const { competicao } = usePublicCompetition(slug);
  const { atleta, isLoading, error, refetch } = usePublicPlayer(playerId);

  if (isLoading) return <LoaderGlobal label="Carregando jogador" />;
  // Jogador de outra liga aberto com o endereço desta: trata como não encontrado.
  const deOutraLiga = Boolean(atleta && competicao && atleta.jogador.competicao_id !== competicao.id);
  if (error || !atleta || deOutraLiga) {
    return <ErrorStateGlobal error={error ?? new AppError('Jogador não encontrado.')} onRetry={() => void refetch()} />;
  }

  const { jogador, time, jogosDisputados, numeros, jogos } = atleta;
  const subtitulo = [jogador.apelido && `“${jogador.apelido}”`, time?.nome].filter(Boolean).join(' · ');

  return (
    <Stack>
      <EntityHeaderGlobal
        title={jogador.nome}
        subtitle={subtitulo || undefined}
        imageUrl={jogador.foto_url}
        imageShape="circle"
        badges={
          <>
            {jogador.numero !== null && <BadgeGlobal label={`Nº ${jogador.numero}`} tone="primary" />}
            {jogador.posicao && <BadgeGlobal label={jogador.posicao} />}
            {!jogador.ativo && <BadgeGlobal label="Inativo" tone="warning" />}
          </>
        }
        actions={
          time ? (
            <LinkButtonGlobal to={paths.publicTeam(slug, time.id)} label={`Ver ${time.nome}`} variant="outline" size="sm" />
          ) : undefined
        }
      />
      {jogosDisputados === 0 ? (
        <EmptyStateGlobal
          title="Ainda sem números"
          description="Os números aparecem depois da primeira súmula completa com este jogador. Jogos só com placar e W.O. não entram."
        />
      ) : (
        <>
          <Section>
            <SectionTitle>Números na competição</SectionTitle>
            <Numbers>
              <NumberTile>
                <NumberLabel>Jogos</NumberLabel>
                <NumberValue>{jogosDisputados}</NumberValue>
              </NumberTile>
              {numeros.map(({ categoria, total, media }) => (
                <NumberTile key={categoria.id}>
                  <NumberLabel>{categoria.nome}</NumberLabel>
                  <NumberValue>{total}</NumberValue>
                  <NumberAverage>{formatAverage(media)} por jogo</NumberAverage>
                </NumberTile>
              ))}
            </Numbers>
          </Section>
          <Section>
            <SectionTitle>Jogo a jogo</SectionTitle>
            <PlayerGameLogGlobal
              games={sortPlayerGames(jogos)}
              categories={numeros.map((n) => n.categoria)}
              gameHref={(jogoId) => paths.publicGame(slug, jogoId)}
            />
          </Section>
        </>
      )}
    </Stack>
  );
}
