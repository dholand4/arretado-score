import { useMemo, useState } from 'react';
import type { IUsuarioListado, Papel } from '@/@types/user';
import { AlertGlobal, type AlertVariant } from '@/components/alertGlobal';
import { BadgeGlobal } from '@/components/badgeGlobal';
import { ButtonGlobal } from '@/components/buttonGlobal';
import { CardGlobal } from '@/components/cardGlobal';
import { ConfirmDialogGlobal } from '@/components/confirmDialogGlobal';
import { EmptyStateGlobal } from '@/components/emptyStateGlobal';
import { InputGlobal } from '@/components/inputGlobal';
import { LoaderGlobal } from '@/components/loaderGlobal';
import { PageHeaderGlobal } from '@/components/pageHeaderGlobal';
import { ResetPasswordModalGlobal } from '@/components/resetPasswordModalGlobal';
import { SelectGlobal } from '@/components/selectGlobal';
import { UserFormModalGlobal, type IUserFormSubmit } from '@/components/userFormModalGlobal';
import { PAPEL_LABEL, PAPEL_OPTIONS } from '@/constants/roles';
import { useAuth } from '@/hooks/useAuth';
import { useUserLeagues, useUsers } from '@/hooks/useUsers';
import { useConfirmAction } from '@/hooks/useConfirm';
import { getErrorMessage } from '@/utils/appError';
import { formatDateTime } from '@/utils/date';
import { filterUsers, type IUserFilters } from '@/utils/filterUsers';
import { generateTemporaryPassword } from '@/utils/password';
import { Actions, Badges, Count, Feedback, Filters, List, Meta, UserEmail, UserHeader, UserName } from './style';
import { formatPhone } from '@/utils/phone';

type ModalState =
  | { type: 'create' }
  | { type: 'edit'; user: IUsuarioListado }
  | { type: 'reset'; user: IUsuarioListado }
  | { type: 'toggle'; user: IUsuarioListado }
  | null;

const FILTER_OPTIONS = [{ value: '', label: 'Todos os papéis' }, ...PAPEL_OPTIONS];
const LIGA_TODAS = 'todas';
const ORDEM_NA_LIGA: Record<Papel, number> = { master: 0, admin: 1, dono_time: 2 };

