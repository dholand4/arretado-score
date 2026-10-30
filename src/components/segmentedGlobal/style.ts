import styled from 'styled-components';

export const Group = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.xs}px;
  padding: ${({ theme }) => theme.spacing.xs}px;
  border-radius: ${({ theme }) => theme.radius.md}px;
  background-color: ${({ theme }) => theme.colors.surfaceMuted};
  overflow-x: auto;
`;

export const Option = styled.button<{ $active: boolean }>`
  flex: 1;
  min-height: ${({ theme }) => theme.sizes.controlHeightSm}px;
  padding: 0 ${({ theme }) => theme.spacing.sm + theme.spacing.xs}px;
  border: none;
  border-radius: ${({ theme }) => theme.radius.sm}px;
  background-color: ${({ theme, $active }) => ($active ? theme.colors.surface : 'transparent')};
  box-shadow: ${({ theme, $active }) => ($active ? theme.shadows.sm : 'none')};
  color: ${({ theme, $active }) => ($active ? theme.colors.text : theme.colors.textMuted)};
  font-size: ${({ theme }) => theme.fontSize.sm}px;
  font-weight: ${({ theme, $active }) => ($active ? theme.fontWeight.semibold : theme.fontWeight.medium)};
  white-space: nowrap;
  cursor: pointer;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
`;
