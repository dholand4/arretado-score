import { useId, useState, type FormEvent } from 'react';
import type { IJogadorInput, ImageChange } from '@/@types/competition';
import { AlertGlobal } from '@/components/alertGlobal';
import { ButtonGlobal } from '@/components/buttonGlobal';
import { CheckboxGlobal } from '@/components/checkboxGlobal';
import { ImageUploadGlobal } from '@/components/imageUploadGlobal';
import { InputGlobal } from '@/components/inputGlobal';
import { ModalGlobal } from '@/components/modalGlobal';
import { hasErrors, parseOptionalInt, validatePlayer, type FormErrors } from '@/utils/competitionValidators';
import { Form, Row } from './style';
import type { IPlayerFormModalProps } from './types';

export function PlayerFormModalGlobal({ open, player, saving = false, error, onSubmit, onClose }: IPlayerFormModalProps) {
  const formId = useId();
  const [nome, setNome] = useState(player?.nome ?? '');
  const [apelido, setApelido] = useState(player?.apelido ?? '');
  const [numero, setNumero] = useState(player?.numero?.toString() ?? '');
  const [posicao, setPosicao] = useState(player?.posicao ?? '');
  const [documento, setDocumento] = useState(player?.documento ?? '');
  const [ativo, setAtivo] = useState(player?.ativo ?? true);
  const [photo, setPhoto] = useState<ImageChange>({ kind: 'keep' });
  const [errors, setErrors] = useState<FormErrors<IJogadorInput>>({});

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const values: IJogadorInput = {
      nome: nome.trim(),
      apelido: apelido.trim(),
      numero: parseOptionalInt(numero),
      posicao: posicao.trim(),
      documento: documento.trim(),
      ativo,
    };
    const found = validatePlayer(values);
    setErrors(found);
    if (!hasErrors(found)) onSubmit(values, photo);
  };

  return (
    <ModalGlobal
      open={open}
      title={player ? 'Editar jogador' : 'Novo jogador'}
      onClose={onClose}
      footer={
        <>
          <ButtonGlobal label="Cancelar" variant="ghost" onClick={onClose} disabled={saving} />
          <ButtonGlobal label="Salvar" type="submit" form={formId} loading={saving} />
        </>
      }
    >
      <Form id={formId} onSubmit={handleSubmit} noValidate>
        <ImageUploadGlobal
          label="Foto"
          name={nome}
          currentUrl={player?.foto_url}
          value={photo}
          onChange={setPhoto}
        />
        <Row>
          <InputGlobal
            label="Número"
            type="number"
            inputMode="numeric"
            min={0}
            max={999}
            value={numero}
            onChange={(e) => setNumero(e.target.value)}
            error={errors.numero}
          />
          <InputGlobal
            label="Nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            error={errors.nome}
            autoFocus={!player}
          />
        </Row>
        <InputGlobal label="Apelido" value={apelido} onChange={(e) => setApelido(e.target.value)} />
        <InputGlobal label="Posição" value={posicao} onChange={(e) => setPosicao(e.target.value)} />
        <InputGlobal
          label="Documento (opcional)"
          value={documento}
          onChange={(e) => setDocumento(e.target.value)}
          hint="Quando preenchido, impede o mesmo atleta em dois times da competição."
        />
        {player && (
          <CheckboxGlobal
            label="Ativo"
            description="Jogadores inativos não aparecem na súmula."
            checked={ativo}
            onChange={(e) => setAtivo(e.target.checked)}
          />
        )}
        {error && <AlertGlobal variant="error" message={error} />}
      </Form>
    </ModalGlobal>
  );
}

export type { IPlayerFormModalProps } from './types';
