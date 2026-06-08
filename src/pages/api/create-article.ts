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
      console.log('.env loaded from', envPath);
    } else {
      console.log('.env not found at', envPath);
    }
  } catch (e) {
    console.log('Failed to load .env', e);
  }
}

loadDotEnvOnce();

export async function POST({ request }) {
  try {
    console.log('API /api/create-article called');
    console.log('DIRECTUS_URL:', process.env.DIRECTUS_URL ? 'set' : 'unset');
    console.log('DIRECTUS_TOKEN present:', !!process.env.DIRECTUS_TOKEN);
    const body = await request.json();
    const DIRECTUS_URL = process.env.DIRECTUS_URL ?? 'https://spirited-squid.pikapod.net';
    const token = process.env.DIRECTUS_TOKEN;

    if (!token) {
      return new Response(JSON.stringify({ error: 'DIRECTUS_TOKEN not set on server' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    const res = await fetch(`${DIRECTUS_URL}/items/Articles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return new Response(JSON.stringify(data), { status: res.status, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
