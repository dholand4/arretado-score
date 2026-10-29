export const QUERY_KEYS = {
  // Etapa 5
  bracket: (slug: string) => ['etapa5', 'bracket', slug] as const,
  // Etapa 4
  games: (id: string) => ['etapa4', 'games', id] as const,
  sheet: (competitionId: string, gameId: string) => ['etapa4', 'sheet', competitionId, gameId] as const,
  standings: (slug: string) => ['etapa4', 'standings', slug] as const,
  classification: (phase: string, group: string | null) => ['etapa4', 'classification', phase, group] as const,
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
};
