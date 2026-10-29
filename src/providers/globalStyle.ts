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
    font-family: ${({ theme }) => theme.fontFamily.base};
    font-size: ${({ theme }) => theme.fontSize.md}px;
    line-height: ${({ theme }) => theme.lineHeight.base};
    color: ${({ theme }) => theme.colors.text};
    background-color: ${({ theme }) => theme.colors.background};
    -webkit-font-smoothing: antialiased;
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
