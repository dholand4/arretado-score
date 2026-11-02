export interface IMesaLinkModalProps {
  open: boolean;
  // Endereço completo do link ativo (nulo = nenhum).
  url: string | null;
  // Validade já formatada ("hoje, 23:00").
  expiraEm: string | null;
  loading?: boolean;
  busy?: boolean;
  error?: string | null;
  onGenerate: () => void;
  onCancelLink: () => void;
  onClose: () => void;
}
