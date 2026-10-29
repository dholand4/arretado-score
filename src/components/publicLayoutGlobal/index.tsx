import { BrandGlobal } from '@/components/brandGlobal';
import { AccountLink, Footer, Header, HeaderInner, Main, Shell } from './style';
import type { IPublicLayoutProps } from './types';

export function PublicLayoutGlobal({ children, accountLink }: IPublicLayoutProps) {
  return (
    <Shell>
      <Header>
        <HeaderInner>
          <BrandGlobal to="/" inverse />
          <AccountLink to={accountLink.to}>{accountLink.label}</AccountLink>
        </HeaderInner>
      </Header>
      <Main>{children}</Main>
      <Footer>TorneioMais · campeonatos amadores</Footer>
    </Shell>
  );
}

export type { IPublicLayoutProps } from './types';
