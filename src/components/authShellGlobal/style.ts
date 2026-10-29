import styled from 'styled-components';

export const Page = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.lg}px;
  min-height: 100vh;
  padding: ${({ theme }) => theme.spacing.lg}px ${({ theme }) => theme.spacing.md}px;
  background-color: ${({ theme }) => theme.colors.secondary};
`;

export const Card = styled.main`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md}px;
  width: 100%;
  max-width: ${({ theme }) => theme.sizes.modalMaxWidth - theme.spacing.xxl}px;
  padding: ${({ theme }) => theme.spacing.lg}px;
  background-color: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radius.lg}px;
  box-shadow: ${({ theme }) => theme.shadows.lg};
`;

export const Title = styled.h1`
  font-size: ${({ theme }) => theme.fontSize.xl}px;
  font-weight: ${({ theme }) => theme.fontWeight.bold};
`;

export const Subtitle = styled.p`
  margin-top: ${({ theme }) => -theme.spacing.sm}px;
  font-size: ${({ theme }) => theme.fontSize.sm}px;
  color: ${({ theme }) => theme.colors.textMuted};
`;

export const Footer = styled.div`
  display: flex;
  justify-content: center;
  font-size: ${({ theme }) => theme.fontSize.sm}px;
`;
