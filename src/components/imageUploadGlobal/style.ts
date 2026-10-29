import styled from 'styled-components';
import { buttonStyles, type IStyledButtonProps } from '@/components/buttonGlobal/style';

export { ErrorText, Hint, Label } from '@/components/inputGlobal/style';

export const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs}px;
`;

export const Row = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md}px;
`;

export const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm}px;
`;

export const FileLabel = styled.label<IStyledButtonProps>`
  ${buttonStyles}
`;

export const HiddenInput = styled.input`
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
`;
