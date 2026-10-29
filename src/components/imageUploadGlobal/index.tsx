import { useEffect, useId, useMemo, useState, type ChangeEvent } from 'react';
import { AvatarGlobal } from '@/components/avatarGlobal';
import { ButtonGlobal } from '@/components/buttonGlobal';
import { ACCEPTED_IMAGE_TYPES } from '@/constants/storage';
import { validateImageFile } from '@/utils/image';
import { Actions, ErrorText, Field, FileLabel, HiddenInput, Hint, Label, Row } from './style';
import type { IImageUploadProps } from './types';

export function ImageUploadGlobal({
  label,
  name,
  currentUrl,
  value,
  onChange,
  shape = 'circle',
  disabled = false,
}: IImageUploadProps) {
  const inputId = useId();
  const [error, setError] = useState<string | null>(null);

  const previewUrl = useMemo(
    () => (value.kind === 'replace' ? URL.createObjectURL(value.file) : null),
    [value],
  );
  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const shownUrl = value.kind === 'replace' ? previewUrl : value.kind === 'remove' ? null : currentUrl;

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const invalid = validateImageFile(file);
    setError(invalid);
    if (!invalid) onChange({ kind: 'replace', file });
  };

  return (
    <Field>
      <Label htmlFor={inputId}>{label}</Label>
      <Row>
        <AvatarGlobal name={name || '?'} src={shownUrl} size="lg" shape={shape} />
        <Actions>
          <FileLabel htmlFor={inputId} $variant="outline" $size="sm" $fullWidth={false} aria-disabled={disabled}>
            {shownUrl ? 'Trocar imagem' : 'Escolher imagem'}
          </FileLabel>
          <HiddenInput id={inputId} type="file" accept={ACCEPTED_IMAGE_TYPES} onChange={handleFile} disabled={disabled} />
          {shownUrl && (
            <ButtonGlobal
              label="Remover"
              variant="ghost"
              size="sm"
              disabled={disabled}
              onClick={() => onChange(currentUrl ? { kind: 'remove' } : { kind: 'keep' })}
            />
          )}
        </Actions>
      </Row>
      {error ? <ErrorText>{error}</ErrorText> : <Hint>JPEG, PNG ou WebP. A imagem é reduzida antes do envio.</Hint>}
    </Field>
  );
}

export type { IImageUploadProps } from './types';
