import type { IEvento, IJogoResumo } from '@/@types/event';
import {
  EVENT_ART_COLORS as C,
  EVENT_ART_FONT,
  EVENT_ART_FORMATS,
  EVENT_ART_MIME,
  type EventArtFormat,
  type EventArtLayout,
  type IEventArtFormat,
} from '@/constants/eventArt';
import { AppError } from './appError';
import { dayGameNumbers, dependentGames, formatTime, gameDetails, gameSides, shortTime } from './eventSchedule';
import { loadImageBitmap } from './image';

// ---------- Conteúdo (o que a arte mostra) ----------

export interface IEventArtTeam {
  name: string;
  logo: string | null;
  // Lado que depende de resultado ("Perdedor Jogo 1") ou time ainda não definido.
  placeholder: boolean;
}

export interface IEventArtGame {
  id: string;
  // "JOGO 1"; nulo em dia de um jogo só.
  order: string | null;
  home: IEventArtTeam;
  away: IEventArtTeam;
  // Horário; placar ou status quando o jogo já tem resultado.
  center: string;
  time: string;
  finished: boolean;
  details: string;
}

export interface IEventArtContent {
  leagueName: string;
  leagueLogo: string | null;
  date: string;
  place: string;
  games: IEventArtGame[];
  // Times do dia, na ordem em que entram em quadra (opção "Só os times").
  teams: IEventArtTeam[];
}

const diaPorExtenso = new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long' });

// "2026-11-01" → "Domingo, 1º de novembro" (data pura: formata ao meio-dia UTC para não trocar de dia).
export function artDate(date: string): string {
  const parts = diaPorExtenso.formatToParts(new Date(`${date}T12:00:00Z`));
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? '';
  const dia = get('day') === '1' ? '1º' : get('day');
  const semana = get('weekday');
  return `${semana.charAt(0).toUpperCase()}${semana.slice(1)}, ${dia} de ${get('month')}`;
}

function gameCenter(jogo: IJogoResumo): string {
  if (jogo.status === 'encerrado') return `${jogo.placar_casa ?? 0} x ${jogo.placar_fora ?? 0}`;
  if (jogo.status === 'wo') return 'W.O.';
  if (jogo.status === 'cancelado') return 'Cancelado';
  return formatTime(jogo.inicio_previsto);
}

// Monta a arte com a mesma leitura do app: confrontos condicionais ("Perdedor Jogo 1 x C") e "Jogo N".
export function eventArtContent(event: IEvento, league: { nome: string; logo_url: string | null }): IEventArtContent {
  const jogos = [...event.jogos].sort((a, b) => (a.ordem_no_evento ?? 0) - (b.ordem_no_evento ?? 0));
  const dependentes = dependentGames(jogos);
  const numeros = dayGameNumbers(jogos);

  const games = jogos.map((jogo): IEventArtGame => {
    const lados = gameSides(jogo, dependentes);
    const team = (name: string): IEventArtTeam => {
      const time = [jogo.casa, jogo.fora].find((t) => t?.nome === name);
      return { name, logo: time?.logo_url ?? null, placeholder: !time };
    };
    const numero = numeros.get(jogo.id);
    return {
      id: jogo.id,
      order: numero ? `JOGO ${numero}` : null,
      home: team(lados.home),
      away: team(lados.away),
      center: gameCenter(jogo),
      time: formatTime(jogo.inicio_previsto),
      finished: ['encerrado', 'wo', 'cancelado'].includes(jogo.status),
      details: dependentes.has(jogo.id) ? (jogo.fase?.nome ?? '') : gameDetails(jogo),
    };
  });

  const teams = new Map<string, IEventArtTeam>();
  jogos.forEach((jogo) =>
    [jogo.casa, jogo.fora].forEach((time) => {
      if (time && !teams.has(time.nome)) teams.set(time.nome, { name: time.nome, logo: time.logo_url ?? null, placeholder: false });
    }),
  );

  return {
    leagueName: league.nome,
    leagueLogo: league.logo_url,
    date: artDate(event.data),
    place: `A partir das ${shortTime(event.hora_inicio)} · ${event.local}`,
    games,
    teams: [...teams.values()],
  };
}

