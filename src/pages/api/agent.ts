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

loadDotEnvOnce();

export async function POST({ request }: { request: Request }) {
  try {
    const body = await request.json();
    const prompt = (body.input || '').toString();
    const agentId = body.agentId || null;

    if (!prompt) {
      return new Response(JSON.stringify({ error: 'No input provided' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const OPENAI_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_KEY) {
      // Return a mock response when no API key is configured
      const mock = `Réponse factice pour: ${prompt.slice(0, 200)}`;
      return new Response(JSON.stringify({ reply: mock, agentId }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    // Relay request to OpenAI Chat Completions
    const payload = {
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Tu es un assistant utile pour l\'interface admin NeoSomaTech.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 800,
      temperature: 0.2,
    };

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    const reply = data?.choices?.[0]?.message?.content ?? data?.error ?? 'Pas de réponse';
    return new Response(JSON.stringify({ reply, raw: data, agentId }), { status: res.status, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
