import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { buttonStyles, type IStyledButtonProps } from '@/components/buttonGlobal/style';

export const StyledLink = styled(Link)<IStyledButtonProps & { $hideOnMobile: boolean }>`
  ${buttonStyles}

  @media (max-width: ${({ theme }) => theme.breakpoints.md - 1}px) {
    ${({ $hideOnMobile }) => ($hideOnMobile ? 'display: none;' : '')}
  }
`;
