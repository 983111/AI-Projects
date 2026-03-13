'use strict';
// Load .env if present (dev mode)
try { require('dotenv').config(); } catch {}
const { app, BrowserWindow, ipcMain, shell, clipboard, screen, desktopCapturer } = require('electron');
const path = require('path');
const os = require('os');
const { exec } = require('child_process');

let mainWindow;
let agent = null;
let automationAbort = false;

function getAgent() {
  if (!agent) agent = require('./browser-agent');
  return agent;
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280, height: 820, minWidth: 960, minHeight: 640,
    frame: false, backgroundColor: '#f0ede8',
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false },
    show: false,
  });
  mainWindow.loadFile('index.html');
  mainWindow.once('ready-to-show', () => mainWindow.show());
  mainWindow.on('maximize', () => mainWindow.webContents.send('window-state', 'maximized'));
  mainWindow.on('unmaximize', () => mainWindow.webContents.send('window-state', 'normal'));
}

// ── Window controls ──
ipcMain.on('win-minimize', () => mainWindow?.minimize());
ipcMain.on('win-maximize', () => mainWindow?.isMaximized() ? mainWindow.unmaximize() : mainWindow.maximize());
ipcMain.on('win-close', () => { getAgent().closeBrowser().catch(() => {}); mainWindow?.close(); });
ipcMain.on('open-url', (_, url) => shell.openExternal(url));
ipcMain.on('abort-automation', () => { automationAbort = true; });

