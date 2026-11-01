import { useEffect, useMemo, useState } from 'react';
import type { IJogadorMesa, IOficiaisMesa, TipoFalta } from '@/@types/liveSheet';
import { AlertGlobal } from '@/components/alertGlobal';
import { BadgeGlobal } from '@/components/badgeGlobal';
import { ButtonGlobal } from '@/components/buttonGlobal';
import { CardGlobal } from '@/components/cardGlobal';
import { ConfirmDialogGlobal } from '@/components/confirmDialogGlobal';
import { EmptyStateGlobal } from '@/components/emptyStateGlobal';
import { ErrorStateGlobal } from '@/components/errorStateGlobal';
import { LinkButtonGlobal } from '@/components/linkButtonGlobal';
import { LiveLineupGlobal } from '@/components/liveLineupGlobal';
import { LivePlayLogGlobal } from '@/components/livePlayLogGlobal';
import { LiveScoreboardGlobal } from '@/components/liveScoreboardGlobal';
import { LiveTeamPanelGlobal } from '@/components/liveTeamPanelGlobal';
import { LoaderGlobal } from '@/components/loaderGlobal';
import { ModalGlobal } from '@/components/modalGlobal';
import { SegmentedGlobal } from '@/components/segmentedGlobal';
import { useLiveSheet } from '@/hooks/useLiveSheet';
import { useRouteParams } from '@/hooks/useRouteParams';
import { paths } from '@/routes/types';
import { getErrorMessage } from '@/utils/appError';
import {
  TIPO_FALTA_LABEL,
  describeLance,
  formatLanceTime,
  periodLabel,
  periodShortLabel,
  playerLabel,
} from '@/utils/liveSheet';
import {
  Banner,
  Column,
  Columns,
  FoulChoices,
  Intro,
  Muted,
  Page,
  PeriodScore,
  PeriodScores,
  SectionTitle,
  Tabs,
  Title,
  Toolbar,
  TopBar,
} from './style';

type Aba = 'casa' | 'fora' | 'lances';
type Dialogo = null | 'encerrar' | 'descartar' | { jogadorId: string; timeId: string };

const OUTRAS_FALTAS: TipoFalta[] = ['tecnica', 'antidesportiva', 'desqualificante'];
const SEM_OFICIAIS: IOficiaisMesa = { apontador: '', cronometrista: '', operador_24: '', arbitro: '', fiscal: '' };

