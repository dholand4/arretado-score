import styled, { css } from 'styled-components';

// Medidas de papel (A4 com margem de 8 mm): não há token de tema para impressão.
export const SHEET = {
  width: '194mm',
  line: '0.25mm',
  thick: '0.5mm',
  box: '4mm',
  circle: '3.6mm',
  logoHeight: '22mm',
  font: '7.5pt',
  fontSmall: '6.5pt',
  fontTitle: '20pt',
  fontSubtitle: '11pt',
} as const;

const ink = css`
  border-color: ${({ theme }) => theme.colors.text};
`;

export const Sheet = styled.article<{ $rowHeight: number }>`
  --row-height: ${({ $rowHeight }) => $rowHeight}mm;
  width: ${SHEET.width};
  margin: 0 auto;
  padding: ${({ theme }) => theme.spacing.xs}px;
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.text};
  font-family: Arial, Helvetica, sans-serif;
  font-size: ${SHEET.font};
  line-height: ${({ theme }) => theme.lineHeight.tight};
  print-color-adjust: exact;
  -webkit-print-color-adjust: exact;

  @media print {
    padding: 0;
  }
`;

export const Header = styled.header`
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md}px;
  min-height: ${SHEET.logoHeight};
  margin-bottom: ${({ theme }) => theme.spacing.sm}px;
`;

export const League = styled.p`
  font-size: ${SHEET.fontSubtitle};
  font-weight: ${({ theme }) => theme.fontWeight.bold};
  text-transform: uppercase;
`;

export const Logo = styled.img`
  display: block;
  max-height: ${SHEET.logoHeight};
  max-width: 40mm;
  object-fit: contain;
`;

export const TitleBox = styled.div`
  text-align: right;
`;

export const Title = styled.h1`
  font-size: ${SHEET.fontTitle};
  font-weight: ${({ theme }) => theme.fontWeight.regular};
  letter-spacing: 0.04em;
`;

export const Subtitle = styled.p`
  font-size: ${SHEET.fontSubtitle};
`;

export const Phase = styled.p`
  font-size: ${SHEET.fontSmall};
`;

// Linha "rótulo ____valor____".
export const Fields = styled.div<{ $columns: string }>`
  display: grid;
  grid-template-columns: ${({ $columns }) => $columns};
  column-gap: ${({ theme }) => theme.spacing.md}px;
  row-gap: ${({ theme }) => theme.spacing.xs}px;
  align-items: end;
`;

export const Field = styled.div`
  display: flex;
  align-items: flex-end;
  gap: ${({ theme }) => theme.spacing.xs}px;
  min-width: 0;
  white-space: nowrap;
`;

export const FieldValue = styled.span`
  flex: 1;
  min-width: 0;
  min-height: 1.3em;
  overflow: hidden;
  text-overflow: ellipsis;
  border-bottom: ${SHEET.line} solid;
  ${ink}
  font-weight: ${({ theme }) => theme.fontWeight.bold};
`;

export const TeamsLine = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.sm}px;
  font-size: ${SHEET.fontSubtitle};
`;

export const Box = styled.section`
  border: ${SHEET.thick} solid;
  ${ink}
`;

export const InfoBox = styled(Box)`
  padding: ${({ theme }) => theme.spacing.xs}px ${({ theme }) => theme.spacing.sm}px;
  font-size: ${SHEET.fontSubtitle};
`;

export const Main = styled.div`
  display: grid;
  grid-template-columns: 63fr 37fr;
  border: ${SHEET.thick} solid;
  border-top: none;
  ${ink}
`;

export const Teams = styled.div`
  border-right: ${SHEET.thick} solid;
  ${ink}
`;

export const Team = styled.section`
  & + & {
    border-top: ${SHEET.thick} solid;
    ${ink}
  }
