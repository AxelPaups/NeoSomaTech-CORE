// src/pages/api/product-fields.ts
// -----------------------------------------------------------------------------
// Retourne la definition des champs de la collection "Produits".
// Maintient la compatibilite avec l'ancienne API (retourne un tableau
// `{ data: [{ field, type, meta, schema }, ...] }`) pour ne rien casser
// dans le <script> cote client, MAIS la source de verite est maintenant
// src/config/client.ts (les champs hardcodes de l'ancienne version
// sont remplaces par la liste issue de la config).
// -----------------------------------------------------------------------------
export const prerender = false;

import fs from 'fs';
import path from 'path';
import {
  produitsCollection,
  type FieldDef,
} from '../../config/client';

// --- mini loader .env (les credentials viennent de .env) ---------------------
function loadDotEnvOnce() {
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (!fs.existsSync(envPath)) return;
    const content = fs.readFileSync(envPath, 'utf8');
    content.split(/\r?\n/).forEach((line) => {
      const match = line.match(/^\s*([^#=]+?)\s*=\s*(.*)?\s*$/);
      if (!match) return;
      const key = match[1].trim();
      let val = match[2] ?? '';
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = val;
    });
  } catch (error) {
    console.log('Failed to load .env', error);
  }
}
loadDotEnvOnce();

// --- helpers : map FieldDef (config) vers la forme "Directus-like" ----------
function fieldDefToDirectusShape(def: FieldDef, index: number) {
  const field = def.key;
  const type =
    def.type === 'decimal' ? 'decimal' :
      def.type === 'number' ? 'integer' :
        def.type === 'boolean' ? 'boolean' :
          def.type === 'textarea' ? 'text' :
            def.type === 'html' ? 'text' :
              def.type === 'json' ? 'json' :
                def.type === 'date' ? 'date' :
                  def.type === 'datetime' ? 'dateTime' :
                    'string';

  return {
    collection: produitsCollection.collection,
    field,
    type,
    schema: {
      name: field,
      table: produitsCollection.collection,
      data_type: type,
      default_value: null,
      max_length: null,
      numeric_precision: null,
      numeric_scale: null,
      is_generated: false,
      is_nullable: def.required ? false : true,
      is_unique: false,
      is_indexed: false,
      is_primary_key: field === 'id',
      has_auto_increment: false,
      foreign_key_column: null,
      foreign_key_table: null,
    },
    meta: {
      id: index + 1,
      collection: produitsCollection.collection,
      field,
      special: [],
      interface: null,
      options: null,
      display: null,
      display_options: null,
      readonly: !!def.readonly,
      hidden: false,
      sort: index + 1,
      width: 'full',
      group: def.group ?? null,
      translations: def.label
        ? [{ language: 'fr-FR', translation: def.label, singular: null, plural: null }]
        : [],
      note: def.helper ?? null,
      required: !!def.required,
      conditions: null,
      validation: null,
      validation_message: null,
    },
  };
}

export async function GET() {
  // Re-export de la liste des champs definis dans la config centralisee.
  const data = produitsCollection.fields.map((f, i) => fieldDefToDirectusShape(f, i));
  return new Response(JSON.stringify({ data }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
