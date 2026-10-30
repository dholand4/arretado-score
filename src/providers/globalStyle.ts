import { createGlobalStyle } from 'styled-components';

export const GlobalStyle = createGlobalStyle`
  *, *::before, *::after {
    box-sizing: border-box;
  }

  html {
    -webkit-text-size-adjust: 100%;
  }

  body {
    margin: 0;
    min-height: 100vh;
    /* No iPhone instalado o app ocupa a tela toda: o conteúdo começa abaixo da barra de status. */
    padding-top: ${({ theme }) => theme.safeArea.top};
    padding-bottom: ${({ theme }) => theme.safeArea.bottom};
    font-family: ${({ theme }) => theme.fontFamily.base};
    font-size: ${({ theme }) => theme.fontSize.md}px;
    line-height: ${({ theme }) => theme.lineHeight.base};
    color: ${({ theme }) => theme.colors.text};
    background-color: ${({ theme }) => theme.colors.background};
    -webkit-font-smoothing: antialiased;
  }

  /* Faixa azul atrás da barra de status do iPhone (altura zero nos outros aparelhos). */
  body::before {
    content: '';
    position: fixed;
    top: 0;
    right: 0;
    left: 0;
    z-index: ${({ theme }) => theme.zIndex.header + 1};
    height: ${({ theme }) => theme.safeArea.top};
    background-color: ${({ theme }) => theme.colors.secondary};
  }

  h1, h2, h3, h4, p {
    margin: 0;
  }

  h1, h2, h3, h4 {
    line-height: ${({ theme }) => theme.lineHeight.tight};
  }

  a {
    color: ${({ theme }) => theme.colors.primary};
  }

  button, input, select, textarea {
    font: inherit;
  }

  :focus-visible {
    outline: ${({ theme }) => theme.sizes.focusRing}px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 2px;
  }
`;
