export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      activity_log: {
        Row: {
          action: string;
          actor_id: string | null;
          agency_id: string;
          created_at: string;
          details: NonNullable<Json>;
          entity: string;
          entity_id: string | null;
          id: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          action: string;
          actor_id?: string | null;
          agency_id: string;
          created_at?: string;
          details?: NonNullable<Json>;
          entity: string;
          entity_id?: string | null;
          id?: string;
          updated_at?: string;
        };
        Update: {
          action?: string;
          actor_id?: string | null;
          agency_id?: string;
          created_at?: string;
          details?: NonNullable<Json>;
          entity?: string;
          entity_id?: string | null;
          id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "activity_log_actor_id_fkey";
            columns: ["actor_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "activity_log_agency_id_fkey";
            columns: ["agency_id"];
            isOneToOne: false;
            referencedRelation: "agencies";
            referencedColumns: ["id"];
          },
        ];
      };
      agencies: {
        Row: {
          address: string | null;
          alert_days_before: number;
          alert_km_before: number;
          brand_color: string | null;
          city: string | null;
          cnss: string | null;
          contract_number_prefix: string;
          contract_terms: string | null;
          created_at: string;
          current_period_end: string | null;
          default_deposit: number;
          default_franchise: number;
          default_language: string;
          document_items: string[];
          email: string | null;
          equipment_items: string[];
          ice: string | null;
          id: string;
          if_number: string | null;
          logo_path: string | null;
          min_driver_age: number;
          min_license_years: number;
          name: string;
          next_contract_number: number;
          patente: string | null;
          phone: string | null;
          plan_id: string | null;
          rc: string | null;
          slug: string;
          subscription_status: string;
          trial_ends_at: string | null;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          address?: string | null;
          alert_days_before?: number;
          alert_km_before?: number;
          brand_color?: string | null;
          city?: string | null;
          cnss?: string | null;
          contract_number_prefix?: string;
          contract_terms?: string | null;
          created_at?: string;
          current_period_end?: string | null;
          default_deposit?: number;
          default_franchise?: number;
          default_language?: string;
          document_items?: string[];
          email?: string | null;
          equipment_items?: string[];
          ice?: string | null;
          id?: string;
          if_number?: string | null;
          logo_path?: string | null;
          min_driver_age?: number;
          min_license_years?: number;
          name: string;
          next_contract_number?: number;
          patente?: string | null;
          phone?: string | null;
          plan_id?: string | null;
          rc?: string | null;
          slug: string;
          subscription_status?: string;
          trial_ends_at?: string | null;
          updated_at?: string;
        };
        Update: {
          address?: string | null;
          alert_days_before?: number;
          alert_km_before?: number;
          brand_color?: string | null;
          city?: string | null;
          cnss?: string | null;
          contract_number_prefix?: string;
          contract_terms?: string | null;
          created_at?: string;
          current_period_end?: string | null;
          default_deposit?: number;
          default_franchise?: number;
          default_language?: string;
          document_items?: string[];
          email?: string | null;
          equipment_items?: string[];
          ice?: string | null;
          id?: string;
          if_number?: string | null;
          logo_path?: string | null;
          min_driver_age?: number;
          min_license_years?: number;
          name?: string;
          next_contract_number?: number;
          patente?: string | null;
          phone?: string | null;
          plan_id?: string | null;
          rc?: string | null;
          slug?: string;
          subscription_status?: string;
          trial_ends_at?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "agencies_plan_id_fkey";
            columns: ["plan_id"];
            isOneToOne: false;
            referencedRelation: "plans";
            referencedColumns: ["id"];
          },
        ];
      };
      agency_members: {
        Row: {
          agency_id: string;
          created_at: string;
          id: string;
          invited_by: string | null;
          role: string;
          status: string;
          updated_at: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          agency_id: string;
          created_at?: string;
          id?: string;
          invited_by?: string | null;
          role: string;
          status?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          agency_id?: string;
          created_at?: string;
          id?: string;
          invited_by?: string | null;
          role?: string;
          status?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "agency_members_agency_id_fkey";
            columns: ["agency_id"];
            isOneToOne: false;
            referencedRelation: "agencies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "agency_members_invited_by_fkey";
            columns: ["invited_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "agency_members_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      ai_chunks: {
        Row: {
          agency_id: string;
          content: string;
          created_at: string;
          document_id: string;
          embedding: string | null;
          id: string;
          metadata: NonNullable<Json>;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          agency_id: string;
          content: string;
          created_at?: string;
          document_id: string;
          embedding?: string | null;
          id?: string;
          metadata?: NonNullable<Json>;
          updated_at?: string;
        };
        Update: {
          agency_id?: string;
          content?: string;
          created_at?: string;
          document_id?: string;
          embedding?: string | null;
          id?: string;
          metadata?: NonNullable<Json>;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ai_chunks_agency_id_document_id_fkey";
            columns: ["agency_id", "document_id"];
            isOneToOne: false;
            referencedRelation: "ai_documents";
            referencedColumns: ["agency_id", "id"];
          },
          {
            foreignKeyName: "ai_chunks_agency_id_fkey";
            columns: ["agency_id"];
            isOneToOne: false;
            referencedRelation: "agencies";
            referencedColumns: ["id"];
          },
        ];
      };
      ai_documents: {
        Row: {
          agency_id: string;
          created_at: string;
          created_by: string | null;
          id: string;
          source: string;
          storage_path: string | null;
          title: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          agency_id: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          source?: string;
          storage_path?: string | null;
          title: string;
          updated_at?: string;
        };
        Update: {
          agency_id?: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          source?: string;
          storage_path?: string | null;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ai_documents_agency_id_fkey";
            columns: ["agency_id"];
            isOneToOne: false;
            referencedRelation: "agencies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ai_documents_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      charges: {
        Row: {
          agency_id: string;
          amount: number;
          campaign_name: string | null;
          category: string;
          created_at: string;
          created_by: string | null;
          date: string;
          id: string;
          note: string | null;
          updated_at: string;
          vehicle_id: string | null;
        };
        ComputedFields: never;
        Insert: {
          agency_id: string;
          amount: number;
          campaign_name?: string | null;
          category: string;
          created_at?: string;
          created_by?: string | null;
          date?: string;
          id?: string;
          note?: string | null;
          updated_at?: string;
          vehicle_id?: string | null;
        };
        Update: {
          agency_id?: string;
          amount?: number;
          campaign_name?: string | null;
          category?: string;
          created_at?: string;
          created_by?: string | null;
          date?: string;
          id?: string;
          note?: string | null;
          updated_at?: string;
          vehicle_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "charges_agency_id_fkey";
            columns: ["agency_id"];
            isOneToOne: false;
            referencedRelation: "agencies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "charges_agency_id_vehicle_id_fkey";
            columns: ["agency_id", "vehicle_id"];
            isOneToOne: false;
            referencedRelation: "vehicles";
            referencedColumns: ["agency_id", "id"];
          },
          {
            foreignKeyName: "charges_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      clients: {
        Row: {
          address: string | null;
          agency_id: string;
          birth_date: string | null;
          birth_place: string | null;
          created_at: string;
          email: string | null;
          full_name: string;
          id: string;
          id_expires_on: string | null;
          id_issued_on: string | null;
          id_issued_place: string | null;
          id_number: string;
          id_number_norm: string | null;
          id_type: string;
          license_issued_on: string | null;
          license_issued_place: string | null;
          license_number: string | null;
          nationality: string | null;
          notes: string | null;
          phone: string | null;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          address?: string | null;
          agency_id: string;
          birth_date?: string | null;
          birth_place?: string | null;
          created_at?: string;
          email?: string | null;
          full_name: string;
          id?: string;
          id_expires_on?: string | null;
          id_issued_on?: string | null;
          id_issued_place?: string | null;
          id_number: string;
          id_number_norm?: never;
          id_type: string;
          license_issued_on?: string | null;
          license_issued_place?: string | null;
          license_number?: string | null;
          nationality?: string | null;
          notes?: string | null;
          phone?: string | null;
          updated_at?: string;
        };
        Update: {
          address?: string | null;
          agency_id?: string;
          birth_date?: string | null;
          birth_place?: string | null;
          created_at?: string;
          email?: string | null;
          full_name?: string;
          id?: string;
          id_expires_on?: string | null;
          id_issued_on?: string | null;
          id_issued_place?: string | null;
          id_number?: string;
          id_number_norm?: never;
          id_type?: string;
          license_issued_on?: string | null;
          license_issued_place?: string | null;
          license_number?: string | null;
          nationality?: string | null;
          notes?: string | null;
          phone?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "clients_agency_id_fkey";
            columns: ["agency_id"];
            isOneToOne: false;
            referencedRelation: "agencies";
            referencedColumns: ["id"];
          },
        ];
      };
      invitations: {
        Row: {
          accepted_at: string | null;
          accepted_by: string | null;
          agency_id: string;
          created_at: string;
          email: string | null;
          expires_at: string;
          id: string;
          invited_by: string | null;
          phone: string | null;
          role: string;
          token_hash: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          accepted_at?: string | null;
          accepted_by?: string | null;
          agency_id: string;
          created_at?: string;
          email?: string | null;
          expires_at?: string;
          id?: string;
          invited_by?: string | null;
          phone?: string | null;
          role: string;
          token_hash: string;
          updated_at?: string;
        };
        Update: {
          accepted_at?: string | null;
          accepted_by?: string | null;
          agency_id?: string;
          created_at?: string;
          email?: string | null;
          expires_at?: string;
          id?: string;
          invited_by?: string | null;
          phone?: string | null;
          role?: string;
          token_hash?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "invitations_accepted_by_fkey";
            columns: ["accepted_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "invitations_agency_id_fkey";
            columns: ["agency_id"];
            isOneToOne: false;
            referencedRelation: "agencies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "invitations_invited_by_fkey";
            columns: ["invited_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      maintenance_periods: {
        Row: {
          agency_id: string;
          created_at: string;
          created_by: string | null;
          ended_on: string | null;
          expected_end_on: string | null;
          id: string;
          note: string | null;
          reason: string;
          starts_on: string;
          updated_at: string;
          vehicle_id: string;
        };
        ComputedFields: never;
        Insert: {
          agency_id: string;
          created_at?: string;
          created_by?: string | null;
          ended_on?: string | null;
          expected_end_on?: string | null;
          id?: string;
          note?: string | null;
          reason: string;
          starts_on?: string;
          updated_at?: string;
          vehicle_id: string;
        };
        Update: {
          agency_id?: string;
          created_at?: string;
          created_by?: string | null;
          ended_on?: string | null;
          expected_end_on?: string | null;
          id?: string;
          note?: string | null;
          reason?: string;
          starts_on?: string;
          updated_at?: string;
          vehicle_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "maintenance_periods_agency_id_fkey";
            columns: ["agency_id"];
            isOneToOne: false;
            referencedRelation: "agencies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "maintenance_periods_agency_id_vehicle_id_fkey";
            columns: ["agency_id", "vehicle_id"];
            isOneToOne: false;
            referencedRelation: "vehicles";
            referencedColumns: ["agency_id", "id"];
          },
          {
            foreignKeyName: "maintenance_periods_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      plans: {
        Row: {
          active: boolean;
          ai_enabled: boolean;
          code: string;
          created_at: string;
          id: string;
          max_users: number | null;
          max_vehicles: number | null;
          name: string;
          price_mad_month: number;
          price_mad_year: number;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          active?: boolean;
          ai_enabled?: boolean;
          code: string;
          created_at?: string;
          id?: string;
          max_users?: number | null;
          max_vehicles?: number | null;
          name: string;
          price_mad_month?: number;
          price_mad_year?: number;
          updated_at?: string;
        };
        Update: {
          active?: boolean;
          ai_enabled?: boolean;
          code?: string;
          created_at?: string;
          id?: string;
          max_users?: number | null;
          max_vehicles?: number | null;
          name?: string;
          price_mad_month?: number;
          price_mad_year?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      platform_admins: {
        Row: {
          created_at: string;
          id: string;
          updated_at: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          id?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "platform_admins_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string;
          full_name: string | null;
          id: string;
          phone: string | null;
          preferred_locale: string;
          preferred_theme: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          full_name?: string | null;
          id: string;
          phone?: string | null;
          preferred_locale?: string;
          preferred_theme?: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          full_name?: string | null;
          id?: string;
          phone?: string | null;
          preferred_locale?: string;
          preferred_theme?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      reservation_payments: {
        Row: {
          agency_id: string;
          amount: number;
          created_at: string;
          created_by: string | null;
          id: string;
          kind: string;
          method: string;
          note: string | null;
          paid_at: string;
          reservation_id: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          agency_id: string;
          amount: number;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          kind: string;
          method: string;
          note?: string | null;
          paid_at?: string;
          reservation_id: string;
          updated_at?: string;
        };
        Update: {
          agency_id?: string;
          amount?: number;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          kind?: string;
          method?: string;
          note?: string | null;
          paid_at?: string;
          reservation_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reservation_payments_agency_id_fkey";
            columns: ["agency_id"];
            isOneToOne: false;
            referencedRelation: "agencies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reservation_payments_agency_id_reservation_id_fkey";
            columns: ["agency_id", "reservation_id"];
            isOneToOne: false;
            referencedRelation: "reservations";
            referencedColumns: ["agency_id", "id"];
          },
          {
            foreignKeyName: "reservation_payments_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      reservations: {
        Row: {
          actual_return_at: string | null;
          advance_paid: number;
          agency_id: string;
          cancel_reason: string | null;
          cancelled_at: string | null;
          client_id: string;
          contract_number: string;
          created_at: string;
          created_by: string | null;
          daily_price: number;
          delivery: boolean;
          delivery_fee: number;
          delivery_place: string | null;
          deposit_amount: number;
          deposit_taken: boolean;
          documents_given: string[];
          end_at: string;
          equipment: string[];
          extended_days: number;
          franchise: number;
          fuel_in: number | null;
          fuel_out: number | null;
          id: string;
          km_in: number | null;
          km_out: number | null;
          notes: string | null;
          return_place: string | null;
          second_driver_id: string | null;
          signed_at: string | null;
          signed_by: string | null;
          start_at: string;
          status: string;
          updated_at: string;
          vehicle_id: string;
        };
        ComputedFields: never;
        Insert: {
          actual_return_at?: string | null;
          advance_paid?: number;
          agency_id: string;
          cancel_reason?: string | null;
          cancelled_at?: string | null;
          client_id: string;
          contract_number?: string;
          created_at?: string;
          created_by?: string | null;
          daily_price: number;
          delivery?: boolean;
          delivery_fee?: number;
          delivery_place?: string | null;
          deposit_amount?: number;
          deposit_taken?: boolean;
          documents_given?: string[];
          end_at: string;
          equipment?: string[];
          extended_days?: number;
          franchise?: number;
          fuel_in?: number | null;
          fuel_out?: number | null;
          id?: string;
          km_in?: number | null;
          km_out?: number | null;
          notes?: string | null;
          return_place?: string | null;
          second_driver_id?: string | null;
          signed_at?: string | null;
          signed_by?: string | null;
          start_at: string;
          status?: string;
          updated_at?: string;
          vehicle_id: string;
        };
        Update: {
          actual_return_at?: string | null;
          advance_paid?: number;
          agency_id?: string;
          cancel_reason?: string | null;
          cancelled_at?: string | null;
          client_id?: string;
          contract_number?: string;
          created_at?: string;
          created_by?: string | null;
          daily_price?: number;
          delivery?: boolean;
          delivery_fee?: number;
          delivery_place?: string | null;
          deposit_amount?: number;
          deposit_taken?: boolean;
          documents_given?: string[];
          end_at?: string;
          equipment?: string[];
          extended_days?: number;
          franchise?: number;
          fuel_in?: number | null;
          fuel_out?: number | null;
          id?: string;
          km_in?: number | null;
          km_out?: number | null;
          notes?: string | null;
          return_place?: string | null;
          second_driver_id?: string | null;
          signed_at?: string | null;
          signed_by?: string | null;
          start_at?: string;
          status?: string;
          updated_at?: string;
          vehicle_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reservations_agency_id_client_id_fkey";
            columns: ["agency_id", "client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["agency_id", "id"];
          },
          {
            foreignKeyName: "reservations_agency_id_fkey";
            columns: ["agency_id"];
            isOneToOne: false;
            referencedRelation: "agencies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reservations_agency_id_second_driver_id_fkey";
            columns: ["agency_id", "second_driver_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["agency_id", "id"];
          },
          {
            foreignKeyName: "reservations_agency_id_vehicle_id_fkey";
            columns: ["agency_id", "vehicle_id"];
            isOneToOne: false;
            referencedRelation: "vehicles";
            referencedColumns: ["agency_id", "id"];
          },
          {
            foreignKeyName: "reservations_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reservations_signed_by_fkey";
            columns: ["signed_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      vehicles: {
        Row: {
          agency_id: string;
          brand_model: string;
          category: string;
          created_at: string;
          current_km: number;
          daily_rate: number;
          first_registration_date: string | null;
          fuel: string;
          gearbox: string;
          id: string;
          insurance_expires_on: string | null;
          insurer: string | null;
          notes: string | null;
          oil_last_date: string | null;
          oil_last_km: number | null;
          oil_next_km: number | null;
          plate: string;
          plate_norm: string | null;
          policy_number: string | null;
          status: string;
          technical_visit_expires_on: string | null;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          agency_id: string;
          brand_model: string;
          category: string;
          created_at?: string;
          current_km?: number;
          daily_rate: number;
          first_registration_date?: string | null;
          fuel: string;
          gearbox: string;
          id?: string;
          insurance_expires_on?: string | null;
          insurer?: string | null;
          notes?: string | null;
          oil_last_date?: string | null;
          oil_last_km?: number | null;
          oil_next_km?: number | null;
          plate: string;
          plate_norm?: never;
          policy_number?: string | null;
          status?: string;
          technical_visit_expires_on?: string | null;
          updated_at?: string;
        };
        Update: {
          agency_id?: string;
          brand_model?: string;
          category?: string;
          created_at?: string;
          current_km?: number;
          daily_rate?: number;
          first_registration_date?: string | null;
          fuel?: string;
          gearbox?: string;
          id?: string;
          insurance_expires_on?: string | null;
          insurer?: string | null;
          notes?: string | null;
          oil_last_date?: string | null;
          oil_last_km?: number | null;
          oil_next_km?: number | null;
          plate?: string;
          plate_norm?: never;
          policy_number?: string | null;
          status?: string;
          technical_visit_expires_on?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "vehicles_agency_id_fkey";
            columns: ["agency_id"];
            isOneToOne: false;
            referencedRelation: "agencies";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      _next_contract_number: { Args: { p_agency: string }; Returns: string };
      accept_invitation: { Args: { p_token: string }; Returns: string };
      create_agency: { Args: { p_name: string; p_slug: string }; Returns: string };
      current_agency_ids: { Args: { p_roles?: string[] }; Returns: string[] };
      has_role: { Args: { p_agency: string; p_roles: string[] }; Returns: boolean };
      is_member: { Args: { p_agency: string }; Returns: boolean };
      is_platform_admin: { Args: Record<PropertyKey, never>; Returns: boolean };
      match_chunks: {
        Args: { p_agency: string; p_k?: number; p_query_embedding: string };
        Returns: {
          content: string;
          document_id: string;
          id: string;
          metadata: Json;
          similarity: number;
        }[];
      };
      next_contract_number: { Args: { p_agency: string }; Returns: string };
      preview_contract_number: { Args: { p_agency: string }; Returns: string };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
