import styled from 'styled-components';
import { Input } from '@/components/inputGlobal/style';

export { ErrorText, Field, Hint, Label } from '@/components/inputGlobal/style';

export const Textarea = styled(Input).attrs({ as: 'textarea' })`
  height: auto;
  min-height: ${({ theme }) => theme.sizes.controlHeight * 2}px;
  padding-top: ${({ theme }) => theme.spacing.sm + theme.spacing.xxs}px;
  padding-bottom: ${({ theme }) => theme.spacing.sm + theme.spacing.xxs}px;
  line-height: ${({ theme }) => theme.lineHeight.base};
  resize: vertical;
`;
