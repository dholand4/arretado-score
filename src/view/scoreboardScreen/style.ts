import styled from 'styled-components';

// Tela inteira escura: o placar ocupa tudo (tablet de frente para a quadra).
export const Screen = styled.div`
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  background-color: #0e1424;
`;

export const Fill = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;

  > * {
    flex: 1;
  }
`;

export const FullscreenButton = styled.button`
  position: absolute;
  top: calc(${({ theme }) => theme.spacing.sm}px + ${({ theme }) => theme.safeArea.top});
  right: ${({ theme }) => theme.spacing.sm}px;
  padding: ${({ theme }) => theme.spacing.xs}px ${({ theme }) => theme.spacing.sm}px;
  border: ${({ theme }) => theme.sizes.borderWidth}px solid rgba(255, 255, 255, 0.25);
  border-radius: ${({ theme }) => theme.radius.md}px;
  background: transparent;
  color: rgba(255, 255, 255, 0.7);
  font-size: ${({ theme }) => theme.fontSize.xs}px;
  cursor: pointer;
`;