// Súmula ao vivo (seção 6.5.1): o mesário lança pontos, faltas e tempos com cronômetro e relógio de posse.
export function LiveScoreSheetScreen() {
  const { competitionId, gameId } = useRouteParams('competitionId', 'gameId');
  const mesa = useLiveSheet(competitionId, gameId);
  const { ctx, relogio, resumo } = mesa;
  const [aba, setAba] = useState<Aba>('casa');
  const [editandoEscalacao, setEditandoEscalacao] = useState(false);
  const [dialogo, setDialogo] = useState<Dialogo>(null);
  const [mensagem, setMensagem] = useState<string | null>(null);

  const jogadores = useMemo(() => new Map((ctx?.jogadores ?? []).map((j) => [j.id, j])), [ctx?.jogadores]);
  const escalados = ctx?.mesa?.escalados ?? [];

  const alternarRelogio = relogio?.rodando ? mesa.pausar : mesa.iniciar;
  const emJogo = ctx?.mesa?.status === 'em_andamento' && escalados.length > 0 && !editandoEscalacao;

  // Atalhos no computador: espaço liga/desliga o relógio; Ctrl/Cmd+Z desfaz o último lance.
  useEffect(() => {
    if (!emJogo) return;
    const onKey = (event: KeyboardEvent) => {
      const alvo = event.target instanceof Element ? event.target : null;
      if (alvo?.closest('input, textarea, select, button, [role="dialog"]')) return;
      if (event.code === 'Space') {
        event.preventDefault();
        alternarRelogio();
      } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        mesa.desfazer();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [emJogo, alternarRelogio, mesa]);

  const avisar = (erro: string | null) => setMensagem(erro);

  const voltar = (
    <LinkButtonGlobal to={paths.competitionGames(competitionId)} label="← Jogos" size="sm" variant="ghost" />
  );

  if (mesa.isLoading) return <LoaderGlobal label="Carregando a mesa" />;
  if (mesa.error || !ctx) {
    return (
      <Page>
        <TopBar>{voltar}</TopBar>
        <ErrorStateGlobal error={mesa.error} onRetry={() => void mesa.refetch()} />
      </Page>
    );
  }

  const titulo = `${ctx.casa.nome} x ${ctx.fora.nome}`;
  const rotulo = (j: IJogadorMesa) => playerLabel(j);
  const doTime = (timeId: string) => ctx.jogadores.filter((j) => j.time_id === timeId);
  const nomeDoTime = (timeId: string) => (timeId === ctx.casa.id ? ctx.casa.nome : ctx.fora.nome);
  const itensLances = [...mesa.lances].reverse().map((l) => ({
    id: l.id,
    periodo: periodShortLabel(l.periodo, ctx.competicao),
    tempo: formatLanceTime(l.tempo_restante_ms),
    texto: describeLance(l, l.jogador_id ? jogadores.get(l.jogador_id) : undefined, nomeDoTime(l.time_id)),
    anulado: l.anulado,
    pendente: Boolean(l.pendente),
  }));

  // ---- Mesa ainda não aberta ---------------------------------------------------------------
  if (!ctx.mesa) {
    const temResultado = !['pendente', 'agendado'].includes(ctx.jogo.status);
    return (
      <Page>
        <TopBar>
          {voltar}
          <Title>{titulo}</Title>
        </TopBar>
        <Intro>
          {temResultado ? (
            <EmptyStateGlobal
              title="Este jogo já tem resultado"
              description="Para corrigir, use a súmula normal."
              action={<LinkButtonGlobal to={paths.gameScoreSheet(competitionId, gameId)} label="Abrir súmula" />}
            />
          ) : (
            <CardGlobal title="Súmula ao vivo">
              <Muted>
                O mesário registra o jogo em tempo real: cronômetro, relógio de posse, pontos, faltas e tempos. Enquanto a
                mesa estiver aberta, a súmula normal e o W.O. deste jogo ficam bloqueados.
              </Muted>
              {mesa.abrir.error && <AlertGlobal variant="error" message={getErrorMessage(mesa.abrir.error)} />}
              <Toolbar>
                <ButtonGlobal label="Abrir a mesa" loading={mesa.abrir.isPending} onClick={() => mesa.abrir.mutate()} />
                <LinkButtonGlobal
                  to={paths.gameScoreSheet(competitionId, gameId)}
                  label="Usar a súmula normal"
                  variant="ghost"
                />
              </Toolbar>
            </CardGlobal>
          )}
        </Intro>
      </Page>
    );
  }

  // ---- Mesa encerrada: só leitura ---------------------------------------------------------
  if (ctx.mesa.status === 'encerrada') {
    return (
      <Page>
        <TopBar>
          {voltar}
          <Title>{titulo}</Title>
        </TopBar>
        <Intro>
          <AlertGlobal
            variant="success"
            message={`Jogo encerrado: ${ctx.casa.nome} ${resumo?.placar.casa ?? ''} x ${resumo?.placar.fora ?? ''} ${ctx.fora.nome}. Rebotes, assistências e correções vão na súmula normal.`}
          />
          <Toolbar>
            <LinkButtonGlobal to={paths.gameScoreSheet(competitionId, gameId)} label="Abrir súmula" />
          </Toolbar>
          <SectionTitle>Lances</SectionTitle>
          <LivePlayLogGlobal itens={itensLances} />
        </Intro>
      </Page>
    );
  }

  // ---- Escalação --------------------------------------------------------------------------
  if (escalados.length === 0 || editandoEscalacao) {
    const comLances = [...new Set(mesa.lances.filter((l) => !l.anulado && l.jogador_id).map((l) => l.jogador_id as string))];
    return (
      <Page>
        <TopBar>
          {voltar}
          <Title>Escalação — {titulo}</Title>
        </TopBar>
        <Intro>
          <Muted>Marque quem vai jogar em cada time. Só eles aparecem na mesa; dá para incluir alguém depois.</Muted>
          <LiveLineupGlobal
            times={[ctx.casa, ctx.fora].map((t) => ({
              id: t.id,
              nome: t.nome,
              jogadores: doTime(t.id).map((j) => ({ id: j.id, rotulo: rotulo(j) })),
            }))}
            escalados={escalados}
            oficiais={{
              ...SEM_OFICIAIS,
              ...Object.fromEntries(
                (Object.keys(SEM_OFICIAIS) as (keyof IOficiaisMesa)[]).map((k) => [k, ctx.mesa?.[k] ?? '']),
              ),
            }}
            travados={comLances}
            submitLabel={escalados.length ? 'Salvar escalação' : 'Começar o jogo'}
            saving={mesa.escalar.isPending}
            error={mesa.escalar.error ? getErrorMessage(mesa.escalar.error) : null}
            onCancel={escalados.length ? () => setEditandoEscalacao(false) : undefined}
            onSubmit={(lista, oficiais) =>
              mesa.escalar.mutate({ escalados: lista, oficiais }, { onSuccess: () => setEditandoEscalacao(false) })
            }
          />
        </Intro>
      </Page>
    );
  }

  // ---- Jogo ---------------------------------------------------------------------------------
  if (!relogio || !resumo) return <LoaderGlobal label="Carregando a mesa" />;
  const regras = ctx.competicao;

  const painel = (lado: 'casa' | 'fora') => {
    const time = ctx[lado];
    return (
      <LiveTeamPanelGlobal
        nome={time.nome}
        jogadores={doTime(time.id)
          .filter((j) => escalados.includes(j.id))
          .map((j) => {
            const r = resumo.jogadores[j.id];
            return { id: j.id, rotulo: rotulo(j), pontos: r?.pontos ?? 0, faltas: r?.faltas ?? 0, excluido: Boolean(r?.excluido) };
          })}
        faltasExclusao={regras.faltas_exclusao_jogador}
        temposRestantes={Math.max(0, resumo.temposLimite - resumo.temposUsados[lado])}
        onPonto={(jogadorId, valor) => avisar(mesa.lancar({ tipo: 'ponto', time_id: time.id, jogador_id: jogadorId, valor }))}
        onFalta={(jogadorId) => avisar(mesa.lancar({ tipo: 'falta', time_id: time.id, jogador_id: jogadorId }))}
        onOutraFalta={(jogadorId) => setDialogo({ jogadorId, timeId: time.id })}
        onTempo={() => avisar(mesa.lancar({ tipo: 'tempo', time_id: time.id }))}
      />
    );
  };

  const time = (lado: 'casa' | 'fora') => ({
    nome: ctx[lado].nome,
    placar: resumo.placar[lado],
    faltas: resumo.faltasEquipe[lado],
    emBonus: resumo.emBonus[lado],
    temposUsados: resumo.temposUsados[lado],
    temposLimite: resumo.temposLimite,
  });

  const proximoLabel =
    mesa.proximoPasso === 'prorrogacao' ? 'Ir para a prorrogação' : `Ir para o ${periodLabel(relogio.periodo + 1, regras)}`;
  const status = mesa.offline
    ? { label: `Sem conexão · ${mesa.pendentes} para enviar`, tone: 'danger' as const }
    : mesa.pendentes
      ? { label: `Enviando ${mesa.pendentes}`, tone: 'warning' as const }
      : { label: 'Tudo salvo', tone: 'success' as const };
  const dialogoFalta = dialogo && typeof dialogo === 'object' ? dialogo : null;
  const jogadorFalta = dialogoFalta ? jogadores.get(dialogoFalta.jogadorId) : undefined;

  return (
    <Page>
      <TopBar>
        {voltar}
        <Title>
          {titulo} · {ctx.jogo.fase}
        </Title>
        <BadgeGlobal label={status.label} tone={status.tone} />
      </TopBar>

      {mesa.erroFila && <AlertGlobal variant="error" message={mesa.erroFila} onClose={mesa.limparErroFila} />}
      {mensagem && <AlertGlobal variant="warning" message={mensagem} onClose={() => setMensagem(null)} />}

      {mesa.aviso === 'posse' && (
        <Banner role="alert">
          Estouro do relógio de posse
          <ButtonGlobal label={`Nova posse (${regras.posse_segundos})`} size="sm" onClick={() => mesa.definirPosse(regras.posse_segundos)} />
        </Banner>
      )}
      {mesa.aviso === 'fim_periodo' && (
        <Banner role="alert">
          Fim do {periodLabel(relogio.periodo, regras)}
          {mesa.proximoPasso === 'fim' ? (
            <ButtonGlobal label="Encerrar o jogo" size="sm" onClick={() => setDialogo('encerrar')} />
          ) : (
            <ButtonGlobal label={proximoLabel} size="sm" onClick={mesa.proximoPeriodo} />
          )}
        </Banner>
      )}

      <LiveScoreboardGlobal
        casa={time('casa')}
        fora={time('fora')}
        periodo={periodLabel(relogio.periodo, regras)}
        jogoMs={mesa.jogoMs}
        posseMs={mesa.posseMs}
        posseSegundos={regras.posse_segundos}
        posseCurta={regras.posse_reset_curto}
        rodando={relogio.rodando}
        onToggle={alternarRelogio}
        onAjustarJogo={mesa.ajustarJogo}
        onPosse={mesa.definirPosse}
        onAjustarPosse={mesa.ajustarPosse}
      />

      <Toolbar>
        <ButtonGlobal label="Desfazer" size="sm" variant="outline" disabled={!mesa.podeDesfazer} onClick={mesa.desfazer} />
        {!relogio.rodando && mesa.proximoPasso !== 'fim' && (
          <ButtonGlobal label={proximoLabel} size="sm" variant="outline" onClick={mesa.proximoPeriodo} />
        )}
        <ButtonGlobal label="Escalação" size="sm" variant="ghost" onClick={() => setEditandoEscalacao(true)} />
        <ButtonGlobal label="Encerrar o jogo" size="sm" onClick={() => setDialogo('encerrar')} />
        <ButtonGlobal label="Descartar mesa" size="sm" variant="ghost" onClick={() => setDialogo('descartar')} />
      </Toolbar>

      <Tabs>
        <SegmentedGlobal
          ariaLabel="Painel"
          value={aba}
          onChange={setAba}
          options={[
            { value: 'casa', label: ctx.casa.nome },
            { value: 'fora', label: ctx.fora.nome },
            { value: 'lances', label: 'Lances' },
          ]}
        />
      </Tabs>

      <Columns>
        <Column $mobileHidden={aba !== 'casa'}>{painel('casa')}</Column>
        <Column $mobileHidden={aba !== 'fora'}>{painel('fora')}</Column>
        <Column $mobileHidden={aba !== 'lances'} $wide>
          <SectionTitle>Lances</SectionTitle>
          <PeriodScores aria-label="Placar por período">
            {resumo.porPeriodo.map((p) => (
              <PeriodScore key={p.periodo}>
                {periodShortLabel(p.periodo, regras)} {p.casa}–{p.fora}
              </PeriodScore>
            ))}
          </PeriodScores>
          <LivePlayLogGlobal itens={itensLances} onAnular={mesa.anular} />
        </Column>
      </Columns>

      <ModalGlobal
        open={Boolean(dialogoFalta)}
        title={jogadorFalta ? `Falta de ${rotulo(jogadorFalta)}` : 'Falta'}
        onClose={() => setDialogo(null)}
      >
        <FoulChoices>
          {OUTRAS_FALTAS.map((tipo) => (
            <ButtonGlobal
              key={tipo}
              label={TIPO_FALTA_LABEL[tipo]}
              variant={tipo === 'desqualificante' ? 'danger' : 'outline'}
              fullWidth
              onClick={() => {
                if (dialogoFalta) {
                  avisar(mesa.lancar({ tipo: 'falta', time_id: dialogoFalta.timeId, jogador_id: dialogoFalta.jogadorId, tipo_falta: tipo }));
                }
                setDialogo(null);
              }}
            />
          ))}
        </FoulChoices>
      </ModalGlobal>

      <ConfirmDialogGlobal
        open={dialogo === 'encerrar'}
        title="Encerrar o jogo"
        message={`${ctx.casa.nome} ${resumo.placar.casa} x ${resumo.placar.fora} ${ctx.fora.nome}.${
          mesa.proximoPasso === 'fim' ? '' : ' O tempo de jogo ainda não terminou.'
        } O resultado vai para a tabela e a mesa fica só para leitura.`}
        confirmLabel="Encerrar"
        loading={mesa.encerrar.isPending}
        error={mesa.encerrar.error ? getErrorMessage(mesa.encerrar.error) : null}
        onConfirm={() => mesa.encerrar.mutate(undefined, { onSuccess: () => setDialogo(null) })}
        onClose={() => {
          mesa.encerrar.reset();
          setDialogo(null);
        }}
      />
      <ConfirmDialogGlobal
        open={dialogo === 'descartar'}
        title="Descartar a mesa"
        message="Todos os lances deste jogo serão apagados e o jogo volta para a súmula normal."
        confirmLabel="Descartar"
        danger
        loading={mesa.descartar.isPending}
        error={mesa.descartar.error ? getErrorMessage(mesa.descartar.error) : null}
        onConfirm={() => mesa.descartar.mutate(undefined, { onSuccess: () => setDialogo(null) })}
        onClose={() => setDialogo(null)}
      />
    </Page>
  );
}
