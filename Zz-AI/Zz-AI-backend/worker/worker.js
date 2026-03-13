/**
 * Zz Voice OS — Cloudflare Worker
 * Desktop planner is now browser-aware:
 *   1. Receives screenshot of current browser viewport
 *   2. Receives compact DOM state (interactive elements with x,y coords)
 *   3. LLM produces a Playwright-executable action plan
 *   4. Actions include navigate, click, fill, type, press_key, scroll, wait_for, evaluate, etc.
 */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
};
const j = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { 'Content-Type': 'application/json', ...CORS } });
const e = (m, s = 400) => j({ error: m }, s);

// ─── SUPABASE ─────────────────────────────────────────────────────────────────
function sb(env) {
  const base = env.SUPABASE_URL + '/rest/v1';
  const h = { 'Content-Type': 'application/json', apikey: env.SUPABASE_SERVICE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`, Prefer: 'return=representation' };
  const req = async (method, table, qs = '', body) => {
    const res = await fetch(`${base}/${table}${qs ? '?' + qs : ''}`, { method, headers: h, body: body !== undefined ? JSON.stringify(body) : undefined });
    const text = await res.text();
    if (!res.ok) throw new Error(`SB ${method} ${table}: ${text}`);
    return text ? JSON.parse(text) : null;
  };
  return {
    select: (t, qs) => req('GET', t, qs),
    insert: (t, d) => req('POST', t, '', d),
    update: (t, qs, d) => req('PATCH', t, qs, d),
    delete: (t, qs) => req('DELETE', t, qs),
  };
}

// ─── JWT ──────────────────────────────────────────────────────────────────────
const b64u = s => btoa(s).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
const b64d = s => { const p = s + '=='.slice(0,(4-s.length%4)%4); return Uint8Array.from(atob(p.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0)); };
async function signJWT(payload, secret) {
  const h = b64u(JSON.stringify({alg:'HS256',typ:'JWT'})), b = b64u(JSON.stringify(payload));
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), {name:'HMAC',hash:'SHA-256'}, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${h}.${b}`));
  return `${h}.${b}.${b64u(String.fromCharCode(...new Uint8Array(sig)))}`;
}
async function verifyJWT(token, secret) {
  const [h,b,sig] = token.split('.');
  if (!sig) throw new Error('Bad JWT');
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), {name:'HMAC',hash:'SHA-256'}, false, ['verify']);
  if (!await crypto.subtle.verify('HMAC', key, b64d(sig), new TextEncoder().encode(`${h}.${b}`))) throw new Error('Invalid sig');
  const p = JSON.parse(new TextDecoder().decode(b64d(b)));
  if (p.exp && Date.now()/1000 > p.exp) throw new Error('Expired');
  return p;
}
async function auth(req, env) {
  const hdr = req.headers.get('Authorization') || '';
  if (!hdr.startsWith('Bearer ')) return { err: e('No auth', 401) };
  if (hdr.slice(7) === 'local-session-token') return { userId: 'local' };
  try { const p = await verifyJWT(hdr.slice(7), env.JWT_SECRET||'change-me'); return { userId: p.sub }; }
  catch(ex) { return { err: e('Bad token: '+ex.message, 401) }; }
}

// ─── CACHES ───────────────────────────────────────────────────────────────────
const sosMap = new Map(), chatCache = new Map();
const sosReg = uid => { sosMap.set(uid, Date.now()); setTimeout(()=>sosMap.delete(uid), 10000); };
const sosIs = uid => { const t=sosMap.get(uid); return t&&Date.now()-t<10000; };
const sosDel = uid => sosMap.delete(uid);
const cGet = k => { const v=chatCache.get(k); if(!v)return null; if(Date.now()-v.t>86400000){chatCache.delete(k);return null;} return v.v; };
const cSet = (k,v) => chatCache.set(k,{v,t:Date.now()});

// ─── LOCAL INTENTS ────────────────────────────────────────────────────────────
const INTENTS = [
  {name:'time', re:/what'?s?\s*the\s*time/i, fn:()=>new Date().toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',second:'2-digit'})},
  {name:'date', re:/what'?s?\s*(the\s*)?(date|day)/i, fn:()=>new Date().toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'})},
  {name:'greet', re:/^(hi|hello|hey|howdy)/i, fn:()=>'Hello! How can I help you today?'},
];
function localIntent(q) { for(const{name,re,fn}of INTENTS){const m=q.match(re);if(m)return{intent:name,response:fn(m)};} return null; }

