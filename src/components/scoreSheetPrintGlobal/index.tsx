import { Fragment } from 'react';
import { sheetDate, sheetPlayerRows, sheetPointRows, sheetTime } from '@/utils/printSheet';
import {
  BlockEdge,
  Bottom,
  Center,
  Circle,
  Col,
  Control,
  ControlRow,
  Controls,
  Field,
  Fields,
  FieldValue,
  Header,
  InfoBox,
  League,
  Logo,
  Main,
  NameCell,
  PeriodLine,
  PeriodScore,
  Phase,
  Points,
  PointsTitle,
  Sheet,
  Small,
  Square,
  Squares,
  Subtitle,
  Table,
  Team,
  TeamsLine,
  Teams,
  TeamTitle,
  Th,
  Title,
  TitleBox,
} from './style';
import type { IScoreSheetPrintProps, ITeamBlockProps } from './types';

const FALTAS = [1, 2, 3, 4, 5];

function Blank({ label, value = '' }: { label: string; value?: string }) {
  return (
    <Field>
      <span>{label}</span>
      <FieldValue>{value}</FieldValue>
    </Field>
  );
}

function Boxes({ count, numbered = false }: { count: number; numbered?: boolean }) {
  return (
    <Squares>
      {Array.from({ length: count }, (_, i) => (
        <Square key={i}>{numbered ? i + 1 : ''}</Square>
      ))}
    </Squares>
  );
}

function TeamFouls({ periods }: { periods: [number, number] }) {
  return (
    <ControlRow>
      Período
      {periods.map((periodo) => (
        <ControlRow key={periodo}>
          <Circle>{periodo}</Circle>
          <Boxes count={4} numbered />
        </ControlRow>
      ))}
    </ControlRow>
  );
}

function TeamBlock({ letter, name, rows }: ITeamBlockProps) {
  return (
    <Team aria-label={`Equipe ${letter}`}>
      <TeamTitle>
        EQUIPE <strong>{letter}</strong>: <strong>{name}</strong>
      </TeamTitle>
      <Controls>
        <Control>
          <span>Tempos Debitados</span>
          <ControlRow>
            <Circle>1</Circle>
            <Boxes count={1} />
            <Circle>2</Circle>
            <Boxes count={1} />
            <span>Períodos Extras</span>
          </ControlRow>
          <ControlRow>
            <Circle>3</Circle>
            <Boxes count={1} />
            <Circle>4</Circle>
            <Boxes count={2} />
            <Boxes count={3} />
          </ControlRow>
        </Control>
        <Control>
          <span>Faltas da Equipe</span>
          <TeamFouls periods={[1, 2]} />
          <TeamFouls periods={[3, 4]} />
        </Control>
      </Controls>
      <Table>
        <colgroup>
          <Col $width="13%" />
          <col />
          <Col $width="6%" />
          <Col $width="4.5%" />
          {FALTAS.map((falta) => (
            <Col key={falta} $width="4.2%" />
          ))}
        </colgroup>
        <thead>
          <tr>
            <Th rowSpan={2}>Registro</Th>
            <Th rowSpan={2}>Nome dos jogadores</Th>
            <Th rowSpan={2}>Nº</Th>
            <Small rowSpan={2}>Jog</Small>
            <Th colSpan={5}>Faltas</Th>
          </tr>
          <tr>
            {FALTAS.map((falta) => (
              <Th key={falta}>{falta}</Th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key}>
              <td />
              <NameCell>{row.nome}</NameCell>
              <Center>{row.numero}</Center>
              <td />
              {FALTAS.map((falta) => (
                <td key={falta} />
              ))}
            </tr>
          ))}
          {['Técnico:', 'Ass. Técnico:'].map((rotulo) => (
            <tr key={rotulo}>
              <td colSpan={4}>{rotulo}</td>
              {FALTAS.map((falta) => (
                <td key={falta} />
              ))}
            </tr>
          ))}
        </tbody>
      </Table>
    </Team>
  );
}

