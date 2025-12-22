export type FieldType = 'text' | 'number' | 'select' | 'date' | 'boolean' | 'email' | 'url' | 'richtext' | 'json' | 'relation';

export interface EntityTable {
  id: string;
  workspace_id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface EntityField {
  id: string;
  table_id: string;
  name: string;
  type: FieldType;
  order_index: number;
  // Options pour les selects ou la config des relations
  options: {
    choices?: { label: string; color?: string; id: string }[];
    target_table_id?: string; // Pour les relations
    [key: string]: any;
  } | null;
}

export interface EntityRecord {
  id: string;
  table_id: string;
  // Record<string, any> permet de stocker { "field_id_123": "Valeur" }
  data: Record<string, any>; 
  created_at: string;
  updated_at: string;
}

// Type composé utile pour le frontend (Table + ses champs)
export interface EntityTableWithFields extends EntityTable {
  fields: EntityField[];
}
