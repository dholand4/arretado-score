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
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm}px;

  & > input {
    flex: 1;
  }
`;

// Base comum de input, select e textarea: mesma altura, borda, cor e foco em todo o app.
export const Input = styled.input<{ $invalid: boolean }>`
  display: block;
  width: 100%;
  min-width: 0;
  height: ${({ theme }) => theme.sizes.controlHeight}px;
  margin: 0;
  padding: 0 ${({ theme }) => theme.spacing.sm + theme.spacing.xs}px;
  border: ${({ theme }) => theme.sizes.borderWidth}px solid
    ${({ theme, $invalid }) => ($invalid ? theme.colors.danger : theme.colors.borderStrong)};
  border-radius: ${({ theme }) => theme.radius.md}px;
  background-color: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.fontSize.md}px;
  line-height: ${({ theme }) => theme.lineHeight.tight};
  transition:
    border-color ${({ theme }) => theme.transition.fast},
    box-shadow ${({ theme }) => theme.transition.fast};

  &::placeholder {
    color: ${({ theme }) => theme.colors.textMuted};
    opacity: 0.8;
  }

  &:hover:not(:disabled) {
    border-color: ${({ theme, $invalid }) => ($invalid ? theme.colors.danger : theme.colors.textMuted)};
  }

  &:focus {
    outline: none;
    border-color: ${({ theme, $invalid }) => ($invalid ? theme.colors.danger : theme.colors.primary)};
    box-shadow: 0 0 0 ${({ theme }) => theme.sizes.focusRing}px
      ${({ theme, $invalid }) => ($invalid ? theme.colors.dangerSoft : theme.colors.primarySoft)};
  }

  &:disabled {
    background-color: ${({ theme }) => theme.colors.surfaceMuted};
    color: ${({ theme }) => theme.colors.textMuted};
    cursor: not-allowed;
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
