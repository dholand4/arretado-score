import { Link } from 'react-router-dom';
import styled from 'styled-components';

export const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md}px;
`;

export const BackLink = styled(Link)`
  color: ${({ theme }) => theme.colors.textMuted};
`;