// ─── GROQ ─────────────────────────────────────────────────────────────────────
async function groqChat(query, apiKey) {
  const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+apiKey},
    body: JSON.stringify({ model:'llama-3.3-70b-versatile', messages:[{role:'system',content:'You are Zz, a concise voice assistant. Reply in 1-3 plain sentences.'},{role:'user',content:query}], max_tokens:256, temperature:0.7 })
  });
  if (!r.ok) throw new Error('Groq '+r.status);
  const d = await r.json();
  return d.choices?.[0]?.message?.content?.trim() || '';
}

// ─── BROWSER ACTION SCHEMA ────────────────────────────────────────────────────
// This is what the LLM must produce. Every action maps 1:1 to browser-agent.js.
const SCHEMA_DOC = `
BROWSER ACTION SCHEMA
=====================
Every step MUST be one of these types. Use EXACTLY these field names.

NAVIGATION
  { "type": "navigate", "url": "https://full-url.com", "note": "why" }
  { "type": "go_back", "note": "why" }
  { "type": "go_forward", "note": "why" }
  { "type": "new_tab", "url": "https://...", "note": "why" }

INTERACTION
  { "type": "click", "target": "descriptive label of element OR CSS selector", "note": "what you're clicking" }
  { "type": "fill", "target": "input label/placeholder/id/CSS", "value": "text to enter", "note": "what field" }
  { "type": "type", "value": "text to type at cursor", "note": "what you're typing" }
  { "type": "press_key", "key": "Enter|Escape|Tab|ctrl+a|ctrl+c|ctrl+v|ctrl+enter|ctrl+z|shift+enter|cmd+t|cmd+w|ArrowDown|ArrowUp", "note": "why" }
  { "type": "select_option", "target": "select element label/id", "value": "option value", "note": "why" }
  { "type": "hover", "target": "element label/CSS", "note": "what to hover" }
  { "type": "scroll", "direction": "down|up|left|right", "amount": 3, "note": "why" }

WAITING
  { "type": "wait", "ms": 1500, "note": "what you're waiting for" }
  { "type": "wait_for", "selector": "button text or CSS selector", "timeout": 8000, "note": "what to wait for" }
  { "type": "wait_navigation", "timeout": 8000, "note": "waiting for page load" }

READING / INSPECTION
  { "type": "extract_text", "selector": "element to read (optional, blank=whole page)", "note": "what to extract" }
  { "type": "evaluate", "script": "() => document.title", "note": "JS expression to evaluate" }

RULES:
1. For 'click' and 'fill', set 'target' to the visible text label, aria-label, placeholder, id, or CSS selector.
   Use what is visible in the DOM state and screenshot. Be specific.
2. Always navigate FIRST if the browser is not already on the right page.
3. After filling a form field, use press_key Enter OR click the submit button — not both.
4. Use wait steps after navigation and after clicking elements that trigger loading.
5. If the task requires reading data from the page, use extract_text.
6. Max 15 steps. Keep it efficient.
7. Do NOT invent elements that aren't on the page.
`;

const PLANNER_SYSTEM = `You are a precise browser automation agent for Zz Voice OS.
Your job: given a user command + the current browser page state (DOM + screenshot), produce an exact step-by-step plan to accomplish the task using the Playwright-based browser controller.

${SCHEMA_DOC}

Return ONLY valid JSON with this structure:
{
  "shouldAutomate": true/false,
  "summary": "one sentence describing what the plan will do",
  "intent": "NAVIGATE|SEARCH|COMPOSE|FILL_FORM|READ|INTERACT|LOGIN|DOWNLOAD|OTHER",
  "steps": [ ...action objects ]
}

Set shouldAutomate=false ONLY if the command needs no browser action (pure Q&A).`;