// O jogo da vez: o primeiro do dia ainda sem resultado; com todos encerrados, o último.
export function currentGameId(content: Pick<IEventArtContent, 'games'>): string | null {
  return (content.games.find((g) => !g.finished) ?? content.games[content.games.length - 1])?.id ?? null;
}

export function spotlightGame(content: Pick<IEventArtContent, 'games'>, gameId?: string | null): IEventArtGame | null {
  return content.games.find((g) => g.id === gameId) ?? content.games.find((g) => g.id === currentGameId(content)) ?? null;
}

const LAYOUT_FILE: Record<EventArtLayout, string> = { games: 'jogos', teams: 'times', game: 'confronto' };

export function eventArtFileName(
  event: Pick<IEvento, 'data'>,
  format: EventArtFormat,
  layout: EventArtLayout,
  game?: Pick<IEventArtGame, 'order'> | null,
): string {
  const numero = layout === 'game' && game?.order ? `-${game.order.toLowerCase().replace(/\s+/g, '-')}` : '';
  return `${LAYOUT_FILE[layout]}-${event.data}${numero}-${format}.png`;
}

// ---------- Texto no canvas ----------

type Ctx = CanvasRenderingContext2D;

// Logo baixado e a cor do fundo dele (preenche o círculo ou a placa por trás do logo).
export interface IArtImage {
  bitmap: ImageBitmap;
  backdrop: string;
}

type ArtImages = Map<string, IArtImage>;
type Weight = 400 | 600 | 700 | 800;

function setFont(ctx: Ctx, size: number, weight: Weight = 700) {
  ctx.font = `${weight} ${size}px ${EVENT_ART_FONT}`;
}

function setSpacing(ctx: Ctx, px: number) {
  if ('letterSpacing' in ctx) ctx.letterSpacing = `${px}px`;
}

function widthOf(ctx: Ctx, text: string): number {
  return ctx.measureText(text).width;
}

// Corta o texto com "…" até caber na largura (com a fonte já definida).
export function ellipsize(ctx: Ctx, text: string, maxWidth: number): string {
  if (widthOf(ctx, text) <= maxWidth) return text;
  let cut = text;
  while (cut.length > 1 && widthOf(ctx, `${cut}…`) > maxWidth) cut = cut.slice(0, -1);
  return `${cut.trimEnd()}…`;
}

// Quebra por espaços (o espaço inseparável de "Jogo 1" não quebra) ou por outro separador, como " · ".
function wrap(ctx: Ctx, text: string, maxWidth: number, separator = ' '): string[] {
  const lines: string[] = [];
  text.split(separator).forEach((word) => {
    const last = lines[lines.length - 1];
    const joined = `${last}${separator}${word}`;
    if (last !== undefined && widthOf(ctx, joined) <= maxWidth) lines[lines.length - 1] = joined;
    else lines.push(word);
  });
  return lines;
}

export interface IFittedText {
  size: number;
  lines: string[];
}

// Maior fonte em que o texto cabe: primeiro numa linha (até 75% do tamanho máximo), depois em até
// maxLines linhas; se nem no mínimo couber, corta com "…".
export function fitText(
  ctx: Ctx,
  text: string,
  maxWidth: number,
  {
    max,
    min,
    maxLines = 1,
    weight = 700,
    separator = ' ',
  }: { max: number; min: number; maxLines?: number; weight?: Weight; separator?: string },
): IFittedText {
  for (let size = max; size >= Math.max(min, max * 0.75); size -= 2) {
    setFont(ctx, size, weight);
    if (widthOf(ctx, text) <= maxWidth) return { size, lines: [text] };
  }
  for (let size = max; size >= min; size -= 2) {
    setFont(ctx, size, weight);
    const lines = wrap(ctx, text, maxWidth, separator);
    if (lines.length <= maxLines && lines.every((l) => widthOf(ctx, l) <= maxWidth)) return { size, lines };
  }
  setFont(ctx, min, weight);
  const lines = wrap(ctx, text, maxWidth, separator);
  const kept = lines.slice(0, maxLines);
  const rest = lines.slice(maxLines - 1).join(separator);
  kept[kept.length - 1] = ellipsize(ctx, lines.length > maxLines ? rest : kept[kept.length - 1], maxWidth);
  return { size: min, lines: kept.map((l) => ellipsize(ctx, l, maxWidth)) };
}

