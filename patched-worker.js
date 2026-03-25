const CORS_HEADERS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const CF_MODEL = '@cf/meta/llama-3.1-8b-instruct';

const SYSTEM_PROMPTS = {
  note: `You are a knowledge assistant. Convert the user's request into a well-structured Markdown note.
Return ONLY valid JSON, no markdown fences, no explanation:
{ "title": "short title", "markdown": "full markdown content" }`,

  canvas: `You are a visual architect. Convert the user's request into Fabric.js canvas objects.
Return ONLY valid JSON, no markdown fences, no explanation:
{
  "title": "short title",
  "fabricObjects": [
    { "type": "rect",    "left": 100, "top": 80,  "width": 140, "height": 50, "fill": "transparent", "stroke": "#c8903a", "strokeWidth": 2, "rx": 6 },
    { "type": "textbox", "left": 110, "top": 95,  "width": 120, "text": "Label", "fontSize": 13, "fill": "#cec5b8" },
    { "type": "line",    "coords": [240, 105, 350, 105], "stroke": "#5a5248", "strokeWidth": 2 }
  ]
}
Rules: spread across 800x500px, pair every shape with a textbox label, use line with coords[] for connectors, max 20 objects.`,

  mermaid: `You are a diagram architect. Convert the user's request into a Mermaid.js diagram.
Return ONLY valid JSON, no markdown fences, no explanation:
{ "title": "short title", "mermaid": "graph TD\\n  A[Start] --> B[End]" }
Rules: valid Mermaid syntax only, escape newlines as \\n in the JSON string.`,
};

function makeResponse(data, status) {
  return new Response(JSON.stringify(data), {
    status: status || 200,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

async function callCfAI(prompt, mode, ai) {
  const messages = [
    { role: 'system', content: SYSTEM_PROMPTS[mode] },
    { role: 'user',   content: prompt },
  ];

  const result = await ai.run(CF_MODEL, {
    messages,
    temperature: 0.7,
    max_tokens:  2048,
  });

  const text = result && result.response;
  if (!text) throw new Error('Empty response from Cloudflare AI');

  // Strip any accidental markdown fences
  const clean = text.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();

  // Extract first JSON object from the response
  const jsonMatch = clean.match(/\{[\s\S]*\}/);
  
  if (!jsonMatch) {
    // FIX: If the AI returns a single word (like our folder categorization) it won't be JSON!
    // Safely assume it's just raw text instead of crashing the worker.
    return { markdown: clean.replace(/["']/g, '').trim(), title: "Smart Categorized" };
  }

  return JSON.parse(jsonMatch[0]);
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (request.method === 'GET') {
      const url = new URL(request.url);
      if (url.pathname === '/ping') {
        return makeResponse({ ok: true, model: CF_MODEL }, 200);
      }
    }

    if (request.method !== 'POST') {
      return makeResponse({ error: 'Method not allowed' }, 405);
    }

    const authHeader = request.headers.get('Authorization') || '';
    if (!authHeader.startsWith('Bearer ')) {
      return makeResponse({ error: 'Missing auth token' }, 401);
    }

    let prompt, mode;
    try {
      const body = await request.json();
      prompt = body.prompt;
      mode   = body.mode || 'note';
    } catch(e) {
      return makeResponse({ error: 'Invalid JSON body' }, 400);
    }

    if (!prompt) return makeResponse({ error: 'Missing prompt' }, 400);

    const safeMode = ['note', 'canvas', 'mermaid'].includes(mode) ? mode : 'note';

    if (!env.AI) {
      return makeResponse({ error: 'AI binding not configured' }, 500);
    }

    try {
      const result = await callCfAI(prompt, safeMode, env.AI);
      return makeResponse(result, 200);
    } catch(err) {
      // NOTE: We now return the actual error string so the browser can log it instead of just generic 'Unexpected Error'
      return makeResponse({ error: err.message || 'Unexpected error' }, 500);
    }
  }
};
