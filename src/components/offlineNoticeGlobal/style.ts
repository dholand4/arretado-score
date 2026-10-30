import styled from 'styled-components';

export const Notice = styled.div`
  position: fixed;
  right: ${({ theme }) => theme.spacing.md}px;
  bottom: calc(${({ theme }) => theme.spacing.md}px + ${({ theme }) => theme.safeArea.bottom});
  left: ${({ theme }) => theme.spacing.md}px;
  z-index: ${({ theme }) => theme.zIndex.modal + 1};
  max-width: ${({ theme }) => theme.sizes.modalMaxWidth}px;
  margin: 0 auto;
  padding: ${({ theme }) => theme.spacing.sm + theme.spacing.xs}px ${({ theme }) => theme.spacing.md}px;
  border-radius: ${({ theme }) => theme.radius.md}px;
  background-color: ${({ theme }) => theme.colors.secondary};
  box-shadow: ${({ theme }) => theme.shadows.md};
  color: ${({ theme }) => theme.colors.textInverse};
  font-size: ${({ theme }) => theme.fontSize.sm}px;
  text-align: center;
`;

export const Title = styled.strong`
  font-weight: ${({ theme }) => theme.fontWeight.semibold};
`;
