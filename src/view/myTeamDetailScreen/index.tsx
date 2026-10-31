import { useState } from 'react';
import type { ITimeDetalhe } from '@/@types/competition';
import { AlertGlobal } from '@/components/alertGlobal';
import { BadgeGlobal } from '@/components/badgeGlobal';
import { CardGlobal } from '@/components/cardGlobal';
import { ButtonGlobal } from '@/components/buttonGlobal';
import { EntityHeaderGlobal } from '@/components/entityHeaderGlobal';
import { ErrorStateGlobal } from '@/components/errorStateGlobal';
import { LinkButtonGlobal } from '@/components/linkButtonGlobal';
import { LoaderGlobal } from '@/components/loaderGlobal';
import { PlayerFormModalGlobal } from '@/components/playerFormModalGlobal';
import { RosterGlobal } from '@/components/rosterGlobal';
import { TeamFormModalGlobal } from '@/components/teamFormModalGlobal';
import { TeamPaymentsGlobal } from '@/components/teamPaymentsGlobal';
import { useBackNavigation } from '@/hooks/useBackNavigation';
import { useTeamPayments } from '@/hooks/useFinance';
import { useRouteParams } from '@/hooks/useRouteParams';
import { useTeamRoster } from '@/hooks/useTeamRoster';
import { useTeam } from '@/hooks/useTeams';
import { useConfirmAction } from '@/hooks/useConfirm';
import { ROUTES } from '@/routes/types';
import { getErrorMessage } from '@/utils/appError';
import { todayInFortaleza } from '@/utils/finance';
import { pluralize } from '@/utils/text';
import { Feedback } from './style';

function OwnerRoster({ team }: { team: ITimeDetalhe }) {
  const roster = useTeamRoster(team, false);
  if (roster.isLoading) return <LoaderGlobal label="Carregando elenco" />;
  if (roster.error) return <ErrorStateGlobal error={roster.error} onRetry={() => void roster.refetch()} />;
  return (
    <>
      {roster.actionError && (
        <Feedback>
          <AlertGlobal variant="error" message={roster.actionError} />
        </Feedback>
      )}
      <RosterGlobal {...roster.rosterProps} />
      {roster.formProps && <PlayerFormModalGlobal key={roster.formKey} {...roster.formProps} />}
    </>
  );
}

// Pagamentos do elenco (seção 8.2): só no modelo por time; não mostra a cobrança da competição.
function TeamPayments({ team }: { team: ITimeDetalhe }) {
  const { pagamentos, isLoading, error, refetch, generate, setStatus } = useTeamPayments(team.id, true);
  const [notice, setNotice] = useState<string | null>(null);
  const confirmAction = useConfirmAction();
  if (isLoading) return <LoaderGlobal label="Carregando pagamentos" />;
  if (error) return <ErrorStateGlobal error={error} onRetry={() => void refetch()} />;
  return (
    <TeamPaymentsGlobal
      payments={pagamentos}
      defaultMonth={todayInFortaleza()}
      busy={generate.isPending || setStatus.isPending}
      error={generate.error || setStatus.error ? getErrorMessage(generate.error ?? setStatus.error) : null}
      notice={notice}
      onGenerate={(referencia, valor) =>
        confirmAction('Gerar os pagamentos deste mês para o elenco?', () => {
          setNotice(null);
          generate.mutate(
            { referencia, valor },
            {
              onSuccess: (qtd) =>
                setNotice(qtd ? `${pluralize(qtd, 'linha criada', 'linhas criadas')}.` : 'Esse mês já estava gerado.'),
            },
          );
        })
      }
      onSetStatus={(id, status) =>
        confirmAction('Alterar a situação deste pagamento?', () => setStatus.mutate({ id, status }))
      }
    />
  );
}

export function MyTeamDetailScreen() {
  const { teamId } = useRouteParams('teamId');
  useBackNavigation({ to: ROUTES.myTeams, label: 'Meus times' });
  const { team, isLoading, error, refetch, updateTeam } = useTeam(teamId);
  const [editing, setEditing] = useState(false);
  const confirmAction = useConfirmAction();

  if (isLoading) return <LoaderGlobal label="Carregando time" />;
  if (error || !team) return <ErrorStateGlobal error={error} onRetry={() => void refetch()} />;

  return (
    <>
      <EntityHeaderGlobal
        title={team.nome}
        subtitle={team.competicao.nome}
        imageUrl={team.logo_url}
        badges={team.sigla ? <BadgeGlobal label={team.sigla} /> : undefined}
        actions={
          <>
            <LinkButtonGlobal to={ROUTES.myTeams} label="← Meus times" size="sm" variant="ghost" hideOnMobile />
            <ButtonGlobal
              label="Editar nome e logo"
              size="sm"
              variant="outline"
              onClick={() => {
                updateTeam.reset();
                setEditing(true);
              }}
            />
          </>
        }
      />
      <OwnerRoster team={team} />
      {team.competicao.cobranca_modelo === 'por_time' && (
        <CardGlobal title="Pagamentos do elenco">
          <TeamPayments team={team} />
        </CardGlobal>
      )}
      {editing && (
        <TeamFormModalGlobal
          open
          ownerMode
          initialValues={{ nome: team.nome, sigla: team.sigla ?? '', dono_id: team.dono_id, logo_url: team.logo_url }}
          saving={updateTeam.isPending}
          error={updateTeam.error ? getErrorMessage(updateTeam.error) : null}
          onSubmit={(values, logo) =>
            confirmAction('Salvar as alterações do time?', () =>
              updateTeam.mutate({ patch: { nome: values.nome }, logo }, { onSuccess: () => setEditing(false) }),
            )
          }
          onClose={() => setEditing(false)}
        />
      )}
    </>
  );
}
