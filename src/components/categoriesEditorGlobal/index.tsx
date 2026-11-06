import { useState } from 'react';
import type { ICategoria } from '@/@types/competition';
import { AlertGlobal } from '@/components/alertGlobal';
import { BadgeGlobal } from '@/components/badgeGlobal';
import { ButtonGlobal } from '@/components/buttonGlobal';
import { CategoryFormModalGlobal } from '@/components/categoryFormModalGlobal';
import { ConfirmDialogGlobal } from '@/components/confirmDialogGlobal';
import { CONTA_CESTAS_OPCOES } from '@/constants/competition';
import { Actions, List, Meta, Row, Texts, Title, Wrapper } from './style';
import type { ICategoriesEditorProps } from './types';

type ModalState = { type: 'create' } | { type: 'edit'; category: ICategoria } | { type: 'remove'; category: ICategoria } | null;

export function CategoriesEditorGlobal({
  categories,
  busy = false,
  error,
  onCreate,
  onUpdate,
  onRemove,
  onMove,
  onClearError,
}: ICategoriesEditorProps) {
  const [modal, setModal] = useState<ModalState>(null);
  const close = () => setModal(null);
  const open = (next: ModalState) => {
    onClearError?.();
    setModal(next);
  };

  // A categoria de placar fica sempre em primeiro; as outras se movem entre si.
  const extras = categories.filter((c) => !c.soma_no_placar);

  return (
    <Wrapper>
      <List aria-label="Estatísticas">
        {categories.map((category) => {
          const index = extras.findIndex((c) => c.id === category.id);
          return (
            <Row key={category.id} $inactive={!category.ativa}>
              <Texts>
                <Title>
                  {category.nome} ({category.sigla})
                  {category.soma_no_placar && <BadgeGlobal label="Placar" tone="primary" />}
                  {!category.ativa && <BadgeGlobal label="Inativa" />}
                </Title>
                <Meta>
                  Ranking: {category.titulo_ranking}
                  {category.conta_cestas_de !== null &&
                    ` · conta as ${CONTA_CESTAS_OPCOES.find((o) => o.value === category.conta_cestas_de)?.short} da súmula ao vivo`}
                </Meta>
              </Texts>
              <Actions>
                {!category.soma_no_placar && (
                  <>
                    <ButtonGlobal
                      label="↑"
                      aria-label={`Subir ${category.nome}`}
                      size="sm"
                      variant="ghost"
                      disabled={busy || index === 0}
                      onClick={() => onMove(category, extras[index - 1])}
                    />
                    <ButtonGlobal
                      label="↓"
                      aria-label={`Descer ${category.nome}`}
                      size="sm"
                      variant="ghost"
                      disabled={busy || index === extras.length - 1}
                      onClick={() => onMove(category, extras[index + 1])}
                    />
                  </>
                )}
                <ButtonGlobal
                  label={category.soma_no_placar ? 'Renomear' : 'Editar'}
                  size="sm"
                  variant="outline"
                  onClick={() => open({ type: 'edit', category })}
                />
                {!category.soma_no_placar && (
                  <>
                    <ButtonGlobal
                      label={category.ativa ? 'Desativar' : 'Ativar'}
                      size="sm"
                      variant="ghost"
                      disabled={busy}
                      onClick={() => onUpdate(category.id, { ativa: !category.ativa })}
                    />
                    <ButtonGlobal
                      label="Excluir"
                      size="sm"
                      variant="ghost"
                      onClick={() => open({ type: 'remove', category })}
                    />
                  </>
                )}
              </Actions>
            </Row>
          );
        })}
      </List>

      {!modal && error && <AlertGlobal variant="error" message={error} />}

      <div>
        <ButtonGlobal label="Adicionar estatística" variant="secondary" onClick={() => open({ type: 'create' })} />
      </div>

      {modal?.type === 'create' && (
        <CategoryFormModalGlobal
          open
          saving={busy}
          error={error}
          onSubmit={(values) => onCreate(values, close)}
          onClose={close}
        />
      )}
      {modal?.type === 'edit' && (
        <CategoryFormModalGlobal
          open
          key={modal.category.id}
          initialValues={{
            nome: modal.category.nome,
            sigla: modal.category.sigla,
            titulo_ranking: modal.category.titulo_ranking,
            conta_cestas_de: modal.category.conta_cestas_de,
          }}
          isScoreCategory={modal.category.soma_no_placar}
          saving={busy}
          error={error}
          onSubmit={(values) => onUpdate(modal.category.id, values, close)}
          onClose={close}
        />
      )}
      {modal?.type === 'remove' && (
        <ConfirmDialogGlobal
          open
          title="Excluir estatística"
          message={`Excluir "${modal.category.nome}"? O ranking dessa estatística deixa de existir.`}
          confirmLabel="Excluir"
          danger
          loading={busy}
          error={error}
          onConfirm={() => onRemove(modal.category.id, close)}
          onClose={close}
        />
      )}
    </Wrapper>
  );
}

export type { ICategoriesEditorProps } from './types';
