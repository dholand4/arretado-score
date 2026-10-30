export const QUERY_KEYS = {
  profile: (userId: string) => ['profile', userId] as const,
  users: ['users'] as const,
  competitions: ['competitions'] as const,
  publicCompetitions: ['competitions', 'public'] as const,
  competition: (id: string) => ['competitions', id] as const,
  categories: (competicaoId: string) => ['competitions', competicaoId, 'categories'] as const,
  competitionAdmins: (competicaoId: string) => ['competitions', competicaoId, 'admins'] as const,
  teams: (competicaoId: string) => ['competitions', competicaoId, 'teams'] as const,
  team: (timeId: string) => ['teams', timeId] as const,
  players: (timeId: string) => ['teams', timeId, 'players'] as const,
  myTeams: (userId: string) => ['my-teams', userId] as const,
  donos: ['people', 'donos'] as const,
  adminUsers: ['people', 'admins'] as const,
  // Fases e dias de jogos
  phases: (competicaoId: string) => ['competitions', competicaoId, 'phases'] as const,
  gamesProgress: (competicaoId: string) => ['competitions', competicaoId, 'games-progress'] as const,
  events: (competicaoId: string) => ['competitions', competicaoId, 'events'] as const,
  eventCandidates: (competicaoId: string) => ['competitions', competicaoId, 'event-candidates'] as const,
  // Jogos, súmula e classificação
  games: (competicaoId: string) => ['competitions', competicaoId, 'games'] as const,
  scoreSheet: (jogoId: string) => ['games', jogoId, 'score-sheet'] as const,
  classificationAll: ['classification'] as const,
  classification: (faseId: string, grupoId: string | null) => ['classification', faseId, grupoId ?? 'geral'] as const,
  bestExtras: (faseId: string, colocacao: number) => ['classification', faseId, 'extras', colocacao] as const,
  // Área pública
  publicStandings: (slug: string) => ['public', slug, 'standings'] as const,
  bracket: (slug: string) => ['public', slug, 'bracket'] as const,
};
