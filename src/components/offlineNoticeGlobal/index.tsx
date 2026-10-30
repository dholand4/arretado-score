import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { Notice, Title } from './style';

// Aparece embaixo da tela enquanto o aparelho está sem internet.
export function OfflineNoticeGlobal() {
  const online = useOnlineStatus();
  if (online) return null;
  return (
    <Notice role="status">
      <Title>Sem conexão.</Title> Os dados podem estar desatualizados; tudo volta a atualizar quando a internet voltar.
    </Notice>
  );
}
