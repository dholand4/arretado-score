import { useState } from 'react';
import { AlertGlobal } from '@/components/alertGlobal';
import { AvatarGlobal } from '@/components/avatarGlobal';
import { BadgeGlobal } from '@/components/badgeGlobal';
import { ButtonGlobal } from '@/components/buttonGlobal';
import { CardGlobal } from '@/components/cardGlobal';
import { ErrorStateGlobal } from '@/components/errorStateGlobal';
import { LoaderGlobal } from '@/components/loaderGlobal';
import { PageHeaderGlobal } from '@/components/pageHeaderGlobal';
import { SelectGlobal } from '@/components/selectGlobal';
import { useAdminUsers, useCompetitionAdmins } from '@/hooks/useCompetitionAdmins';
import { useRouteParams } from '@/hooks/useRouteParams';
import { useConfirmAction } from '@/hooks/useConfirm';
import { getErrorMessage } from '@/utils/appError';
import { AddRow, Feedback, Item, List, Name } from './style';

export function CompetitionAdminsScreen() {
  const { competitionId } = useRouteParams('competitionId');
  const { admins, isLoading, error, refetch, addAdmin, removeAdmin } = useCompetitionAdmins(competitionId);
  const { adminUsers } = useAdminUsers();
  const [selected, setSelected] = useState('');
  const confirmAction = useConfirmAction();

  const disponiveis = adminUsers.filter((u) => !admins.some((a) => a.user_id === u.id));
  const actionError = addAdmin.error ?? removeAdmin.error;

  if (isLoading) return <LoaderGlobal label="Carregando coordenadores" />;
  if (error) return <ErrorStateGlobal error={error} onRetry={() => void refetch()} />;

  return (
    <>
      <PageHeaderGlobal
        title="Coordenadores da liga"
        subtitle="Quem pode configurar, cadastrar times e lançar súmulas. O Admin tem acesso a todas as ligas."
      />
      <CardGlobal>
        <List aria-label="Coordenadores">
          {admins.map((admin) => (
            <Item key={admin.user_id}>
              <AvatarGlobal name={admin.profile?.nome ?? '?'} size="sm" />
              <Name>
                {admin.profile?.nome ?? 'Usuário'}
                {admin.profile && !admin.profile.ativo && <BadgeGlobal label="Inativo" tone="danger" />}
              </Name>
              <ButtonGlobal
                label="Remover"
                size="sm"
                variant="ghost"
                disabled={removeAdmin.isPending}
                onClick={() =>
                  confirmAction(`Tirar ${admin.profile?.nome ?? 'este coordenador'} da liga?`, () =>
                    removeAdmin.mutate(admin.user_id),
                  )
                }
              />
            </Item>
          ))}
        </List>
        {admins.length === 0 && (
          <AlertGlobal variant="warning" message="Nenhum coordenador vinculado: só o Admin acessa." />
        )}
        <AddRow>
          <SelectGlobal
            label="Adicionar coordenador"
            value={selected}
            options={[
              { value: '', label: disponiveis.length ? 'Escolha um usuário…' : 'Nenhum coordenador disponível' },
              ...disponiveis.map((u) => ({ value: u.id, label: u.nome })),
            ]}
            onChange={(e) => setSelected(e.target.value)}
          />
          <ButtonGlobal
            label="Adicionar"
            disabled={!selected}
            loading={addAdmin.isPending}
            onClick={() =>
              confirmAction('Adicionar este coordenador à liga?', () =>
                addAdmin.mutate(selected, { onSuccess: () => setSelected('') }),
              )
            }
          />
        </AddRow>
        {actionError && (
          <Feedback>
            <AlertGlobal variant="error" message={getErrorMessage(actionError)} />
          </Feedback>
        )}
      </CardGlobal>
    </>
  );
}
