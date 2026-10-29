import { ButtonGlobal } from '@/components/buttonGlobal';
import { CardGlobal } from '@/components/cardGlobal';
import { CRITERIOS_DESEMPATE, MIN_TIMES_PARA_INICIAR, MODALIDADE_LABEL } from '@/constants/competition';
import type { WizardStepKey } from '@/constants/competition';
import { pluralize } from '@/utils/text';
import { List, Muted, Sections, Term, Value } from './style';
import type { ICompetitionReviewProps } from './types';

export function CompetitionReviewGlobal({ competition: c, categories, teamsCount, onEditStep }: ICompetitionReviewProps) {
  const edit = (step: WizardStepKey) => (
    <ButtonGlobal label="Editar" size="sm" variant="ghost" onClick={() => onEditStep(step)} />
  );
  const ativas = categories.filter((cat) => cat.ativa);

  return (
    <Sections>
      <CardGlobal title="Dados básicos" actions={edit('dados')}>
        <List>
          <Term>Nome</Term>
          <Value>{c.nome}</Value>
          <Term>Endereço</Term>
          <Value>/c/{c.slug}</Value>
          <Term>Modalidade</Term>
          <Value>{MODALIDADE_LABEL[c.modalidade]}</Value>
          <Term>Local padrão</Term>
          <Value>{c.local_padrao || '—'}</Value>
          <Term>Intervalo</Term>
          <Value>{c.intervalo_jogos_min} min</Value>
        </List>
      </CardGlobal>

      <CardGlobal title="Pontuação e W.O." actions={edit('pontuacao')}>
        <List>
          <Term>Vitória</Term>
          <Value>{pluralize(c.pontos_vitoria, 'ponto', 'pontos')}</Value>
          {c.permite_empate && (
            <>
              <Term>Empate</Term>
              <Value>{pluralize(c.pontos_empate, 'ponto', 'pontos')}</Value>
            </>
          )}
          <Term>Derrota</Term>
          <Value>{pluralize(c.pontos_derrota, 'ponto', 'pontos')}</Value>
          <Term>Derrota W.O.</Term>
          <Value>{pluralize(c.pontos_derrota_wo, 'ponto', 'pontos')}</Value>
          <Term>Placar W.O.</Term>
          <Value>
            {c.wo_placar_vencedor} x {c.wo_placar_perdedor}
          </Value>
          <Term>Desempate</Term>
          <Value>{c.criterios_desempate.map((k) => CRITERIOS_DESEMPATE[k].label).join(' → ') || '—'}</Value>
        </List>
      </CardGlobal>

      <CardGlobal title="Estatísticas" actions={edit('estatisticas')}>
        <List>
          {ativas.map((cat) => (
            <Value key={cat.id} as="div">
              <strong>{cat.sigla}</strong> {cat.nome} — ranking “{cat.titulo_ranking}”
            </Value>
          ))}
        </List>
        {ativas.length < categories.length && (
          <Muted>{pluralize(categories.length - ativas.length, 'categoria inativa', 'categorias inativas')}.</Muted>
        )}
      </CardGlobal>

      <CardGlobal title="Times">
        <Muted>
          {pluralize(teamsCount, 'time cadastrado', 'times cadastrados')}
          {teamsCount < MIN_TIMES_PARA_INICIAR && ` — são necessários ao menos ${MIN_TIMES_PARA_INICIAR} para iniciar.`}
        </Muted>
      </CardGlobal>

      <CardGlobal title="Fases e cobrança">
        <Muted>Configuração das fases (e o botão “Iniciar competição”) e da cobrança entram nas próximas etapas.</Muted>
      </CardGlobal>
    </Sections>
  );
}

export type { ICompetitionReviewProps } from './types';
