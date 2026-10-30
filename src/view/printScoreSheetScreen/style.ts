import styled from 'styled-components';

export const Page = styled.div`
  min-height: 100vh;
  padding: ${({ theme }) => theme.spacing.md}px;
  background: ${({ theme }) => theme.colors.background};

  @media print {
    min-height: 0;
    padding: 0;
    background: none;
  }

  @page {
    size: A4 portrait;
    margin: 8mm;
  }
`;

export const Toolbar = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.sm}px;
  max-width: ${({ theme }) => theme.sizes.contentMaxWidth}px;
  margin: 0 auto ${({ theme }) => theme.spacing.md}px;

  @media print {
    display: none;
  }
`;

export const Hint = styled.p`
  flex-basis: 100%;
  font-size: ${({ theme }) => theme.fontSize.sm}px;
  color: ${({ theme }) => theme.colors.textMuted};
`;

// Em telas estreitas a folha (194 mm) aparece reduzida; na impressão volta ao tamanho real.
export const Paper = styled.div`
  width: fit-content;
  max-width: 100%;
  margin: 0 auto;
  overflow-x: auto;
  box-shadow: ${({ theme }) => theme.shadows.sm};

  @media (max-width: ${({ theme }) => theme.breakpoints.md - 1}px) {
    zoom: 0.58;
  }

  @media (max-width: 479px) {
    zoom: 0.45;
  }

  @media print {
    zoom: 1;
    overflow: visible;
    box-shadow: none;
  }
`;
