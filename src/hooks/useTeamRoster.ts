import { useState } from 'react';
import type { IJogador, ITime } from '@/@types/competition';
import type { IConfirmDialogProps } from '@/components/confirmDialogGlobal';
import type { IPlayerFormModalProps } from '@/components/playerFormModalGlobal';
import type { IRosterProps } from '@/components/rosterGlobal';
import { getErrorMessage } from '@/utils/appError';
import { usePlayers } from './usePlayers';

type ModalState = { type: 'form'; player?: IJogador } | { type: 'delete'; player: IJogador } | null;

// Liga o elenco (lista + formulário + exclusão) às mutações; usado pelo admin e pelo dono.
export function useTeamRoster(time: Pick<ITime, 'id' | 'competicao_id'>, canDelete: boolean) {
  const { players, isLoading, error, refetch, savePlayer, setPlayerActive, removePlayer } = usePlayers(time);
  const [modal, setModal] = useState<ModalState>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const open = (next: ModalState) => {
    savePlayer.reset();
    removePlayer.reset();
    setModal(next);
  };
  const close = () => setModal(null);

  const rosterProps: IRosterProps = {
    players,
    canDelete,
    busy: setPlayerActive.isPending,
    onAdd: () => open({ type: 'form' }),
    onEdit: (player) => open({ type: 'form', player }),
    onToggleActive: (player) => {
      setActionError(null);
      setPlayerActive.mutate(
        { id: player.id, ativo: !player.ativo },
        { onError: (err) => setActionError(getErrorMessage(err)) },
      );
    },
    onDelete: canDelete ? (player) => open({ type: 'delete', player }) : undefined,
  };

  const formProps: IPlayerFormModalProps | null =
    modal?.type === 'form'
      ? {
          open: true,
          player: modal.player,
          saving: savePlayer.isPending,
          error: savePlayer.error ? getErrorMessage(savePlayer.error) : null,
          onSubmit: (input, photo) => savePlayer.mutate({ jogador: modal.player, input, photo }, { onSuccess: close }),
          onClose: close,
        }
      : null;

  const deleteProps: IConfirmDialogProps | null =
    modal?.type === 'delete'
      ? {
          open: true,
          title: 'Excluir jogador',
          message: `Excluir ${modal.player.nome} do elenco? Para só tirar da súmula, prefira desativar.`,
          confirmLabel: 'Excluir',
          danger: true,
          loading: removePlayer.isPending,
          error: removePlayer.error ? getErrorMessage(removePlayer.error) : null,
          onConfirm: () => removePlayer.mutate(modal.player.id, { onSuccess: close }),
          onClose: close,
        }
      : null;

  return { isLoading, error, refetch, actionError, rosterProps, formProps, deleteProps, formKey: modal?.type === 'form' ? (modal.player?.id ?? 'novo') : '' };
}