const LINE_HEIGHT = 1.15;

function fittedHeight(fitted: IFittedText): number {
  return fitted.lines.length * fitted.size * LINE_HEIGHT;
}

// Desenha linhas já ajustadas a partir do topo y; devolve a altura usada.
function drawLines(ctx: Ctx, fitted: IFittedText, x: number, y: number, weight: Weight = 700): number {
  setFont(ctx, fitted.size, weight);
  ctx.textBaseline = 'top';
  fitted.lines.forEach((line, i) => ctx.fillText(line, x, y + i * fitted.size * LINE_HEIGHT));
  return fittedHeight(fitted);
}

// ---------- Formas ----------

function roundedRect(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawContain(ctx: Ctx, image: ImageBitmap, x: number, y: number, w: number, h: number) {
  const scale = Math.min(w / image.width, h / image.height);
  const dw = image.width * scale;
  const dh = image.height * scale;
  ctx.drawImage(image, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
}

function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  return words
    .slice(0, 2)
    .map((w) => w.charAt(0))
    .join('')
    .toUpperCase();
}

// Escudo do time num círculo: logo sobre a cor do fundo dele (logo preto, círculo preto), iniciais
// sem logo, "?" no lado condicional.
function drawBadge(ctx: Ctx, team: IEventArtTeam, image: IArtImage | undefined, cx: number, cy: number, size: number) {
  const r = size / 2;
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  if (image) {
    ctx.fillStyle = image.backdrop;
    ctx.fill();
    ctx.save();
    ctx.clip();
    const inner = size * 0.78;
    drawContain(ctx, image.bitmap, cx - inner / 2, cy - inner / 2, inner, inner);
    ctx.restore();
    ctx.lineWidth = Math.max(2, size * 0.025);
    ctx.strokeStyle = C.badgeRing;
    ctx.stroke();
  } else {
    ctx.fillStyle = team.placeholder ? C.placeholder : C.initialsBackground;
    ctx.fill();
    ctx.lineWidth = Math.max(2, size * 0.03);
    ctx.strokeStyle = team.placeholder ? C.placeholderBorder : C.accent;
    if (team.placeholder) ctx.setLineDash([size * 0.08, size * 0.06]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = team.placeholder ? C.textMuted : C.text;
    setFont(ctx, Math.round(size * (team.placeholder ? 0.46 : 0.36)), 800);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(team.placeholder ? '?' : initials(team.name), cx, cy + size * 0.02);
  }
  ctx.restore();
}

// ---------- Partes da arte ----------

function drawBackground(ctx: Ctx, f: IEventArtFormat) {
  const bg = ctx.createLinearGradient(0, 0, 0, f.height);
  bg.addColorStop(0, C.backgroundTop);
  bg.addColorStop(1, C.backgroundBottom);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, f.width, f.height);

  const glowY = f.safeTop + f.logoSize / 2;
  const glow = ctx.createRadialGradient(f.width / 2, glowY, 0, f.width / 2, glowY, f.width * 0.6);
  glow.addColorStop(0, C.glow);
  glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, f.width, f.height);

  // Linhas de quadra discretas: círculo central no pé da arte e garrafão no topo.
  ctx.save();
  ctx.strokeStyle = C.courtLine;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(f.width / 2, f.height, f.width * 0.3, Math.PI, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, f.height);
  ctx.lineTo(f.width, f.height);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(f.width / 2, 0, f.width * 0.42, 0, Math.PI);
  ctx.stroke();
  ctx.restore();
}

const SIDE = 56;