export function UsersScreen() {
  const { profile } = useAuth();
  const { users, isLoading, error, refetch, createUser, updateUser, resetPassword } = useUsers();
  const { ligas } = useUserLeagues();
  // O coordenador só vê os logins das equipes que enxerga e só redefine a senha delas.
  const isMaster = profile?.papel === 'master';
  const [liga, setLiga] = useState(isMaster ? '' : LIGA_TODAS);
  const [filters, setFilters] = useState<IUserFilters>({ search: '', papel: '' });
  const [modal, setModal] = useState<ModalState>(null);
  const [feedback, setFeedback] = useState<{ variant: AlertVariant; message: string } | null>(null);
  const confirmAction = useConfirmAction();

  // Sem liga escolhida, só os masters (mandam em todas); numa liga, os coordenadores e
  // depois os logins dos times (o master que criou a liga fica de fora).
  const minhasLigas = isMaster ? ligas : ligas.filter((l) => profile && l.usuarios.includes(profile.id));
  const ligaOptions = [
    ...(isMaster ? [{ value: '', label: 'Escolha uma liga' }] : []),
    { value: LIGA_TODAS, label: isMaster ? 'Todas as ligas' : 'Todas as minhas ligas' },
    ...minhasLigas.map((l) => ({ value: l.id, label: l.nome })),
  ];
  const usersOfLeague = useMemo(() => {
    if (!liga) return users.filter((u) => u.papel === 'master');
    const escolhida = ligas.find((l) => l.id === liga);
    if (!escolhida) return users;
    const ids = new Set(escolhida.usuarios);
    return users
      .filter((u) => ids.has(u.id) && u.papel !== 'master')
      .sort((a, b) => ORDEM_NA_LIGA[a.papel] - ORDEM_NA_LIGA[b.papel]);
  }, [ligas, liga, users]);
  const visibleUsers = useMemo(() => filterUsers(usersOfLeague, filters), [usersOfLeague, filters]);

  const openModal = (next: ModalState) => {
    createUser.reset();
    updateUser.reset();
    resetPassword.reset();
    setModal(next);
  };
  const closeModal = () => setModal(null);

  const handleCreate = (values: IUserFormSubmit) =>
    confirmAction(`Criar o usuário ${values.nome} (${values.email})?`, () =>
      createUser.mutate(values, {
        onSuccess: (user) => {
          closeModal();
          setFeedback({
            variant: 'success',
            message: `Usuário ${user.nome} criado. Repasse o e-mail ${user.email} e a senha provisória "${values.senha}". A troca será exigida no primeiro acesso.`,
          });
        },
      }),
    );

  const handleEdit = (user: IUsuarioListado, values: IUserFormSubmit) =>
    confirmAction(`Salvar as alterações de ${values.nome}?`, () =>
      updateUser.mutate(
        { id: user.id, nome: values.nome, papel: values.papel, telefone: values.telefone || null },
        {
          onSuccess: () => {
            closeModal();
            setFeedback({ variant: 'success', message: `Usuário ${values.nome} atualizado.` });
          },
        },
      ),
    );

  const handleReset = (user: IUsuarioListado, senha: string) =>
    confirmAction(`Redefinir a senha de ${user.nome}?`, () =>
      resetPassword.mutate(
        { id: user.id, senha },
        {
          onSuccess: () => {
            closeModal();
            setFeedback({
              variant: 'success',
              message: `Senha de ${user.nome} redefinida para "${senha}". A troca será exigida no próximo acesso.`,
            });
          },
        },
      ),
    );

  const handleToggle = (user: IUsuarioListado) => {
    const ativo = !user.ativo;
    updateUser.mutate(
      { id: user.id, ativo },
      {
        onSuccess: () => {
          closeModal();
          setFeedback({
            variant: 'success',
            message: ativo ? `${user.nome} foi reativado.` : `${user.nome} foi desativado e não consegue mais entrar.`,
          });
        },
      },
    );
  };

  const mutationError = (err: unknown) => (err ? getErrorMessage(err) : null);

  const renderContent = () => {
    if (isLoading) return <LoaderGlobal label="Carregando usuários" />;
    if (error) {
      return (
        <EmptyStateGlobal
          title="Não foi possível carregar os usuários"
          description={getErrorMessage(error)}
          action={<ButtonGlobal label="Tentar novamente" variant="outline" onClick={() => void refetch()} />}
        />
      );
    }
    if (visibleUsers.length === 0) {
      const description = usersOfLeague.length
        ? 'Ajuste a busca ou o filtro de papel.'
        : !isMaster
          ? 'Cadastre o acesso da equipe junto com o time, na tela de Times da liga.'
          : liga === LIGA_TODAS || !liga
            ? 'Crie o primeiro usuário.'
          : 'Nenhum coordenador ou responsável de time nesta liga.';
      return <EmptyStateGlobal title="Nenhum usuário encontrado" description={description} />;
    }
    return (
      <>
        <Count>
          {liga
            ? `${visibleUsers.length} de ${usersOfLeague.length} usuário(s)`
            : `${visibleUsers.length} master(s), com acesso a todas as ligas. Escolha uma liga para ver os coordenadores e responsáveis de time.`}
        </Count>
        <List aria-label="Usuários">
          {visibleUsers.map((user) => {
            const isSelf = user.id === profile?.id;
            return (
              <CardGlobal key={user.id} as="li">
                <UserHeader>
                  <UserName>
                    {user.nome}
                    {isSelf && ' (você)'}
                  </UserName>
                  <UserEmail>{user.email}</UserEmail>
                  {user.telefone && <UserEmail>{formatPhone(user.telefone)}</UserEmail>}
                </UserHeader>
                <Badges>
                  <BadgeGlobal label={PAPEL_LABEL[user.papel]} tone={user.papel === 'master' ? 'primary' : 'info'} />
                  <BadgeGlobal label={user.ativo ? 'Ativo' : 'Inativo'} tone={user.ativo ? 'success' : 'danger'} />
                  {user.precisa_trocar_senha && <BadgeGlobal label="Troca de senha pendente" tone="warning" />}
                </Badges>
                <Meta>Último acesso: {formatDateTime(user.ultimo_acesso)}</Meta>
                <Actions>
                  {isMaster && (
                    <ButtonGlobal
                      label="Editar"
                      size="sm"
                      variant="outline"
                      onClick={() => openModal({ type: 'edit', user })}
                    />
                  )}
                  <ButtonGlobal
                    label="Redefinir senha"
                    size="sm"
                    variant="outline"
                    onClick={() => openModal({ type: 'reset', user })}
                  />
                  {isMaster && !isSelf && (
                    <ButtonGlobal
                      label={user.ativo ? 'Desativar' : 'Reativar'}
                      size="sm"
                      variant={user.ativo ? 'ghost' : 'secondary'}
                      onClick={() => openModal({ type: 'toggle', user })}
                    />
                  )}
                </Actions>
              </CardGlobal>
            );
          })}
        </List>
      </>
    );
  };

  return (
    <>
      <PageHeaderGlobal
        title="Usuários"
        subtitle={
          isMaster
            ? 'Coordenadores e equipes só entram com login criado aqui.'
            : 'Acessos das equipes das suas ligas. Redefina a senha quando uma equipe esquecer.'
        }
        actions={isMaster && <ButtonGlobal label="Novo usuário" onClick={() => openModal({ type: 'create' })} />}
      />

      {feedback && (
        <Feedback>
          <AlertGlobal variant={feedback.variant} message={feedback.message} onClose={() => setFeedback(null)} />
        </Feedback>
      )}

      <Filters>
        <SelectGlobal label="Liga" value={liga} options={ligaOptions} onChange={(e) => setLiga(e.target.value)} />
        <InputGlobal
          label="Buscar"
          type="search"
          placeholder="Nome, e-mail ou telefone"
          value={filters.search}
          onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
        />
        {isMaster && (
          <SelectGlobal
            label="Papel"
            value={filters.papel}
            options={FILTER_OPTIONS}
            onChange={(e) => setFilters((f) => ({ ...f, papel: e.target.value as Papel | '' }))}
          />
        )}
      </Filters>

      {renderContent()}

      {modal?.type === 'create' && (
        <UserFormModalGlobal
          open
          mode="create"
          submitting={createUser.isPending}
          error={mutationError(createUser.error)}
          onGeneratePassword={generateTemporaryPassword}
          onSubmit={handleCreate}
          onClose={closeModal}
        />
      )}

      {modal?.type === 'edit' && (
        <UserFormModalGlobal
          key={modal.user.id}
          open
          mode="edit"
          initialValues={{
            nome: modal.user.nome,
            email: modal.user.email,
            papel: modal.user.papel,
            telefone: modal.user.telefone,
          }}
          lockPapel={modal.user.id === profile?.id}
          submitting={updateUser.isPending}
          error={mutationError(updateUser.error)}
          onGeneratePassword={generateTemporaryPassword}
          onSubmit={(values) => handleEdit(modal.user, values)}
          onClose={closeModal}
        />
      )}

      {modal?.type === 'reset' && (
        <ResetPasswordModalGlobal
          key={modal.user.id}
          open
          userName={modal.user.nome}
          submitting={resetPassword.isPending}
          error={mutationError(resetPassword.error)}
          onGeneratePassword={generateTemporaryPassword}
          onSubmit={(senha) => handleReset(modal.user, senha)}
          onClose={closeModal}
        />
      )}

      {modal?.type === 'toggle' && (
        <ConfirmDialogGlobal
          open
          title={modal.user.ativo ? 'Desativar usuário' : 'Reativar usuário'}
          message={
            modal.user.ativo
              ? `${modal.user.nome} perde o acesso até ser reativado. Os dados são mantidos.`
              : `${modal.user.nome} volta a conseguir entrar com a senha atual.`
          }
          confirmLabel={modal.user.ativo ? 'Desativar' : 'Reativar'}
          danger={modal.user.ativo}
          loading={updateUser.isPending}
          error={mutationError(updateUser.error)}
          onConfirm={() => handleToggle(modal.user)}
          onClose={closeModal}
        />
      )}
    </>
  );
}
