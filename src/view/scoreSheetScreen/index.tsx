import { useState } from 'react';
import type { ISumula, ModoResultado, WoAusente } from '@/@types/game';
import { AlertGlobal } from '@/components/alertGlobal';
import { ButtonGlobal } from '@/components/buttonGlobal';
import { ErrorStateGlobal } from '@/components/errorStateGlobal';
import { FormActionsGlobal } from '@/components/formActionsGlobal';
import { InputGlobal } from '@/components/inputGlobal';
import { LinkButtonGlobal } from '@/components/linkButtonGlobal';
import { LoaderGlobal } from '@/components/loaderGlobal';
import { PageHeaderGlobal } from '@/components/pageHeaderGlobal';
import { ScoreboardGlobal } from '@/components/scoreboardGlobal';
import { ScoreSheetTeamGlobal } from '@/components/scoreSheetTeamGlobal';
import { SegmentedGlobal } from '@/components/segmentedGlobal';
import { SelectGlobal } from '@/components/selectGlobal';
import { useAuth } from '@/hooks/useAuth';
import { useRouteParams } from '@/hooks/useRouteParams';
import { useScoreSheet } from '@/hooks/useScoreSheet';
import { paths } from '@/routes/types';
import { getErrorMessage } from '@/utils/appError';
import {
  buildResultInput,
  displayedScore,
  initialSheetState,
  sheetError,
  sortByNumber,
  teamScore,
  type ISheetState,
} from '@/utils/scoreSheet';
import { Grid, Help, Stack, Teams } from './style';

const MODOS: { value: ModoResultado; label: string }[] = [
  { value: 'completa', label: 'Súmula completa' },
  { value: 'placar', label: 'Só o placar' },
  { value: 'wo', label: 'W.O.' },
];

interface ISheetFormProps {
  sumula: ISumula;
  isMaster: boolean;
  saving: boolean;
  saveError: unknown;
  onSave: (state: ISheetState) => Promise<unknown>;
}

