import { css } from 'styled-components';

// Apaga suavemente a borda de uma lista que rola de lado, indicando que há mais itens daquele lado.
export const edgeFade = css<{ $fadeStart: boolean; $fadeEnd: boolean }>`
  ${({ theme, $fadeStart, $fadeEnd }) => {
    if (!$fadeStart && !$fadeEnd) return '';
    const size = theme.spacing.xl;
    const gradient = `linear-gradient(to right, ${$fadeStart ? `transparent 0, #000 ${size}px` : '#000 0'}, ${
      $fadeEnd ? `#000 calc(100% - ${size}px), transparent 100%` : '#000 100%'
    })`;
    return `-webkit-mask-image: ${gradient}; mask-image: ${gradient};`;
  }}
`;