function PointsCount() {
  return (
    <Points aria-label="Contagem de pontos">
      <thead>
        <tr>
          <PointsTitle colSpan={12}>CONTAGEM DE PONTOS</PointsTitle>
        </tr>
        <tr>
          {[0, 1, 2].map((bloco) => (
            <Fragment key={bloco}>
              <Th colSpan={2}>A</Th>
              <Th colSpan={2}>B</Th>
            </Fragment>
          ))}
        </tr>
      </thead>
      <tbody>
        {sheetPointRows().map((linha) => (
          <tr key={linha[0]}>
            {linha.map((numero, bloco) => {
              const Edge = bloco < linha.length - 1 ? BlockEdge : 'td';
              return [
                <td key={`a-${numero}`} />,
                <td key={`na-${numero}`}>{numero}</td>,
                <td key={`nb-${numero}`}>{numero}</td>,
                <Edge key={`b-${numero}`} />,
              ];
            })}
          </tr>
        ))}
      </tbody>
    </Points>
  );
}

// Súmula de basquete no modelo em papel, com a logo da liga e os elencos já preenchidos.
export function ScoreSheetPrintGlobal({ sheet }: IScoreSheetPrintProps) {
  const categoria = sheet.grupo ? `${sheet.fase} · ${sheet.grupo}` : sheet.fase;

  return (
    <Sheet aria-label={`Súmula ${sheet.casa} x ${sheet.fora}`}>
      <Header>
        <League>{sheet.competicao.nome}</League>
        {sheet.competicao.logo_url ? (
          <Logo src={sheet.competicao.logo_url} alt={`Logo ${sheet.competicao.nome}`} />
        ) : (
          <span />
        )}
        <TitleBox>
          <Title>BASQUETEBOL</Title>
          <Subtitle>SÚMULA DE JOGO</Subtitle>
          <Phase>{categoria}</Phase>
        </TitleBox>
      </Header>

      <TeamsLine>
        <Fields $columns="1fr 1fr 0.8fr">
          <Blank label="EQUIPE A" value={sheet.casa} />
          <Blank label="EQUIPE B" value={sheet.fora} />
          <Blank label="Sexo" />
        </Fields>
      </TeamsLine>

      <InfoBox>
        <Fields $columns="1.7fr 0.9fr 0.7fr 1.2fr">
          <Blank label="Competição:" value={sheet.competicao.nome} />
          <Blank label="Data:" value={sheetDate(sheet)} />
          <Blank label="Hora:" value={sheetTime(sheet.inicioPrevisto)} />
          <Blank label="Árbitro:" />
          <Blank label="Jogo Nº:" />
          <Blank label="Local:" value={sheet.evento?.local ?? ''} />
          <Blank label="Categoria:" />
          <Blank label="Fiscal:" />
        </Fields>
      </InfoBox>

      <Main>
        <Teams>
          <TeamBlock letter="A" name={sheet.casa} rows={sheetPlayerRows(sheet.casaJogadores)} />
          <TeamBlock letter="B" name={sheet.fora} rows={sheetPlayerRows(sheet.foraJogadores)} />
        </Teams>
        <PointsCount />
      </Main>

      <Bottom>
        <div>
          <span>Pontuação:</span>
          {[
            [1, 2],
            [3, 4],
          ].map((par) => (
            <PeriodLine key={par[0]}>
              <span>Período</span>
              {par.map((periodo) => (
                <PeriodScore key={periodo}>
                  <Circle>{periodo}</Circle>
                  <Blank label="A" />
                  <Blank label="B" />
                </PeriodScore>
              ))}
            </PeriodLine>
          ))}
          <PeriodLine>
            <span>Extras</span>
            <PeriodScore>
              <span />
              <Blank label="A" />
              <Blank label="B" />
            </PeriodScore>
          </PeriodLine>
        </div>
        <div>
          <Fields $columns="auto 1fr 1fr">
            <span>Pontuação final:</span>
            <Blank label="EQUIPE A" />
            <Blank label="EQUIPE B" />
          </Fields>
          <Blank label="Nome da equipe vencedora:" />
        </div>
        <div>
          <Blank label="Apontador:" />
          <Blank label="Cronometrista:" />
          <Blank label='Operador 24":' />
        </div>
        <div>
          <Blank label="Árbitro:" />
          <Blank label="Fiscal:" />
          <Blank label="Assinatura do capitão em caso de protesto:" />
        </div>
      </Bottom>
    </Sheet>
  );
}

export type { IScoreSheetPrintProps } from './types';
