import { useState, type FormEvent } from 'react';
import type { IOficiaisMesa } from '@/@types/liveSheet';
import { AlertGlobal } from '@/components/alertGlobal';
import { ButtonGlobal } from '@/components/buttonGlobal';
import { CheckboxGlobal } from '@/components/checkboxGlobal';
import { FormActionsGlobal } from '@/components/formActionsGlobal';
import { InputGlobal } from '@/components/inputGlobal';
import { Count, Form, Legend, Officials, Team, TeamHeader, Teams } from './style';
import type { ILiveLineupProps } from './types';

const OFICIAIS: { campo: keyof IOficiaisMesa; label: string }[] = [
  { campo: 'arbitro', label: 'Árbitro' },
  { campo: 'fiscal', label: 'Fiscal' },
  { campo: 'apontador', label: 'Apontador' },
  { campo: 'cronometrista', label: 'Cronometrista' },
  { campo: 'operador_24', label: 'Operador 24"' },
];

// Quem vai jogar em cada time e os nomes da arbitragem e da mesa (opcionais).
export function LiveLineupGlobal({
  times,
  escalados: iniciais,
  oficiais: oficiaisIniciais,
  travados = [],
  submitLabel,
  saving = false,
  error,
  onSubmit,
  onCancel,
}: ILiveLineupProps) {
  const [escalados, setEscalados] = useState(() => new Set(iniciais));
  const [oficiais, setOficiais] = useState(oficiaisIniciais);
  const [aviso, setAviso] = useState<string | null>(null);

  const alternar = (id: string, marcado: boolean) =>
    setEscalados((atual) => {
      const proximo = new Set(atual);
      if (marcado) proximo.add(id);
      else proximo.delete(id);
      return proximo;
    });

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const semNinguem = times.find((t) => !t.jogadores.some((j) => escalados.has(j.id)));
    if (semNinguem) {
      setAviso(`Marque ao menos um jogador de ${semNinguem.nome}.`);
      return;
    }
    setAviso(null);
    onSubmit([...escalados], oficiais);
  };

  return (
    <Form onSubmit={handleSubmit} noValidate aria-label="Escalação">
      <Teams>
        {times.map((time) => {
          const marcados = time.jogadores.filter((j) => escalados.has(j.id)).length;
          return (
            <Team key={time.id}>
              <TeamHeader>
                {time.nome} <Count>{marcados} marcados</Count>
              </TeamHeader>
              <ButtonGlobal
                label="Marcar todos"
                size="sm"
                variant="ghost"
                onClick={() => time.jogadores.forEach((j) => alternar(j.id, true))}
              />
              {time.jogadores.map((jogador) => (
                <CheckboxGlobal
                  key={jogador.id}
                  label={jogador.rotulo}
                  checked={escalados.has(jogador.id)}
                  disabled={travados.includes(jogador.id)}
                  onChange={(e) => alternar(jogador.id, e.target.checked)}
                />
              ))}
            </Team>
          );
        })}
      </Teams>
      <section>
        <Legend>Arbitragem e mesa (opcional)</Legend>
        <Officials>
          {OFICIAIS.map(({ campo, label }) => (
            <InputGlobal
              key={campo}
              label={label}
              value={oficiais[campo]}
              onChange={(e) => setOficiais((atual) => ({ ...atual, [campo]: e.target.value }))}
            />
          ))}
        </Officials>
      </section>
      {(aviso || error) && <AlertGlobal variant="error" message={aviso ?? error ?? ''} />}
      <FormActionsGlobal>
        {onCancel && <ButtonGlobal label="Cancelar" variant="outline" onClick={onCancel} disabled={saving} />}
        <ButtonGlobal label={submitLabel} type="submit" loading={saving} />
      </FormActionsGlobal>
    </Form>
  );
}

export type { ILineupTeam, ILiveLineupProps } from './types';
