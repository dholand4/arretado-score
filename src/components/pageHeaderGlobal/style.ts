import styled from 'styled-components';

export const Container = styled.header`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm + theme.spacing.xs}px;
  margin-bottom: ${({ theme }) => theme.spacing.lg}px;

  @media (min-width: ${({ theme }) => theme.breakpoints.md}px) {
    flex-direction: row;
    align-items: flex-end;
    justify-content: space-between;
  }
`;

export const Texts = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs}px;
`;

export const Title = styled.h1`
  font-size: ${({ theme }) => theme.fontSize.xl}px;
  font-weight: ${({ theme }) => theme.fontWeight.bold};

  @media (min-width: ${({ theme }) => theme.breakpoints.md}px) {
    font-size: ${({ theme }) => theme.fontSize.xxl}px;
  }
`;

export const Subtitle = styled.p`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSize.sm}px;
`;

export const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm}px;
`;