`;

export const TeamTitle = styled.h2`
  padding: ${({ theme }) => theme.spacing.xxs}px ${({ theme }) => theme.spacing.xs}px;
  font-size: ${SHEET.fontSubtitle};
  font-weight: ${({ theme }) => theme.fontWeight.regular};
  border-bottom: ${SHEET.line} solid;
  ${ink}

  strong {
    font-weight: ${({ theme }) => theme.fontWeight.bold};
  }
`;

export const Controls = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  border-bottom: ${SHEET.line} solid;
  ${ink}
`;

export const Control = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xxs}px;
  padding: ${({ theme }) => theme.spacing.xxs}px ${({ theme }) => theme.spacing.xs}px;

  & + & {
    border-left: ${SHEET.line} solid;
    ${ink}
  }
`;

export const ControlRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs}px;
  white-space: nowrap;
`;

export const Circle = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: ${SHEET.circle};
  height: ${SHEET.circle};
  border: ${SHEET.line} solid;
  ${ink}
  border-radius: 50%;
  font-size: ${SHEET.fontSmall};
  flex-shrink: 0;
`;

export const Squares = styled.span`
  display: inline-flex;
`;

export const Square = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: ${SHEET.box};
  height: ${SHEET.box};
  border: ${SHEET.line} solid;
  ${ink}
  font-size: ${SHEET.fontSmall};

  & + & {
    border-left: none;
  }
`;

const cell = css`
  border: ${SHEET.line} solid;
  ${ink}
  padding: 0 ${({ theme }) => theme.spacing.xxs}px;
  height: var(--row-height);
  font-size: ${SHEET.font};
  font-weight: ${({ theme }) => theme.fontWeight.regular};
`;

export const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;

  th,
  td {
    ${cell}
  }

  tr > :first-child {
    border-left: none;
  }

  tr > :last-child {
    border-right: none;
  }

  thead tr:first-child > * {
    border-top: none;
  }
`;

export const Col = styled.col<{ $width: string }>`
  width: ${({ $width }) => $width};
`;

export const Th = styled.th`
  text-align: center;
`;

export const Small = styled(Th)`
  font-size: ${SHEET.fontSmall} !important;
`;

export const NameCell = styled.td`
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-weight: ${({ theme }) => theme.fontWeight.semibold} !important;
`;

export const Center = styled.td`
  text-align: center;
  font-weight: ${({ theme }) => theme.fontWeight.bold} !important;
`;

// Contagem de pontos: a tabela estica até a altura das duas equipes.
export const Points = styled(Table)`
  height: 100%;

  td {
    height: auto;
    padding: 0;
    text-align: center;
    font-size: ${SHEET.fontSmall};
  }

  tbody tr:last-child td {
    border-bottom: none;
  }
`;

export const PointsTitle = styled.th`
  font-weight: ${({ theme }) => theme.fontWeight.bold} !important;
  letter-spacing: 0.04em;
`;

export const BlockEdge = styled.td`
  border-right: ${SHEET.thick} solid !important;
`;

export const Bottom = styled.div`
  display: grid;
  grid-template-columns: 46fr 54fr;
  border: ${SHEET.thick} solid;
  border-top: none;
  ${ink}

  & > * {
    display: flex;
    flex-direction: column;
    justify-content: space-around;
    gap: ${({ theme }) => theme.spacing.xs}px;
    padding: ${({ theme }) => theme.spacing.xs}px ${({ theme }) => theme.spacing.sm}px;
  }

  & > :nth-child(odd) {
    border-right: ${SHEET.thick} solid;
    ${ink}
  }

  & > :nth-child(n + 3) {
    border-top: ${SHEET.thick} solid;
    ${ink}
  }
`;

export const PeriodLine = styled.div`
  display: grid;
  grid-template-columns: 14mm repeat(2, 1fr);
  gap: ${({ theme }) => theme.spacing.sm}px;
  align-items: center;
`;

export const PeriodScore = styled.div`
  display: grid;
  grid-template-columns: auto 1fr 1fr;
  align-items: end;
  gap: ${({ theme }) => theme.spacing.sm}px;
`;
