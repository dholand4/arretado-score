import styled from 'styled-components';

// Tela inteira, sem o menu do painel: celular, tablet deitado ou computador na mesa.
export const Page = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm + theme.spacing.xs}px;
  min-height: 100vh;
  padding: calc(${({ theme }) => theme.spacing.sm}px + ${({ theme }) => theme.safeArea.top})
    ${({ theme }) => theme.spacing.sm}px calc(${({ theme }) => theme.spacing.md}px + ${({ theme }) => theme.safeArea.bottom});
  background: ${({ theme }) => theme.colors.background};

  @media (min-width: ${({ theme }) => theme.breakpoints.md}px) {
    padding-left: ${({ theme }) => theme.spacing.md}px;
    padding-right: ${({ theme }) => theme.spacing.md}px;
  }
`;

export const TopBar = styled.header`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.sm}px;
`;

export const Title = styled.h1`
  flex: 1;
  min-width: 0;
  overflow: hidden;
  font-size: ${({ theme }) => theme.fontSize.md}px;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const Toolbar = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.xs}px;
`;

export const Banner = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.sm}px;
  padding: ${({ theme }) => theme.spacing.sm}px ${({ theme }) => theme.spacing.md}px;
  border-radius: ${({ theme }) => theme.radius.md}px;
  background-color: ${({ theme }) => theme.colors.warningSoft};
  color: ${({ theme }) => theme.colors.warning};
  font-weight: ${({ theme }) => theme.fontWeight.semibold};
`;

// No celular só um painel por vez (abas); do tablet em diante, lado a lado.
export const Tabs = styled.div`
  @media (min-width: ${({ theme }) => theme.breakpoints.md}px) {
    display: none;
  }
`;

export const Columns = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: ${({ theme }) => theme.spacing.md}px;

  @media (min-width: ${({ theme }) => theme.breakpoints.md}px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (min-width: ${({ theme }) => theme.breakpoints.lg}px) {
    grid-template-columns: repeat(2, minmax(0, 1fr)) minmax(260px, 0.8fr);
  }
`;

export const Column = styled.div<{ $mobileHidden: boolean; $wide?: boolean }>`
  display: ${({ $mobileHidden }) => ($mobileHidden ? 'none' : 'flex')};
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm}px;
  min-width: 0;

  @media (min-width: ${({ theme }) => theme.breakpoints.md}px) {
    display: flex;
    grid-column: ${({ $wide }) => ($wide ? '1 / -1' : 'auto')};
  }

  @media (min-width: ${({ theme }) => theme.breakpoints.lg}px) {
    grid-column: auto;
  }
`;

export const SectionTitle = styled.h2`
  font-size: ${({ theme }) => theme.fontSize.lg}px;
`;

export const PeriodScores = styled.ul`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.xs}px;
  margin: 0;
  padding: 0;
  list-style: none;
`;

export const PeriodScore = styled.li`
  padding: ${({ theme }) => theme.spacing.xxs}px ${({ theme }) => theme.spacing.sm}px;
  border-radius: ${({ theme }) => theme.radius.pill}px;
  background-color: ${({ theme }) => theme.colors.surfaceMuted};
  font-size: ${({ theme }) => theme.fontSize.sm}px;
  font-variant-numeric: tabular-nums;
`;

export const Intro = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md}px;
  width: 100%;
  max-width: ${({ theme }) => theme.sizes.contentMaxWidth}px;
  margin: 0 auto;
`;

export const Muted = styled.p`
  color: ${({ theme }) => theme.colors.textMuted};
`;

export const FoulChoices = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm}px;
`;