// Logo da liga numa placa de cantos arredondados, do tamanho da imagem, na cor do fundo do logo
// (branca quando ele é transparente, para continuar legível sobre o azul).
function drawLeagueLogo(ctx: Ctx, { bitmap: image, backdrop }: IArtImage, cx: number, top: number, size: number) {
  const pad = size * 0.06;
  const scale = Math.min((size - pad * 2) / image.width, (size - pad * 2) / image.height);
  const w = image.width * scale + pad * 2;
  const h = image.height * scale + pad * 2;
  const x = cx - w / 2;
  const y = top + (size - h) / 2;
  ctx.save();
  ctx.shadowColor = C.logoShadow;
  ctx.shadowBlur = 30;
  ctx.shadowOffsetY = 10;
  roundedRect(ctx, x, y, w, h, size * 0.12);
  ctx.fillStyle = backdrop;
  ctx.fill();
  ctx.restore();
  ctx.save();
  roundedRect(ctx, x, y, w, h, size * 0.12);
  ctx.clip();
  drawContain(ctx, image, x + pad, y + pad, w - pad * 2, h - pad * 2);
  ctx.restore();
}

// Logo (ou nome) da liga, o título ("JOGOS DO DIA"), data e local. Devolve onde a lista de jogos começa.
function drawHeader(ctx: Ctx, content: IEventArtContent, images: ArtImages, f: IEventArtFormat, kicker: string): number {
  const width = f.width - SIDE * 2;
  const cx = f.width / 2;
  const k = f.scale;
  let y = f.safeTop;
  ctx.textAlign = 'center';

  const logo = content.leagueLogo ? images.get(content.leagueLogo) : undefined;
  if (logo) {
    drawLeagueLogo(ctx, logo, cx, y, f.logoSize);
    y += f.logoSize + 32;
  } else {
    ctx.fillStyle = C.text;
    const name = fitText(ctx, content.leagueName, width, { max: 64 * k, min: 40, maxLines: 2, weight: 800 });
    y += drawLines(ctx, name, cx, y, 800);
    y += 28;
  }

  ctx.fillStyle = C.accentSoft;
  setSpacing(ctx, 8);
  y += drawLines(ctx, { size: Math.round(30 * k), lines: [kicker] }, cx, y, 800) + 14;
  setSpacing(ctx, 0);

  ctx.fillStyle = C.text;
  y += drawLines(ctx, fitText(ctx, content.date, width, { max: 72 * k, min: 44, weight: 800 }), cx, y, 800) + 10;

  ctx.fillStyle = C.textMuted;
  const place = fitText(ctx, content.place, width, { max: 34 * k, min: 24, maxLines: 2, weight: 600, separator: ' · ' });
  y += drawLines(ctx, place, cx, y, 600);
  return y + 40;
}

interface IBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

function drawCardBox(ctx: Ctx, box: IBox) {
  roundedRect(ctx, box.x, box.y, box.w, box.h, Math.min(32, box.h / 4));
  ctx.fillStyle = C.card;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = C.cardBorder;
  ctx.stroke();
}

// Coluna do meio: "JOGO 1", horário (ou placar) e fase.
function drawCenter(ctx: Ctx, game: IEventArtGame, cx: number, box: IBox, width: number, compact: boolean, k: number) {
  const order = game.order ? { size: Math.round((compact ? 18 : 24) * k), lines: [game.order] } : null;
  const main = fitText(ctx, game.center, width, { max: (compact ? 44 : 68) * k, min: 26, weight: 800 });
  const showDetails = Boolean(game.details) && box.h >= (compact ? 140 : 110);
  const details = showDetails
    ? fitText(ctx, game.details, width, {
        max: (compact ? 20 : 24) * k,
        min: 16,
        maxLines: compact ? 1 : 2,
        weight: 600,
        separator: ' · ',
      })
    : null;
  const gap = compact ? 4 : 8;
  const total =
    (order ? fittedHeight(order) + gap : 0) + fittedHeight(main) + (details ? gap + fittedHeight(details) : 0);
  let y = box.y + (box.h - total) / 2;

  ctx.textAlign = 'center';
  if (order) {
    ctx.fillStyle = C.accentSoft;
    setSpacing(ctx, compact ? 3 : 4);
    y += drawLines(ctx, order, cx, y, 800) + gap;
    setSpacing(ctx, 0);
  }
  ctx.fillStyle = C.text;
  y += drawLines(ctx, main, cx, y, 800);
  if (details) {
    ctx.fillStyle = C.textMuted;
    drawLines(ctx, details, cx, y + gap, 600);
  }
}

