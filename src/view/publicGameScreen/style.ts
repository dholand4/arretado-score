import styled from 'styled-components';

export const Stack = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.lg}px;
`;

export const Info = styled.p`
  font-size: ${({ theme }) => theme.fontSize.sm}px;
  color: ${({ theme }) => theme.colors.textMuted};
`;

export const Teams = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: ${({ theme }) => theme.spacing.lg}px;

  @media (min-width: ${({ theme }) => theme.breakpoints.lg}px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

export const LiveTitle = styled.h2`
  font-size: ${({ theme }) => theme.fontSize.lg}px;
  font-weight: ${({ theme }) => theme.fontWeight.semibold};
`;
