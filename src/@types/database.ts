
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
            [_ in never]: never
          }
          Functions: {
            "categoria_placar_padrao":
{ Args: { "modalidade": string }; Returns: {
              "nome": string,"sigla": string,"titulo_ranking": string
            }[]
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
"listar_usuarios":
{ Args: Record<PropertyKey, never>; Returns: {
              "ativo": boolean,"created_at": string,"email": string,"id": string,"nome": string,"papel": string,"precisa_trocar_senha": boolean,"ultimo_acesso": string
            }[]
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
