import { useId, useState, type FormEvent } from 'react';
import type { Papel } from '@/@types/user';
import { AlertGlobal } from '@/components/alertGlobal';
import { ButtonGlobal } from '@/components/buttonGlobal';
import { InputGlobal } from '@/components/inputGlobal';
import { ModalGlobal } from '@/components/modalGlobal';
import { SelectGlobal } from '@/components/selectGlobal';
import { PAPEL_OPTIONS } from '@/constants/roles';
import { formatPhone, maskPhone, phoneDigits } from '@/utils/phone';
import { validateUserForm, type UserFormErrors } from '@/utils/validators';
import { Form } from './style';
import type { IUserFormModalProps } from './types';

export function UserFormModalGlobal({
  open,
  mode,
  initialValues,
  submitting = false,
  error,
  lockPapel = false,
  onGeneratePassword,
  onSubmit,
  onClose,
}: IUserFormModalProps) {
  const formId = useId();
  const [nome, setNome] = useState(initialValues?.nome ?? '');
  const [email, setEmail] = useState(initialValues?.email ?? '');
  const [senha, setSenha] = useState('');
  const [papel, setPapel] = useState<Papel>(initialValues?.papel ?? 'admin');
  const [telefone, setTelefone] = useState(formatPhone(initialValues?.telefone));
  const [errors, setErrors] = useState<UserFormErrors>({});

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const found = validateUserForm({ nome, email, senha, papel, telefone }, mode);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    onSubmit({ nome: nome.trim(), email: email.trim().toLowerCase(), senha, papel, telefone: phoneDigits(telefone) });
  };

  const isCreate = mode === 'create';

  return (
    <ModalGlobal
      open={open}
      title={isCreate ? 'Novo usuário' : 'Editar usuário'}
      onClose={onClose}
      footer={
        <>
          <ButtonGlobal label="Cancelar" variant="ghost" onClick={onClose} disabled={submitting} />
          <ButtonGlobal
            label={isCreate ? 'Criar usuário' : 'Salvar'}
            type="submit"
            form={formId}
            loading={submitting}
          />
        </>
      }
    >
      <Form id={formId} onSubmit={handleSubmit} noValidate>
        <InputGlobal
          label="Nome"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          error={errors.nome}
          autoComplete="off"
          autoFocus
        />
        <InputGlobal
          label="E-mail"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          disabled={!isCreate}
          hint={isCreate ? undefined : 'O e-mail não pode ser alterado.'}
          autoComplete="off"
        />
        {isCreate && (
          <InputGlobal
            label="Senha provisória"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            error={errors.senha}
            hint="O usuário será obrigado a trocar no primeiro acesso."
            autoComplete="new-password"
            action={
              <ButtonGlobal label="Gerar" variant="outline" onClick={() => setSenha(onGeneratePassword())} />
            }
          />
        )}
        <InputGlobal
          label="Telefone / WhatsApp"
          type="tel"
          inputMode="tel"
          value={telefone}
          onChange={(e) => setTelefone(maskPhone(e.target.value))}
          error={errors.telefone}
          hint="Opcional. DDD + número."
          autoComplete="off"
        />
        <SelectGlobal
          label="Papel"
          value={papel}
          options={PAPEL_OPTIONS}
          onChange={(e) => setPapel(e.target.value as Papel)}
          error={errors.papel}
          disabled={lockPapel}
        />
        {error && <AlertGlobal variant="error" message={error} />}
      </Form>
    </ModalGlobal>
  );
}

export type { IUserFormModalProps, IUserFormSubmit } from './types';
