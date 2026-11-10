import styled from 'styled-components';

export { Scroll, Table } from '@/components/standingsTableGlobal/style';

export const GameCell = styled.td`
  && {
    text-align: left;
  }
`;

export const Game = styled.span`
  display: flex;
  flex-direction: column;
  line-height: ${({ theme }) => theme.lineHeight.tight};
`;

export const Opponent = styled.span`
  font-weight: ${({ theme }) => theme.fontWeight.semibold};
`;

export const Result = styled.span`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs}px;
  font-size: ${({ theme }) => theme.fontSize.xs}px;
  color: ${({ theme }) => theme.colors.textMuted};
`;

export const DateCell = styled.td`
  color: ${({ theme }) => theme.colors.textMuted};
`;
