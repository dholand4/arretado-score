import styled from 'styled-components';

export const Wrapper = styled.label`
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing.sm + theme.spacing.xs}px;
  cursor: pointer;
`;

export const Box = styled.input`
  flex-shrink: 0;
  width: ${({ theme }) => theme.spacing.lg - theme.spacing.xs}px;
  height: ${({ theme }) => theme.spacing.lg - theme.spacing.xs}px;
  margin: ${({ theme }) => theme.spacing.xxs}px 0 0;
  accent-color: ${({ theme }) => theme.colors.primary};
  cursor: inherit;
`;

export const Texts = styled.span`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xxs}px;
`;

export const Label = styled.span`
  font-size: ${({ theme }) => theme.fontSize.md}px;
  font-weight: ${({ theme }) => theme.fontWeight.medium};
`;

export const Description = styled.span`
  font-size: ${({ theme }) => theme.fontSize.sm}px;
  color: ${({ theme }) => theme.colors.textMuted};
`;
