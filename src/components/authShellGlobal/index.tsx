import { SportsBackdropGlobal } from '@/components/sportsBackdropGlobal';
import { Card, Footer, Page, Subtitle, Title } from './style';
import type { IAuthShellProps } from './types';

export function AuthShellGlobal({ title, subtitle, children, footer }: IAuthShellProps) {
  return (
    <Page>
      <SportsBackdropGlobal />
      <Card>
        <Title>{title}</Title>
        {subtitle && <Subtitle>{subtitle}</Subtitle>}
        {children}
        {footer && <Footer>{footer}</Footer>}
      </Card>
    </Page>
  );
}

export type { IAuthShellProps } from './types';
