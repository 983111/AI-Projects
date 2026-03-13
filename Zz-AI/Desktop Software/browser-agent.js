'use strict';
/**
 * browser-agent.js
 * Manages a persistent Playwright Chromium browser.
 * The LLM plans sequences of browser actions; this executes them.
 *
 * Action types understood:
 *   navigate, click, fill, type, press_key, scroll, wait,
 *   wait_for, wait_navigation, evaluate, extract_text,
 *   select_option, hover, go_back, go_forward, new_tab,
 *   close_tab, screenshot, get_state
 */

let pw;
let browser = null;
let page = null;
let status = 'idle'; // idle | launching | ready | error

// ─── LAZY LOAD PLAYWRIGHT ─────────────────────────────────────────────────────
function getPW() {
  if (!pw) pw = require('playwright');
  return pw;
}

// ─── LIFECYCLE ────────────────────────────────────────────────────────────────
async function ensureBrowser() {
  if (browser && browser.isConnected() && page && !page.isClosed()) return;
  status = 'launching';

  const chromium = getPW().chromium;
  browser = await chromium.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--start-maximized'],
    defaultViewport: null,
  });

  const ctx = await browser.newContext({ viewport: null });
  page = await ctx.newPage();
  status = 'ready';

  browser.on('disconnected', () => { browser = null; page = null; status = 'idle'; });
}

async function closeBrowser() {
  if (browser) { await browser.close().catch(() => {}); browser = null; page = null; status = 'idle'; }
}

function getStatus() { return status; }
function isReady() { return status === 'ready' && !!browser?.isConnected() && !!page && !page.isClosed(); }

// ─── SCREENSHOT ───────────────────────────────────────────────────────────────
async function screenshot() {
  if (!page || page.isClosed()) return null;
  try {
    const buf = await page.screenshot({ type: 'jpeg', quality: 72 });
    return {
      base64: buf.toString('base64'),
      mimeType: 'image/jpeg',
      url: page.url(),
      title: await page.title().catch(() => ''),
    };
  } catch { return null; }
}

// ─── PAGE STATE — compact DOM snapshot for LLM ───────────────────────────────
async function getPageState() {
  if (!page || page.isClosed()) return { error: 'no page', url: '' };
  try {
    return await page.evaluate(() => {
      const interactive = [];
      const allEls = document.querySelectorAll(
        'a[href],button,input,textarea,select,[role="button"],[role="textbox"],[role="link"],[contenteditable="true"]'
      );
      for (const el of allEls) {
        const r = el.getBoundingClientRect();
        if (r.width < 2 || r.height < 2) continue;
        if (r.top < -200 || r.top > window.innerHeight + 200) continue;
        interactive.push({
          tag: el.tagName.toLowerCase(),
          text: (el.innerText || el.value || el.placeholder || '').trim().slice(0, 60),
          label: el.getAttribute('aria-label') || el.getAttribute('title') || el.getAttribute('placeholder') || '',
          id: el.id || '',
          name: el.name || '',
          type: el.type || '',
          href: el.href?.slice(0, 80) || '',
          x: Math.round(r.left + r.width / 2),
          y: Math.round(r.top + r.height / 2),
          w: Math.round(r.width),
          h: Math.round(r.height),
        });
      }
      return {
        url: location.href,
        title: document.title,
        interactive: interactive.slice(0, 80),
        scrollY: Math.round(window.scrollY),
        pageHeight: document.body.scrollHeight,
        viewportH: window.innerHeight,
        viewportW: window.innerWidth,
      };
    });
  } catch (err) {
    return { error: err.message, url: page.url() };
  }
}

// ─── SMART ELEMENT RESOLUTION ─────────────────────────────────────────────────
// Given a description string, find the best matching locator or coordinates
async function resolveEl(desc) {
  if (!desc) return null;
  // Already a CSS/Playwright selector
  if (desc.startsWith('#') || desc.startsWith('.') || desc.startsWith('[') || desc.includes('>>')) return { sel: desc };

  // Try Playwright built-in locators first (fast + reliable)
  const tries = [
    () => page.getByRole('button', { name: desc, exact: false }),
    () => page.getByRole('link', { name: desc, exact: false }),
    () => page.getByRole('textbox', { name: desc, exact: false }),
    () => page.getByPlaceholder(desc, { exact: false }),
    () => page.getByLabel(desc, { exact: false }),
    () => page.getByText(desc, { exact: false }),
  ];

  for (const fn of tries) {
    try {
      const loc = fn();
      if (await loc.first().isVisible({ timeout: 600 })) return { loc };
    } catch {}
  }

  // Fallback: JS coordinate search
  try {
    const coords = await page.evaluate((d) => {
      const dl = d.toLowerCase();
      const els = document.querySelectorAll('a,button,input,textarea,select,[role="button"],[contenteditable]');
      for (const el of els) {
        const label = [el.innerText, el.value, el.placeholder, el.getAttribute('aria-label'), el.getAttribute('title')].filter(Boolean).join(' ').toLowerCase();
        if (label.includes(dl)) {
          const r = el.getBoundingClientRect();
          if (r.width > 2 && r.height > 2) return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
        }
      }
      return null;
    }, desc);
    if (coords) return { coords };
  } catch {}
  return null;
}

