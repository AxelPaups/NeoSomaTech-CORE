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

export async function GET({ url }: { url: URL }) {
  try {
    const id = url.searchParams.get('id');
    if (!id) {
      return new Response(JSON.stringify({ error: 'Missing article id' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const DIRECTUS_URL = process.env.DIRECTUS_URL ?? 'https://spirited-squid.pikapod.net';
    const token = process.env.DIRECTUS_TOKEN;
    if (!token) {
      return new Response(JSON.stringify({ error: 'DIRECTUS_TOKEN not set on server' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const params = new URLSearchParams({
      fields: '*.*',
    });

    const res = await fetch(`${DIRECTUS_URL}/items/Articles/${encodeURIComponent(id)}?${params}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
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
