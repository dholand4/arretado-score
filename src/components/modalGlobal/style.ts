import styled from 'styled-components';

export const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: ${({ theme }) => theme.zIndex.modal};
  display: flex;
  align-items: flex-end;
  justify-content: center;
  background-color: ${({ theme }) => theme.colors.overlay};

  @media (min-width: ${({ theme }) => theme.breakpoints.md}px) {
    align-items: center;
    padding: ${({ theme }) => theme.spacing.lg}px;
  }
`;

export const Dialog = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: ${({ theme }) => theme.sizes.modalMaxWidth}px;
  max-height: 90vh;
  background-color: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radius.lg}px ${({ theme }) => theme.radius.lg}px 0 0;
  box-shadow: ${({ theme }) => theme.shadows.lg};
  /* No celular a janela sobe de baixo: deixa livre a barra de gestos do iPhone. */
  padding-bottom: ${({ theme }) => theme.safeArea.bottom};

  @media (min-width: ${({ theme }) => theme.breakpoints.md}px) {
    border-radius: ${({ theme }) => theme.radius.lg}px;
  }
`;

export const Header = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.sm}px;
  padding: ${({ theme }) => theme.spacing.md}px;
  border-bottom: ${({ theme }) => theme.sizes.borderWidth}px solid ${({ theme }) => theme.colors.border};
`;

export const Title = styled.h2`
  font-size: ${({ theme }) => theme.fontSize.lg}px;
  font-weight: ${({ theme }) => theme.fontWeight.semibold};
`;

export const CloseButton = styled.button`
  border: none;
  background: transparent;
  font-size: ${({ theme }) => theme.fontSize.xl}px;
  line-height: 1;
  color: ${({ theme }) => theme.colors.textMuted};
  cursor: pointer;
  padding: ${({ theme }) => theme.spacing.xs}px;
`;

export const Body = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md}px;
  padding: ${({ theme }) => theme.spacing.md}px;
  overflow-y: auto;
`;

export const Footer = styled.footer`
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.spacing.sm}px;
  padding: ${({ theme }) => theme.spacing.md}px;
  border-top: ${({ theme }) => theme.sizes.borderWidth}px solid ${({ theme }) => theme.colors.border};
`;
