import styled from 'styled-components';

// Banner da liga: degradê azul com brilho laranja e o círculo central de uma quadra ao fundo.
export const Banner = styled.section`
  position: relative;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md}px;
  margin-bottom: ${({ theme }) => theme.spacing.lg}px;
  padding: ${({ theme }) => theme.spacing.md}px;
  overflow: hidden;
  border-radius: ${({ theme }) => theme.radius.lg}px;
  background:
    radial-gradient(circle at 100% 0%, ${({ theme }) => theme.colors.primary}66 0%, transparent 55%),
    linear-gradient(135deg, ${({ theme }) => theme.colors.secondary} 0%, ${({ theme }) => theme.colors.secondaryHover} 100%);
  box-shadow: ${({ theme }) => theme.shadows.md};
  color: ${({ theme }) => theme.colors.textInverse};

  /* Círculo central e linha do meio da quadra, bem sutis. */
  &::before,
  &::after {
    content: '';
    position: absolute;
    pointer-events: none;
  }

  &::before {
    right: -${({ theme }) => theme.spacing.xxl}px;
    top: 50%;
    width: 220px;
    height: 220px;
    border: 2px solid ${({ theme }) => theme.colors.textInverse}1f;
    border-radius: 50%;
    transform: translateY(-50%);
  }

  &::after {
    right: ${({ theme }) => 110 - theme.spacing.xxl}px;
    top: 0;
    bottom: 0;
    border-left: 2px solid ${({ theme }) => theme.colors.textInverse}1f;
  }

  @media (min-width: ${({ theme }) => theme.breakpoints.md}px) {
    gap: ${({ theme }) => theme.spacing.lg}px;
    padding: ${({ theme }) => theme.spacing.lg}px ${({ theme }) => theme.spacing.xl}px;
  }
`;

export const LogoBox = styled.div`
  position: relative;
  z-index: 1;
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  padding: ${({ theme }) => theme.spacing.xs}px;
  border-radius: ${({ theme }) => theme.radius.md}px;
  background-color: ${({ theme }) => theme.colors.surface};
  box-shadow: ${({ theme }) => theme.shadows.md};

  @media (min-width: ${({ theme }) => theme.breakpoints.md}px) {
    width: 84px;
    height: 84px;
  }
`;

export const Logo = styled.img`
  width: 100%;
  height: 100%;
  object-fit: contain;
`;

// Sem logo: a inicial da liga no lugar.
export const Initial = styled.span`
  color: ${({ theme }) => theme.colors.secondary};
  font-size: ${({ theme }) => theme.fontSize.xxl}px;
  font-weight: ${({ theme }) => theme.fontWeight.bold};
`;

export const Texts = styled.div`
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs}px;
  min-width: 0;
`;

export const Overline = styled.span`
  color: ${({ theme }) => theme.colors.primary};
  font-size: ${({ theme }) => theme.fontSize.xs}px;
  font-weight: ${({ theme }) => theme.fontWeight.bold};
  letter-spacing: 0.12em;
  text-transform: uppercase;
`;

export const Name = styled.h2`
  overflow-wrap: anywhere;
  font-size: ${({ theme }) => theme.fontSize.lg}px;
  font-weight: ${({ theme }) => theme.fontWeight.bold};
  line-height: ${({ theme }) => theme.lineHeight.tight};

  @media (min-width: ${({ theme }) => theme.breakpoints.md}px) {
    font-size: ${({ theme }) => theme.fontSize.xxl}px;
  }
`;

export const Tags = styled.ul`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.xs}px;
  margin: ${({ theme }) => theme.spacing.xxs}px 0 0;
  padding: 0;
  list-style: none;
`;

export const Tag = styled.li`
  padding: ${({ theme }) => theme.spacing.xxs}px ${({ theme }) => theme.spacing.sm}px;
  border: 1px solid ${({ theme }) => theme.colors.textInverse}33;
  border-radius: ${({ theme }) => theme.radius.pill}px;
  background-color: ${({ theme }) => theme.colors.textInverse}14;
  font-size: ${({ theme }) => theme.fontSize.xs}px;
  font-weight: ${({ theme }) => theme.fontWeight.medium};
`;
