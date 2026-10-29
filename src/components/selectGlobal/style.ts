import styled from 'styled-components';
import { Input } from '@/components/inputGlobal/style';

export { ErrorText, Field, Label } from '@/components/inputGlobal/style';

export const Select = styled(Input).attrs({ as: 'select' })`
  cursor: pointer;
`;
