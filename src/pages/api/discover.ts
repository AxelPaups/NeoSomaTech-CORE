export const prerender = false;

import fs from 'fs';
import path from 'path';

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
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = val;
    });
  } catch (error) {
    console.log('Failed to load .env', error);
  }
}

loadDotEnvOnce();

const SYSTEM_COLLECTIONS = new Set([
  'directus_activity', 'directus_collections', 'directus_dashboards',
  'directus_extensions', 'directus_fields', 'directus_files',
  'directus_flow', 'directus_folders', 'directus_migrations',
  'directus_notifications', 'directus_operations', 'directus_panels',
  'directus_permissions', 'directus_presets', 'directus_relations',
  'directus_revisions', 'directus_roles', 'directus_sessions',
  'directus_settings', 'directus_shares', 'directus_translations',
  'directus_webhooks', 'directus_users',
]);

interface CollectionInfo {
  collection: string;
  name: string;
  note: string | null;
  item_count: number;
}

interface FieldInfo {
  collection: string;
  field: string;
  type: string;
  meta: Record<string, unknown> | null;
  schema: Record<string, unknown> | null;
}

interface DiscoveryResult {
  collection: string;
  name: string;
  note: string | null;
  item_count: number;
  fields: FieldInfo[];
}

export async function GET() {
  try {
    const DIRECTUS_URL = process.env.DIRECTUS_URL ?? 'https://spirited-squid.pikapod.net';
    const token = process.env.DIRECTUS_TOKEN;
    if (!token) {
      return new Response(JSON.stringify({ error: 'DIRECTUS_TOKEN not set on server' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const authHeaders = { Authorization: `Bearer ${token}` };

    const collectionsRes = await fetch(`${DIRECTUS_URL}/collections`, {
      headers: authHeaders,
    });

    if (!collectionsRes.ok) {
      const text = await collectionsRes.text();
      return new Response(JSON.stringify({ error: `Directus collections error: ${collectionsRes.status}`, detail: text }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const collectionsJson = await collectionsRes.json();
    const rawCollections: CollectionInfo[] = (collectionsJson.data || []);

    const userCollections = rawCollections.filter(
      (c) => !c.collection.startsWith('directus_') && !SYSTEM_COLLECTIONS.has(c.collection)
    );

    const result: DiscoveryResult[] = [];

    for (const c of userCollections) {
      try {
        const fieldsRes = await fetch(`${DIRECTUS_URL}/fields/${c.collection}`, {
          headers: authHeaders,
        });
        if (!fieldsRes.ok) continue;

        const fieldsJson = await fieldsRes.json();
        const fields: FieldInfo[] = (fieldsJson.data || []).filter(
          (f: FieldInfo) => !f.collection.startsWith('directus_')
        );

        result.push({
          collection: c.collection,
          name: (c as any).meta?.translations?.[0]?.translation || c.collection,
          note: (c as any).meta?.note || null,
          item_count: (c as any).meta?.item_count ?? 0,
          fields,
        });
      } catch {
        continue;
      }
    }

    return new Response(JSON.stringify({ data: result }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