// Cartão alto (poucos jogos): escudo em cima e nome embaixo, um time de cada lado.
function drawTallCard(ctx: Ctx, game: IEventArtGame, images: ArtImages, box: IBox, k: number) {
  const centerW = 260;
  const colW = (box.w - centerW) / 2;
  const badge = Math.min(box.h * 0.44, 132 * k);
  const nameW = colW - 32;

  [game.home, game.away].forEach((team, i) => {
    const cx = box.x + (i === 0 ? colW / 2 : box.w - colW / 2);
    const name = fitText(ctx, team.name, nameW, { max: 38 * k, min: 24, maxLines: 2, weight: 700 });
    const total = badge + 16 + fittedHeight(name);
    const top = box.y + (box.h - total) / 2;
    drawBadge(ctx, team, team.logo ? images.get(team.logo) : undefined, cx, top + badge / 2, badge);
    ctx.textAlign = 'center';
    ctx.fillStyle = team.placeholder ? C.textMuted : C.text;
    drawLines(ctx, name, cx, top + badge + 16, 700);
  });

  drawCenter(ctx, game, box.x + box.w / 2, box, centerW - 24, false, k);
}

// Cartão baixo (muitos jogos): escudo ao lado do nome, numa linha só.
function drawRowCard(ctx: Ctx, game: IEventArtGame, images: ArtImages, box: IBox, k: number) {
  const pad = 22;
  const centerW = 190;
  const colW = (box.w - centerW) / 2;
  const badge = Math.min(box.h * 0.62, 76);
  const nameW = colW - pad - badge - 16 - 8;
  const cy = box.y + box.h / 2;

  [game.home, game.away].forEach((team, i) => {
    const home = i === 0;
    const badgeX = home ? box.x + pad + badge / 2 : box.x + box.w - pad - badge / 2;
    drawBadge(ctx, team, team.logo ? images.get(team.logo) : undefined, badgeX, cy, badge);
    const name = fitText(ctx, team.name, nameW, { max: 34 * k, min: 20, maxLines: box.h >= 100 ? 2 : 1, weight: 700 });
    ctx.textAlign = home ? 'left' : 'right';
    ctx.fillStyle = team.placeholder ? C.textMuted : C.text;
    const x = home ? badgeX + badge / 2 + 16 : badgeX - badge / 2 - 16;
    drawLines(ctx, name, x, cy - fittedHeight(name) / 2, 700);
  });

  drawCenter(ctx, game, box.x + box.w / 2, box, centerW - 16, true, k);
}

const FOOTER_HEIGHT = 80;
const TALL_CARD_MIN = 220;

function drawGames(ctx: Ctx, games: IEventArtGame[], images: ArtImages, f: IEventArtFormat, top: number) {
  if (games.length === 0) return;
  const bottom = f.height - f.safeBottom - FOOTER_HEIGHT;
  const gap = games.length > 5 ? 14 : 22;
  const available = bottom - top - gap * (games.length - 1);
  const cardH = Math.min(f.cardMax, available / games.length);
  const total = cardH * games.length + gap * (games.length - 1);
  const startY = top + Math.max(0, (bottom - top - total) / 2);

  games.forEach((game, i) => {
    const box = { x: SIDE, y: startY + i * (cardH + gap), w: f.width - SIDE * 2, h: cardH };
    drawCardBox(ctx, box);
    if (cardH >= TALL_CARD_MIN) drawTallCard(ctx, game, images, box, f.scale);
    else drawRowCard(ctx, game, images, box, f.scale);
  });
}

