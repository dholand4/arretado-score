import { Link } from 'react-router-dom';
import styled from 'styled-components';

export const Wrapper = styled.main`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.md}px;
  min-height: ${({ theme }) => theme.safeArea.viewportHeight};
  padding: ${({ theme }) => theme.spacing.lg}px;
  text-align: center;
`;

export const Code = styled.p`
  font-size: ${({ theme }) => theme.fontSize.xxl * 2}px;
  font-weight: ${({ theme }) => theme.fontWeight.bold};
  color: ${({ theme }) => theme.colors.primary};
  line-height: 1;
`;

export const Title = styled.h1`
  font-size: ${({ theme }) => theme.fontSize.xl}px;
`;

export const HomeLink = styled(Link)`
  font-weight: ${({ theme }) => theme.fontWeight.semibold};
`;
