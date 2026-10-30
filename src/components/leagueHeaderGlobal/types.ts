export interface ILeagueHeaderProps {
  name: string;
  logoUrl?: string | null;
  // Etiquetas curtas abaixo do nome (ex.: modalidade e situação da liga).
  tags?: string[];
}