async function doClick(resolved, opts = {}) {
  if (!resolved) throw new Error('Element not found');
  if (resolved.loc) await resolved.loc.first().click({ timeout: 6000, ...opts });
  else if (resolved.sel) await page.locator(resolved.sel).first().click({ timeout: 6000, ...opts });
  else if (resolved.coords) await page.mouse.click(resolved.coords.x, resolved.coords.y);
  else throw new Error('Cannot resolve element');
}

// ─── ACTIONS ──────────────────────────────────────────────────────────────────
async function navigate(url) {
  await ensureBrowser();
  const full = url.startsWith('http') ? url : 'https://' + url;
  await page.goto(full, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(600);
  return { ok: true, message: 'Navigated to ' + page.url() };
}

async function click(desc) {
  await ensureBrowser();
  const el = await resolveEl(String(desc || ''));
  if (!el) throw new Error(`Element not found: "${desc}"`);
  await doClick(el);
  await page.waitForTimeout(400);
  return { ok: true, message: `Clicked "${desc}"` };
}

async function fill(target, value) {
  await ensureBrowser();
  const el = await resolveEl(String(target || ''));
  if (!el) throw new Error(`Input not found: "${target}"`);
  if (el.loc) {
    await el.loc.first().click({ timeout: 5000 });
    await el.loc.first().fill(String(value), { timeout: 5000 });
  } else if (el.sel) {
    await page.locator(el.sel).first().click({ timeout: 5000 });
    await page.locator(el.sel).first().fill(String(value), { timeout: 5000 });
  } else if (el.coords) {
    await page.mouse.click(el.coords.x, el.coords.y);
    await page.keyboard.press('Control+a');
    await page.keyboard.type(String(value), { delay: 20 });
  }
  await page.waitForTimeout(300);
  return { ok: true, message: `Filled "${target}" with "${String(value).slice(0, 40)}"` };
}

async function type(text) {
  await ensureBrowser();
  await page.keyboard.type(String(text), { delay: 20 });
  await page.waitForTimeout(200);
  return { ok: true, message: `Typed "${String(text).slice(0, 40)}"` };
}

async function pressKey(combo) {
  await ensureBrowser();
  const map = { cmd: 'Meta', ctrl: 'Control', alt: 'Alt', shift: 'Shift', enter: 'Enter', return: 'Enter', escape: 'Escape', esc: 'Escape', tab: 'Tab', backspace: 'Backspace', delete: 'Delete', space: 'Space', up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight', home: 'Home', end: 'End', pageup: 'PageUp', pagedown: 'PageDown' };
  const normalized = combo.split('+').map(k => map[k.toLowerCase()] || (k.length === 1 ? k : k.charAt(0).toUpperCase() + k.slice(1))).join('+');
  await page.keyboard.press(normalized);
  await page.waitForTimeout(300);
  return { ok: true, message: `Pressed ${normalized}` };
}

async function scroll(direction, amount) {
  await ensureBrowser();
  const px = (Number(amount) || 3) * 150;
  await page.mouse.wheel(direction === 'left' ? -px : direction === 'right' ? px : 0, direction === 'up' ? -px : px);
  await page.waitForTimeout(300);
  return { ok: true, message: `Scrolled ${direction}` };
}

async function waitFor(selector, timeout) {
  await ensureBrowser();
  const el = await resolveEl(String(selector || ''));
  if (el?.loc) await el.loc.first().waitFor({ state: 'visible', timeout: timeout || 8000 });
  else if (el?.sel) await page.locator(el.sel).waitFor({ state: 'visible', timeout: timeout || 8000 });
  else await page.waitForTimeout(timeout || 2000);
  return { ok: true, message: `Element visible: "${selector}"` };
}

async function waitNav(timeout) {
  await ensureBrowser();
  try { await page.waitForLoadState('domcontentloaded', { timeout: timeout || 8000 }); } catch {}
  return { ok: true, message: 'Page loaded', url: page.url() };
}

async function evaluate(script) {
  await ensureBrowser();
  const blocked = /\b(fetch\(|XMLHttpRequest|eval\(|Function\(|require\(|process\.|child_process|rm\s|exec\()\b/;
  if (blocked.test(script)) throw new Error('Blocked operation in script');
  const res = await page.evaluate(script);
  return { ok: true, message: 'Evaluated', data: String(res ?? '').slice(0, 500) };
}

async function extractText(selector) {
  await ensureBrowser();
  let text;
  if (selector) {
    const el = await resolveEl(String(selector));
    if (el?.loc) text = await el.loc.first().innerText({ timeout: 5000 }).catch(() => '');
    else if (el?.sel) text = await page.locator(el.sel).first().innerText({ timeout: 5000 }).catch(() => '');
    else text = '';
  } else {
    text = await page.evaluate(() => document.body.innerText?.slice(0, 3000) || '');
  }
  return { ok: true, message: 'Text extracted', data: String(text).trim().slice(0, 1500) };
}

async function selectOption(target, value) {
  await ensureBrowser();
  const el = await resolveEl(String(target));
  if (el?.loc) await el.loc.first().selectOption(value, { timeout: 5000 });
  else if (el?.sel) await page.locator(el.sel).first().selectOption(value, { timeout: 5000 });
  else throw new Error(`Select not found: "${target}"`);
  return { ok: true, message: `Selected "${value}"` };
}

async function hover(desc) {
  await ensureBrowser();
  const el = await resolveEl(String(desc));
  if (!el) throw new Error(`Element not found: "${desc}"`);
  if (el.loc) await el.loc.first().hover({ timeout: 5000 });
  else if (el.sel) await page.locator(el.sel).first().hover({ timeout: 5000 });
  else if (el.coords) await page.mouse.move(el.coords.x, el.coords.y);
  await page.waitForTimeout(300);
  return { ok: true, message: `Hovered "${desc}"` };
}

async function goBack() { await ensureBrowser(); await page.goBack({ timeout: 8000, waitUntil: 'domcontentloaded' }); await page.waitForTimeout(400); return { ok: true, message: 'Back', url: page.url() }; }
async function goForward() { await ensureBrowser(); await page.goForward({ timeout: 8000, waitUntil: 'domcontentloaded' }); await page.waitForTimeout(400); return { ok: true, message: 'Forward', url: page.url() }; }

async function newTab(url) {
  await ensureBrowser();
  const ctx = browser.contexts()[0];
  page = await ctx.newPage();
  if (url) await page.goto(url.startsWith('http') ? url : 'https://' + url, { waitUntil: 'domcontentloaded', timeout: 15000 });
  return { ok: true, message: `New tab${url ? ': ' + url : ''}` };
}

async function closeTab() {
  await ensureBrowser();
  const pages = browser.contexts()[0].pages();
  if (pages.length > 1) { await page.close(); page = pages[pages.length - 2]; return { ok: true, message: 'Tab closed' }; }
  return { ok: false, error: 'Only one tab' };
}

// ─── DISPATCH ─────────────────────────────────────────────────────────────────
async function executeAction(action) {
  const t = String(action.type || '').toLowerCase();
  try {
    switch (t) {
      case 'navigate':                return await navigate(action.url || action.value);
      case 'click':                   return await click(action.selector || action.target || action.value || action.description || action.note);
      case 'fill':
      case 'fill_input':
      case 'type_text':               return await fill(action.selector || action.target, action.value || action.text);
      case 'type':                    return await type(action.value || action.text);
      case 'press_key':
      case 'keypress':                return await pressKey(action.key || action.value);
      case 'scroll':                  return await scroll(action.direction || 'down', action.amount);
      case 'wait':                    await new Promise(r => setTimeout(r, Math.max(100, Math.min(15000, Number(action.ms) || 1000)))); return { ok: true, message: `Waited ${action.ms || 1000}ms` };
      case 'wait_for':
      case 'wait_element':            return await waitFor(action.selector || action.value, action.timeout);
      case 'wait_navigation':         return await waitNav(action.timeout);
      case 'evaluate':
      case 'js':                      return await evaluate(action.script || action.value);
      case 'extract_text':            return await extractText(action.selector || action.value);
      case 'select_option':           return await selectOption(action.selector || action.target, action.value);
      case 'hover':                   return await hover(action.selector || action.target || action.value);
      case 'go_back':                 return await goBack();
      case 'go_forward':              return await goForward();
      case 'new_tab':                 return await newTab(action.url || action.value);
      case 'close_tab':               return await closeTab();
      case 'screenshot':              { const ss = await screenshot(); return ss ? { ok: true, ...ss } : { ok: false, error: 'No screenshot' }; }
      case 'get_state':               return { ok: true, ...(await getPageState()) };
      default:                        return { ok: false, error: `Unknown action: ${t}` };
    }
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

module.exports = { ensureBrowser, closeBrowser, executeAction, screenshot, getPageState, getStatus, isReady };