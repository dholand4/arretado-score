import { useState, type FormEvent } from 'react';
import type { IOficiaisMesa } from '@/@types/liveSheet';
import { AlertGlobal } from '@/components/alertGlobal';
import { ButtonGlobal } from '@/components/buttonGlobal';
import { CheckboxGlobal } from '@/components/checkboxGlobal';
import { FormActionsGlobal } from '@/components/formActionsGlobal';
import { InputGlobal } from '@/components/inputGlobal';
import { MAX_ESCALADOS_POR_TIME } from '@/utils/liveSheet';
import { Count, Form, Hint, Legend, Officials, Team, TeamHeader, Teams } from './style';
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
    const demais = times.find((t) => t.jogadores.filter((j) => escalados.has(j.id)).length > MAX_ESCALADOS_POR_TIME);
    if (demais) {
      setAviso(`Marque no máximo ${MAX_ESCALADOS_POR_TIME} jogadores de ${demais.nome}.`);
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
          // Elenco maior que o limite: o mesário escolhe quem entra na súmula.
          const escolher = time.jogadores.length > MAX_ESCALADOS_POR_TIME;
          const cheio = marcados >= MAX_ESCALADOS_POR_TIME;
          return (
            <Team key={time.id}>
              <TeamHeader>
                {time.nome}{' '}
                <Count>{escolher ? `${marcados} de ${MAX_ESCALADOS_POR_TIME} marcados` : `${marcados} marcados`}</Count>
              </TeamHeader>
              {escolher ? (
                <Hint>
                  {time.jogadores.length} no elenco: escolha até {MAX_ESCALADOS_POR_TIME} para o jogo.
                </Hint>
              ) : (
                <ButtonGlobal
                  label="Marcar todos"
                  size="sm"
                  variant="ghost"
                  onClick={() => time.jogadores.forEach((j) => alternar(j.id, true))}
                />
              )}
              {time.jogadores.map((jogador) => (
                <CheckboxGlobal
                  key={jogador.id}
                  label={jogador.rotulo}
                  checked={escalados.has(jogador.id)}
                  disabled={travados.includes(jogador.id) || (cheio && !escalados.has(jogador.id))}
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