// Opção "Só os times": um cartão por time, um abaixo do outro (duas colunas quando são muitos).
function drawTeams(ctx: Ctx, teams: IEventArtTeam[], images: ArtImages, f: IEventArtFormat, top: number) {
  if (teams.length === 0) return;
  const bottom = f.height - f.safeBottom - FOOTER_HEIGHT;
  const columns = teams.length > 6 ? 2 : 1;
  const rows = Math.ceil(teams.length / columns);
  const gap = rows > 5 ? 14 : 22;
  const rowH = Math.min(f.cardMax * 0.75, (bottom - top - gap * (rows - 1)) / rows);
  const total = rowH * rows + gap * (rows - 1);
  const startY = top + Math.max(0, (bottom - top - total) / 2);
  const width = f.width - SIDE * 2;
  const colW = columns === 1 ? Math.min(width, 760) : (width - gap) / 2;
  const startX = (f.width - (colW * columns + gap * (columns - 1))) / 2;
  const badge = Math.min(rowH * 0.72, 150 * f.scale);
  const pad = Math.min(28, rowH * 0.2);

  teams.forEach((team, i) => {
    const box = {
      x: startX + (i % columns) * (colW + gap),
      y: startY + Math.floor(i / columns) * (rowH + gap),
      w: colW,
      h: rowH,
    };
    drawCardBox(ctx, box);
    const cy = box.y + box.h / 2;
    drawBadge(ctx, team, team.logo ? images.get(team.logo) : undefined, box.x + pad + badge / 2, cy, badge);
    const nameX = box.x + pad + badge + 24;
    const name = fitText(ctx, team.name, box.x + box.w - pad - nameX, {
      max: (columns === 1 ? 54 : 36) * f.scale,
      min: 20,
      maxLines: 2,
      weight: 800,
    });
    ctx.textAlign = 'left';
    ctx.fillStyle = C.text;
    drawLines(ctx, name, nameX, cy - fittedHeight(name) / 2, 800);
  });
}

// "Agora em quadra": um confronto só, com escudos grandes, "VS" (ou o placar) e horário e fase.
function drawSpotlight(ctx: Ctx, game: IEventArtGame, images: ArtImages, f: IEventArtFormat, top: number) {
  const k = f.scale;
  const bottom = f.height - f.safeBottom - FOOTER_HEIGHT;
  const h = Math.min(bottom - top, 640 * k);
  const box = { x: SIDE, y: top + (bottom - top - h) / 2, w: f.width - SIDE * 2, h };
  drawCardBox(ctx, box);

  const centerW = 230;
  const colW = (box.w - centerW) / 2;
  const badge = Math.min(colW - 40, h * 0.5, 300 * k);
  const cx = box.x + box.w / 2;
  ctx.textAlign = 'center';

  const order = game.order ? { size: Math.round(30 * k), lines: [game.order] } : null;
  let y = box.y + 36;
  if (order) {
    ctx.fillStyle = C.accentSoft;
    setSpacing(ctx, 6);
    y += drawLines(ctx, order, cx, y, 800);
    setSpacing(ctx, 0);
  }

  const names = [game.home, game.away].map((team) =>
    fitText(ctx, team.name, colW - 24, { max: 46 * k, min: 26, maxLines: 2, weight: 800 }),
  );
  const namesH = Math.max(...names.map(fittedHeight));
  const blockH = badge + 24 + namesH;
  const blockTop = y + Math.max(16, (box.y + box.h - 90 * k - y - blockH) / 2);
  const badgeCy = blockTop + badge / 2;

  [game.home, game.away].forEach((team, i) => {
    const tx = box.x + (i === 0 ? colW / 2 : box.w - colW / 2);
    drawBadge(ctx, team, team.logo ? images.get(team.logo) : undefined, tx, badgeCy, badge);
    ctx.textAlign = 'center';
    ctx.fillStyle = team.placeholder ? C.textMuted : C.text;
    drawLines(ctx, names[i], tx, blockTop + badge + 24, 800);
  });

  // Meio: placar (jogo encerrado) ou "VS".
  const main = fitText(ctx, game.finished ? game.center : 'VS', centerW - 16, { max: (game.finished ? 84 : 96) * k, min: 36, weight: 800 });
  ctx.textAlign = 'center';
  ctx.fillStyle = game.finished ? C.text : C.accent;
  drawLines(ctx, main, cx, badgeCy - fittedHeight(main) / 2, 800);

  const info = [game.finished ? 'Final' : game.time, game.details].filter(Boolean).join(' · ');
  if (info) {
    ctx.fillStyle = C.textMuted;
    const fitted = fitText(ctx, info, box.w - 64, { max: 32 * k, min: 20, maxLines: 2, weight: 600, separator: ' · ' });
    drawLines(ctx, fitted, cx, box.y + box.h - 36 - fittedHeight(fitted), 600);
  }
}