// ─── PLANNER ──────────────────────────────────────────────────────────────────
// NOTE: No screenshot is sent here — base64 images blow past Cloudflare's
// request size limits and the vision model is too slow. We use DOM state (text)
// only with the fast llama-3.3-70b model. Screenshots are taken locally in
// Electron after each step for the live preview but never sent to the worker.
async function planBrowserAutomation(command, apiKey, pageState) {
  const stateText = pageState && !pageState.error
    ? `CURRENT BROWSER STATE:
URL: ${pageState.url || 'none'}
Title: ${pageState.title || 'none'}

INTERACTIVE ELEMENTS visible on page (use these exact labels/text as click/fill targets):
${(pageState.interactive || []).slice(0, 50).map(el =>
  `  [${el.tag}] text="${el.text || ''}" label="${el.label || ''}" id="${el.id || ''}" name="${el.name || ''}" type="${el.type || ''}" href="${el.href || ''}"`
).join('\n')}`
    : 'CURRENT BROWSER STATE: Browser not open yet. Will navigate first.';

  const userMsg = `User command: "${command}"

${stateText}

Produce the automation plan now. Output ONLY the JSON object.`;

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 9000); // hard 9s timeout

  try {
    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      signal: ctrl.signal,
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + apiKey },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile', // fast text model only
        messages: [
          { role: 'system', content: PLANNER_SYSTEM },
          { role: 'user', content: userMsg },
        ],
        max_tokens: 900,
        temperature: 0.1,
        response_format: { type: 'json_object' },
      }),
    });
    clearTimeout(timer);
    if (!r.ok) throw new Error(`Groq ${r.status}: ${await r.text()}`);
    const d = await r.json();
    const raw = d.choices?.[0]?.message?.content;
    if (!raw) throw new Error('Empty response from Groq');
    return JSON.parse(raw);
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

// ─── SANITIZE PLAN ────────────────────────────────────────────────────────────
const ALLOWED = new Set(['navigate','click','fill','fill_input','type_text','type','press_key','keypress','scroll','wait','wait_for','wait_element','wait_navigation','evaluate','js','extract_text','select_option','hover','go_back','go_forward','new_tab','close_tab']);