// ── Plan a command by calling Groq directly from Node (no worker hop) ──
ipcMain.handle('plan-command', async (_, { command, pageState }) => {
  const GROQ_KEY = process.env.GROQ_API_KEY || '';
  if (!GROQ_KEY) return localFallbackPlan(command);

  const stateText = pageState && !pageState.error
    ? `CURRENT BROWSER STATE:\nURL: ${pageState.url || 'none'}\nTitle: ${pageState.title || ''}\n\nINTERACTIVE ELEMENTS:\n${(pageState.interactive || []).slice(0, 40).map(el =>
        `  [${el.tag}] text="${el.text}" label="${el.label}" id="${el.id}" name="${el.name}" type="${el.type}"`
      ).join('\n')}`
    : 'Browser not open yet.';

  const systemPrompt = `You are a browser automation planner. Given a user command and the current browser page state, output a JSON plan.

ACTIONS AVAILABLE:
navigate: { type, url, note }
click: { type, target, note }          -- target = visible text, aria-label, id, or placeholder
fill: { type, target, value, note }    -- target = input label/placeholder/id
type: { type, value, note }            -- types at current cursor
press_key: { type, key, note }         -- e.g. "Enter", "ctrl+a", "Escape"
scroll: { type, direction, amount, note }
wait: { type, ms, note }
wait_for: { type, selector, timeout, note }
extract_text: { type, selector, note }
go_back: { type, note }
new_tab: { type, url, note }

OUTPUT FORMAT (JSON only, no markdown):
{
  "shouldAutomate": true,
  "summary": "one sentence",
  "intent": "NAVIGATE|SEARCH|COMPOSE|FORM|READ|INTERACT",
  "steps": [ ... ]
}

RULES:
- Always navigate first if the right page isn't open
- Use exact visible text for click targets
- After fill, press Enter OR click submit button
- Max 12 steps, be efficient`;

  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 12000);
    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      signal: ctrl.signal,
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + GROQ_KEY },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Command: "${command}"\n\n${stateText}\n\nOutput only the JSON object.` }
        ],
        max_tokens: 800,
        temperature: 0.1,
        response_format: { type: 'json_object' },
      }),
    });
    clearTimeout(timer);
    if (!r.ok) throw new Error('Groq ' + r.status);
    const d = await r.json();
    const raw = JSON.parse(d.choices?.[0]?.message?.content || '{}');
    return sanitizePlan(raw);
  } catch (err) {
    console.error('plan-command Groq error:', err.message);
    return localFallbackPlan(command);
  }
});

function localFallbackPlan(command) {
  const q = command.toLowerCase();
  const steps = [];
  const sites = {
    gmail: 'https://mail.google.com', youtube: 'https://youtube.com',
    github: 'https://github.com', chatgpt: 'https://chatgpt.com',
    claude: 'https://claude.ai', figma: 'https://figma.com',
    notion: 'https://notion.so', calendar: 'https://calendar.google.com',
    drive: 'https://drive.google.com', docs: 'https://docs.google.com',
    twitter: 'https://twitter.com', linkedin: 'https://linkedin.com',
    reddit: 'https://reddit.com', google: 'https://google.com',
    vercel: 'https://vercel.com', supabase: 'https://supabase.com',
  };
  for (const [k, url] of Object.entries(sites)) {
    if (q.includes(k)) { steps.push({ type: 'navigate', url, note: 'Open ' + k }); break; }
  }
  const urlM = q.match(/(?:go to|open|visit)\s+(https?:\/\/\S+)/);
  if (urlM && !steps.length) steps.push({ type: 'navigate', url: urlM[1], note: 'Navigate' });
  if (!steps.length) {
    const searchM = q.match(/(?:search|find|look up)\s+(?:for\s+)?(.+)/);
    const q2 = searchM ? searchM[1] : command;
    steps.push({ type: 'navigate', url: 'https://www.google.com/search?q=' + encodeURIComponent(q2), note: 'Search: ' + q2 });
  }
  return sanitizePlan({ shouldAutomate: true, summary: steps[0]?.note || command, intent: 'NAVIGATE', steps });
}

function sanitizePlan(raw) {
  const ALLOWED = new Set(['navigate','click','fill','type','press_key','scroll','wait','wait_for','extract_text','go_back','new_tab','close_tab','hover','select_option','evaluate']);
  const steps = (Array.isArray(raw?.steps) ? raw.steps : []).slice(0, 12).map(s => {
    const t = String(s?.type || '').toLowerCase();
    if (!ALLOWED.has(t)) return null;
    const base = { type: t, note: String(s.note || '').slice(0, 100) };
    if (t === 'navigate' || t === 'new_tab') {
      let url = String(s.url || s.value || '').trim();
      if (!url) return null;
      if (!url.startsWith('http')) url = 'https://' + url;
      return { ...base, url };
    }
    if (t === 'click' || t === 'hover') return { ...base, target: String(s.target || s.selector || s.value || s.text || '').trim() || null };
    if (t === 'fill') return { ...base, target: String(s.target || s.selector || '').trim(), value: String(s.value || s.text || '') };
    if (t === 'type') return { ...base, value: String(s.value || s.text || '') };
    if (t === 'press_key') return { ...base, key: String(s.key || s.value || 'Enter') };
    if (t === 'scroll') return { ...base, direction: ['up','down','left','right'].includes(s.direction) ? s.direction : 'down', amount: Math.max(1, Math.min(10, Number(s.amount) || 3)) };
    if (t === 'wait') return { ...base, ms: Math.max(200, Math.min(10000, Number(s.ms) || 1000)) };
    if (t === 'wait_for') return { ...base, selector: String(s.selector || s.value || ''), timeout: Number(s.timeout) || 6000 };
    if (t === 'extract_text') return { ...base, selector: String(s.selector || '') };
    if (t === 'evaluate') return { ...base, script: String(s.script || s.value || '') };
    return base;
  }).filter(s => s && (s.target !== null));

  return {
    shouldAutomate: steps.length > 0,
    summary: String(raw?.summary || 'Automation ready').slice(0, 200),
    intent: String(raw?.intent || 'NAVIGATE').toUpperCase(),
    steps,
  };
}

// ── Browser control ──
ipcMain.handle('browser-status', () => ({ status: getAgent().getStatus(), ready: getAgent().isReady() }));
ipcMain.handle('browser-launch', async () => {
  try { await getAgent().ensureBrowser(); return { ok: true }; }
  catch (e) { return { ok: false, error: e.message }; }
});
ipcMain.handle('browser-close', async () => { await getAgent().closeBrowser().catch(() => {}); return { ok: true }; });

// ── Screenshot: browser viewport preferred, desktop fallback ──
ipcMain.handle('capture-screen', async () => {
  const a = getAgent();
  if (a.isReady()) {
    const ss = await a.screenshot();
    if (ss) return { ...ss, source: 'browser' };
  }
  try {
    const { width, height } = screen.getPrimaryDisplay().size;
    const sources = await desktopCapturer.getSources({ types: ['screen'], thumbnailSize: { width: 1280, height: Math.round(1280 * height / width) } });
    if (!sources.length) return { error: 'No source' };
    const img = sources[0].thumbnail;
    const jpeg = img.toJPEG(72);
    return { base64: jpeg.toString('base64'), mimeType: 'image/jpeg', source: 'desktop', width: img.getSize().width, height: img.getSize().height };
  } catch (e) { return { error: e.message }; }
});

// ── Page state (DOM for LLM) ──
ipcMain.handle('get-page-state', async () => {
  const a = getAgent();
  return a.isReady() ? await a.getPageState() : { error: 'Browser not running' };
});

// ── Single browser action ──
ipcMain.handle('browser-action', async (_, action) => getAgent().executeAction(action));

// ── OS-level actions (clipboard, window, native app) ──
ipcMain.handle('os-action', async (_, action) => {
  const t = String(action.type || '').toLowerCase();
  const v = String(action.value || '').trim();
  try {
    if (t === 'copy_text') { clipboard.writeText(v); return { ok: true, message: 'Copied' }; }
    if (t === 'read_clipboard') return { ok: true, data: clipboard.readText() };
    if (t === 'open_app') { await openApp(v); return { ok: true, message: `Launched ${v}` }; }
    if (t === 'window') {
      if (v === 'minimize') mainWindow?.minimize();
      else if (v === 'maximize') mainWindow?.maximize();
      else if (v === 'hide') mainWindow?.hide();
      else if (v === 'show') { mainWindow?.show(); mainWindow?.focus(); }
      else if (v === 'focus') mainWindow?.focus();
      return { ok: true };
    }
    if (t === 'wait') { await sleep(Math.max(100, Math.min(15000, Number(action.ms) || 1000))); return { ok: true }; }
    return { ok: false, error: `Unknown OS action: ${t}` };
  } catch (e) { return { ok: false, error: e.message }; }
});

// ── Main automation loop: plan → execute step → screenshot → stream to UI ──
ipcMain.handle('run-automation-plan', async (_, { steps }) => {
  automationAbort = false;
  const a = getAgent();
  const results = [];

  try { await a.ensureBrowser(); }
  catch (e) { return [{ step: 0, ok: false, error: 'Browser launch failed: ' + e.message }]; }

  for (let i = 0; i < steps.length; i++) {
    if (automationAbort) { results.push({ step: i, ok: false, error: 'Stopped' }); break; }

    const step = steps[i];
    mainWindow?.webContents.send('automation-step', { step: i, total: steps.length, type: step.type, note: step.note || '' });

    // All steps go through the browser agent — it handles navigate, click, fill, wait, etc.
    let result = await a.executeAction(step);

    // Capture browser screenshot after key actions
    let ss = null;
    const skipSS = ['wait','press_key','type','scroll'].includes(step.type);
    if (!skipSS) {
      await sleep(800);
      ss = await a.screenshot().catch(() => null);
    }

    const row = { step: i, type: step.type, note: step.note || '', ok: result.ok, message: result.message || '', error: result.error || '', data: result.data || null, screenshot: ss };
    results.push(row);

    // Stream result to renderer immediately
    mainWindow?.webContents.send('automation-step-result', { step: i, ok: result.ok, message: result.message || result.error || '', data: result.data || null, screenshot: ss });

    if (!result.ok) {
      mainWindow?.webContents.send('automation-done', { ok: false, results });
      return results;
    }
  }

  mainWindow?.webContents.send('automation-done', { ok: true, results });
  return results;
});

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function openApp(name) {
  const schemes = { slack: 'slack://', discord: 'discord://', notion: 'notion://', spotify: 'spotify://', vscode: 'vscode://', telegram: 'tg://', zoom: 'zoommtg://' };
  const key = name.toLowerCase().replace(/\s+/g, '');
  if (schemes[key]) return shell.openExternal(schemes[key]);
  const p = os.platform();
  if (p === 'darwin') await runShell(`open -a "${name}"`);
  else if (p === 'linux') await runShell(name.toLowerCase() + ' &');
  else await runShell(`start ${name}`);
}

function runShell(cmd) {
  return new Promise((res, rej) => exec(cmd, { timeout: 8000 }, (e, o) => e ? rej(e) : res(o)));
}

app.whenReady().then(createWindow);
app.on('window-all-closed', async () => { await getAgent().closeBrowser().catch(() => {}); if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });