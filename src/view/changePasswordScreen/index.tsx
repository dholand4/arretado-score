import { useState, type FormEvent } from 'react';
import { AlertGlobal } from '@/components/alertGlobal';
import { AuthShellGlobal } from '@/components/authShellGlobal';
import { ButtonGlobal } from '@/components/buttonGlobal';
import { InputGlobal } from '@/components/inputGlobal';
import { SENHA_MIN_CARACTERES } from '@/constants/auth';
import { useAppNavigate } from '@/hooks/useAppNavigate';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/routes/types';
import { getErrorMessage } from '@/utils/appError';
import { validateNewPassword } from '@/utils/validators';
import { Form } from './style';

export function ChangePasswordScreen() {
  const { profile, changePassword, signOut } = useAuth();
  const navigate = useAppNavigate();
  const [senha, setSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const obrigatoria = Boolean(profile?.precisa_trocar_senha);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const validation = validateNewPassword(senha, confirmacao);
    if (validation) {
      setError(validation);
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await changePassword(senha);
      navigate(ROUTES.panel, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, 'Não foi possível trocar a senha.'));
      setSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate(ROUTES.login, { replace: true });
  };

  return (
    <AuthShellGlobal
      title="Trocar senha"
      subtitle={profile ? `Olá, ${profile.nome}.` : undefined}
      footer={
        obrigatoria ? (
          <ButtonGlobal label="Sair" variant="ghost" size="sm" onClick={handleSignOut} />
        ) : (
          <ButtonGlobal
            label="Voltar ao painel"
            variant="ghost"
            size="sm"
            onClick={() => navigate(ROUTES.panel)}
          />
        )
      }
    >
      {obrigatoria && (
        <AlertGlobal
          variant="warning"
          message="Por segurança, defina uma nova senha antes de continuar. A senha provisória deixa de valer."
        />
      )}
      <Form onSubmit={handleSubmit} noValidate aria-label="Trocar senha">
        <InputGlobal
          label="Nova senha"
          type="password"
          autoComplete="new-password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          hint={`Mínimo de ${SENHA_MIN_CARACTERES} caracteres.`}
          autoFocus
        />
        <InputGlobal
          label="Confirme a nova senha"
          type="password"
          autoComplete="new-password"
          value={confirmacao}
          onChange={(e) => setConfirmacao(e.target.value)}
        />
        {error && <AlertGlobal variant="error" message={error} />}
        <ButtonGlobal label="Salvar nova senha" type="submit" loading={submitting} fullWidth />
      </Form>
    </AuthShellGlobal>
  );
}
