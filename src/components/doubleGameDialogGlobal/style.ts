import styled from 'styled-components';

export const Message = styled.p`
  font-size: ${({ theme }) => theme.fontSize.md}px;
  line-height: ${({ theme }) => theme.lineHeight.base};
`;