function SheetForm({ sumula, isMaster, saving, saveError, onSave }: ISheetFormProps) {
  const [state, setState] = useState<ISheetState>(() => initialSheetState(sumula));
  const [validation, setValidation] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const { jogo } = sumula;

  const cancelado = jogo.status === 'cancelado';
  const bloqueado = cancelado || (sumula.edicaoRestrita && !isMaster);
  const [placarCasa, placarFora] = displayedScore(sumula, state);

  const update = (patch: Partial<ISheetState>) => {
    setSaved(false);
    setState((current) => ({ ...current, ...patch }));
  };

  const togglePresent = (jogadorId: string, presente: boolean) =>
    update({
      presentes: presente
        ? [...new Set([...state.presentes, jogadorId])]
        : state.presentes.filter((id) => id !== jogadorId),
    });

  // Preencher qualquer número marca a presença (seção 6.5).
  const changeValue = (jogadorId: string, categoriaId: string, valor: string) =>
    update({
      valores: { ...state.valores, [jogadorId]: { ...state.valores[jogadorId], [categoriaId]: valor } },
      presentes:
        valor !== '' && !state.presentes.includes(jogadorId) ? [...state.presentes, jogadorId] : state.presentes,
    });

  const submit = async () => {
    const erro = sheetError(sumula, state);
    setValidation(erro);
    if (erro) return;
    try {
      await onSave(state);
      setSaved(true);
    } catch {
      // A mensagem vem de saveError.
    }
  };

  const teamProps = (timeId: string, nome: string) => ({
    teamName: nome,
    score: teamScore(sumula, state, timeId),
    players: sortByNumber(sumula.jogadores.filter((jogador) => jogador.time_id === timeId)),
    categories: sumula.categorias,
    present: state.presentes,
    values: state.valores,
    disabled: bloqueado,
    onTogglePresent: togglePresent,
    onChangeValue: changeValue,
  });

  return (
    <>
      <ScoreboardGlobal
        home={sumula.casa}
        away={sumula.fora}
        homeScore={placarCasa}
        awayScore={placarFora}
        subtitle={sumula.fase.nome}
      />
      <Stack>
        {cancelado && <AlertGlobal variant="warning" message="Jogo cancelado não recebe súmula." />}
        {sumula.edicaoRestrita && (
          <AlertGlobal
            variant="warning"
            message={
              isMaster
                ? 'A fase seguinte já tem resultado. Ao editar, confira séries e classificação depois.'
                : 'A fase seguinte já tem resultado: só o admin master pode editar esta súmula.'
            }
          />
        )}
        <SegmentedGlobal
          ariaLabel="Tipo de lançamento"
          options={MODOS}
          value={state.modo}
          disabled={bloqueado}
          onChange={(modo) => update({ modo })}
        />

        {state.modo === 'completa' && (
          <Teams>
            <ScoreSheetTeamGlobal {...teamProps(jogo.time_casa_id, sumula.casa)} />
            <ScoreSheetTeamGlobal {...teamProps(jogo.time_fora_id, sumula.fora)} />
          </Teams>
        )}

        {state.modo === 'placar' && (
          <>
            <Help>O placar conta na tabela e nas séries, mas não nos rankings. Estatísticas já lançadas são apagadas.</Help>
            <Grid>
              <InputGlobal
                label={sumula.casa}
                type="number"
                inputMode="numeric"
                min={0}
                value={state.placarCasa}
                disabled={bloqueado}
                onChange={(event) => update({ placarCasa: event.target.value })}
              />
              <InputGlobal
                label={sumula.fora}
                type="number"
                inputMode="numeric"
                min={0}
                value={state.placarFora}
                disabled={bloqueado}
                onChange={(event) => update({ placarFora: event.target.value })}
              />
            </Grid>
          </>
        )}

        {state.modo === 'wo' && (
          <>
            <Help>
              Placar automático de {sumula.competicao.wo_placar_vencedor} x {sumula.competicao.wo_placar_perdedor} para o
              time presente; W.O. duplo fica 0 x 0, sem vencedor. Sem estatísticas de jogadores.
            </Help>
            <SelectGlobal
              label="Quem faltou?"
              value={state.ausente}
              disabled={bloqueado}
              options={[
                { value: '', label: 'Selecione' },
                { value: 'casa', label: sumula.casa },
                { value: 'fora', label: sumula.fora },
                { value: 'ambos', label: 'Os dois times' },
              ]}
              onChange={(event) => update({ ausente: event.target.value as WoAusente | '' })}
            />
          </>
        )}

        {validation && <AlertGlobal variant="error" message={validation} />}
        {!validation && saveError !== null && saveError !== undefined && (
          <AlertGlobal variant="error" message={getErrorMessage(saveError)} />
        )}
        {saved && <AlertGlobal variant="success" message="Resultado salvo. Tabela e séries já foram atualizadas." />}

        <FormActionsGlobal>
          <ButtonGlobal label="Salvar resultado" loading={saving} disabled={bloqueado || saving} onClick={() => void submit()} />
        </FormActionsGlobal>
      </Stack>
    </>
  );
}

export function ScoreSheetScreen() {
  const { competitionId, gameId } = useRouteParams('competitionId', 'gameId');
  const { profile } = useAuth();
  const { sumula, isLoading, error, refetch, saveResult } = useScoreSheet(competitionId, gameId);

  const renderContent = () => {
    if (isLoading) return <LoaderGlobal label="Carregando súmula" />;
    if (error || !sumula) return <ErrorStateGlobal error={error} onRetry={() => void refetch()} />;
    return (
      <SheetForm
        key={sumula.jogo.id}
        sumula={sumula}
        isMaster={profile?.papel === 'master'}
        saving={saveResult.isPending}
        saveError={saveResult.error}
        onSave={(state) => saveResult.mutateAsync(buildResultInput(state))}
      />
    );
  };

  return (
    <>
      <PageHeaderGlobal
        title="Súmula"
        actions={<LinkButtonGlobal to={paths.competitionGames(competitionId)} label="← Jogos" size="sm" variant="ghost" />}
      />
      {renderContent()}
    </>
  );
}
