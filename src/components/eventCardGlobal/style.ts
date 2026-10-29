import styled from 'styled-components';

export const Meta = styled.p`
  font-size: ${({ theme }) => theme.fontSize.sm}px;
  color: ${({ theme }) => theme.colors.textMuted};
`;

export const Games = styled.ol`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs}px;
  margin: 0;
  padding: 0;
  list-style: none;
`;

export const Game = styled.li`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm}px;
  padding: ${({ theme }) => theme.spacing.sm}px;
  border-radius: ${({ theme }) => theme.radius.md}px;
  background-color: ${({ theme }) => theme.colors.surfaceMuted};
  font-size: ${({ theme }) => theme.fontSize.sm}px;
`;

export const Time = styled.span`
  min-width: ${({ theme }) => theme.spacing.xxl}px;
  font-weight: ${({ theme }) => theme.fontWeight.bold};
`;

export const Texts = styled.span`
  display: flex;
  flex-direction: column;
`;

export const Details = styled.span`
  font-size: ${({ theme }) => theme.fontSize.xs}px;
  color: ${({ theme }) => theme.colors.textMuted};
`;

export const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.xs}px;
`;