function drawFooter(ctx: Ctx, f: IEventArtFormat) {
  const y = f.height - f.safeBottom - FOOTER_HEIGHT / 2;
  setFont(ctx, Math.round(32 * f.scale), 800);
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  const first = 'Arretado ';
  const second = 'Score';
  const x = (f.width - widthOf(ctx, first) - widthOf(ctx, second)) / 2;
  ctx.fillStyle = C.text;
  ctx.fillText(first, x, y);
  ctx.fillStyle = C.accent;
  ctx.fillText(second, x + widthOf(ctx, first), y);
}

export function drawEventArt(
  ctx: Ctx,
  content: IEventArtContent,
  images: ArtImages,
  format: EventArtFormat,
  layout: EventArtLayout = 'games',
  gameId?: string | null,
) {
  const f = EVENT_ART_FORMATS[format];
  drawBackground(ctx, f);
  const game = layout === 'game' ? spotlightGame(content, gameId) : null;
  const kicker = game ? (game.finished ? 'RESULTADO' : 'AGORA EM QUADRA') : 'JOGOS DO DIA';
  const top = drawHeader(ctx, content, images, f, kicker);
  if (game) drawSpotlight(ctx, game, images, f, top);
  else if (layout === 'teams') drawTeams(ctx, content.teams, images, f, top);
  else drawGames(ctx, content.games, images, f, top);
  drawFooter(ctx, f);
}

// ---------- Imagem final ----------

const BACKDROP_SAMPLE = 32;

// Cor do fundo do logo, pela borda da imagem: se a borda é quase toda opaca, usa a média dela
// (logo quadrado preto → círculo preto); se é transparente, fundo branco.
export function logoBackdrop(image: ImageBitmap): string {
  const canvas = document.createElement('canvas');
  canvas.width = BACKDROP_SAMPLE;
  canvas.height = BACKDROP_SAMPLE;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return C.logoBackground;
  ctx.drawImage(image, 0, 0, BACKDROP_SAMPLE, BACKDROP_SAMPLE);
  const { data } = ctx.getImageData(0, 0, BACKDROP_SAMPLE, BACKDROP_SAMPLE);
  const last = BACKDROP_SAMPLE - 1;
  const sum = [0, 0, 0];
  let border = 0;
  let opaque = 0;
  for (let y = 0; y < BACKDROP_SAMPLE; y += 1) {
    for (let x = 0; x < BACKDROP_SAMPLE; x += 1) {
      if (x !== 0 && y !== 0 && x !== last && y !== last) continue;
      border += 1;
      const i = (y * BACKDROP_SAMPLE + x) * 4;
      if (data[i + 3] < 200) continue;
      opaque += 1;
      sum[0] += data[i];
      sum[1] += data[i + 1];
      sum[2] += data[i + 2];
    }
  }
  if (opaque < border * 0.6) return C.logoBackground;
  const [r, g, b] = sum.map((v) => Math.round(v / opaque));
  return `rgb(${r}, ${g}, ${b})`;
}

// Baixa os logos (Storage com CORS liberado; logo que falhar vira iniciais) e gera o PNG.
export async function renderEventArt(
  content: IEventArtContent,
  format: EventArtFormat,
  layout: EventArtLayout = 'games',
  gameId?: string | null,
): Promise<Blob> {
  const urls = [
    content.leagueLogo,
    ...content.games.flatMap((g) => [g.home.logo, g.away.logo]),
    ...content.teams.map((t) => t.logo),
  ].filter((url): url is string => Boolean(url));
  const loaded = await Promise.all([...new Set(urls)].map(async (url) => [url, await loadImageBitmap(url)] as const));
  const images: ArtImages = new Map();
  loaded.forEach(([url, bitmap]) => {
    if (bitmap) images.set(url, { bitmap, backdrop: logoBackdrop(bitmap) });
  });

  try {
    const f = EVENT_ART_FORMATS[format];
    const canvas = document.createElement('canvas');
    canvas.width = f.width;
    canvas.height = f.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new AppError('Não foi possível gerar a arte neste navegador.');
    drawEventArt(ctx, content, images, format, layout, gameId);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, EVENT_ART_MIME));
    if (!blob) throw new AppError('Não foi possível gerar a arte neste navegador.');
    return blob;
  } finally {
    images.forEach((image) => image.bitmap.close());
  }
}
