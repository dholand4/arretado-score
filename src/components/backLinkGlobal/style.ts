import { Link } from 'react-router-dom';
import styled from 'styled-components';

// "Voltar" no topo da tela, como num aplicativo; só no celular (no computador fica junto das ações).
export const StyledBackLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs}px;
  min-height: ${({ theme }) => theme.sizes.controlHeightSm}px;
  margin: -${({ theme }) => theme.spacing.xs}px 0 ${({ theme }) => theme.spacing.sm}px;
  color: ${({ theme }) => theme.colors.primary};
  font-size: ${({ theme }) => theme.fontSize.sm}px;
  font-weight: ${({ theme }) => theme.fontWeight.semibold};
  text-decoration: none;

  @media (min-width: ${({ theme }) => theme.breakpoints.md}px) {
    display: none;
  }
`;

export const Chevron = styled.span`
  font-size: ${({ theme }) => theme.fontSize.lg}px;
  line-height: 1;
`;
