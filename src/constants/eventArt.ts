// Arte de divulgação do dia de jogos (seção 9.3): formatos do Instagram e cores da arte.
export type EventArtFormat = 'post' | 'story';
// "Com horários": confrontos na ordem, com horário. "Só os times": quem joga no dia, sem os confrontos.
// "Agora em quadra": um confronto só, em destaque (o jogo da vez, ou o resultado dele).
export type EventArtLayout = 'games' | 'teams' | 'game';

export const EVENT_ART_LAYOUTS: Record<EventArtLayout, string> = {
  games: 'Com horários',
  teams: 'Só os times',
  game: 'Agora em quadra',
};

export interface IEventArtFormat {
  label: string;
  width: number;
  height: number;
  // Faixas livres em cima e embaixo (no story, ficam atrás dos botões do Instagram).
  safeTop: number;
  safeBottom: number;
  logoSize: number;
  // Altura máxima do cartão de jogo e multiplicador das fontes (o story tem mais espaço).
  cardMax: number;
  scale: number;
}

export const EVENT_ART_FORMATS: Record<EventArtFormat, IEventArtFormat> = {
  post: { label: 'Post (4:5)', width: 1080, height: 1350, safeTop: 56, safeBottom: 40, logoSize: 210, cardMax: 300, scale: 1 },
  story: { label: 'Story (9:16)', width: 1080, height: 1920, safeTop: 210, safeBottom: 230, logoSize: 280, cardMax: 360, scale: 1.15 },
};

// Canvas não lê o tema do styled-components: os tons repetem o azul-marinho e o laranja do tema.
export const EVENT_ART_COLORS = {
  backgroundTop: '#1F2A44',
  backgroundBottom: '#0E1424',
  glow: 'rgba(232, 89, 12, 0.35)',
  courtLine: 'rgba(255, 255, 255, 0.06)',
  card: 'rgba(255, 255, 255, 0.07)',
  cardBorder: 'rgba(255, 255, 255, 0.14)',
  accent: '#E8590C',
  accentSoft: '#FFA94D',
  text: '#FFFFFF',
  textMuted: 'rgba(255, 255, 255, 0.72)',
  logoBackground: '#FFFFFF',
  logoShadow: 'rgba(0, 0, 0, 0.35)',
  badgeRing: 'rgba(255, 255, 255, 0.28)',
  initialsBackground: '#2C3A5C',
  placeholder: 'rgba(255, 255, 255, 0.10)',
  placeholderBorder: 'rgba(255, 255, 255, 0.35)',
} as const;

export const EVENT_ART_FONT = "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";

export const EVENT_ART_MIME = 'image/png';
