import styled from 'styled-components';

export const Box = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.sm + theme.spacing.xs}px;
  margin-bottom: ${({ theme }) => theme.spacing.lg}px;
  padding: ${({ theme }) => theme.spacing.md}px;
  border: ${({ theme }) => theme.sizes.borderWidth}px solid ${({ theme }) => theme.colors.warning};
  border-radius: ${({ theme }) => theme.radius.md}px;
  background-color: ${({ theme }) => theme.colors.warningSoft};
`;

export const Texts = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xxs}px;
  min-width: 220px;
  font-size: ${({ theme }) => theme.fontSize.sm}px;

  strong {
    color: ${({ theme }) => theme.colors.warning};
  }
`;

export const ErrorText = styled.span`
  color: ${({ theme }) => theme.colors.danger};
`;
