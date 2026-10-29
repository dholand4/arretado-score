import styled from 'styled-components';

export const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs}px;
  width: 100%;
`;

export const Label = styled.label`
  font-size: ${({ theme }) => theme.fontSize.sm}px;
  font-weight: ${({ theme }) => theme.fontWeight.medium};
  color: ${({ theme }) => theme.colors.text};
`;

export const Row = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm}px;
`;

export const Input = styled.input<{ $invalid: boolean }>`
  flex: 1;
  min-width: 0;
  min-height: ${({ theme }) => theme.sizes.controlHeight}px;
  padding: 0 ${({ theme }) => theme.spacing.sm + theme.spacing.xs}px;
  border: ${({ theme }) => theme.sizes.borderWidth}px solid
    ${({ theme, $invalid }) => ($invalid ? theme.colors.danger : theme.colors.borderStrong)};
  border-radius: ${({ theme }) => theme.radius.md}px;
  background-color: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.fontSize.md}px;

  &:disabled {
    background-color: ${({ theme }) => theme.colors.surfaceMuted};
  }
`;

export const Hint = styled.span`
  font-size: ${({ theme }) => theme.fontSize.xs}px;
  color: ${({ theme }) => theme.colors.textMuted};
`;

export const ErrorText = styled.span`
  font-size: ${({ theme }) => theme.fontSize.xs}px;
  color: ${({ theme }) => theme.colors.danger};
`;
