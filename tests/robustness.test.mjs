import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import vm from 'node:vm';
import { fields } from '../lib/protobuf.mjs';
import { readDatabase } from '../lib/database.mjs';

test('total minification simulation: zero matched native bindings never throws, supplies atomic fallbacks, and boots UI cleanly', () => {
  const bindingsCode = readFileSync(new URL('../lib/native-bindings.js', import.meta.url), 'utf8');
  const i18nCode = readFileSync(new URL('../lib/native-i18n.js', import.meta.url), 'utf8');
  const clientCode = readFileSync(new URL('../lib/native-client.js', import.meta.url), 'utf8');
  const panelsCode = readFileSync(new URL('../lib/native-panels.js', import.meta.url), 'utf8');
  const uiCode = readFileSync(new URL('../lib/native-ui.js', import.meta.url), 'utf8');

  const React = {
    createElement: (type, props, ...children) => ({ type, props: props || {}, children }),
    Fragment: 'fragment',
    createContext: defaultVal => {
      const ctx = { _current: defaultVal, Provider: ({ value, children }) => { ctx._current = value; return children; } };
      return ctx;
    },
    useContext: ctx => ctx?._current ?? null,
    useState: init => [typeof init === 'function' ? init() : init, () => {}],
    useRef: init => ({ current: init }),
    useId: () => 'fb-1',
    useEffect() {},
    useLayoutEffect() {},
    useSyncExternalStore: (_, getSnap) => getSnap(),
    isValidElement: el => Boolean(el && typeof el === 'object' && 'props' in el),
    cloneElement: (el, nextProps) => ({ ...el, props: { ...el.props, ...nextProps } })
  };

  const makeEl = () => ({
    dataset: {},
    style: {},
    isConnected: false,
    children: [],
    append(...items) { for (const x of items) { x.isConnected = true; this.children.push(x); } },
    insertBefore(node) { node.isConnected = true; this.children.push(node); },
    setAttribute() {},
    removeAttribute() {},
    addEventListener() {},
    removeEventListener() {},
    querySelector: () => null,
    querySelectorAll: () => [],
    remove() { this.isConnected = false; }
  });

  const head = makeEl();
  const body = makeEl();
  const docAttrs = new Set();
  const ctx = vm.createContext({
    React,
    ReactDOM: {
      createPortal: node => node,
      createRoot: () => ({ render() {}, unmount() {} })
    },
    Intl,
    URL,
    AbortController,
    MutationObserver: class { observe() {} disconnect() {} },
    setInterval: () => 1,
    clearInterval() {},
    setTimeout: () => 1,
    clearTimeout() {},
    location: { pathname: '/c/conv-future-1' },
    navigator: { userAgent: 'Antigravity/9.0.0' },
    window: { addEventListener() {}, removeEventListener() {} },
    document: {
      readyState: 'complete',
      title: 'Antigravity',
      head,
      body,
      documentElement: {
        style: { setProperty() {}, removeProperty() {} },
        toggleAttribute(k, f) { if (f === undefined ? !docAttrs.has(k) : f) docAttrs.add(k); else docAttrs.delete(k); },
        removeAttribute(k) { docAttrs.delete(k); },
        hasAttribute(k) { return docAttrs.has(k); }
      },
      createElement: () => makeEl(),
      addEventListener() {},
      removeEventListener() {},
      querySelector: () => null,
      querySelectorAll: () => []
    }
  });

  // Zero matching native functions in globalThis (simulate radical Antigravity refactor)
  vm.runInContext(bindingsCode, ctx);
  const resolved = ctx.__agyResolveNativeBindings([]);
  assert.ok(Array.isArray(resolved.degraded));
  assert.ok(resolved.degraded.length >= 10);
  const b = resolved.bindings;
  assert.equal(typeof b.HC, 'function');
  assert.equal(typeof b.IC, 'function');
  assert.equal(typeof b.JC, 'function');
  assert.equal(typeof b.Uy, 'function');
  assert.equal(typeof b.UP, 'function');
  assert.equal(typeof b.HU, 'function');
  assert.equal(typeof b.tc, 'function');
  assert.equal(typeof b.Wb, 'function');
  assert.equal(typeof b.IJ, 'function');
  assert.equal(typeof b.LN, 'function');

  // Verify stepIndex fallback handles multiple step metadata shapes
  assert.equal(b.HU({ sourceTrajectoryStepInfo: { stepIndex: 7 } }), 7);
  assert.equal(b.HU({ stepIndex: 12 }), 12);
  assert.equal(b.HU({ index: 19 }), 19);

  // Boot i18n + client + panels + UI with zero native bindings and zero createFileRoute (mirrors native-host.mjs closure)
  ctx.__agyNativeBindings = resolved.bindings;
  ctx.__agyNativeBindingNames = resolved.names;
  ctx.__agyDegradedBindings = resolved.degraded;
  const aliases = ['B', 'HC', 'IC', 'JC', 'KC', 'GC', 'Uy', 'XP', 'UP', 'TP', 'VP', 'dq', 'k0', 'Sy', 'kT', 'lT', 'mT', 'nT', 'um', 'HU', 'I', 'tc', 'Wb', 'IJ', 'LN', 'VD', 'Wz', 'YF', 'MUa', 'Gy', 'Shd'];
  vm.runInContext(`(function({${aliases.join(',')}}){\n${i18nCode}\n${clientCode}\n${panelsCode}\n${uiCode}\n})(__agyNativeBindings);`, ctx);

  assert.ok(ctx.__agyPowertools, 'Powertools must still boot when all native UI bindings degrade');
  const status = ctx.__agyPowertools.status;
  assert.equal(status.healthy, true);
  assert.equal(status.nativeComponents, false);
  assert.ok(status.degradedBindings.includes('HC'));
  ctx.__agyPowertools.dispose();
});

