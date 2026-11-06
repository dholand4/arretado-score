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
import { MesaLinkModalGlobal } from '@/components/mesaLinkModalGlobal';
import { ModalGlobal } from '@/components/modalGlobal';
import { SegmentedGlobal } from '@/components/segmentedGlobal';
import { useLiveSheet } from '@/hooks/useLiveSheet';
import { useMesaLink } from '@/hooks/useMesaLink';
import { useRouteParams } from '@/hooks/useRouteParams';
import { paths } from '@/routes/types';
import { getErrorMessage } from '@/utils/appError';
import { formatDateTime } from '@/utils/date';
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
type Dialogo = null | 'encerrar' | 'aprovar' | 'descartar' | { jogadorId: string; timeId: string };

const OUTRAS_FALTAS: TipoFalta[] = ['tecnica', 'antidesportiva', 'desqualificante'];
const SEM_OFICIAIS: IOficiaisMesa = { apontador: '', cronometrista: '', operador_24: '', arbitro: '', fiscal: '' };

// Súmula ao vivo (seção 6.5.1): o mesário lança pontos, faltas e tempos com cronômetro e relógio de posse.
export function LiveScoreSheetScreen() {
  const { competitionId, gameId } = useRouteParams('competitionId', 'gameId');
  return <LiveSheetView competitionId={competitionId} gameId={gameId} />;
}

interface ILiveSheetViewProps {
  competitionId: string;
  gameId: string;
  // Link de mesa: o mesário opera sem login; não descarta, e o encerramento vai para a aprovação.
  token?: string;
}

