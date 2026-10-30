import { Banner, Initial, Logo, LogoBox, Name, Overline, Tag, Tags, Texts } from './style';
import type { ILeagueHeaderProps } from './types';

// Banner no topo das telas da liga: logo, nome e etiquetas (modalidade, situação).
export function LeagueHeaderGlobal({ name, logoUrl, tags = [] }: ILeagueHeaderProps) {
  return (
    <Banner aria-label={`Liga: ${name}`}>
      <LogoBox>{logoUrl ? <Logo src={logoUrl} alt="" /> : <Initial aria-hidden>{name.charAt(0)}</Initial>}</LogoBox>
      <Texts>
        <Overline>Liga</Overline>
        <Name>{name}</Name>
        {tags.length > 0 && (
          <Tags>
            {tags.map((tag) => (
              <Tag key={tag}>{tag}</Tag>
            ))}
          </Tags>
        )}
      </Texts>
    </Banner>
  );
}

export type { ILeagueHeaderProps } from './types';
