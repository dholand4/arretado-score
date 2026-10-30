import { useState } from 'react';
import { AlertGlobal } from '@/components/alertGlobal';
import { ButtonGlobal } from '@/components/buttonGlobal';
import { InputGlobal } from '@/components/inputGlobal';
import { Box, Buttons, Help, Line } from './style';
import type { IStandingsAdjustProps } from './types';

// Desempate manual só para times em empate técnico (seção 6.3); cada ajuste fica registrado.
export function StandingsAdjustGlobal({ tiedRows, busy = false, error, onSave, onRemove }: IStandingsAdjustProps) {
  const [priorities, setPriorities] = useState<Record<string, string>>({});

  if (tiedRows.length === 0) return <Help>Não há empate técnico nesta classificação.</Help>;

  return (
    <Box>
      <Help>Em empate técnico, informe a prioridade (1 fica na frente). A alteração fica registrada.</Help>
      {tiedRows.map((row) => {
        const value = priorities[row.time_id] ?? '';
        const valid = Number.isInteger(Number(value)) && Number(value) >= 1;
        return (
          <Line key={row.time_id}>
            <InputGlobal
              label={`${row.posicao}º ${row.nome} — prioridade`}
              type="number"
              inputMode="numeric"
              min={1}
              step={1}
              value={value}
              onChange={(event) => setPriorities((current) => ({ ...current, [row.time_id]: event.target.value }))}
            />
            <Buttons>
              <ButtonGlobal
                label="Salvar"
                size="sm"
                disabled={busy || value === '' || !valid}
                onClick={() => onSave(row.time_id, Number(value))}
              />
              <ButtonGlobal label="Remover" size="sm" variant="ghost" disabled={busy} onClick={() => onRemove(row.time_id)} />
            </Buttons>
          </Line>
        );
      })}
      {error && <AlertGlobal variant="error" message={error} />}
    </Box>
  );
}

export type { IStandingsAdjustProps, IStandingsAdjustRow } from './types';