export function LiveSheetView({ competitionId, gameId, token }: ILiveSheetViewProps) {
  const viaLink = Boolean(token);
  const mesa = useLiveSheet(competitionId, gameId, token);
  const { ctx, relogio, resumo } = mesa;
  const [aba, setAba] = useState<Aba>('casa');
  const [editandoEscalacao, setEditandoEscalacao] = useState(false);
  const [dialogo, setDialogo] = useState<Dialogo>(null);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [linkAberto, setLinkAberto] = useState(false);
  const linkMesa = useMesaLink(gameId, !viaLink && linkAberto);

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

  const voltar = viaLink ? null : (
    <LinkButtonGlobal to={paths.competitionGames(competitionId)} label="← Jogos" size="sm" variant="ghost" />
  );

  // Placar em tela cheia para o segundo tablet (de frente para a quadra) e link para o mesário.
  const abrirTelao = () => window.open(paths.scoreboard(gameId), '_blank', 'noopener');
  const botoesExtras = (
    <>
      <ButtonGlobal label="Placar (telão)" size="sm" variant="outline" onClick={abrirTelao} />
      {!viaLink && (
        <ButtonGlobal
          label="Link do mesário"
          size="sm"
          variant="outline"
          onClick={() => {
            linkMesa.gerar.reset();
            linkMesa.cancelar.reset();
            setLinkAberto(true);
          }}
        />
      )}
    </>
  );
  const linkErro = linkMesa.gerar.error ?? linkMesa.cancelar.error ?? linkMesa.error;
  const modalLink = !viaLink && (
    <MesaLinkModalGlobal
      open={linkAberto}
      url={linkMesa.link ? `${window.location.origin}${paths.mesaLink(linkMesa.link.token)}` : null}
      expiraEm={linkMesa.link ? formatDateTime(linkMesa.link.expira_em) : null}
      loading={linkMesa.isLoading}
      busy={linkMesa.gerar.isPending || linkMesa.cancelar.isPending}
      error={linkErro ? getErrorMessage(linkErro) : null}
      onGenerate={() => linkMesa.gerar.mutate()}
      onCancelLink={() => linkMesa.cancelar.mutate()}
      onClose={() => setLinkAberto(false)}
    />
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
              description={viaLink ? 'A súmula deste jogo já foi fechada.' : 'Para corrigir, use a súmula normal.'}
              action={
                viaLink ? undefined : <LinkButtonGlobal to={paths.gameScoreSheet(competitionId, gameId)} label="Abrir súmula" />
              }
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
                {botoesExtras}
                {!viaLink && (
                  <LinkButtonGlobal
                    to={paths.gameScoreSheet(competitionId, gameId)}
                    label="Usar a súmula normal"
                    variant="ghost"
                  />
                )}
              </Toolbar>
            </CardGlobal>
          )}
        </Intro>
        {modalLink}
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
            message={
              viaLink
                ? `Jogo encerrado e aprovado: ${ctx.casa.nome} ${resumo?.placar.casa ?? ''} x ${resumo?.placar.fora ?? ''} ${ctx.fora.nome}. Obrigado!`
                : `Jogo encerrado: ${ctx.casa.nome} ${resumo?.placar.casa ?? ''} x ${resumo?.placar.fora ?? ''} ${ctx.fora.nome}. Rebotes, assistências e correções vão na súmula normal.`
            }
          />
          {!viaLink && (
            <Toolbar>
              <LinkButtonGlobal to={paths.gameScoreSheet(competitionId, gameId)} label="Abrir súmula" />
            </Toolbar>
          )}
          <SectionTitle>Lances</SectionTitle>
          <LivePlayLogGlobal itens={itensLances} />
        </Intro>
      </Page>
    );
  }

  // ---- Encerrada pelo mesário: aguardando a aprovação do coordenador --------------------
  if (ctx.mesa.status === 'aguardando_aprovacao') {
    const placar = `${ctx.casa.nome} ${resumo?.placar.casa ?? 0} x ${resumo?.placar.fora ?? 0} ${ctx.fora.nome}`;
    return (
      <Page>
        <TopBar>
          {voltar}
          <Title>{titulo}</Title>
        </TopBar>
        <Intro>
          {viaLink ? (
            <AlertGlobal
              variant="success"
              title="Jogo enviado para aprovação"
              message={`${placar}. O coordenador vai conferir e aprovar; só depois o resultado entra na tabela. Obrigado!`}
            />
          ) : (
            <>
              <AlertGlobal
                variant="warning"
                title="O mesário encerrou o jogo"
                message={`${placar}. Confira os lances e aprove para o resultado entrar na tabela, ou reabra para o mesário corrigir.`}
              />
              <Toolbar>
                <ButtonGlobal label="Aprovar resultado" onClick={() => setDialogo('aprovar')} />
                <ButtonGlobal
                  label="Reabrir para o mesário"
                  variant="outline"
                  loading={mesa.reabrir.isPending}
                  onClick={() => mesa.reabrir.mutate()}
                />
                <ButtonGlobal label="Descartar mesa" variant="ghost" onClick={() => setDialogo('descartar')} />
              </Toolbar>
              {mesa.reabrir.error && <AlertGlobal variant="error" message={getErrorMessage(mesa.reabrir.error)} />}
            </>
          )}
          {resumo && (
            <PeriodScores aria-label="Placar por período">
              {resumo.porPeriodo.map((p) => (
                <PeriodScore key={p.periodo}>
                  {periodShortLabel(p.periodo, ctx.competicao)} {p.casa}–{p.fora}
                </PeriodScore>
              ))}
            </PeriodScores>
          )}
          <SectionTitle>Lances</SectionTitle>
          <LivePlayLogGlobal itens={itensLances} />
        </Intro>
        <ConfirmDialogGlobal
          open={dialogo === 'aprovar'}
          title="Aprovar resultado"
          message={`${placar}. O resultado vai para a tabela e a mesa fica só para leitura.`}
          confirmLabel="Aprovar"
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
    logoUrl: ctx[lado].logo_url,
    placar: resumo.placar[lado],
    faltas: resumo.faltasEquipe[lado],
    emBonus: resumo.emBonus[lado],
    temposUsados: resumo.temposUsados[lado],
    temposLimite: resumo.temposLimite,
    tempoPedidoMs: mesa.tempoPedido?.timeId === ctx[lado].id ? mesa.tempoPedido.restanteMs : null,
  });

  const proximoLabel =
    mesa.proximoPasso === 'prorrogacao' ? 'Ir para a prorrogação' : `Ir para o ${periodLabel(relogio.periodo + 1, regras)}`;
  const status = mesa.offline
    ? { label: `Sem conexão · ${mesa.pendentes} para enviar`, tone: 'danger' as const }
    : mesa.pendentes
      ? { label: `Enviando ${mesa.pendentes}`, tone: 'warning' as const }
      : { label: 'Tudo salvo', tone: 'success' as const };
  const dialogoFalta = dialogo && typeof dialogo === 'object' ? dialogo : null;
  // Pelo link, encerrar manda para a aprovação; o coordenador encerra direto.
  const encerramento = viaLink ? mesa.finalizar : mesa.encerrar;
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
        {botoesExtras}
        <ButtonGlobal label="Encerrar o jogo" size="sm" onClick={() => setDialogo('encerrar')} />
        {!viaLink && (
          <ButtonGlobal label="Descartar mesa" size="sm" variant="ghost" onClick={() => setDialogo('descartar')} />
        )}
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
        } ${
          viaLink
            ? 'O jogo vai para a aprovação do coordenador; só depois o resultado entra na tabela.'
            : 'O resultado vai para a tabela e a mesa fica só para leitura.'
        }`}
        confirmLabel="Encerrar"
        loading={encerramento.isPending}
        error={encerramento.error ? getErrorMessage(encerramento.error) : null}
        onConfirm={() => encerramento.mutate(undefined, { onSuccess: () => setDialogo(null) })}
        onClose={() => {
          encerramento.reset();
          setDialogo(null);
        }}
      />
      {modalLink}
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
