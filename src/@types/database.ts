
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "categorias_estatistica": {
                  Row: {
                    "ativa": boolean,"competicao_id": string,"created_at": string,"id": string,"nome": string,"ordem": number | null,"sigla": string,"soma_no_placar": boolean,"titulo_ranking": string
                  }
                  ComputedFields: never
                  Insert: {
                    "ativa"?: boolean,"competicao_id": string,"created_at"?: string,"id"?: string,"nome": string,"ordem"?: number | null,"sigla": string,"soma_no_placar"?: boolean,"titulo_ranking": string
                  }
                  Update: {
                    "ativa"?: boolean,"competicao_id"?: string,"created_at"?: string,"id"?: string,"nome"?: string,"ordem"?: number | null,"sigla"?: string,"soma_no_placar"?: boolean,"titulo_ranking"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "categorias_estatistica_competicao_id_fkey"
      columns: ["competicao_id"]
isOneToOne: false
      referencedRelation: "competicoes"
      referencedColumns: ["id"]
    }
                  ]
                },"cobrancas": {
                  Row: {
                    "competicao_id": string,"comprovante_url": string | null,"created_at": string,"id": string,"jogador_id": string | null,"observacao": string | null,"pago_em": string | null,"referencia": string,"registrado_por": string | null,"status": string,"time_id": string,"valor": number,"vencimento": string
                  }
                  ComputedFields: never
                  Insert: {
                    "competicao_id": string,"comprovante_url"?: string | null,"created_at"?: string,"id"?: string,"jogador_id"?: string | null,"observacao"?: string | null,"pago_em"?: string | null,"referencia": string,"registrado_por"?: string | null,"status"?: string,"time_id": string,"valor": number,"vencimento": string
                  }
                  Update: {
                    "competicao_id"?: string,"comprovante_url"?: string | null,"created_at"?: string,"id"?: string,"jogador_id"?: string | null,"observacao"?: string | null,"pago_em"?: string | null,"referencia"?: string,"registrado_por"?: string | null,"status"?: string,"time_id"?: string,"valor"?: number,"vencimento"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "cobrancas_competicao_id_fkey"
      columns: ["competicao_id"]
isOneToOne: false
      referencedRelation: "competicoes"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "cobrancas_jogador_id_fkey"
      columns: ["jogador_id"]
isOneToOne: false
      referencedRelation: "jogadores"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "cobrancas_registrado_por_fkey"
      columns: ["registrado_por"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "cobrancas_time_id_fkey"
      columns: ["time_id"]
isOneToOne: false
      referencedRelation: "times"
      referencedColumns: ["id"]
    }
                  ]
                },"competicao_admins": {
                  Row: {
                    "competicao_id": string,"created_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "competicao_id": string,"created_at"?: string,"user_id": string
                  }
                  Update: {
                    "competicao_id"?: string,"created_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "competicao_admins_competicao_id_fkey"
      columns: ["competicao_id"]
isOneToOne: false
      referencedRelation: "competicoes"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "competicao_admins_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"competicoes": {
                  Row: {
                    "cobranca_dia_vencimento": number | null,"cobranca_mes_inicio": string | null,"cobranca_modelo": string,"cobranca_qtd_meses": number | null,"cobranca_valor": number | null,"created_at": string,"criado_por": string | null,"criterios_desempate": NonNullable<Json>,"descricao": string | null,"estrutura_travada": boolean,"id": string,"intervalo_jogos_min": number,"local_padrao": string | null,"logo_url": string | null,"modalidade": string,"nome": string,"permite_empate": boolean,"pontos_derrota": number,"pontos_derrota_wo": number,"pontos_empate": number,"pontos_vitoria": number,"slug": string,"status": string,"wo_placar_perdedor": number,"wo_placar_vencedor": number
                  }
                  ComputedFields: never
                  Insert: {
                    "cobranca_dia_vencimento"?: number | null,"cobranca_mes_inicio"?: string | null,"cobranca_modelo"?: string,"cobranca_qtd_meses"?: number | null,"cobranca_valor"?: number | null,"created_at"?: string,"criado_por"?: string | null,"criterios_desempate"?: NonNullable<Json>,"descricao"?: string | null,"estrutura_travada"?: boolean,"id"?: string,"intervalo_jogos_min"?: number,"local_padrao"?: string | null,"logo_url"?: string | null,"modalidade": string,"nome": string,"permite_empate"?: boolean,"pontos_derrota"?: number,"pontos_derrota_wo"?: number,"pontos_empate"?: number,"pontos_vitoria"?: number,"slug": string,"status"?: string,"wo_placar_perdedor"?: number,"wo_placar_vencedor"?: number
                  }
                  Update: {
                    "cobranca_dia_vencimento"?: number | null,"cobranca_mes_inicio"?: string | null,"cobranca_modelo"?: string,"cobranca_qtd_meses"?: number | null,"cobranca_valor"?: number | null,"created_at"?: string,"criado_por"?: string | null,"criterios_desempate"?: NonNullable<Json>,"descricao"?: string | null,"estrutura_travada"?: boolean,"id"?: string,"intervalo_jogos_min"?: number,"local_padrao"?: string | null,"logo_url"?: string | null,"modalidade"?: string,"nome"?: string,"permite_empate"?: boolean,"pontos_derrota"?: number,"pontos_derrota_wo"?: number,"pontos_empate"?: number,"pontos_vitoria"?: number,"slug"?: string,"status"?: string,"wo_placar_perdedor"?: number,"wo_placar_vencedor"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "competicoes_criado_por_fkey"
      columns: ["criado_por"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"eventos": {
                  Row: {
                    "competicao_id": string,"created_at": string,"data": string,"hora_inicio": string,"id": string,"intervalo_min": number,"local": string,"observacoes": string | null,"qtd_jogos": number,"status": string
                  }
                  ComputedFields: never
                  Insert: {
                    "competicao_id": string,"created_at"?: string,"data": string,"hora_inicio": string,"id"?: string,"intervalo_min": number,"local": string,"observacoes"?: string | null,"qtd_jogos": number,"status"?: string
                  }
                  Update: {
                    "competicao_id"?: string,"created_at"?: string,"data"?: string,"hora_inicio"?: string,"id"?: string,"intervalo_min"?: number,"local"?: string,"observacoes"?: string | null,"qtd_jogos"?: number,"status"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "eventos_competicao_id_fkey"
      columns: ["competicao_id"]
isOneToOne: false
      referencedRelation: "competicoes"
      referencedColumns: ["id"]
    }
                  ]
                },"fases": {
                  Row: {
                    "classificam": number | null,"competicao_id": string,"created_at": string,"cruzamento": string | null,"disputa_terceiro": boolean,"entrada": Json | null,"id": string,"melhor_de": number,"melhores_extras": number,"nome": string,"ordem": number,"qtd_grupos": number | null,"sorteio_grupos": string,"status": string,"tipo": string,"turnos": number
                  }
                  ComputedFields: never
                  Insert: {
                    "classificam"?: number | null,"competicao_id": string,"created_at"?: string,"cruzamento"?: string | null,"disputa_terceiro"?: boolean,"entrada"?: Json | null,"id"?: string,"melhor_de"?: number,"melhores_extras"?: number,"nome": string,"ordem": number,"qtd_grupos"?: number | null,"sorteio_grupos"?: string,"status"?: string,"tipo": string,"turnos"?: number
                  }
                  Update: {
                    "classificam"?: number | null,"competicao_id"?: string,"created_at"?: string,"cruzamento"?: string | null,"disputa_terceiro"?: boolean,"entrada"?: Json | null,"id"?: string,"melhor_de"?: number,"melhores_extras"?: number,"nome"?: string,"ordem"?: number,"qtd_grupos"?: number | null,"sorteio_grupos"?: string,"status"?: string,"tipo"?: string,"turnos"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "fases_competicao_id_fkey"
      columns: ["competicao_id"]
isOneToOne: false
      referencedRelation: "competicoes"
      referencedColumns: ["id"]
    }
                  ]
                },"grupo_times": {
                  Row: {
                    "created_at": string,"grupo_id": string,"time_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"grupo_id": string,"time_id": string
                  }
                  Update: {
                    "created_at"?: string,"grupo_id"?: string,"time_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "grupo_times_grupo_id_fkey"
      columns: ["grupo_id"]
isOneToOne: false
      referencedRelation: "grupos"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "grupo_times_time_id_fkey"
      columns: ["time_id"]
isOneToOne: false
      referencedRelation: "times"
      referencedColumns: ["id"]
    }
                  ]
                },"grupos": {
                  Row: {
                    "created_at": string,"fase_id": string,"id": string,"nome": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"fase_id": string,"id"?: string,"nome": string
                  }
                  Update: {
                    "created_at"?: string,"fase_id"?: string,"id"?: string,"nome"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "grupos_fase_id_fkey"
      columns: ["fase_id"]
isOneToOne: false
      referencedRelation: "fases"
      referencedColumns: ["id"]
    }
                  ]
                },"jogadores": {
                  Row: {
                    "apelido": string | null,"ativo": boolean,"competicao_id": string,"created_at": string,"documento": string | null,"foto_url": string | null,"id": string,"nome": string,"numero": number | null,"posicao": string | null,"time_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "apelido"?: string | null,"ativo"?: boolean,"competicao_id": string,"created_at"?: string,"documento"?: string | null,"foto_url"?: string | null,"id"?: string,"nome": string,"numero"?: number | null,"posicao"?: string | null,"time_id": string
                  }
                  Update: {
                    "apelido"?: string | null,"ativo"?: boolean,"competicao_id"?: string,"created_at"?: string,"documento"?: string | null,"foto_url"?: string | null,"id"?: string,"nome"?: string,"numero"?: number | null,"posicao"?: string | null,"time_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "jogadores_competicao_id_fkey"
      columns: ["competicao_id"]
isOneToOne: false
      referencedRelation: "competicoes"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "jogadores_time_id_fkey"
      columns: ["time_id"]
isOneToOne: false
      referencedRelation: "times"
      referencedColumns: ["id"]
    }
                  ]
                },"jogo_jogadores": {
                  Row: {
                    "created_at": string,"jogador_id": string,"jogo_id": string,"time_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"jogador_id": string,"jogo_id": string,"time_id": string
                  }
                  Update: {
                    "created_at"?: string,"jogador_id"?: string,"jogo_id"?: string,"time_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "jogo_jogadores_jogador_id_fkey"
      columns: ["jogador_id"]
isOneToOne: false
      referencedRelation: "jogadores"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "jogo_jogadores_jogo_id_fkey"
      columns: ["jogo_id"]
isOneToOne: false
      referencedRelation: "jogos"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "jogo_jogadores_time_id_fkey"
      columns: ["time_id"]
isOneToOne: false
      referencedRelation: "times"
      referencedColumns: ["id"]
    }
                  ]
                },"jogos": {
                  Row: {
                    "competicao_id": string,"created_at": string,"evento_id": string | null,"fase_id": string,"grupo_id": string | null,"id": string,"inicio_previsto": string | null,"numero_na_serie": number | null,"ordem_no_evento": number | null,"placar_casa": number | null,"placar_fora": number | null,"rodada": number | null,"serie_id": string | null,"so_placar": boolean,"status": string,"time_casa_id": string,"time_fora_id": string,"vencedor_id": string | null,"wo_ausente": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "competicao_id": string,"created_at"?: string,"evento_id"?: string | null,"fase_id": string,"grupo_id"?: string | null,"id"?: string,"inicio_previsto"?: string | null,"numero_na_serie"?: number | null,"ordem_no_evento"?: number | null,"placar_casa"?: number | null,"placar_fora"?: number | null,"rodada"?: number | null,"serie_id"?: string | null,"so_placar"?: boolean,"status"?: string,"time_casa_id": string,"time_fora_id": string,"vencedor_id"?: string | null,"wo_ausente"?: string | null
                  }
                  Update: {
                    "competicao_id"?: string,"created_at"?: string,"evento_id"?: string | null,"fase_id"?: string,"grupo_id"?: string | null,"id"?: string,"inicio_previsto"?: string | null,"numero_na_serie"?: number | null,"ordem_no_evento"?: number | null,"placar_casa"?: number | null,"placar_fora"?: number | null,"rodada"?: number | null,"serie_id"?: string | null,"so_placar"?: boolean,"status"?: string,"time_casa_id"?: string,"time_fora_id"?: string,"vencedor_id"?: string | null,"wo_ausente"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "jogos_competicao_id_fkey"
      columns: ["competicao_id"]
isOneToOne: false
      referencedRelation: "competicoes"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "jogos_evento_id_fkey"
      columns: ["evento_id"]
isOneToOne: false
      referencedRelation: "eventos"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "jogos_fase_id_fkey"
      columns: ["fase_id"]
isOneToOne: false
      referencedRelation: "fases"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "jogos_grupo_id_fkey"
      columns: ["grupo_id"]
isOneToOne: false
      referencedRelation: "grupos"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "jogos_serie_id_fkey"
      columns: ["serie_id"]
isOneToOne: false
      referencedRelation: "series"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "jogos_time_casa_id_fkey"
      columns: ["time_casa_id"]
isOneToOne: false
      referencedRelation: "times"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "jogos_time_fora_id_fkey"
      columns: ["time_fora_id"]
isOneToOne: false
      referencedRelation: "times"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "jogos_vencedor_id_fkey"
      columns: ["vencedor_id"]
isOneToOne: false
      referencedRelation: "times"
      referencedColumns: ["id"]
    }
                  ]
                },"pagamentos_internos": {
                  Row: {
                    "created_at": string,"id": string,"jogador_id": string,"observacao": string | null,"pago_em": string | null,"referencia": string,"status": string,"time_id": string,"valor": number
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"jogador_id": string,"observacao"?: string | null,"pago_em"?: string | null,"referencia": string,"status"?: string,"time_id": string,"valor": number
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"jogador_id"?: string,"observacao"?: string | null,"pago_em"?: string | null,"referencia"?: string,"status"?: string,"time_id"?: string,"valor"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "pagamentos_internos_jogador_id_fkey"
      columns: ["jogador_id"]
isOneToOne: false
      referencedRelation: "jogadores"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "pagamentos_internos_time_id_fkey"
      columns: ["time_id"]
isOneToOne: false
      referencedRelation: "times"
      referencedColumns: ["id"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "ativo": boolean,"created_at": string,"id": string,"nome": string,"papel": string,"precisa_trocar_senha": boolean
                  }
                  ComputedFields: never
                  Insert: {
                    "ativo"?: boolean,"created_at"?: string,"id": string,"nome": string,"papel": string,"precisa_trocar_senha"?: boolean
                  }
                  Update: {
                    "ativo"?: boolean,"created_at"?: string,"id"?: string,"nome"?: string,"papel"?: string,"precisa_trocar_senha"?: boolean
                  }
                  Relationships: [
                    
                  ]
                },"series": {
                  Row: {
                    "codigo": string,"created_at": string,"fase_id": string,"id": string,"melhor_de": number,"origem_a": Json | null,"origem_b": Json | null,"status": string,"time_a_id": string | null,"time_b_id": string | null,"vencedor_id": string | null,"vitorias_a": number,"vitorias_b": number
                  }
                  ComputedFields: never
                  Insert: {
                    "codigo": string,"created_at"?: string,"fase_id": string,"id"?: string,"melhor_de"?: number,"origem_a"?: Json | null,"origem_b"?: Json | null,"status"?: string,"time_a_id"?: string | null,"time_b_id"?: string | null,"vencedor_id"?: string | null,"vitorias_a"?: number,"vitorias_b"?: number
                  }
                  Update: {
                    "codigo"?: string,"created_at"?: string,"fase_id"?: string,"id"?: string,"melhor_de"?: number,"origem_a"?: Json | null,"origem_b"?: Json | null,"status"?: string,"time_a_id"?: string | null,"time_b_id"?: string | null,"vencedor_id"?: string | null,"vitorias_a"?: number,"vitorias_b"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "series_fase_id_fkey"
      columns: ["fase_id"]
isOneToOne: false
      referencedRelation: "fases"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "series_time_a_id_fkey"
      columns: ["time_a_id"]
isOneToOne: false
      referencedRelation: "times"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "series_time_b_id_fkey"
      columns: ["time_b_id"]
isOneToOne: false
      referencedRelation: "times"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "series_vencedor_id_fkey"
      columns: ["vencedor_id"]
isOneToOne: false
      referencedRelation: "times"
      referencedColumns: ["id"]
    }
                  ]
                },"sumula_estatisticas": {
                  Row: {
                    "categoria_id": string,"created_at": string,"id": string,"jogador_id": string,"jogo_id": string,"time_id": string,"valor": number
                  }
                  ComputedFields: never
                  Insert: {
                    "categoria_id": string,"created_at"?: string,"id"?: string,"jogador_id": string,"jogo_id": string,"time_id": string,"valor"?: number
                  }
                  Update: {
                    "categoria_id"?: string,"created_at"?: string,"id"?: string,"jogador_id"?: string,"jogo_id"?: string,"time_id"?: string,"valor"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "sumula_estatisticas_categoria_id_fkey"
      columns: ["categoria_id"]
isOneToOne: false
      referencedRelation: "categorias_estatistica"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "sumula_estatisticas_categoria_id_fkey"
      columns: ["categoria_id"]
isOneToOne: false
      referencedRelation: "v_ranking_estatisticas"
      referencedColumns: ["categoria_id"]
    },{
      foreignKeyName: "sumula_estatisticas_jogador_id_fkey"
      columns: ["jogador_id"]
isOneToOne: false
      referencedRelation: "jogadores"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "sumula_estatisticas_jogo_id_fkey"
      columns: ["jogo_id"]
isOneToOne: false
      referencedRelation: "jogos"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "sumula_estatisticas_time_id_fkey"
      columns: ["time_id"]
isOneToOne: false
      referencedRelation: "times"
      referencedColumns: ["id"]
    }
                  ]
                },"times": {
                  Row: {
                    "competicao_id": string,"created_at": string,"dono_id": string | null,"id": string,"logo_url": string | null,"nome": string,"sigla": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "competicao_id": string,"created_at"?: string,"dono_id"?: string | null,"id"?: string,"logo_url"?: string | null,"nome": string,"sigla"?: string | null
                  }
                  Update: {
                    "competicao_id"?: string,"created_at"?: string,"dono_id"?: string | null,"id"?: string,"logo_url"?: string | null,"nome"?: string,"sigla"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "times_competicao_id_fkey"
      columns: ["competicao_id"]
isOneToOne: false
      referencedRelation: "competicoes"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "times_dono_id_fkey"
      columns: ["dono_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            "v_classificacao": {
                  Row: {
                    "aproveitamento": number | null,"competicao_id": string,"d": number | null,"e": number | null,"fase_id": string | null,"grupo_id": string | null,"j": number | null,"pc": number | null,"pf": number | null,"pts": number | null,"saldo": number | null,"time_id": string | null,"v": number | null,"wo": number | null
                  }
                  ComputedFields: never
                  Relationships: [
                    {
      foreignKeyName: "fases_competicao_id_fkey"
      columns: ["competicao_id"]
isOneToOne: false
      referencedRelation: "competicoes"
      referencedColumns: ["id"]
    }
                  ]
                },"v_ranking_estatisticas": {
                  Row: {
                    "categoria_id": string | null,"competicao_id": string | null,"escopo": string | null,"fase_id": string | null,"jogador_id": string | null,"jogos": number | null,"media": number | null,"time_id": string | null,"total": number | null
                  }
                  ComputedFields: never
                  Relationships: [
                    {
      foreignKeyName: "jogo_jogadores_jogador_id_fkey"
      columns: ["jogador_id"]
isOneToOne: false
      referencedRelation: "jogadores"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "jogo_jogadores_time_id_fkey"
      columns: ["time_id"]
isOneToOne: false
      referencedRelation: "times"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "jogos_competicao_id_fkey"
      columns: ["competicao_id"]
isOneToOne: false
      referencedRelation: "competicoes"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Functions: {
            "categoria_placar_padrao":
{ Args: { "modalidade": string }; Returns: {
              "nome": string,"sigla": string,"titulo_ranking": string
            }[]
                           },
"competicao_da_fase":
{ Args: { "p_fase_id": string }; Returns: string
                           },
"competicao_do_grupo":
{ Args: { "p_grupo_id": string }; Returns: string
                           },
"competicao_do_jogo":
{ Args: { "p_jogo_id": string }; Returns: string
                           },
"competicao_publica":
{ Args: { "p_competicao_id": string }; Returns: boolean
                           },
"criar_competicao":
{ Args: { "p_descricao"?: string,"p_intervalo_jogos_min"?: number,"p_local_padrao"?: string,"p_modalidade": string,"p_nome": string,"p_slug": string }; Returns: string
                           },
"criterios_desempate_validos":
{ Args: { "criterios": Json }; Returns: boolean
                           },
"evento_publicado":
{ Args: { "p_evento_id": string }; Returns: boolean
                           },
"is_admin":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"is_admin_da_competicao":
{ Args: { "p_competicao_id": string }; Returns: boolean
                           },
"is_dono_do_time":
{ Args: { "p_time_id": string }; Returns: boolean
                           },
"is_dono_na_competicao":
{ Args: { "p_competicao_id": string }; Returns: boolean
                           },
"is_master":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"is_usuario_ativo":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"jogo_encerrado_publico":
{ Args: { "p_jogo_id": string }; Returns: boolean
                           },
"jogo_publico":
{ Args: { "p_jogo_id": string }; Returns: boolean
                           },
"listar_usuarios":
{ Args: Record<PropertyKey, never>; Returns: {
              "ativo": boolean,"created_at": string,"email": string,"id": string,"nome": string,"papel": string,"precisa_trocar_senha": boolean,"ultimo_acesso": string
            }[]
                           },
"pode_editar_estrutura":
{ Args: { "p_competicao_id": string }; Returns: boolean
                           },
"pode_gerenciar_arquivo":
{ Args: { "p_bucket": string,"p_nome": string }; Returns: boolean
                           },
"try_uuid":
{ Args: { "valor": string }; Returns: string
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            
          }
        }
} as const
