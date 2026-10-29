import styled from 'styled-components';

export const List = styled.ol`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm}px;
  margin: 0;
  padding: 0;
  list-style: none;
`;

export const Item = styled.li<{ $dragging: boolean }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm}px;
  padding: ${({ theme }) => theme.spacing.sm}px ${({ theme }) => theme.spacing.sm + theme.spacing.xs}px;
  border: ${({ theme }) => theme.sizes.borderWidth}px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md}px;
  background-color: ${({ theme }) => theme.colors.surface};
  opacity: ${({ $dragging }) => ($dragging ? 0.5 : 1)};
  cursor: grab;
`;

export const Position = styled.span`
  min-width: ${({ theme }) => theme.spacing.lg}px;
  font-weight: ${({ theme }) => theme.fontWeight.bold};
  color: ${({ theme }) => theme.colors.primary};
`;

export const Texts = styled.span`
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
`;

export const Description = styled.span`
  font-size: ${({ theme }) => theme.fontSize.xs}px;
  color: ${({ theme }) => theme.colors.textMuted};
`;

export const Controls = styled.span`
  display: flex;
  gap: ${({ theme }) => theme.spacing.xxs}px;
`;

export const IconButton = styled.button`
  min-width: ${({ theme }) => theme.sizes.controlHeightSm}px;
  min-height: ${({ theme }) => theme.sizes.controlHeightSm}px;
  border: ${({ theme }) => theme.sizes.borderWidth}px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.sm}px;
  background-color: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.text};
  cursor: pointer;

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;