test('router break, secondary DOM anchors, and sidebar menu DOM fallback all work when native hooks are absent', async () => {
  const i18nCode = readFileSync(new URL('../lib/native-i18n.js', import.meta.url), 'utf8');
  const uiCode = readFileSync(new URL('../lib/native-ui.js', import.meta.url), 'utf8');

  const renderedMounts = new Map();
  const docListeners = new Map();
  const React = {
    createElement: (type, props, ...children) => ({ type, props: props || {}, children }),
    Fragment: 'fragment',
    createContext: v => ({ _v: v, Provider: ({ children }) => children }),
    useContext: c => c?._v ?? null,
    useState: init => [typeof init === 'function' ? init() : init, () => {}],
    useRef: init => ({ current: init }),
    useId: () => 'r-1',
    useEffect: fn => { fn(); },
    useSyncExternalStore: (_, getSnap) => getSnap()
  };

  const makeNode = (tag = 'div') => {
    const attrs = new Map();
    const listeners = new Map();
    return {
      tagName: tag.toUpperCase(),
      dataset: {},
      style: {},
      className: '',
      textContent: '',
      children: [],
      isConnected: true,
      parentElement: null,
      nextSibling: null,
      firstChild: null,
      append(...items) {
        for (const item of items) {
          item.isConnected = true;
          item.parentElement = this;
          this.children.push(item);
        }
        this.firstChild = this.children[0] || null;
        for (let i = 0; i < this.children.length; i++) this.children[i].nextSibling = this.children[i + 1] || null;
      },
      insertBefore(node, before) {
        const existing = this.children.indexOf(node);
        if (existing >= 0) this.children.splice(existing, 1);
        node.isConnected = true;
        node.parentElement = this;
        if (before && this.children.includes(before)) this.children.splice(this.children.indexOf(before), 0, node);
        else this.children.push(node);
        this.firstChild = this.children[0] || null;
        for (let i = 0; i < this.children.length; i++) this.children[i].nextSibling = this.children[i + 1] || null;
      },
      setAttribute(k, v) { attrs.set(k, String(v)); },
      getAttribute(k) { return attrs.get(k) ?? null; },
      hasAttribute(k) { return attrs.has(k); },
      removeAttribute(k) { attrs.delete(k); },
      addEventListener(type, fn) { listeners.set(type, fn); },
      removeEventListener(type) { listeners.delete(type); },
      click() { listeners.get('click')?.({ preventDefault() {}, stopPropagation() {} }); },
      closest: () => null,
      querySelector: () => null,
      querySelectorAll: () => [],
      remove() {
        this.isConnected = false;
        if (this.parentElement) {
          const i = this.parentElement.children.indexOf(this);
          if (i >= 0) this.parentElement.children.splice(i, 1);
        }
      }
    };
  };

  // Fallback sidebar anchor: a[href="/customizations"] is gone; only a[href="/automations"] exists
  const sidebarList = makeNode('div');
  const automationsLink = makeNode('a');
  sidebarList.append(automationsLink);

  // Fallback composer anchor: [data-testid="model-selector-trigger"] is gone; .surface-composer-card has .agy-composer-footer > div:first-child
  const composerCard = makeNode('div');
  const composerFooter = makeNode('div');
  const composerLeftGroup = makeNode('div');
  const fallbackModelBtn = makeNode('button');
  composerLeftGroup.append(fallbackModelBtn);
  composerFooter.append(composerLeftGroup);
  composerCard.append(composerFooter);
  fallbackModelBtn.closest = sel => sel.includes('.surface-composer-card') ? composerCard : null;
  composerFooter.querySelector = sel => sel === ':scope > div:first-child' ? composerLeftGroup : null;
  composerCard.querySelector = sel => sel.includes('.agy-composer-footer') ? composerFooter : null;

  // Fallback user message step: [data-testid="user-message-actions"] is gone; only [data-testid="user-input-step"] exists
  const userStep = makeNode('div');
  userStep.querySelector = sel => {
    if (sel.includes('data-agy-fallback-actions')) return userStep.children.find(c => 'agyFallbackActions' in (c.dataset || {})) || null;
    return null;
  };

  // Fallback sidebar conversation menu (no global lHc)
  const renameItem = makeNode('button');
  renameItem.textContent = 'Rename';
  const archiveItem = makeNode('button');
  archiveItem.textContent = 'Archive';
  const openMenu = makeNode('div');
  openMenu.append(renameItem, archiveItem);
  openMenu.querySelector = sel => {
    if (sel.includes('agy-fork-session-menu-item')) return openMenu.children.find(c => c.dataset?.testid === 'agy-fork-session-menu-item') || null;
    return null;
  };
  openMenu.querySelectorAll = sel => sel.includes('[role="menuitem"]') ? openMenu.children : [];

  const head = makeNode('head');
  const body = makeNode('body');
  let capturedPanelsEnv = null;
  let observerCallback = null;
  const forkedCalls = [];

  const ctx = vm.createContext({
    React,
    ReactDOM: {
      createRoot(mount) {
        return {
          render(tree) { renderedMounts.set(mount.dataset?.agyPowertoolsRoot || 'anon', { mount, tree }); },
          unmount() { renderedMounts.delete(mount.dataset?.agyPowertoolsRoot || 'anon'); }
        };
      }
    },
    Intl,
    URL,
    AbortController,
    MutationObserver: class { constructor(cb) { observerCallback = cb; } observe() {} disconnect() {} },
    getComputedStyle: () => ({ display: 'flex' }),
    setInterval: () => 1,
    clearInterval() {},
    setTimeout: (fn, ms) => { if (ms <= 250) fn(); return 1; },
    clearTimeout() {},
    location: { pathname: '/c/conv-fb' },
    navigator: { userAgent: 'Antigravity/9.0.0' },
    window: { addEventListener() {}, removeEventListener() {} },
    __agyNativeAdapter: {
      wrap: el => el,
      installPage: () => false, // Simulate TanStack Router breaking change
      router: () => null,
      composerCascadeId: () => 'conv-fb',
      userMessage: el => el === userStep ? { cascadeId: 'conv-fb', metadata: { stepIndex: 2 } } : null,
      fork: async (cid, step) => { forkedCalls.push([cid, step]); return { conversationId: 'forked-new' }; },
      executionState: () => null,
      capabilities: () => ({}),
      dispose() {}
    },
    __agyPanels: env => {
      capturedPanelsEnv = env;
      return {
        Page: () => React.createElement('div', { 'data-testid': 'agy-management-page' }, 'Powertools Page'),
        Sidebar: () => React.createElement('a', { 'data-testid': 'agy-management-trigger' }, 'Powertools'),
        dispose() {}
      };
    },
    __agyPowertoolsHost: raw => {
      const msg = JSON.parse(raw);
      queueMicrotask(() => {
        if (msg.method === 'state') {
          ctx.__agyPowertoolsReceive?.(msg.id, {
            conversationId: 'conv-fb',
            turns: [],
            requests: [],
            errors: [],
            contextWindow: {},
            telemetry: {},
            progress: {}
          });
        } else {
          ctx.__agyPowertoolsReceive?.(msg.id, {});
        }
      });
    },
    document: {
      readyState: 'complete',
      title: 'Antigravity',
      head,
      body,
      documentElement: {
        style: { setProperty() {}, removeProperty() {} },
        toggleAttribute() {},
        removeAttribute() {},
        hasAttribute: () => false
      },
      createElement: tag => makeNode(tag),
      addEventListener(type, fn) { if (!docListeners.has(type)) docListeners.set(type, []); docListeners.get(type).push(fn); },
      removeEventListener() {},
      querySelector: sel => {
        if (sel.includes('a[href="/automations"]')) return automationsLink;
        if (sel === '[data-testid="agy-management-trigger"]') return renderedMounts.has('management') ? {} : null;
        return null;
      },
      querySelectorAll: sel => {
        if (sel === '[data-testid="model-selector-trigger"]') return [];
        if (sel.includes('.surface-composer-card')) return [composerCard];
        if (sel.includes('[data-testid="user-input-step"]')) return [userStep];
        if (sel.includes('[role="menu"]')) return [openMenu];
        if (sel === '[data-testid="agy-context-ring-trigger"]') return renderedMounts.has('ring') ? [{}] : [];
        return [];
      }
    }
  });

  vm.runInContext(i18nCode, ctx);
  vm.runInContext(uiCode, ctx);
  await new Promise(r => setImmediate(r));

  // 1. Secondary DOM anchors mount sidebar management trigger, composer ring, and user message edit button!
  assert.equal(renderedMounts.has('management'), true, 'sidebar management trigger mounted via a[href="/automations"]');
  assert.equal(renderedMounts.has('ring'), true, 'composer ring mounted via .surface-composer-card fallback');
  assert.equal(renderedMounts.has('message-edit'), true, 'message edit button mounted via fallback hover action bar');
  assert.equal(ctx.__agyPowertools.status.healthy, true);

  // 2. Clicking Powertools when installPage() returned false opens Standalone Full-Pane Overlay
  assert.equal(ctx.__agyPowertools.status.standalonePage, false);
  capturedPanelsEnv.openManagementTab('quota');
  assert.equal(ctx.__agyPowertools.status.standalonePage, true);
  assert.equal(renderedMounts.has('standalone-page'), true, 'Standalone Full-Pane Overlay mounted into document.body');
  const overlayTree = renderedMounts.get('standalone-page').tree;
  const renderedOverlay = typeof overlayTree.type === 'function' ? overlayTree.type(overlayTree.props || {}) : overlayTree;
  assert.equal(renderedOverlay.props['data-testid'], 'agy-standalone-page-overlay');

  capturedPanelsEnv.closeStandalonePage();
  assert.equal(ctx.__agyPowertools.status.standalonePage, false);
  assert.equal(renderedMounts.has('standalone-page'), false);

  // 3. Sidebar conversation menu DOM fallback injects "分支会话" item when lHc is missing
  const sideLink = makeNode('a');
  sideLink.setAttribute('href', '/c/conv-side-99');
  const sideRow = makeNode('div');
  sideRow.querySelector = sel => sel.includes('a[href^="/c/"]') ? sideLink : null;
  const pointerDownTarget = { closest: sel => sel.includes('.agy-sidebar-row') ? sideRow : null };
  for (const fn of docListeners.get('pointerdown') || []) fn({ target: pointerDownTarget });
  observerCallback?.([{ target: openMenu }]);

  const injectedForkItem = openMenu.children.find(c => c.dataset?.testid === 'agy-fork-session-menu-item');
  assert.ok(injectedForkItem, 'DOM fallback injected agy-fork-session-menu-item into [role="menu"]');
  injectedForkItem.click();
  await new Promise(r => setImmediate(r));
  assert.deepEqual(forkedCalls, [['conv-side-99', -1]]);

  ctx.__agyPowertools.dispose();
});