function sanitize(raw) {
  const plan = {
    shouldAutomate: Boolean(raw?.shouldAutomate),
    summary: String(raw?.summary || 'Automation ready.').slice(0, 300),
    intent: String(raw?.intent || 'NAVIGATE').toUpperCase(),
    steps: [],
  };

  if (!Array.isArray(raw?.steps)) return plan;

  plan.steps = raw.steps.slice(0, 15).filter(s => s && ALLOWED.has(String(s.type||'').toLowerCase())).map(s => {
    const t = String(s.type).toLowerCase();
    const base = { type: t, note: String(s.note || '').slice(0, 120) };

    if (t === 'navigate' || t === 'new_tab') {
      let url = String(s.url || s.value || '').trim();
      if (!url) return null;
      if (!url.startsWith('http')) url = 'https://' + url;
      return { ...base, url };
    }
    if (t === 'click' || t === 'hover') {
      const target = String(s.target || s.selector || s.value || s.description || '').trim();
      if (!target) return null;
      return { ...base, target };
    }
    if (t === 'fill' || t === 'fill_input' || t === 'type_text') {
      return { ...base, type: 'fill', target: String(s.target || s.selector || '').trim(), value: String(s.value || s.text || '').trim() };
    }
    if (t === 'type') {
      return { ...base, value: String(s.value || s.text || '').trim() };
    }
    if (t === 'press_key' || t === 'keypress') {
      return { ...base, type: 'press_key', key: String(s.key || s.value || 'Enter').trim() };
    }
    if (t === 'scroll') {
      const dir = ['up','down','left','right'].includes(String(s.direction)) ? String(s.direction) : 'down';
      return { ...base, direction: dir, amount: Math.max(1,Math.min(10,Number(s.amount)||3)) };
    }
    if (t === 'wait') {
      return { ...base, ms: Math.max(100, Math.min(15000, Number(s.ms) || 1000)) };
    }
    if (t === 'wait_for' || t === 'wait_element') {
      return { ...base, type: 'wait_for', selector: String(s.selector || s.value || '').trim(), timeout: Number(s.timeout) || 8000 };
    }
    if (t === 'wait_navigation') {
      return { ...base, timeout: Number(s.timeout) || 8000 };
    }
    if (t === 'evaluate' || t === 'js') {
      const script = String(s.script || s.value || '');
      const blocked = /\b(fetch\(|XMLHttpRequest|eval\(|Function\(|require\(|process\.|child_process)\b/;
      if (blocked.test(script)) return null;
      return { ...base, type: 'evaluate', script };
    }
    if (t === 'extract_text') {
      return { ...base, selector: String(s.selector || s.value || '') };
    }
    if (t === 'select_option') {
      return { ...base, target: String(s.target || s.selector || '').trim(), value: String(s.value || '').trim() };
    }
    if (['go_back','go_forward','close_tab'].includes(t)) return base;
    return null;
  }).filter(Boolean);

  if (!plan.steps.length) plan.shouldAutomate = false;
  return plan;
}

// ─── LOCAL FALLBACK PLAN (instant, no LLM) ───────────────────────────────────
// Used when Groq is unavailable. Covers the most common patterns.
function localFallbackPlan(command) {
  const q = command.toLowerCase();
  const steps = [];

  // URL patterns
  const urlMatch = q.match(/(?:go to|open|visit|navigate to)\s+(https?:\/\/\S+)/);
  if (urlMatch) {
    steps.push({ type: 'navigate', url: urlMatch[1], note: 'Open URL directly' });
    return sanitize({ shouldAutomate: true, summary: 'Opening ' + urlMatch[1], intent: 'NAVIGATE', steps });
  }

  // Known sites
  const siteMap = {
    gmail: { url: 'https://mail.google.com', name: 'Gmail' },
    'google mail': { url: 'https://mail.google.com', name: 'Gmail' },
    youtube: { url: 'https://youtube.com', name: 'YouTube' },
    github: { url: 'https://github.com', name: 'GitHub' },
    google: { url: 'https://google.com', name: 'Google' },
    chatgpt: { url: 'https://chatgpt.com', name: 'ChatGPT' },
    claude: { url: 'https://claude.ai', name: 'Claude' },
    figma: { url: 'https://figma.com', name: 'Figma' },
    notion: { url: 'https://notion.so', name: 'Notion' },
    calendar: { url: 'https://calendar.google.com', name: 'Google Calendar' },
    'google calendar': { url: 'https://calendar.google.com', name: 'Google Calendar' },
    drive: { url: 'https://drive.google.com', name: 'Google Drive' },
    'google drive': { url: 'https://drive.google.com', name: 'Google Drive' },
    docs: { url: 'https://docs.google.com', name: 'Google Docs' },
    sheets: { url: 'https://sheets.google.com', name: 'Google Sheets' },
    twitter: { url: 'https://twitter.com', name: 'Twitter/X' },
    linkedin: { url: 'https://linkedin.com', name: 'LinkedIn' },
    reddit: { url: 'https://reddit.com', name: 'Reddit' },
    vercel: { url: 'https://vercel.com', name: 'Vercel' },
    supabase: { url: 'https://supabase.com', name: 'Supabase' },
    stackoverflow: { url: 'https://stackoverflow.com', name: 'Stack Overflow' },
    'stack overflow': { url: 'https://stackoverflow.com', name: 'Stack Overflow' },
  };

  for (const [key, val] of Object.entries(siteMap)) {
    if (q.includes(key)) {
      steps.push({ type: 'navigate', url: val.url, note: 'Open ' + val.name });
      steps.push({ type: 'wait', ms: 1500, note: 'Wait for page load' });
      break;
    }
  }

  // Search
  const searchMatch = q.match(/(?:search|google|look up|find)\s+(?:for\s+)?(.+)/);
  if (searchMatch && !steps.length) {
    const query = searchMatch[1].trim();
    steps.push({ type: 'navigate', url: 'https://www.google.com/search?q=' + encodeURIComponent(query), note: 'Search: ' + query });
  }

  if (!steps.length) {
    // Generic: search for the whole command
    steps.push({ type: 'navigate', url: 'https://www.google.com/search?q=' + encodeURIComponent(command), note: 'Search: ' + command });
  }

  return sanitize({
    shouldAutomate: true,
    summary: steps[0]?.note || 'Executing automation',
    intent: 'NAVIGATE',
    steps,
  });
}

// ─── HANDLERS ─────────────────────────────────────────────────────────────────
async function hRegister(req, env) {
  const body = await req.json().catch(() => ({}));
  const name = (body.name || 'User').trim().slice(0, 60) || 'User';
  const uid = crypto.randomUUID();
  try {
    const rows = await sb(env).insert('users', { firebase_uid: uid, name });
    const user = Array.isArray(rows) ? rows[0] : rows;
    const token = await signJWT({ sub: user.id, name, iat: Math.floor(Date.now()/1000), exp: Math.floor(Date.now()/1000)+365*86400 }, env.JWT_SECRET||'change-me');
    return j({ token, userId: user.id, name: user.name });
  } catch (ex) { return e('Could not create user: ' + ex.message, 500); }
}

async function hDesktopCommand(req, env, userId) {
  const body = await req.json().catch(() => ({}));
  const command = String(body.command || '').trim();
  if (!command) return e('command required');

  // pageState = DOM snapshot from Playwright (text only, no image)
  // screenshot is intentionally NOT forwarded to the LLM — too large for CF workers
  const pageState = body.pageState || null;

  let plan;
  try {
    const raw = await planBrowserAutomation(command, env.GROQ_API_KEY, pageState);
    plan = sanitize(raw);
  } catch (ex) {
    // Instant fallback — build a minimal plan from the command text
    plan = localFallbackPlan(command);
    plan.plannerError = ex.message;
  }

  if (userId !== 'local') {
    await sb(env).insert('voice_sessions', { user_id: userId, command_type: 'DESKTOP', command_text: command, outcome: plan.shouldAutomate ? 'success' : 'failure', duration_ms: 0 }).catch(() => {});
  }

  return j(plan);
}

async function hChat(req, env, userId) {
  const body = await req.json().catch(() => ({}));
  if (!body.query?.trim()) return e('Query empty');
  const query = body.query.trim();
  const local = localIntent(query);
  if (local) { if(userId!=='local') await sb(env).insert('chat_logs',{user_id:userId,query,response:local.response,intent:local.intent,is_llm:false,token_cost:0,cached:false}).catch(()=>{}); return j({response:local.response,intent:local.intent,cached:false,llm:false}); }
  const cached = cGet(query);
  if (cached) { if(userId!=='local') await sb(env).insert('chat_logs',{user_id:userId,query,response:cached,intent:null,is_llm:false,token_cost:0,cached:true}).catch(()=>{}); return j({response:cached,cached:true,llm:false}); }
  try {
    const answer = await groqChat(query, env.GROQ_API_KEY);
    cSet(query, answer);
    if(userId!=='local') await sb(env).insert('chat_logs',{user_id:userId,query,response:answer,intent:null,is_llm:true,token_cost:1,cached:false}).catch(()=>{});
    return j({response:answer,cached:false,llm:true});
  } catch { return j({response:"Sorry, I couldn't connect to AI right now.",cached:false,llm:false}); }
}

async function hMessage(req, env, userId) {
  const body = await req.json().catch(() => ({}));
  if (!body.contact?.trim()) return e('Contact required');
  if (!body.message?.trim()) return e('Message required');
  if (userId !== 'local') await sb(env).insert('voice_sessions', { user_id: userId, command_type: 'MESSAGE', command_text: `Message ${body.contact}: ${body.message}`, outcome: 'success', duration_ms: 800 }).catch(() => {});
  return j({ message: `Message sent to ${body.contact}.`, success: true });
}

async function hSOS(req, env, userId) {
  const body = await req.json().catch(() => ({}));
  const lat = Number(body.latitude ?? 0), lon = Number(body.longitude ?? 0);
  if (userId !== 'local') await sb(env).insert('voice_sessions', { user_id: userId, command_type: 'SOS', command_text: `SOS at ${lat},${lon}`, outcome: 'success', duration_ms: 200 }).catch(() => {});
  sosReg(userId);
  if (env.SOS_NOTIFICATION_URL) fetch(env.SOS_NOTIFICATION_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, location: { lat, lon }, ts: new Date().toISOString() }) }).catch(() => {});
  return j({ message: 'SOS alert sent.', success: true });
}

async function hSOSCancel(req, env, userId) {
  if (!sosIs(userId)) return j({ message: 'No pending SOS.', success: false });
  if (userId !== 'local') await sb(env).insert('voice_sessions', { user_id: userId, command_type: 'SOS', command_text: 'SOS cancelled', outcome: 'failure', duration_ms: 100 }).catch(() => {});
  sosDel(userId); return j({ message: 'SOS cancelled.', success: true });
}

async function hHistory(req, env, userId) {
  if (userId === 'local') return j([]);
  const rows = await sb(env).select('voice_sessions', `user_id=eq.${userId}&order=created_at.desc&limit=20`).catch(() => []);
  return j(rows || []);
}

async function hHistoryDelete(req, env, userId, id) {
  if (userId === 'local') return new Response(null, { status: 204, headers: CORS });
  await sb(env).delete('voice_sessions', `id=eq.${id}&user_id=eq.${userId}`).catch(() => {});
  return new Response(null, { status: 204, headers: CORS });
}

async function hGetSettings(req, env, userId) {
  if (userId === 'local') return j({ voice_speed: 1.0, language: 'en-US', wake_word_sensitivity: 1.0 });
  const rows = await sb(env).select('preferences', `user_id=eq.${userId}`).catch(() => []);
  if (rows?.length) return j(rows[0]);
  const created = await sb(env).insert('preferences', { user_id: userId, voice_speed: 1.0, language: 'en-US', wake_word_sensitivity: 1.0 }).catch(() => []);
  return j(Array.isArray(created) ? created[0] : created);
}

async function hUpdateSettings(req, env, userId) {
  const body = await req.json().catch(() => ({}));
  const allowed = ['voice_speed', 'language', 'wake_word_sensitivity'];
  const data = {};
  for (const k of allowed) if (body[k] !== undefined) data[k] = body[k];
  if (!Object.keys(data).length) return e('No valid fields');
  if (userId === 'local') return j(data);
  const rows = await sb(env).select('preferences', `user_id=eq.${userId}`).catch(() => []);
  let result;
  if (rows?.length) result = await sb(env).update('preferences', `user_id=eq.${userId}`, data);
  else result = await sb(env).insert('preferences', { user_id: userId, voice_speed: 1.0, language: 'en-US', wake_word_sensitivity: 1.0, ...data });
  return j(Array.isArray(result) ? result[0] : result);
}

async function hGetContacts(req, env, userId) {
  if (userId === 'local') return j([]);
  return j((await sb(env).select('emergency_contacts', `user_id=eq.${userId}&order=created_at.desc`).catch(() => [])) || []);
}

async function hAddContact(req, env, userId) {
  const body = await req.json().catch(() => ({}));
  if (!body.name?.trim()) return e('Name required');
  if (!body.phone_number?.trim()) return e('Phone required');
  if (!/^\+?[0-9]{7,15}$/.test(body.phone_number.trim())) return e('Invalid phone. Use E.164');
  if (userId === 'local') return j({ id: crypto.randomUUID(), name: body.name, phone_number: body.phone_number }, 201);
  const rows = await sb(env).insert('emergency_contacts', { user_id: userId, name: body.name.trim(), phone_number: body.phone_number.trim() });
  return j(Array.isArray(rows) ? rows[0] : rows, 201);
}

async function hDeleteContact(req, env, userId, id) {
  if (userId === 'local') return new Response(null, { status: 204, headers: CORS });
  await sb(env).delete('emergency_contacts', `id=eq.${id}&user_id=eq.${userId}`).catch(() => {});
  return new Response(null, { status: 204, headers: CORS });
}

// ─── ROUTER ───────────────────────────────────────────────────────────────────
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const p = url.pathname, m = request.method;

    if (m === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
    if (p === '/health' && m === 'GET') return j({ status: 'ok', ts: new Date().toISOString() });
    if (p === '/api/v1/auth/register' && m === 'POST') return hRegister(request, env);

    const { userId, err: authErr } = await auth(request, env);
    if (authErr) return authErr;

    try {
      if (p === '/api/v1/desktop/command' && m === 'POST') return hDesktopCommand(request, env, userId);
      if (p === '/api/v1/chat'            && m === 'POST') return hChat(request, env, userId);
      if (p === '/api/v1/message'         && m === 'POST') return hMessage(request, env, userId);
      if (p === '/api/v1/sos'             && m === 'POST') return hSOS(request, env, userId);
      if (p === '/api/v1/sos/cancel'      && m === 'POST') return hSOSCancel(request, env, userId);
      if (p === '/api/v1/history'         && m === 'GET')  return hHistory(request, env, userId);
      if (p === '/api/v1/settings'        && m === 'GET')  return hGetSettings(request, env, userId);
      if (p === '/api/v1/settings'        && m === 'POST') return hUpdateSettings(request, env, userId);
      if (p === '/api/v1/settings/emergency-contacts' && m === 'GET')  return hGetContacts(request, env, userId);
      if (p === '/api/v1/settings/emergency-contacts' && m === 'POST') return hAddContact(request, env, userId);

      let mt;
      mt = p.match(/^\/api\/v1\/history\/([^/]+)$/);
      if (mt && m === 'DELETE') return hHistoryDelete(request, env, userId, mt[1]);
      mt = p.match(/^\/api\/v1\/settings\/emergency-contacts\/([^/]+)$/);
      if (mt && m === 'DELETE') return hDeleteContact(request, env, userId, mt[1]);

      return e('Not found', 404);
    } catch (ex) {
      console.error(ex);
      return e('Internal error: ' + ex.message, 500);
    }
  },
};