import { ROUTES } from '@/routes/types';
import { Code, HomeLink, Title, Wrapper } from './style';

export function NotFoundScreen() {
  return (
    <Wrapper>
      <Code>404</Code>
      <Title>Página não encontrada</Title>
      <HomeLink to={ROUTES.home}>Voltar para o início</HomeLink>
    </Wrapper>
  );
}
