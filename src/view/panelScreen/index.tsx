import type { Papel } from '@/@types/user';
import { BadgeGlobal } from '@/components/badgeGlobal';
import { PageHeaderGlobal } from '@/components/pageHeaderGlobal';
import { PAPEL_LABEL } from '@/constants/roles';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES, type RoutePath } from '@/routes/types';
import { Grid, ShortcutDisabled, ShortcutLink, ShortcutText, ShortcutTitle } from './style';

interface IShortcut {
  title: string;
  description: string;
  roles: Papel[];
  to?: RoutePath;
}

// Atalhos sem `to` ficam visíveis como "em breve" até a etapa correspondente.
const SHORTCUTS: IShortcut[] = [
  { title: 'Usuários', description: 'Criar coordenadores e equipes, redefinir senhas.', roles: ['master'], to: ROUTES.users },
  {
    title: 'Competições',
    description: 'Criar e administrar campeonatos, times e jogadores.',
    roles: ['master', 'admin'],
    to: ROUTES.competitions,
  },
  { title: 'Meus times', description: 'Elenco do seu time: nome, número e foto.', roles: ['dono_time'], to: ROUTES.myTeams },
];

export function PanelScreen() {
  const { profile } = useAuth();
  if (!profile) return null;

  const items = SHORTCUTS.filter((item) => item.roles.includes(profile.papel));

  return (
    <>
      <PageHeaderGlobal title={`Olá, ${profile.nome.split(' ')[0]}`} subtitle={PAPEL_LABEL[profile.papel]} />
      <Grid>
        {items.map((item) => (
          <li key={item.title}>
            {item.to ? (
              <ShortcutLink to={item.to}>
                <ShortcutTitle>{item.title}</ShortcutTitle>
                <ShortcutText>{item.description}</ShortcutText>
              </ShortcutLink>
            ) : (
              <ShortcutDisabled aria-disabled="true">
                <ShortcutTitle>
                  {item.title}
                  <BadgeGlobal label="Em breve" />
                </ShortcutTitle>
                <ShortcutText>{item.description}</ShortcutText>
              </ShortcutDisabled>
            )}
          </li>
        ))}
      </Grid>
    </>
  );
}
