import { Link } from 'react-router-dom';
import styled from 'styled-components';

export const BrandLink = styled(Link)<{ $inverse: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm}px;
  color: ${({ theme, $inverse }) => ($inverse ? theme.colors.textInverse : theme.colors.text)};
  font-size: ${({ theme }) => theme.fontSize.lg}px;
  font-weight: ${({ theme }) => theme.fontWeight.bold};
  text-decoration: none;
`;

export const Plus = styled.span`
  color: ${({ theme }) => theme.colors.primary};
`;