test('protobuf wire-type 3/4 groups & truncated trailing bytes + SQLite missing-table isolation', async () => {
  const { mkdirSync } = await import('node:fs');
  // Construct protobuf wire bytes:
  // field 1 (varint = 42): 0x08, 0x2a
  // field 2 (start group = wire 3, tag = (2<<3)|3 = 0x13, inner field 1 varint 7 = 0x08 0x07, end group = (2<<3)|4 = 0x14)
  // field 3 (length-delimited "ok" = 0x1a, 0x02, 0x6f, 0x6b)
  // field 4 trailing truncated varint byte: 0x20, 0x80 (unexpected EOF)
  const buf = new Uint8Array([0x08, 0x2a, 0x13, 0x08, 0x07, 0x14, 0x1a, 0x02, 0x6f, 0x6b, 0x20, 0x80]);
  const decoded = fields(buf);
  assert.equal(decoded.get(1)?.[0], 42);
  assert.equal(Buffer.from(decoded.get(3)?.[0] || []).toString('utf8'), 'ok');
  assert.equal(decoded.has(4), false, 'trailing truncated field 4 is safely discarded without losing earlier fields');

  // SQLite database isolation: missing `steps` table still reads `gen_metadata` cleanly without throwing
  const dir = mkdtempSync(join(tmpdir(), 'agy-db-robust-'));
  try {
    const convDir = join(dir, 'conversations');
    mkdirSync(convDir, { recursive: true });
    const dbPath = join(convDir, 'conv-partial-1.db');
    const db = new DatabaseSync(dbPath);
    db.exec('CREATE TABLE gen_metadata (idx INTEGER PRIMARY KEY, data BLOB);');
    // Generation blob with field 4 (executionId = "exec-1"): 0x22, 6, ...bytes
    const execBytes = Buffer.from('exec-1', 'utf8');
    const genBlob = Buffer.concat([Buffer.from([0x22, execBytes.length]), execBytes]);
    db.prepare('INSERT INTO gen_metadata (idx, data) VALUES (?, ?)').run(0, genBlob);
    db.close();

    const result = readDatabase(dir, 'conv-partial-1', { force: true });
    assert.ok(result);
    assert.equal(result.generations.length, 1);
    assert.equal(result.generations[0].executionId, 'exec-1');
    assert.equal(result.times.size, 0);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('pure-JS Lexical & Protobuf fallbacks allow attachFileToComposer and beginEdit when Shd/Gy/IJ/LN/HU/Wb/tc are absent', async () => {
  const clientCode = readFileSync(new URL('../lib/native-client.js', import.meta.url), 'utf8');

  let loadedEditorState = null;
  const editor = {
    focus() {},
    getEditorState: () => ({ toJSON: () => ({ root: { children: [] } }) }),
    parseEditorState: json => ({ parsed: typeof json === 'string' ? JSON.parse(json) : json }),
    setEditorState(st) { loadedEditorState = st; }
  };
  const box = {
    lexicalRef: { current: editor },
    getMediaAttachments: () => [],
    setMediaAttachments() {},
    getInputCardElement: () => ({ scrollIntoView() {} })
  };
  const inputBox = { parentNode: null, parentElement: null, nextSibling: null };
  const dock = { isConnected: true, children: [inputBox], insertBefore() {} };
  inputBox.parentNode = dock;
  inputBox.parentElement = dock;

  const service = {
    forkConversation() {},
    async sendUserCascadeMessage(p) { return p; }
  };
  const stepHandler = { async revertToIndex() {} };
  const message = {
    cascadeId: 'conv-pure-fb',
    metadata: { stepIndex: 5 }, // No HU global: uses stepIndexOf fallback!
    step: {
      items: [{ chunk: { case: 'text', value: 'Hello fallback world' } }],
      media: [],
      artifactComments: [],
      fileDiffComments: [],
      fileComments: []
    }
  };
  const msgEl = {
    isConnected: true,
    setAttribute() {},
    removeAttribute() {},
    closest: () => ({ querySelector: () => inputBox }),
    '__reactFiber$msg': {
      tag: 0,
      memoizedProps: message,
      return: {
        tag: 10,
        type: {},
        memoizedProps: { value: { stepHandler } },
        return: {
          tag: 10,
          type: {},
          memoizedProps: { value: { inputBoxRef: { current: box }, getLexicalEditor: () => editor } },
          return: { tag: 10, type: {}, memoizedProps: { value: service }, return: null }
        }
      }
    }
  };

  const ctx = vm.createContext({
    URL,
    document: {
      querySelector: () => msgEl,
      querySelectorAll: () => [msgEl],
      createElement: () => ({ dataset: {}, style: {}, append() {}, addEventListener() {}, remove() {} })
    }
    // Notice: NO Shd, NO Gy, NO IJ, NO LN, NO HU, NO tc, NO Wb, NO I!
  });
  vm.runInContext(clientCode, ctx);
  const adapter = ctx.__agyNativeAdapter;

  // 1. attachFileToComposer falls back cleanly to inserting @path text into Lexical state when Shd/Gy are missing
  const attachRes = await adapter.attachFileToComposer({
    mode: 'mention',
    kind: 'file',
    uri: 'file:///repo/src/main.ts',
    path: '/repo/src/main.ts',
    name: 'main.ts'
  }, msgEl);
  assert.equal(attachRes.ok, true);
  assert.equal(attachRes.mode, 'mention-text');
  assert.ok(JSON.stringify(loadedEditorState).includes('@/repo/src/main.ts'));

  // 2. beginEdit serializes items to Lexical JSON and parses state without LN/IJ/HU
  loadedEditorState = null;
  await adapter.beginEdit(msgEl);
  assert.ok(loadedEditorState);
  assert.equal(loadedEditorState.parsed.root.children[0].children[0].text, 'Hello fallback world');
  adapter.cancelEdit();
  adapter.dispose();
});
