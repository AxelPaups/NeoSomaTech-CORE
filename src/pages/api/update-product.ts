export const prerender = false;

import fs from 'fs';
import path from 'path';

function loadDotEnvOnce() {
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      content.split(/\r?\n/).forEach(line => {
        const match = line.match(/^\s*([^#=]+?)\s*=\s*(.*)?\s*$/);
        if (match) {
          const key = match[1].trim();
          let val = match[2] ?? '';
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
          }
          if (!process.env[key]) process.env[key] = val;
        }
      });
    }
  } catch (error) {
    console.log('Failed to load .env', error);
  }
}

function tryParseNumber(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  if (/^-?\d+(?:\.\d+)?$/.test(value)) {
    const n = Number(value);
    return Number.isFinite(n) ? n : value;
  }
  return value;
}

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
  if (typeof value === 'string') {
    const num = tryParseNumber(value);
    return num === value ? value : num;
  }
  return value;
}

loadDotEnvOnce();

export async function POST({ request }: { request: Request }) {
  try {
    const body = await request.json();
    const productId = body.id ?? body.product_id;
    if (!productId) {
      return new Response(JSON.stringify({ error: 'Missing product id' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const sanitizedBody = sanitize({
      ...body,
      id: undefined,
      product_id: undefined,
    }) as Record<string, unknown>;

    const DIRECTUS_URL = process.env.DIRECTUS_URL ?? 'https://spirited-squid.pikapod.net';
    const token = process.env.DIRECTUS_TOKEN;
    if (!token) {
      return new Response(JSON.stringify({ error: 'DIRECTUS_TOKEN not set on server' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    const res = await fetch(`${DIRECTUS_URL}/items/Produits/${encodeURIComponent(String(productId))}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(sanitizedBody),
    });

    const data = await res.json();
    return new Response(JSON.stringify(data), { status: res.status, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
