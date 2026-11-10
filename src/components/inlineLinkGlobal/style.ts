import { Link } from 'react-router-dom';
import styled from 'styled-components';

// Link dentro de texto ou tabela: mantém a cor e o peso de quem está em volta.
export const StyledLink = styled(Link)`
  color: inherit;
  font-weight: inherit;
  text-decoration: none;

  &:hover,
  &:focus-visible {
    color: ${({ theme }) => theme.colors.primary};
    text-decoration: underline;
  }
`;
