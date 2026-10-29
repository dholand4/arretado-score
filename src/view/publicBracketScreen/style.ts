import styled from 'styled-components';

export const Bracket = styled.div`
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing.lg}px;
  overflow-x: auto;
  padding-bottom: ${({ theme }) => theme.spacing.md}px;
`;
export const Phase = styled.section`
  flex: 0 0 min(80vw, 320px);
  min-width: 0;
`;
export const Series = styled.article`
  margin-bottom: ${({ theme }) => theme.spacing.md}px;
  padding: ${({ theme }) => theme.spacing.md}px;
  border: ${({ theme }) => theme.sizes.borderWidth}px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md}px;
  background: ${({ theme }) => theme.colors.surface};
  box-shadow: ${({ theme }) => theme.shadows.sm};
`;
export const Team = styled.div`
  display: flex;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.sm}px;
  padding: ${({ theme }) => theme.spacing.xs}px 0;
`;
export const Games = styled.ul`
  padding-left: ${({ theme }) => theme.spacing.md}px;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSize.sm}px;
`;
export const Champion = styled.p`
  padding: ${({ theme }) => theme.spacing.md}px;
  border-radius: ${({ theme }) => theme.radius.md}px;
  background: ${({ theme }) => theme.colors.successSoft};
  color: ${({ theme }) => theme.colors.success};
  font-weight: ${({ theme }) => theme.fontWeight.bold};
`;
