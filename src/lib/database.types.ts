export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      audit_events: {
        Row: {
          action: string
          company_id: number | null
          created_at: string
          entity: string
          entity_id: number | null
          id: number
          metadata: string | null
          user_id: number
        }
        Insert: {
          action: string
          company_id?: number | null
          created_at?: string
          entity: string
          entity_id?: number | null
          id?: number
          metadata?: string | null
          user_id: number
        }
        Update: {
          action?: string
          company_id?: number | null
          created_at?: string
          entity?: string
          entity_id?: number | null
          id?: number
          metadata?: string | null
          user_id?: number
        }
        Relationships: []
      }
      brand_settings: {
        Row: {
          accent_color: string
          address: string | null
          city: string | null
          company_id: number | null
          company_name: string
          document: string | null
          email: string | null
          id: number
          issuer_address: string | null
          issuer_document: string | null
          issuer_email: string | null
          issuer_legal_name: string | null
          issuer_name: string | null
          issuer_phone: string | null
          legal_name: string | null
          logo_url: string | null
          phone: string | null
          primary_color: string
          state: string | null
          updated_at: string
          updated_by: number | null
          use_company_as_issuer: boolean
          zip_code: string | null
        }
        Insert: {
          accent_color?: string
          address?: string | null
          city?: string | null
          company_id?: number | null
          company_name?: string
          document?: string | null
          email?: string | null
          id?: number
          issuer_address?: string | null
          issuer_document?: string | null
          issuer_email?: string | null
          issuer_legal_name?: string | null
          issuer_name?: string | null
          issuer_phone?: string | null
          legal_name?: string | null
          logo_url?: string | null
          phone?: string | null
          primary_color?: string
          state?: string | null
          updated_at?: string
          updated_by?: number | null
          use_company_as_issuer?: boolean
          zip_code?: string | null
        }
        Update: {
          accent_color?: string
          address?: string | null
          city?: string | null
          company_id?: number | null
          company_name?: string
          document?: string | null
          email?: string | null
          id?: number
          issuer_address?: string | null
          issuer_document?: string | null
          issuer_email?: string | null
          issuer_legal_name?: string | null
          issuer_name?: string | null
          issuer_phone?: string | null
          legal_name?: string | null
          logo_url?: string | null
          phone?: string | null
          primary_color?: string
          state?: string | null
          updated_at?: string
          updated_by?: number | null
          use_company_as_issuer?: boolean
          zip_code?: string | null
        }
        Relationships: []
      }
      companies: {
        Row: {
          accent_color: string
          city: string | null
          created_at: string
          id: number
          logo_url: string | null
          name: string
          owner_user_id: number
          primary_color: string
          updated_at: string
        }
        Insert: {
          accent_color?: string
          city?: string | null
          created_at?: string
          id?: number
          logo_url?: string | null
          name: string
          owner_user_id: number
          primary_color?: string
          updated_at?: string
        }
        Update: {
          accent_color?: string
          city?: string | null
          created_at?: string
          id?: number
          logo_url?: string | null
          name?: string
          owner_user_id?: number
          primary_color?: string
          updated_at?: string
        }
        Relationships: []
      }
      company_setting_history: {
        Row: {
          changed_at: string
          changed_by: number
          company_id: number
          effective_from: string
          id: number
          new_value: Json | null
          previous_value: Json | null
          section: string
          setting_key: string
        }
        Insert: {
          changed_at?: string
          changed_by: number
          company_id: number
          effective_from: string
          id?: number
          new_value?: Json | null
          previous_value?: Json | null
          section: string
          setting_key: string
        }
        Update: {
          changed_at?: string
          changed_by?: number
          company_id?: number
          effective_from?: string
          id?: number
          new_value?: Json | null
          previous_value?: Json | null
          section?: string
          setting_key?: string
        }
        Relationships: []
      }
      company_settings: {
        Row: {
          admin_fee_base: string
          allowed_account_types: string
          closing: Json
          closing_options: string
          company_id: number
          created_at: string
          default_admin_fee_basis_points: number
          default_due_day: number
          default_repass_days: number
          effective_from: string
          financial: Json
          general: Json
          id: number
          non_business_day_rule: string
          partial_payment_rule: string
          prorata_method: string
          repass: Json
          repass_mode: string
          report: Json
          report_options: string
          updated_at: string
          updated_by: number
        }
        Insert: {
          admin_fee_base?: string
          allowed_account_types?: string
          closing?: Json
          closing_options?: string
          company_id: number
          created_at?: string
          default_admin_fee_basis_points?: number
          default_due_day?: number
          default_repass_days?: number
          effective_from: string
          financial?: Json
          general?: Json
          id?: number
          non_business_day_rule?: string
          partial_payment_rule?: string
          prorata_method?: string
          repass?: Json
          repass_mode?: string
          report?: Json
          report_options?: string
          updated_at?: string
          updated_by: number
        }
        Update: {
          admin_fee_base?: string
          allowed_account_types?: string
          closing?: Json
          closing_options?: string
          company_id?: number
          created_at?: string
          default_admin_fee_basis_points?: number
          default_due_day?: number
          default_repass_days?: number
          effective_from?: string
          financial?: Json
          general?: Json
          id?: number
          non_business_day_rule?: string
          partial_payment_rule?: string
          prorata_method?: string
          repass?: Json
          repass_mode?: string
          report?: Json
          report_options?: string
          updated_at?: string
          updated_by?: number
        }
        Relationships: []
      }
      company_settings_history: {
        Row: {
          changed_at: string
          changed_by: number
          company_id: number
          effective_from: string
          id: number
          new_value: string
          previous_value: string | null
          setting_group: string
        }
        Insert: {
          changed_at?: string
          changed_by: number
          company_id: number
          effective_from: string
          id?: number
          new_value: string
          previous_value?: string | null
          setting_group: string
        }
        Update: {
          changed_at?: string
          changed_by?: number
          company_id?: number
          effective_from?: string
          id?: number
          new_value?: string
          previous_value?: string | null
          setting_group?: string
        }
        Relationships: []
      }
      company_users: {
        Row: {
          company_id: number
          created_at: string
          id: number
          role: Database["public"]["Enums"]["user_role"]
          status: Database["public"]["Enums"]["membership_status"]
          user_id: number
        }
        Insert: {
          company_id: number
          created_at?: string
          id?: number
          role?: Database["public"]["Enums"]["user_role"]
          status?: Database["public"]["Enums"]["membership_status"]
          user_id: number
        }
        Update: {
          company_id?: number
          created_at?: string
          id?: number
          role?: Database["public"]["Enums"]["user_role"]
          status?: Database["public"]["Enums"]["membership_status"]
          user_id?: number
        }
        Relationships: []
      }
      competence_closures: {
        Row: {
          closed_at: string | null
          closed_by: number | null
          company_id: number
          competence: string
          created_at: string
          id: number
          reopen_reason: string | null
          reopened_at: string | null
          reopened_by: number | null
          status: string
          updated_at: string
        }
        Insert: {
          closed_at?: string | null
          closed_by?: number | null
          company_id: number
          competence: string
          created_at?: string
          id?: number
          reopen_reason?: string | null
          reopened_at?: string | null
          reopened_by?: number | null
          status?: string
          updated_at?: string
        }
        Update: {
          closed_at?: string | null
          closed_by?: number | null
          company_id?: number
          competence?: string
          created_at?: string
          id?: number
          reopen_reason?: string | null
          reopened_at?: string | null
          reopened_by?: number | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      contract_divergences: {
        Row: {
          analysis_id: number
          company_id: number | null
          confidence: string
          contract_id: number | null
          created_at: string
          decision: string | null
          document_id: number
          document_value: string | null
          document_version: number
          field_key: string
          field_label: string
          id: number
          reason: string | null
          registered_value: string | null
          reviewed_at: string | null
          reviewed_by: number | null
          status: string
        }
        Insert: {
          analysis_id: number
          company_id?: number | null
          confidence?: string
          contract_id?: number | null
          created_at?: string
          decision?: string | null
          document_id: number
          document_value?: string | null
          document_version: number
          field_key: string
          field_label: string
          id?: number
          reason?: string | null
          registered_value?: string | null
          reviewed_at?: string | null
          reviewed_by?: number | null
          status?: string
        }
        Update: {
          analysis_id?: number
          company_id?: number | null
          confidence?: string
          contract_id?: number | null
          created_at?: string
          decision?: string | null
          document_id?: number
          document_value?: string | null
          document_version?: number
          field_key?: string
          field_label?: string
          id?: number
          reason?: string | null
          registered_value?: string | null
          reviewed_at?: string | null
          reviewed_by?: number | null
          status?: string
        }
        Relationships: []
      }
      contract_document_analyses: {
        Row: {
          analyzed_at: string
          company_id: number | null
          contract_id: number | null
          created_by: number | null
          document_id: number
          document_version: number
          id: number
          status: string
        }
        Insert: {
          analyzed_at?: string
          company_id?: number | null
          contract_id?: number | null
          created_by?: number | null
          document_id: number
          document_version: number
          id?: number
          status?: string
        }
        Update: {
          analyzed_at?: string
          company_id?: number | null
          contract_id?: number | null
          created_by?: number | null
          document_id?: number
          document_version?: number
          id?: number
          status?: string
        }
        Relationships: []
      }
      contract_documents: {
        Row: {
          company_id: number | null
          contract_id: number | null
          created_at: string
          created_by: number
          edited_storage_key: string | null
          edited_text: string | null
          extracted_text: string | null
          file_name: string
          id: number
          mime_type: string
          storage_key: string
          storage_url: string
          updated_at: string
          updated_by: number
          version: number
        }
        Insert: {
          company_id?: number | null
          contract_id?: number | null
          created_at?: string
          created_by: number
          edited_storage_key?: string | null
          edited_text?: string | null
          extracted_text?: string | null
          file_name: string
          id?: number
          mime_type: string
          storage_key: string
          storage_url: string
          updated_at?: string
          updated_by: number
          version?: number
        }
        Update: {
          company_id?: number | null
          contract_id?: number | null
          created_at?: string
          created_by?: number
          edited_storage_key?: string | null
          edited_text?: string | null
          extracted_text?: string | null
          file_name?: string
          id?: number
          mime_type?: string
          storage_key?: string
          storage_url?: string
          updated_at?: string
          updated_by?: number
          version?: number
        }
        Relationships: []
      }
      contract_rent_changes: {
        Row: {
          company_id: number
          contract_id: number
          created_at: string
          created_by: number
          effective_date: string
          id: number
          note: string | null
          previous_rent_cents: number | null
          rent_cents: number
        }
        Insert: {
          company_id: number
          contract_id: number
          created_at?: string
          created_by: number
          effective_date: string
          id?: number
          note?: string | null
          previous_rent_cents?: number | null
          rent_cents: number
        }
        Update: {
          company_id?: number
          contract_id?: number
          created_at?: string
          created_by?: number
          effective_date?: string
          id?: number
          note?: string | null
          previous_rent_cents?: number | null
          rent_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "contract_rent_changes_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          adjustment_index: string | null
          admin_fee_percent_basis_points: number | null
          company_id: number | null
          created_at: string
          end_date: string | null
          guarantee_type: string | null
          id: number
          property_id: number
          rent_cents: number
          start_date: string
          status: Database["public"]["Enums"]["contract_status"]
          tenant_id: number
          updated_at: string
        }
        Insert: {
          adjustment_index?: string | null
          admin_fee_percent_basis_points?: number | null
          company_id?: number | null
          created_at?: string
          end_date?: string | null
          guarantee_type?: string | null
          id?: number
          property_id: number
          rent_cents?: number
          start_date: string
          status?: Database["public"]["Enums"]["contract_status"]
          tenant_id: number
          updated_at?: string
        }
        Update: {
          adjustment_index?: string | null
          admin_fee_percent_basis_points?: number | null
          company_id?: number | null
          created_at?: string
          end_date?: string | null
          guarantee_type?: string | null
          id?: number
          property_id?: number
          rent_cents?: number
          start_date?: string
          status?: Database["public"]["Enums"]["contract_status"]
          tenant_id?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contracts_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      contratos: {
        Row: {
          created_at: string
          data_fim: string | null
          data_inicio: string
          dia_vencimento: number | null
          documento_url: string | null
          garantia_descricao: string | null
          garantia_tipo: string
          id: string
          imovel_id: string | null
          indice_reajuste: string
          locatario_id: string | null
          numero: string
          observacoes: string | null
          percentual_reajuste: number | null
          prazo_meses: number | null
          proprietario_id: string | null
          status: string
          taxa_administrativa: number | null
          tipo: string
          updated_at: string
          valor_aluguel: number
          versao_documento: number
        }
        Insert: {
          created_at?: string
          data_fim?: string | null
          data_inicio: string
          dia_vencimento?: number | null
          documento_url?: string | null
          garantia_descricao?: string | null
          garantia_tipo?: string
          id?: string
          imovel_id?: string | null
          indice_reajuste?: string
          locatario_id?: string | null
          numero: string
          observacoes?: string | null
          percentual_reajuste?: number | null
          prazo_meses?: number | null
          proprietario_id?: string | null
          status?: string
          taxa_administrativa?: number | null
          tipo?: string
          updated_at?: string
          valor_aluguel: number
          versao_documento?: number
        }
        Update: {
          created_at?: string
          data_fim?: string | null
          data_inicio?: string
          dia_vencimento?: number | null
          documento_url?: string | null
          garantia_descricao?: string | null
          garantia_tipo?: string
          id?: string
          imovel_id?: string | null
          indice_reajuste?: string
          locatario_id?: string | null
          numero?: string
          observacoes?: string | null
          percentual_reajuste?: number | null
          prazo_meses?: number | null
          proprietario_id?: string | null
          status?: string
          taxa_administrativa?: number | null
          tipo?: string
          updated_at?: string
          valor_aluguel?: number
          versao_documento?: number
        }
        Relationships: []
      }
      controles_conta: {
        Row: {
          aceita_pro_rata: boolean
          aceita_prorata: boolean
          ativo: boolean
          company_id: number
          created_at: string
          descricao: string | null
          exibe_relatorio: boolean
          exibe_resumo_final: boolean
          exibir_relatorio: boolean
          exibir_resumo_final: boolean
          id: number
          modo_calculo: string
          nome: string
          ordem_rateio: number
          ordem_relatorio: number
          ordem_resumo: number
          ordem_resumo_final: number
          participa_cobranca: boolean
          participa_rateio: boolean
          participa_repasse: boolean
          participa_taxa_admin: boolean
          participa_valor_cobrar: boolean
          pode_gerar_juros: boolean
          pode_gerar_multa: boolean
          pode_recorrer: boolean
          pode_ser_recorrente: boolean
          tipo: string
          tipo_categoria: string
          updated_at: string
        }
        Insert: {
          aceita_pro_rata?: boolean
          aceita_prorata?: boolean
          ativo?: boolean
          company_id: number
          created_at?: string
          descricao?: string | null
          exibe_relatorio?: boolean
          exibe_resumo_final?: boolean
          exibir_relatorio?: boolean
          exibir_resumo_final?: boolean
          id?: number
          modo_calculo?: string
          nome: string
          ordem_rateio?: number
          ordem_relatorio?: number
          ordem_resumo?: number
          ordem_resumo_final?: number
          participa_cobranca?: boolean
          participa_rateio?: boolean
          participa_repasse?: boolean
          participa_taxa_admin?: boolean
          participa_valor_cobrar?: boolean
          pode_gerar_juros?: boolean
          pode_gerar_multa?: boolean
          pode_recorrer?: boolean
          pode_ser_recorrente?: boolean
          tipo?: string
          tipo_categoria?: string
          updated_at?: string
        }
        Update: {
          aceita_pro_rata?: boolean
          aceita_prorata?: boolean
          ativo?: boolean
          company_id?: number
          created_at?: string
          descricao?: string | null
          exibe_relatorio?: boolean
          exibe_resumo_final?: boolean
          exibir_relatorio?: boolean
          exibir_resumo_final?: boolean
          id?: number
          modo_calculo?: string
          nome?: string
          ordem_rateio?: number
          ordem_relatorio?: number
          ordem_resumo?: number
          ordem_resumo_final?: number
          participa_cobranca?: boolean
          participa_rateio?: boolean
          participa_repasse?: boolean
          participa_taxa_admin?: boolean
          participa_valor_cobrar?: boolean
          pode_gerar_juros?: boolean
          pode_gerar_multa?: boolean
          pode_recorrer?: boolean
          pode_ser_recorrente?: boolean
          tipo?: string
          tipo_categoria?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "controles_conta_company_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      dashboard_action_items: {
        Row: {
          action: string
          company_id: number
          created_at: string
          created_by: number
          current_situation: string
          due_date: string | null
          id: number
          indicator: string
          priority: string
          problem: string
          responsible_user_id: number | null
          status: string
          target: string
          updated_at: string
        }
        Insert: {
          action: string
          company_id: number
          created_at?: string
          created_by: number
          current_situation: string
          due_date?: string | null
          id?: number
          indicator: string
          priority?: string
          problem: string
          responsible_user_id?: number | null
          status?: string
          target: string
          updated_at?: string
        }
        Update: {
          action?: string
          company_id?: number
          created_at?: string
          created_by?: number
          current_situation?: string
          due_date?: string | null
          id?: number
          indicator?: string
          priority?: string
          problem?: string
          responsible_user_id?: number | null
          status?: string
          target?: string
          updated_at?: string
        }
        Relationships: []
      }
      descontos_acrescimos: {
        Row: {
          ativo: boolean
          cobrar_multa_juros: boolean
          cobrar_taxa_admin: boolean
          company_id: number
          competencia_fim: string | null
          competencia_inicio: string
          contrato_id: number | null
          controle_conta_id: number
          created_at: string
          created_by: number
          data_encerramento: string | null
          data_lancamento: string
          deduzir_imposto: boolean
          descricao: string
          id: number
          imovel_id: number
          locador_id: number
          locatario_id: number
          quantidade_parcelas: number | null
          recorrencia_tipo: Database["public"]["Enums"]["adjustment_recurrence_type"]
          repassar_locador: boolean
          tipo: Database["public"]["Enums"]["adjustment_type"]
          updated_at: string
          updated_by: number
          valor_centavos: number
        }
        Insert: {
          ativo?: boolean
          cobrar_multa_juros?: boolean
          cobrar_taxa_admin?: boolean
          company_id: number
          competencia_fim?: string | null
          competencia_inicio: string
          contrato_id?: number | null
          controle_conta_id: number
          created_at?: string
          created_by: number
          data_encerramento?: string | null
          data_lancamento: string
          deduzir_imposto?: boolean
          descricao: string
          id?: number
          imovel_id: number
          locador_id: number
          locatario_id: number
          quantidade_parcelas?: number | null
          recorrencia_tipo: Database["public"]["Enums"]["adjustment_recurrence_type"]
          repassar_locador?: boolean
          tipo: Database["public"]["Enums"]["adjustment_type"]
          updated_at?: string
          updated_by: number
          valor_centavos: number
        }
        Update: {
          ativo?: boolean
          cobrar_multa_juros?: boolean
          cobrar_taxa_admin?: boolean
          company_id?: number
          competencia_fim?: string | null
          competencia_inicio?: string
          contrato_id?: number | null
          controle_conta_id?: number
          created_at?: string
          created_by?: number
          data_encerramento?: string | null
          data_lancamento?: string
          deduzir_imposto?: boolean
          descricao?: string
          id?: number
          imovel_id?: number
          locador_id?: number
          locatario_id?: number
          quantidade_parcelas?: number | null
          recorrencia_tipo?: Database["public"]["Enums"]["adjustment_recurrence_type"]
          repassar_locador?: boolean
          tipo?: Database["public"]["Enums"]["adjustment_type"]
          updated_at?: string
          updated_by?: number
          valor_centavos?: number
        }
        Relationships: [
          {
            foreignKeyName: "descontos_acrescimos_company_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "descontos_acrescimos_contrato_fkey"
            columns: ["contrato_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "descontos_acrescimos_controle_conta_fkey"
            columns: ["controle_conta_id"]
            isOneToOne: false
            referencedRelation: "controles_conta"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "descontos_acrescimos_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "descontos_acrescimos_imovel_fkey"
            columns: ["imovel_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "descontos_acrescimos_locador_fkey"
            columns: ["locador_id"]
            isOneToOne: false
            referencedRelation: "owners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "descontos_acrescimos_locatario_fkey"
            columns: ["locatario_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "descontos_acrescimos_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      descontos_acrescimos_aplicacoes: {
        Row: {
          cobrar_multa_juros: boolean
          cobrar_taxa_admin: boolean
          competencia: string
          created_at: string
          deduzir_imposto: boolean
          desconto_acrescimo_id: number
          descricao: string
          id: number
          monthly_entry_id: number
          repassar_locador: boolean
          tipo: Database["public"]["Enums"]["adjustment_type"]
          valor_centavos: number
        }
        Insert: {
          cobrar_multa_juros: boolean
          cobrar_taxa_admin: boolean
          competencia: string
          created_at?: string
          deduzir_imposto: boolean
          desconto_acrescimo_id: number
          descricao: string
          id?: number
          monthly_entry_id: number
          repassar_locador: boolean
          tipo: Database["public"]["Enums"]["adjustment_type"]
          valor_centavos: number
        }
        Update: {
          cobrar_multa_juros?: boolean
          cobrar_taxa_admin?: boolean
          competencia?: string
          created_at?: string
          deduzir_imposto?: boolean
          desconto_acrescimo_id?: number
          descricao?: string
          id?: number
          monthly_entry_id?: number
          repassar_locador?: boolean
          tipo?: Database["public"]["Enums"]["adjustment_type"]
          valor_centavos?: number
        }
        Relationships: [
          {
            foreignKeyName: "descontos_acrescimos_aplicacoes_lancamento_fkey"
            columns: ["monthly_entry_id"]
            isOneToOne: false
            referencedRelation: "monthly_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "descontos_acrescimos_aplicacoes_regra_fkey"
            columns: ["desconto_acrescimo_id"]
            isOneToOne: false
            referencedRelation: "descontos_acrescimos"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_allocations: {
        Row: {
          amount_cents: number
          company_id: number
          created_at: string
          criterion: string
          expense_id: number
          id: number
          monthly_entry_id: number
        }
        Insert: {
          amount_cents: number
          company_id: number
          created_at?: string
          criterion?: string
          expense_id: number
          id?: number
          monthly_entry_id: number
        }
        Update: {
          amount_cents?: number
          company_id?: number
          created_at?: string
          criterion?: string
          expense_id?: number
          id?: number
          monthly_entry_id?: number
        }
        Relationships: []
      }
      financial_ledger_entries: {
        Row: {
          allocation_criterion: string | null
          allocation_origin_id: number | null
          amount_cents: number
          cancelled_at: string | null
          category: string
          charge_admin_fee: boolean
          company_id: number
          competence: string
          contract_id: number | null
          control_account_id: number | null
          created_at: string
          created_by: number | null
          deduct_tax: boolean
          description: string
          financial_nature: string
          id: number
          monthly_entry_id: number | null
          movement_date: string | null
          movement_type: string
          origin: string
          origin_id: number
          origin_item: string
          repass_to_owner: boolean
          status: string
          updated_at: string
          updated_by: number | null
        }
        Insert: {
          allocation_criterion?: string | null
          allocation_origin_id?: number | null
          amount_cents: number
          cancelled_at?: string | null
          category: string
          charge_admin_fee?: boolean
          company_id: number
          competence: string
          contract_id?: number | null
          control_account_id?: number | null
          created_at?: string
          created_by?: number | null
          deduct_tax?: boolean
          description: string
          financial_nature: string
          id?: number
          monthly_entry_id?: number | null
          movement_date?: string | null
          movement_type: string
          origin: string
          origin_id: number
          origin_item: string
          repass_to_owner?: boolean
          status?: string
          updated_at?: string
          updated_by?: number | null
        }
        Update: {
          allocation_criterion?: string | null
          allocation_origin_id?: number | null
          amount_cents?: number
          cancelled_at?: string | null
          category?: string
          charge_admin_fee?: boolean
          company_id?: number
          competence?: string
          contract_id?: number | null
          control_account_id?: number | null
          created_at?: string
          created_by?: number | null
          deduct_tax?: boolean
          description?: string
          financial_nature?: string
          id?: number
          monthly_entry_id?: number | null
          movement_date?: string | null
          movement_type?: string
          origin?: string
          origin_id?: number
          origin_item?: string
          repass_to_owner?: boolean
          status?: string
          updated_at?: string
          updated_by?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "financial_ledger_entries_allocation_origin_id_fkey"
            columns: ["allocation_origin_id"]
            isOneToOne: false
            referencedRelation: "monthly_expense_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_ledger_entries_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_ledger_entries_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_ledger_entries_control_account_id_fkey"
            columns: ["control_account_id"]
            isOneToOne: false
            referencedRelation: "controles_conta"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_ledger_entries_monthly_entry_id_fkey"
            columns: ["monthly_entry_id"]
            isOneToOne: false
            referencedRelation: "monthly_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      generated_reports: {
        Row: {
          company_id: number | null
          competence: string
          file_name: string
          file_url: string | null
          generated_at: string
          generated_by: number
          id: number
        }
        Insert: {
          company_id?: number | null
          competence: string
          file_name: string
          file_url?: string | null
          generated_at?: string
          generated_by: number
          id?: number
        }
        Update: {
          company_id?: number | null
          competence?: string
          file_name?: string
          file_url?: string | null
          generated_at?: string
          generated_by?: number
          id?: number
        }
        Relationships: [
          {
            foreignKeyName: "generated_reports_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generated_reports_generated_by_fkey"
            columns: ["generated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      login_attempts: {
        Row: {
          attempted_at: string
          id: number
          scope: string
          subject: string
        }
        Insert: {
          attempted_at?: string
          id?: number
          scope: string
          subject: string
        }
        Update: {
          attempted_at?: string
          id?: number
          scope?: string
          subject?: string
        }
        Relationships: []
      }
      monthly_entries: {
        Row: {
          charges_cents: number
          company_id: number | null
          competence: string
          contract_id: number | null
          created_at: string
          created_by: number
          delinquent: boolean
          due_date: string | null
          fine_cents: number
          guarantee_cents: number
          id: number
          insurance_cents: number
          notes: string | null
          owner_id: number | null
          paid_cents: number
          painting_cents: number
          payment_date: string | null
          pending_cents: number
          property_id: number | null
          rent_cents: number
          status: Database["public"]["Enums"]["entry_status"]
          tenant_id: number | null
          updated_at: string
        }
        Insert: {
          charges_cents?: number
          company_id?: number | null
          competence: string
          contract_id?: number | null
          created_at?: string
          created_by: number
          delinquent?: boolean
          due_date?: string | null
          fine_cents?: number
          guarantee_cents?: number
          id?: number
          insurance_cents?: number
          notes?: string | null
          owner_id?: number | null
          paid_cents?: number
          painting_cents?: number
          payment_date?: string | null
          pending_cents?: number
          property_id?: number | null
          rent_cents?: number
          status?: Database["public"]["Enums"]["entry_status"]
          tenant_id?: number | null
          updated_at?: string
        }
        Update: {
          charges_cents?: number
          company_id?: number | null
          competence?: string
          contract_id?: number | null
          created_at?: string
          created_by?: number
          delinquent?: boolean
          due_date?: string | null
          fine_cents?: number
          guarantee_cents?: number
          id?: number
          insurance_cents?: number
          notes?: string | null
          owner_id?: number | null
          paid_cents?: number
          painting_cents?: number
          payment_date?: string | null
          pending_cents?: number
          property_id?: number | null
          rent_cents?: number
          status?: Database["public"]["Enums"]["entry_status"]
          tenant_id?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "monthly_entries_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "monthly_entries_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "owners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "monthly_entries_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "monthly_entries_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_expense_items: {
        Row: {
          amount_cents: number
          charged_to: string
          company_id: number
          competence: string
          control_account_id: number
          created_at: string
          created_by: number
          description: string
          expense_date: string
          id: number
          notes: string | null
          owner_id: number
          property_id: number | null
        }
        Insert: {
          amount_cents: number
          charged_to?: string
          company_id: number
          competence: string
          control_account_id: number
          created_at?: string
          created_by: number
          description: string
          expense_date: string
          id?: number
          notes?: string | null
          owner_id: number
          property_id?: number | null
        }
        Update: {
          amount_cents?: number
          charged_to?: string
          company_id?: number
          competence?: string
          control_account_id?: number
          created_at?: string
          created_by?: number
          description?: string
          expense_date?: string
          id?: number
          notes?: string | null
          owner_id?: number
          property_id?: number | null
        }
        Relationships: []
      }
      monthly_expenses: {
        Row: {
          company_id: number | null
          competence: string
          condominium_cents: number
          created_at: string
          created_by: number
          id: number
          light_cents: number
          updated_at: string
          water_cents: number
        }
        Insert: {
          company_id?: number | null
          competence: string
          condominium_cents?: number
          created_at?: string
          created_by: number
          id?: number
          light_cents?: number
          updated_at?: string
          water_cents?: number
        }
        Update: {
          company_id?: number | null
          competence?: string
          condominium_cents?: number
          created_at?: string
          created_by?: number
          id?: number
          light_cents?: number
          updated_at?: string
          water_cents?: number
        }
        Relationships: []
      }
      owner_repass_methods: {
        Row: {
          account_type: string | null
          bank_account: string | null
          bank_account_digit: string | null
          bank_agency: string | null
          bank_code: string | null
          bank_name: string | null
          beneficiary_name: string | null
          company_id: number
          created_at: string
          id: number
          method: string
          owner_id: number
          pix_key: string | null
          pix_type: string | null
          position: number
          titular_document: string | null
          updated_at: string
        }
        Insert: {
          account_type?: string | null
          bank_account?: string | null
          bank_account_digit?: string | null
          bank_agency?: string | null
          bank_code?: string | null
          bank_name?: string | null
          beneficiary_name?: string | null
          company_id: number
          created_at?: string
          id?: number
          method: string
          owner_id: number
          pix_key?: string | null
          pix_type?: string | null
          position: number
          titular_document?: string | null
          updated_at?: string
        }
        Update: {
          account_type?: string | null
          bank_account?: string | null
          bank_account_digit?: string | null
          bank_agency?: string | null
          bank_code?: string | null
          bank_name?: string | null
          beneficiary_name?: string | null
          company_id?: number
          created_at?: string
          id?: number
          method?: string
          owner_id?: number
          pix_key?: string | null
          pix_type?: string | null
          position?: number
          titular_document?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      owner_repasses: {
        Row: {
          account_snapshot: string | null
          account_type_snapshot: string | null
          agency_snapshot: string | null
          amount_cents: number
          bank_code_snapshot: string | null
          bank_name_snapshot: string | null
          beneficiary_snapshot: string | null
          company_id: number
          competence: string
          created_at: string
          digit_snapshot: string | null
          document_snapshot: string | null
          id: number
          owner_id: number
          pix_key_snapshot: string | null
          pix_type_snapshot: string | null
          registered_by: number
          repass_date: string
          repass_method: string | null
        }
        Insert: {
          account_snapshot?: string | null
          account_type_snapshot?: string | null
          agency_snapshot?: string | null
          amount_cents: number
          bank_code_snapshot?: string | null
          bank_name_snapshot?: string | null
          beneficiary_snapshot?: string | null
          company_id: number
          competence: string
          created_at?: string
          digit_snapshot?: string | null
          document_snapshot?: string | null
          id?: number
          owner_id: number
          pix_key_snapshot?: string | null
          pix_type_snapshot?: string | null
          registered_by: number
          repass_date: string
          repass_method?: string | null
        }
        Update: {
          account_snapshot?: string | null
          account_type_snapshot?: string | null
          agency_snapshot?: string | null
          amount_cents?: number
          bank_code_snapshot?: string | null
          bank_name_snapshot?: string | null
          beneficiary_snapshot?: string | null
          company_id?: number
          competence?: string
          created_at?: string
          digit_snapshot?: string | null
          document_snapshot?: string | null
          id?: number
          owner_id?: number
          pix_key_snapshot?: string | null
          pix_type_snapshot?: string | null
          registered_by?: number
          repass_date?: string
          repass_method?: string | null
        }
        Relationships: []
      }
      owners: {
        Row: {
          account_type: string | null
          admin_fee_percent_basis_points: number
          bank_account: string | null
          bank_account_digit: string | null
          bank_agency: string | null
          bank_code: string | null
          bank_name: string | null
          beneficiary_name: string | null
          company_id: number | null
          city: string | null
          created_at: string
          document: string | null
          email: string | null
          full_name: string
          id: number
          notes: string | null
          phone: string | null
          pix_key: string | null
          pix_type: string | null
          preferred_repass_method: string | null
          titular_document: string | null
          updated_at: string
        }
        Insert: {
          account_type?: string | null
          admin_fee_percent_basis_points?: number
          bank_account?: string | null
          bank_account_digit?: string | null
          bank_agency?: string | null
          bank_code?: string | null
          bank_name?: string | null
          beneficiary_name?: string | null
          company_id?: number | null
          city?: string | null
          created_at?: string
          document?: string | null
          email?: string | null
          full_name: string
          id?: number
          notes?: string | null
          phone?: string | null
          pix_key?: string | null
          pix_type?: string | null
          preferred_repass_method?: string | null
          titular_document?: string | null
          updated_at?: string
        }
        Update: {
          account_type?: string | null
          admin_fee_percent_basis_points?: number
          bank_account?: string | null
          bank_account_digit?: string | null
          bank_agency?: string | null
          bank_code?: string | null
          bank_name?: string | null
          beneficiary_name?: string | null
          company_id?: number | null
          city?: string | null
          created_at?: string
          document?: string | null
          email?: string | null
          full_name?: string
          id?: number
          notes?: string | null
          phone?: string | null
          pix_key?: string | null
          pix_type?: string | null
          preferred_repass_method?: string | null
          titular_document?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      pendency_receipts: {
        Row: {
          amount_cents: number
          company_id: number
          created_at: string
          created_by: number
          id: number
          monthly_entry_id: number
          notes: string | null
          owner_id: number
          payment_date: string
          received_competence: string
        }
        Insert: {
          amount_cents: number
          company_id: number
          created_at?: string
          created_by: number
          id?: number
          monthly_entry_id: number
          notes?: string | null
          owner_id: number
          payment_date: string
          received_competence: string
        }
        Update: {
          amount_cents?: number
          company_id?: number
          created_at?: string
          created_by?: number
          id?: number
          monthly_entry_id?: number
          notes?: string | null
          owner_id?: number
          payment_date?: string
          received_competence?: string
        }
        Relationships: [
          {
            foreignKeyName: "pendency_receipts_monthly_entry_id_fkey"
            columns: ["monthly_entry_id"]
            isOneToOne: false
            referencedRelation: "monthly_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      properties: {
        Row: {
          address: string
          city: string
          code: string
          company_id: number | null
          created_at: string
          id: number
          occupancy_status: Database["public"]["Enums"]["occupancy_status"]
          bairro: string | null
          caracteristicas: string | null
          complemento: string | null
          numero: string | null
          owner_id: number | null
          rent_cents: number
          state: string
          type: string
          updated_at: string
          zip_code: string | null
        }
        Insert: {
          address: string
          city: string
          code: string
          company_id?: number | null
          created_at?: string
          id?: number
          occupancy_status?: Database["public"]["Enums"]["occupancy_status"]
          bairro?: string | null
          caracteristicas?: string | null
          complemento?: string | null
          numero?: string | null
          owner_id?: number | null
          rent_cents?: number
          state: string
          type: string
          updated_at?: string
          zip_code?: string | null
        }
        Update: {
          address?: string
          city?: string
          code?: string
          company_id?: number | null
          created_at?: string
          id?: number
          occupancy_status?: Database["public"]["Enums"]["occupancy_status"]
          bairro?: string | null
          caracteristicas?: string | null
          complemento?: string | null
          numero?: string | null
          owner_id?: number | null
          rent_cents?: number
          state?: string
          type?: string
          updated_at?: string
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "properties_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "owners"
            referencedColumns: ["id"]
          },
        ]
      }
      report_exclusions: {
        Row: {
          company_id: number
          competence: string
          created_at: string
          created_by: number
          id: number
          property_id: number
          tenant_id: number
        }
        Insert: {
          company_id: number
          competence: string
          created_at?: string
          created_by: number
          id?: number
          property_id: number
          tenant_id: number
        }
        Update: {
          company_id?: number
          competence?: string
          created_at?: string
          created_by?: number
          id?: number
          property_id?: number
          tenant_id?: number
        }
        Relationships: []
      }
      report_notes: {
        Row: {
          company_id: number
          competence: string
          id: number
          notes: string
          owner_id: number
          updated_at: string
          updated_by: number
        }
        Insert: {
          company_id: number
          competence: string
          id?: number
          notes: string
          owner_id: number
          updated_at?: string
          updated_by: number
        }
        Update: {
          company_id?: number
          competence?: string
          id?: number
          notes?: string
          owner_id?: number
          updated_at?: string
          updated_by?: number
        }
        Relationships: []
      }
      report_snapshots: {
        Row: {
          company_id: number
          competence: string
          created_at: string
          created_by: number
          id: number
          owner_id: number | null
          payload: string
        }
        Insert: {
          company_id: number
          competence: string
          created_at?: string
          created_by: number
          id?: number
          owner_id?: number | null
          payload: string
        }
        Update: {
          company_id?: number
          competence?: string
          created_at?: string
          created_by?: number
          id?: number
          owner_id?: number | null
          payload?: string
        }
        Relationships: []
      }
      tenant_debt_payments: {
        Row: {
          amount_cents: number
          company_id: number
          created_at: string
          created_by: number
          debt_id: number
          id: number
          notes: string | null
          payment_competence: string
          payment_date: string
        }
        Insert: {
          amount_cents: number
          company_id: number
          created_at?: string
          created_by: number
          debt_id: number
          id?: number
          notes?: string | null
          payment_competence: string
          payment_date: string
        }
        Update: {
          amount_cents?: number
          company_id?: number
          created_at?: string
          created_by?: number
          debt_id?: number
          id?: number
          notes?: string | null
          payment_competence?: string
          payment_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_debt_payments_debt_id_fkey"
            columns: ["debt_id"]
            isOneToOne: false
            referencedRelation: "tenant_debts"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_debts: {
        Row: {
          amount_cents: number
          company_id: number
          competence: string
          created_at: string
          created_by: number
          description: string
          due_date: string | null
          id: number
          kind: string
          owner_id: number
          paid_cents: number
          status: string
          tenant_id: number
          updated_at: string
        }
        Insert: {
          amount_cents: number
          company_id: number
          competence: string
          created_at?: string
          created_by: number
          description: string
          due_date?: string | null
          id?: number
          kind: string
          owner_id: number
          paid_cents?: number
          status?: string
          tenant_id: number
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          company_id?: number
          competence?: string
          created_at?: string
          created_by?: number
          description?: string
          due_date?: string | null
          id?: number
          kind?: string
          owner_id?: number
          paid_cents?: number
          status?: string
          tenant_id?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_debts_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "owners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_debts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_owners: {
        Row: {
          company_id: number
          created_at: string
          id: number
          owner_id: number
          tenant_id: number
        }
        Insert: {
          company_id?: number
          created_at?: string
          id?: number
          owner_id: number
          tenant_id: number
        }
        Update: {
          company_id?: number
          created_at?: string
          id?: number
          owner_id?: number
          tenant_id?: number
        }
        Relationships: []
      }
      tenants: {
        Row: {
          admin_fee_basis_points: number | null
          company_id: number | null
          cpf: string | null
          created_at: string
          document: string | null
          email: string | null
          full_name: string
          id: number
          notes: string | null
          owner_id: number | null
          phone: string | null
          property_type: string | null
          rent_cents: number
          rg: string | null
          updated_at: string
        }
        Insert: {
          admin_fee_basis_points?: number | null
          company_id?: number | null
          cpf?: string | null
          created_at?: string
          document?: string | null
          email?: string | null
          full_name: string
          id?: number
          notes?: string | null
          owner_id?: number | null
          phone?: string | null
          property_type?: string | null
          rent_cents?: number
          rg?: string | null
          updated_at?: string
        }
        Update: {
          admin_fee_basis_points?: number | null
          company_id?: number | null
          cpf?: string | null
          created_at?: string
          document?: string | null
          email?: string | null
          full_name?: string
          id?: number
          notes?: string | null
          owner_id?: number | null
          phone?: string | null
          property_type?: string | null
          rent_cents?: number
          rg?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenants_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "owners"
            referencedColumns: ["id"]
          },
        ]
      }
      user_screen_permissions: {
        Row: {
          company_id: number
          created_at: string
          id: number
          screen_key: string
          user_id: number
        }
        Insert: {
          company_id?: number
          created_at?: string
          id?: number
          screen_key: string
          user_id: number
        }
        Update: {
          company_id?: number
          created_at?: string
          id?: number
          screen_key?: string
          user_id?: number
        }
        Relationships: []
      }
      users: {
        Row: {
          active_company_id: number | null
          created_at: string
          email: string | null
          id: number
          last_signed_in: string
          login_method: string | null
          must_change_password: boolean
          name: string | null
          open_id: string
          password_hash: string | null
          role: Database["public"]["Enums"]["user_role"]
          sessions_invalidated_at: string | null
          status: Database["public"]["Enums"]["membership_status"]
          temporary_access_expires_at: string | null
          updated_at: string
        }
        Insert: {
          active_company_id?: number | null
          created_at?: string
          email?: string | null
          id?: number
          last_signed_in?: string
          login_method?: string | null
          must_change_password?: boolean
          name?: string | null
          open_id: string
          password_hash?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          sessions_invalidated_at?: string | null
          status?: Database["public"]["Enums"]["membership_status"]
          temporary_access_expires_at?: string | null
          updated_at?: string
        }
        Update: {
          active_company_id?: number | null
          created_at?: string
          email?: string | null
          id?: number
          last_signed_in?: string
          login_method?: string | null
          must_change_password?: boolean
          name?: string | null
          open_id?: string
          password_hash?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          sessions_invalidated_at?: string | null
          status?: Database["public"]["Enums"]["membership_status"]
          temporary_access_expires_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      adjustment_recurrence_type: "one_time" | "installments" | "fixed"
      adjustment_type: "discount" | "surcharge"
      contract_status: "active" | "ended" | "draft"
      entry_status: "paid" | "open" | "overdue" | "partial" | "cancelled"
      membership_status: "active" | "inactive"
      occupancy_status: "occupied" | "vacant" | "maintenance"
      user_role: "user" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      adjustment_recurrence_type: ["one_time", "installments", "fixed"],
      adjustment_type: ["discount", "surcharge"],
      contract_status: ["active", "ended", "draft"],
      entry_status: ["paid", "open", "overdue", "partial", "cancelled"],
      membership_status: ["active", "inactive"],
      occupancy_status: ["occupied", "vacant", "maintenance"],
      user_role: ["user", "admin"],
    },
  },
} as const
