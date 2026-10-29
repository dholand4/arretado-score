import { useId, useState, type FormEvent } from 'react';
import { AlertGlobal } from '@/components/alertGlobal';
import { ButtonGlobal } from '@/components/buttonGlobal';
import { InputGlobal } from '@/components/inputGlobal';
import { ModalGlobal } from '@/components/modalGlobal';
import { SENHA_MIN_CARACTERES } from '@/constants/auth';
import { Description, Form } from './style';
import type { IResetPasswordModalProps } from './types';

export function ResetPasswordModalGlobal({
  open,
  userName,
  submitting = false,
  error,
  onGeneratePassword,
  onSubmit,
  onClose,
}: IResetPasswordModalProps) {
  const formId = useId();
  const [senha, setSenha] = useState('');
  const [fieldError, setFieldError] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (senha.length < SENHA_MIN_CARACTERES) {
      setFieldError(`Mínimo de ${SENHA_MIN_CARACTERES} caracteres.`);
      return;
    }
    setFieldError(null);
    onSubmit(senha);
  };

  return (
    <ModalGlobal
      open={open}
      title="Redefinir senha"
      onClose={onClose}
      footer={
        <>
          <ButtonGlobal label="Cancelar" variant="ghost" onClick={onClose} disabled={submitting} />
          <ButtonGlobal label="Redefinir" type="submit" form={formId} loading={submitting} />
        </>
      }
    >
      <Form id={formId} onSubmit={handleSubmit} noValidate>
        <Description>
          Defina uma nova senha provisória para {userName}. No próximo acesso, o usuário será obrigado a trocá-la.
        </Description>
        <InputGlobal
          label="Nova senha provisória"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          error={fieldError}
          autoComplete="new-password"
          autoFocus
          action={<ButtonGlobal label="Gerar" variant="outline" onClick={() => setSenha(onGeneratePassword())} />}
        />
        {error && <AlertGlobal variant="error" message={error} />}
      </Form>
    </ModalGlobal>
  );
}

export type { IResetPasswordModalProps } from './types';
