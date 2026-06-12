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

function sanitize(value: unknown): unknown {
  if (value === '') return null;
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (Array.isArray(value)) return value.map((v) => sanitize(v));
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(value as Record<string, unknown>)) {
      out[k] = sanitize((value as Record<string, unknown>)[k]);
    }
    return out;
  }
  return value;
}

export async function GET({ url }: { url: URL }) {
  try {
    const DIRECTUS_URL = process.env.DIRECTUS_URL ?? 'https://spirited-squid.pikapod.net';
    const token = process.env.DIRECTUS_TOKEN;
    if (!token) {
      return new Response(JSON.stringify({ error: 'DIRECTUS_TOKEN not set on server' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const collection = url.searchParams.get('collection');
    if (!collection) {
      return new Response(JSON.stringify({ error: 'Missing collection param' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const id = url.searchParams.get('id');

    const authHeaders = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    if (id) {
      const res = await fetch(`${DIRECTUS_URL}/items/${encodeURIComponent(collection)}/${encodeURIComponent(id)}?fields=*.*`, {
        headers: authHeaders,
      });
      const data = await res.json();
      return new Response(JSON.stringify(data), {
        status: res.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const res = await fetch(`${DIRECTUS_URL}/items/${encodeURIComponent(collection)}?limit=-1&fields=*.*`, {
      headers: authHeaders,
    });
    const data = await res.json();
    return new Response(JSON.stringify(data), {
      status: res.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function POST({ request }: { request: Request }) {
  try {
    const DIRECTUS_URL = process.env.DIRECTUS_URL ?? 'https://spirited-squid.pikapod.net';
    const token = process.env.DIRECTUS_TOKEN;
    if (!token) {
      return new Response(JSON.stringify({ error: 'DIRECTUS_TOKEN not set on server' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();
    const collection = body.collection;
    if (!collection) {
      return new Response(JSON.stringify({ error: 'Missing collection in body' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const itemId = body.id;
    const payload = sanitize({ ...body, collection: undefined, id: undefined }) as Record<string, unknown>;

    const authHeaders = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    if (itemId) {
      const res = await fetch(`${DIRECTUS_URL}/items/${encodeURIComponent(collection)}/${encodeURIComponent(String(itemId))}`, {
        method: 'PATCH',
        headers: authHeaders,
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      return new Response(JSON.stringify(data), {
        status: res.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const res = await fetch(`${DIRECTUS_URL}/items/${encodeURIComponent(collection)}`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    return new Response(JSON.stringify(data), {
      status: res.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
