import { useState, type FormEvent } from 'react';
import { useLocation } from 'react-router-dom';
import { AlertGlobal } from '@/components/alertGlobal';
import { AuthShellGlobal } from '@/components/authShellGlobal';
import { ButtonGlobal } from '@/components/buttonGlobal';
import { InputGlobal } from '@/components/inputGlobal';
import { useAppNavigate } from '@/hooks/useAppNavigate';
import { useAuth } from '@/hooks/useAuth';
import { isRoutePath, ROUTES, type ILoginRouteState } from '@/routes/types';
import { getErrorMessage } from '@/utils/appError';
import { BackLink, Form } from './style';

export function LoginScreen() {
  const { signIn, notice, clearNotice } = useAuth();
  const navigate = useAppNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    clearNotice();
    // No login basta ter cara de e-mail; quem decide se a conta existe é o Supabase.
    if (!email.trim().includes('@') || !password) {
      setError('Informe e-mail e senha.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await signIn({ email, password });
      const from = (location.state as ILoginRouteState | null)?.from;
      navigate(isRoutePath(from) ? from : ROUTES.panel, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, 'Não foi possível entrar. Tente novamente.'));
      setSubmitting(false);
    }
  };

  const message = error ?? notice;

  return (
    <AuthShellGlobal
      title="Entrar"
      subtitle="Acesso para admin, coordenadores e equipes."
      footer={<BackLink to={ROUTES.home}>Ver campeonatos sem entrar</BackLink>}
    >
      <Form onSubmit={handleSubmit} noValidate aria-label="Entrar">
        <InputGlobal
          label="E-mail"
          type="email"
          inputMode="email"
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoFocus
        />
        <InputGlobal
          label="Senha"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {message && <AlertGlobal variant="error" message={message} />}
        <ButtonGlobal label="Entrar" type="submit" loading={submitting} fullWidth />
      </Form>
    </AuthShellGlobal>
  );
}
