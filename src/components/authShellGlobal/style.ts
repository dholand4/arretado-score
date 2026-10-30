import styled from 'styled-components';

export const Page = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.lg}px;
  min-height: ${({ theme }) => theme.safeArea.viewportHeight};
  padding: ${({ theme }) => theme.spacing.lg}px ${({ theme }) => theme.spacing.md}px;
  background-color: ${({ theme }) => theme.colors.secondary};
  isolation: isolate;
`;

export const Card = styled.main`
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md}px;
  width: 100%;
  max-width: ${({ theme }) => theme.sizes.modalMaxWidth - theme.spacing.xxl}px;
  padding: ${({ theme }) => theme.spacing.lg}px;
  border: ${({ theme }) => theme.sizes.borderWidth}px solid rgba(255, 255, 255, 0.6);
  background-color: rgba(255, 255, 255, 0.94);
  border-radius: ${({ theme }) => theme.radius.lg}px;
  box-shadow: ${({ theme }) => theme.shadows.lg};
  backdrop-filter: blur(10px);
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
