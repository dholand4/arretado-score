import { useId, useState, type FormEvent } from 'react';
import { AlertGlobal } from '@/components/alertGlobal';
import { ButtonGlobal } from '@/components/buttonGlobal';
import { LoaderGlobal } from '@/components/loaderGlobal';
import { ModalGlobal } from '@/components/modalGlobal';
import { SelectGlobal } from '@/components/selectGlobal';
import { gameDetails, gameLabel } from '@/utils/eventSchedule';
import { Form, Muted } from './style';
import type { ISwapGameModalProps } from './types';

// Troca um jogo do dia por outro candidato (o que sai volta a pendente).
export function SwapGameModalGlobal({
  open,
  games,
  candidates,
  loadingCandidates = false,
  saving = false,
  error,
  onConfirm,
  onClose,
}: ISwapGameModalProps) {
  const formId = useId();
  const [saiId, setSaiId] = useState(games[0]?.id ?? '');
  const [entraId, setEntraId] = useState('');

  // Times que continuam no dia depois da troca: avisa se o candidato repete algum.
  const ocupados = new Set(games.filter((g) => g.id !== saiId).flatMap((g) => [g.time_casa_id, g.time_fora_id]));
  const candidateLabel = (c: (typeof candidates)[number]) => {
    const repete = ocupados.has(c.time_casa_id) || ocupados.has(c.time_fora_id);
    return `${gameLabel(c)} — ${gameDetails(c)}${repete ? ' (time já joga neste dia)' : ''}`;
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (saiId && entraId) onConfirm(saiId, entraId);
  };

  return (
    <ModalGlobal
      open={open}
      title="Trocar jogo"
      onClose={onClose}
      footer={
        <>
          <ButtonGlobal label="Cancelar" variant="ghost" onClick={onClose} disabled={saving} />
          <ButtonGlobal label="Trocar" type="submit" form={formId} loading={saving} disabled={!saiId || !entraId} />
        </>
      }
    >
      <Form id={formId} onSubmit={handleSubmit} noValidate>
        <SelectGlobal
          label="Jogo que sai"
          value={saiId}
          options={games.map((g) => ({ value: g.id, label: gameLabel(g) }))}
          onChange={(e) => setSaiId(e.target.value)}
        />
        {loadingCandidates ? (
          <LoaderGlobal label="Carregando jogos disponíveis" size="sm" inline />
        ) : candidates.length === 0 ? (
          <Muted>Não há outros jogos disponíveis para entrar neste dia.</Muted>
        ) : (
          <SelectGlobal
            label="Jogo que entra"
            value={entraId}
            options={[{ value: '', label: 'Escolha…' }, ...candidates.map((c) => ({ value: c.id, label: candidateLabel(c) }))]}
            onChange={(e) => setEntraId(e.target.value)}
          />
        )}
        {error && <AlertGlobal variant="error" message={error} />}
      </Form>
    </ModalGlobal>
  );
}

export type { ISwapGameModalProps } from './types';
