(() => {
  const version = '2.16.9';
  const hookNames = globalThis.__agyNativeBindings?.names || { resolve: 'sjc', segment: 'Yyc', menu: 'lHc' };
  if (globalThis.__agyNativeAdapter?.version === version && globalThis.__agyNativeAdapter.active) return;
  globalThis.__agyNativeAdapter?.dispose?.();
  let disposed = false;

  const stepIndexOf = meta => {
    if (typeof HU === 'function') {
      try { const idx = HU(meta); if (Number.isInteger(idx)) return idx; } catch {}
    }
    if (!meta || typeof meta !== 'object') return -1;
    for (const v of [meta.sourceTrajectoryStepInfo?.stepIndex, meta.stepIndex, meta.index, meta.trajectoryStepIndex]) {
      if (Number.isInteger(v)) return v;
    }
    return -1;
  };

  const fallbackSerializeItems = (items = []) => {
    const textParts = [];
    for (const item of Array.isArray(items) ? items : []) {
      if (item?.chunk?.case === 'text' && typeof item.chunk.value === 'string') textParts.push(item.chunk.value);
      else if (typeof item?.text === 'string') textParts.push(item.text);
    }
    const lines = textParts.join('').split('\n');
    const paragraphs = (lines.length ? lines : ['']).map(line => ({
      children: line ? [{ detail: 0, format: 0, mode: 'normal', style: '', text: line, type: 'text', version: 1 }] : [],
      direction: null,
      format: '',
      indent: 0,
      textFormat: 0,
      textStyle: '',
      type: 'paragraph',
      version: 1
    }));
    return JSON.stringify({
      root: { children: paragraphs, direction: null, format: '', indent: 0, type: 'root', version: 1 }
    });
  };

  const parseEditorJson = (ed, json) => {
    if (typeof IJ === 'function') return IJ(ed, json);
    if (typeof ed?.parseEditorState === 'function') return ed.parseEditorState(json);
    return typeof json === 'string' ? JSON.parse(json) : json;
  };

  const serializeUserItems = items => (typeof LN === 'function' ? LN(items) : fallbackSerializeItems(items));

  const createMsg = (schema, init = {}) => {
    if (typeof Wb === 'function' && schema) {
      try { return Wb(schema, init); } catch {}
    }
    const base = init && typeof init === 'object' ? { ...init } : {};
    if (schema?.typeName && !base.$typeName) base.$typeName = schema.typeName;
    return base;
  };

  const deepClonePlain = (val, seen = new WeakMap()) => {
    if (!val || typeof val !== 'object') return val;
    if (seen.has(val)) return seen.get(val);
    if (Array.isArray(val)) {
      const arr = [];
      seen.set(val, arr);
      for (const item of val) arr.push(deepClonePlain(item, seen));
      return arr;
    }
    const out = {};
    seen.set(val, out);
    for (const [k, v] of Object.entries(val)) {
      if (typeof v !== 'function') out[k] = deepClonePlain(v, seen);
    }
    return out;
  };

  const cloneMsg = (schema, value) => {
    if (typeof tc === 'function' && schema) {
      try { return tc(schema, value); } catch {}
    }
    if (!value || typeof value !== 'object') return createMsg(schema, {});
    try {
      const copy = typeof structuredClone === 'function' ? structuredClone(value) : JSON.parse(JSON.stringify(value));
      if (value.$typeName && !copy.$typeName) copy.$typeName = value.$typeName;
      return copy;
    } catch {
      return deepClonePlain(value);
    }
  };

  const fiber = element => {
    if (!element || typeof element !== 'object') return null;
    const key = Object.keys(element).find(k => k.startsWith('__reactFiber$') || k.startsWith('__reactInternalInstance$'));
    return key ? element[key] : null;
  };

  function providers(element) {
    const result = [];
    const seenTypes = new Set();
    const pushProvider = node => {
      if (node?.tag === 10 && node.memoizedProps?.value !== undefined && !seenTypes.has(node.type)) {
        seenTypes.add(node.type);
        result.push({ type: node.type, value: node.memoizedProps.value });
      }
    };
    const start = fiber(element);
    for (let node = start; node; node = node.return) pushProvider(node);
    // Fallback: if anchored at #root / top container where providers sit below the DOM node, scan shallow descendants.
    if (!result.length && start?.child) {
      const queue = [{ node: start.child, depth: 1 }];
      let visited = 0;
      while (queue.length && visited < 64) {
        const { node, depth } = queue.shift();
        visited++;
        pushProvider(node);
        if (depth < 8 && node.child) queue.push({ node: node.child, depth: depth + 1 });
        if (depth < 8 && node.sibling) queue.push({ node: node.sibling, depth });
      }
    }
    return result;
  }

  const pageSource = () =>
    document.querySelector?.('[aria-label="Message input"],[data-agy-original-aria-label="Message input"],[data-testid="agent-input-box"]')
    || document.querySelector?.('[data-testid="conversation-view"]')
    || document.querySelector?.('a[href="/customizations"],a[href="/automations"],[data-testid="sidebar-navigation-items"]')
    || document.querySelector?.('#root')?.firstElementChild
    || document.querySelector?.('#root')
    || document.body?.firstElementChild
    || null;

  function resolveFromProviders(source, pick) {
    for (const p of providers(source || pageSource())) {
      const v = p.value;
      if (!v || typeof v !== 'object') continue;
      for (const candidate of [v, v.core, v.services, v.cascadeService, v.conversationService, v.client]) {
        if (candidate && typeof candidate === 'object') {
          const hit = pick(candidate);
          if (hit) return hit;
        }
      }
    }
    return null;
  }

  function service(source) {
    const found = resolveFromProviders(source, c =>
      (typeof c.forkConversation === 'function' || typeof c.sendUserCascadeMessage === 'function' || typeof c.retrieveUserQuotaSummary === 'function') ? c : null
    );
    if (!found) throw new Error('Antigravity conversation service is unavailable');
    return found;
  }

  function wrap(child, element) {
    const BRef = typeof B !== 'undefined' && B ? B : globalThis.React;
    if (!BRef?.createElement) return child;
    return providers(element).reduce((tree, p) => BRef.createElement(p.type, { value: p.value }, tree), child);
  }

  const store = () => {
    for (const p of providers(pageSource())) {
      for (const s of [p.value?.store, p.value]) {
        if (s && typeof s.getState === 'function' && typeof s.dispatch === 'function') return s;
      }
    }
    return undefined;
  };

  const router = () => {
    for (const p of providers(pageSource())) {
      for (const r of [p.value, p.value?.router]) {
        if (r && typeof r.navigate === 'function' && (typeof r.buildRouteTree === 'function' || r.routesById || r.state)) return r;
      }
    }
    return undefined;
  };

  const overview = () => providers(pageSource()).map(p => p.value).find(v => v?.cascadeId && typeof v.togglePanel === 'function' && typeof v.setOverlayOpen === 'function');

  function capabilities() {
    const p = providers(pageSource()), s = store()?.getState?.(), context = p.find(item => item.value?.cascadeContext)?.value;
    const model = context?.cascadeContext?.state?.selectedModel;
    return {
      email: s?.userStatus?.email || '',
      name: s?.userStatus?.name || '',
      subscription: globalThis.__agyDashboard?.subscriptionIdentity?.(s?.userStatus?.userTier),
      plan: s?.userStatus?.userTier?.name || '',
      planId: s?.userStatus?.userTier?.id || '',
      models: s?.userStatus?.cascadeModelConfigData?.clientModelConfigs?.map(m => ({ label: m.label, modelId: m.modelId })) || [],
      model: model?.label || '',
      contextOptions: model?.contextWindowOptions || []
    };
  }

  function executionState(conversationId) {
    if (!conversationId) return null;
    const inputs = typeof document?.querySelectorAll === 'function'
      ? [...document.querySelectorAll('[aria-label="Message input"],[data-agy-original-aria-label="Message input"],[data-testid="agent-input-box"]')]
      : [];
    let state = null;
    for (const el of inputs) {
      const candidate = providers(el).find(p => p.value?.cascadeContext)?.value?.cascadeContext?.state?.agentStateProvider?.getState?.();
      if (candidate?.conversationId === conversationId) { state = candidate; break; }
    }
    if (!state) {
      const fallback = providers(pageSource()).find(p => p.value?.cascadeContext)?.value?.cascadeContext?.state?.agentStateProvider?.getState?.();
      if (fallback?.conversationId === conversationId) state = fallback;
    }
    const turnStartStepIndex = state?.turns?.at(-1)?.startStepIndex;
    if (!state || !Number.isInteger(turnStartStepIndex)) return null;
    let live = null, isSystemTurn = false, userTurnStartStepIndex = null;
    try {
      const slice = state?.trajectorySlice;
      const steps = Array.isArray(slice?.stepsInSlice) ? slice.stepsInSlice : null;
      if (steps && steps.length) {
        const baseIdx = Number(slice?.stepsSlice?.startIndex || 0);
        const startStep = steps[turnStartStepIndex - baseIdx] || null;
        const startCase = String(startStep?.step?.case || '');
        if (startCase && startCase !== 'userInput') isSystemTurn = true;
        if (startCase === 'userInput') {
          userTurnStartStepIndex = turnStartStepIndex;
        } else if (Array.isArray(state?.turns)) {
          for (let i = state.turns.length - 1; i >= 0; i--) {
            const idx = state.turns[i]?.startStepIndex;
            if (!Number.isInteger(idx)) continue;
            const st = steps[idx - baseIdx];
            if (!st) break;
            if (st?.step?.case === 'userInput') { userTurnStartStepIndex = idx; break; }
          }
        }
        const turnTail = steps.filter((_, idx) => baseIdx + idx >= turnStartStepIndex);
        const last = turnTail.at(-1) || null;
        if (last) {
          const waiting = turnTail.some(s => s?.status === 9);
          const lastCase = String(last?.step?.case || '');
          const lastStatus = Number(last?.status || 0);
          const val = last?.step?.value || {};
          const toolCalls = Array.isArray(val.toolCalls) ? val.toolCalls : [];
          const toolName = String(last?.metadata?.toolCall?.name || toolCalls.at(-1)?.name || '').trim();
          const errObj = lastCase === 'errorMessage' ? (val.error || val) : null;
          const errorText = errObj ? String(errObj.userErrorMessage || errObj.shortError || errObj.message || '').trim().slice(0, 180) : '';
          const gens = Array.isArray(slice?.generatorMetadatasInSlice) ? slice.generatorMetadatasInSlice : [];
          const lastGen = gens.at(-1);
          const genError = lastGen?.error ? String(lastGen.error).trim().slice(0, 180) : '';
          live = {
            waiting,
            lastCase,
            lastStatus,
            hasThinking: Boolean(typeof val.thinking === 'string' && val.thinking.trim()),
            hasResponse: Boolean(typeof val.response === 'string' && val.response.trim()),
            toolCallCount: toolCalls.length,
            toolName,
            errorText,
            genError
          };
        }
      }
    } catch {}
    const summary = store()?.getState?.()?.trajectorySummaries?.summaries?.[conversationId];
    const notFullyIdle = Boolean(summary?.notFullyIdle);
    const activeSubagents = subagents(conversationId)
      .filter(s => s.status === 'running' || s.status === 'stopping')
      .map(s => ({ title: s.title, status: s.status }));
    return {
      conversationId, status: state.status, turnStartStepIndex, terminationReason: state.executorMetadata?.terminationReason,
      ...(isSystemTurn ? { isSystemTurn: true } : {}),
      ...(Number.isInteger(userTurnStartStepIndex) && userTurnStartStepIndex !== turnStartStepIndex ? { userTurnStartStepIndex } : {}),
      ...(notFullyIdle ? { notFullyIdle: true } : {}),
      ...(activeSubagents.length ? { activeSubagents } : {}),
      ...(live ? { live } : {})
    };
  }

  function runningConversationIds() {
    const ids = new Set();
    const isTerminalReason = reason => reason === 2 || [1, 3, 6, 11].includes(reason);
    const isActiveSummary = summary => {
      if (!summary || summary.killed) return false;
      const st = summary.status;
      if (st === 2 || st === 4) return true;
      if (st === 1 && !isTerminalReason(summary.terminationReason) && Boolean(summary.notFullyIdle)) return true;
      return false;
    };
    const isActiveExec = exec => {
      if (!exec) return false;
      if (exec.status === 2 || exec.status === 4) return true;
      if (exec.status === 1 && !isTerminalReason(exec.terminationReason) && Boolean(exec.notFullyIdle || exec.activeSubagents?.length)) return true;
      return false;
    };
    try {
      const summaries = store()?.getState?.()?.trajectorySummaries?.summaries;
      if (summaries && typeof summaries === 'object') {
        for (const [cid, summary] of Object.entries(summaries)) {
          if (isActiveSummary(summary)) ids.add(cid);
        }
      }
    } catch {}
    try {
      const activeCid = typeof location === 'object' ? (location?.pathname?.match(/^\/c\/([^/]+)/)?.[1] || '') : '';
      if (activeCid) {
        const exec = executionState(activeCid);
        if (isActiveExec(exec)) ids.add(activeCid);
      }
    } catch {}
    return [...ids];
  }

  function subscribeStore(listener) {
    if (typeof listener !== 'function') return () => {};
    try {
      const s = store();
      if (typeof s?.subscribe === 'function') return s.subscribe(listener);
    } catch {}
    return null;
  }

  function unreadCount(activeId = '', focused = true) {
    const s = store()?.getState?.();
    const summaries = s?.trajectorySummaries?.summaries;
    if (!summaries || typeof summaries !== 'object') return 0;
    const localViewed = s?.conversation?.localLastViewedTimes || {};
    let count = 0;
    for (const [id, summary] of Object.entries(summaries)) {
      if (!summary || summary.annotations?.archived || summary.notFullyIdle) continue;
      if (summary.parentConversationId || Number(summary.nestingDepth || 0) > 0) continue;
      if (summary.annotations?.markedAsUnread) { count++; continue; }
      if (id === activeId && focused) continue;
      const modified = Number(summary.lastModifiedTime?.seconds || 0);
      const viewed = Math.max(Number(summary.annotations?.lastUserViewTime?.seconds || 0), Number(localViewed[id] || 0));
      if (modified > 0 && viewed > 0 && modified > viewed) count++;
    }
    return count;
  }

  function extractWorkspaceUriFromSummary(summary) {
    const meta = summary?.trajectoryMetadata || summary || {};
    const ws = Array.isArray(meta.workspaces) ? meta.workspaces[0] : null;
    const candidates = [
      ws?.workspaceFolderAbsoluteUri,
      ws?.gitRootAbsoluteUri,
      ws?.absoluteUri,
      meta.workspaceFolderAbsoluteUri,
      meta.cwdUri,
      meta.workingDirectoryUri,
      summary?.workspaceFolderAbsoluteUri
    ];
    for (const item of candidates) {
      if (typeof item === 'string' && item.trim().startsWith('file://')) return item.trim();
    }
    return '';
  }

  function workspaceNameFromUri(uri) {
    if (!uri) return '';
    try {
      const clean = decodeURIComponent(String(uri).split('#')[0].split('?')[0]).replace(/[\\/]+$/, '');
      return clean.split(/[\\/]/).filter(Boolean).pop() || '';
    } catch { return ''; }
  }

  function conversationDirectory() {
    const s = store()?.getState?.();
    const summaries = s?.trajectorySummaries?.summaries;
    if (!summaries || typeof summaries !== 'object') return { projects: [], byId: {}, subagentIds: [] };
    const storeProjects = s?.projects?.projects || s?.workspaces?.workspaces || {};
    const byId = {}, subagentIds = [];
    const projectBuckets = new Map();
    for (const [id, summary] of Object.entries(summaries)) {
      if (!summary) continue;
      const meta = summary.trajectoryMetadata || {};
      const isSubagent = Boolean(summary.parentConversationId || meta.parentConversationId || Number(summary.nestingDepth || meta.nestingDepth || 0) > 0);
      if (isSubagent) { subagentIds.push(id); continue; }
      const archived = Boolean(summary.annotations?.archived);
      const title = String(summary.annotations?.title || summary.summary || '').trim();
      const wsUri = extractWorkspaceUriFromSummary(summary);
      const projectId = String(meta.projectId || summary.projectId || '').trim();
      const rawProj = projectId ? storeProjects?.[projectId] : null;
      const projectName = String(rawProj?.name || rawProj?.title || workspaceNameFromUri(wsUri) || '').trim();
      const modifiedSec = Number(summary.lastModifiedTime?.seconds || meta.createdAt?.seconds || summary.createdTime?.seconds || 0);
      const updatedAtMs = modifiedSec > 0 ? modifiedSec * 1000 : 0;
      byId[id] = { id, title, projectId, projectName, archived, updatedAtMs };
      const pKey = projectId || (projectName ? `name:${projectName}` : '');
      if (pKey && projectName) {
        let bucket = projectBuckets.get(pKey);
        if (!bucket) { bucket = { id: pKey, projectId, label: projectName, conversationIds: [], updatedAtMs: 0 }; projectBuckets.set(pKey, bucket); }
        bucket.conversationIds.push(id);
        if (updatedAtMs > bucket.updatedAtMs) bucket.updatedAtMs = updatedAtMs;
      }
    }
    const projects = [...projectBuckets.values()].sort((a, b) => (b.updatedAtMs - a.updatedAtMs) || a.label.localeCompare(b.label));
    return { projects, byId, subagentIds };
  }

  function subagents(conversationId = '') {
    if (!conversationId) return [];
    const summaries = store()?.getState?.()?.trajectorySummaries?.summaries;
    if (!summaries || typeof summaries !== 'object') return [];
    const byId = new Map(Object.entries(summaries));
    const belongs = id => {
      let cur = id;
      for (let depth = 0; depth < 8 && cur; depth++) {
        const item = byId.get(cur);
        const meta = item?.trajectoryMetadata;
        const parent = meta?.parentConversationId || item?.parentConversationId || '';
        const root = meta?.rootConversationId || '';
        if (parent === conversationId || root === conversationId) return true;
        if (!parent || parent === cur) break;
        cur = parent;
      }
      return false;
    };
    const out = [];
    for (const [id, entry] of byId) {
      if (!entry || id === conversationId || !belongs(id)) continue;
      const meta = entry.trajectoryMetadata || {};
      const spec = meta.subagentSpec || {};
      const createdSec = Number(meta.createdAt?.seconds || entry.createdTime?.seconds || 0);
      const modifiedSec = Number(entry.lastModifiedTime?.seconds || 0);
      const status = entry.killed ? 'killed' : (entry.status === 2 || entry.status === 4) ? 'running' : entry.status === 3 ? 'stopping' : 'done';
      out.push({
        id,
        parentId: meta.parentConversationId || entry.parentConversationId || '',
        depth: Number(meta.nestingDepth || entry.nestingDepth || 1),
        typeName: String(spec.typeName || '').trim(),
        role: String(spec.role || '').trim(),
        title: String(spec.role || entry.summary || spec.typeName || 'Subagent').trim(),
        status,
        stepCount: Number(entry.stepCount || 0),
        createdAtMs: createdSec > 0 ? createdSec * 1000 : null,
        lastModifiedAtMs: modifiedSec > 0 ? modifiedSec * 1000 : null
      });
    }
    return out.sort((a, b) => (a.depth - b.depth) || ((a.createdAtMs || 0) - (b.createdAtMs || 0)) || a.id.localeCompare(b.id));
  }

  function openSubagent(id = '') {
    if (!id || typeof document === 'undefined') return false;
    for (const node of document.querySelectorAll('[data-testid="subagent-node"][data-cascade-id],[data-cascade-id]')) {
      if (node.dataset?.cascadeId === id) { node.click(); return true; }
    }
    const r = router();
    if (r?.navigate) { void r.navigate({ to: `/c/${id}` }); return true; }
    return false;
  }

  function composerCascadeId(element) {
    for (let n = fiber(element); n; n = n.return) {
      const p = n.memoizedProps;
      const id = p?.conversationId || p?.effectiveCascadeId || p?.cascadeId || p?.value?.cascadeId || p?.value?.cascadeContext?.cascadeId || p?.value?.cascadeContext?.state?.conversationId;
      if (typeof id === 'string' && id) return id;
    }
    return '';
  }

  function fileTreeEntry(element) {
    const row = element?.closest?.('[role="treeitem"]');
    if (!row) return null;
    for (let node = fiber(row), depth = 0; node && depth < 8; node = node.return, depth++) {
      const entry = node.memoizedProps?.entry || node.memoizedProps?.item || node.memoizedProps?.node;
      if (entry && typeof entry.uri === 'string' && entry.uri.startsWith('file://')) {
        return { uri: entry.uri, isDirectory: entry.fileType === 2 || Boolean(entry.isDirectory) };
      }
    }
    const iconEl = row.querySelector?.('[data-testid="file-tree-node-icon"]') || row.firstElementChild;
    if (iconEl) {
      for (let node = fiber(iconEl)?.child, depth = 0; node && depth < 8; node = node.child, depth++) {
        const p = node.memoizedProps;
        if (p && typeof p.uri === 'string' && p.uri.startsWith('file://')) {
          return { uri: p.uri, isDirectory: Boolean(p.isDirectory) };
        }
      }
    }
    return null;
  }

  function findComposer(sourceEl) {
    const anchors = [];
    const scopedView = sourceEl?.closest?.('[data-testid="conversation-view"]');
    const scopedInput = scopedView?.querySelector?.('[data-testid="agent-input-box"],[aria-label="Message input"],[data-agy-original-aria-label="Message input"]');
    if (scopedInput) anchors.push(scopedInput);
    if (sourceEl) anchors.push(sourceEl);
    const activeEl = typeof document !== 'undefined' ? document.activeElement : null;
    const activeInput = activeEl?.closest?.('[data-testid="agent-input-box"],.surface-composer-card');
    if (activeInput) anchors.push(activeInput);
    const mainInput = typeof document !== 'undefined'
      ? (document.querySelector('[data-testid="conversation-view"] [data-testid="agent-input-box"]')
        || document.querySelector('[data-testid="agent-input-box"]')
        || document.querySelector('.surface-composer-card')
        || pageSource())
      : null;
    if (mainInput) anchors.push(mainInput);
    for (const anchor of anchors) {
      const list = providers(anchor);
      const ibCtx = list.find(p => p.value?.inputBoxRef && typeof p.value?.getLexicalEditor === 'function')?.value;
      const chatCtx = list.find(p => p.value?.inputBoxRef?.current)?.value;
      const box = ibCtx?.inputBoxRef?.current || chatCtx?.inputBoxRef?.current;
      const editor = box?.lexicalRef?.current || ibCtx?.getLexicalEditor?.();
      if (box || editor) return { box, editor };
    }
    return null;
  }

  function insertTextFallbackIntoComposer(editor, box, mentionText) {
    if (editor && typeof editor.setEditorState === 'function') {
      try {
        const curJson = editor.getEditorState?.()?.toJSON?.();
        if (curJson?.root && Array.isArray(curJson.root.children)) {
          const clone = JSON.parse(JSON.stringify(curJson));
          let lastPara = clone.root.children.at(-1);
          if (!lastPara || lastPara.type !== 'paragraph' || !Array.isArray(lastPara.children)) {
            lastPara = { children: [], direction: null, format: '', indent: 0, textFormat: 0, textStyle: '', type: 'paragraph', version: 1 };
            clone.root.children.push(lastPara);
          }
          const prevText = lastPara.children.at(-1)?.text || '';
          const prefix = prevText && !/\s$/.test(prevText) ? ' ' : '';
          lastPara.children.push({ detail: 0, format: 0, mode: 'normal', style: '', text: `${prefix}${mentionText} `, type: 'text', version: 1 });
          editor.setEditorState(parseEditorJson(editor, JSON.stringify(clone)));
          editor.focus?.();
          box?.getInputCardElement?.()?.scrollIntoView?.({ behavior: 'smooth', block: 'nearest' });
          return true;
        }
      } catch {}
    }
    if (typeof document !== 'undefined') {
      const ce = box?.getInputCardElement?.()?.querySelector?.('[contenteditable="true"]')
        || document.querySelector?.('[data-testid="agent-input-box"] [contenteditable="true"],[aria-label="Message input"]');
      if (ce) {
        ce.focus?.();
        if (typeof document.execCommand === 'function') {
          try {
            if (document.execCommand('insertText', false, `${mentionText} `)) return true;
          } catch {}
        }
      }
    }
    return false;
  }

  async function attachFileToComposer(fileInfo, sourceEl) {
    if (!fileInfo || typeof fileInfo !== 'object') throw new Error('文件信息无效');
    const target = findComposer(sourceEl);
    if (!target || (!target.box && !target.editor)) throw new Error('未找到可用的会话输入框');
    const { box, editor } = target;
    if (fileInfo.mode === 'media' && typeof box?.attachFiles === 'function' && typeof File === 'function') {
      let file = fileInfo.file && typeof fileInfo.file === 'object' && typeof fileInfo.file.size === 'number' ? fileInfo.file : null;
      if (!file && fileInfo.base64) {
        const raw = atob(fileInfo.base64);
        const bytes = new Uint8Array(raw.length);
        for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
        file = new File([bytes], fileInfo.name || 'attachment', { type: fileInfo.mimeType || 'application/octet-stream' });
      }
      if (file) {
        await box.attachFiles([file]);
        editor?.focus?.();
        box.getInputCardElement?.()?.scrollIntoView?.({ behavior: 'smooth', block: 'nearest' });
        return { ok: true, mode: 'media', name: fileInfo.name || file.name || '' };
      }
    }
    const uri = String(fileInfo.uri || '').trim();
    const isDir = Boolean(fileInfo.isDirectory || fileInfo.kind === 'directory');
    if (editor && uri) {
      if (isDir && typeof Gy === 'function' && typeof Shd === 'function') {
        try {
          Gy(editor, Shd('directory', uri));
          editor.focus?.();
          box?.getInputCardElement?.()?.scrollIntoView?.({ behavior: 'smooth', block: 'nearest' });
          return { ok: true, mode: 'mention', kind: 'directory', name: fileInfo.name || '' };
        } catch {}
      }
      if (!isDir && typeof MUa === 'function') {
        try {
          MUa(editor, uri);
          editor.focus?.();
          box?.getInputCardElement?.()?.scrollIntoView?.({ behavior: 'smooth', block: 'nearest' });
          return { ok: true, mode: 'mention', kind: 'file', name: fileInfo.name || '' };
        } catch {}
      }
      if (typeof Gy === 'function' && typeof Shd === 'function') {
        try {
          Gy(editor, Shd(isDir ? 'directory' : 'file', uri));
          editor.focus?.();
          box?.getInputCardElement?.()?.scrollIntoView?.({ behavior: 'smooth', block: 'nearest' });
          return { ok: true, mode: 'mention', kind: isDir ? 'directory' : 'file', name: fileInfo.name || '' };
        } catch {}
      }
      const fallbackRef = fileInfo.path ? `@${fileInfo.path}` : `[${fileInfo.name || 'file'}](${uri})`;
      if (insertTextFallbackIntoComposer(editor, box, fallbackRef)) {
        return { ok: true, mode: 'mention-text', kind: isDir ? 'directory' : 'file', name: fileInfo.name || '' };
      }
    }
    throw new Error('当前输入框暂不支持直接引用该文件');
  }

  let originalSend, wrappedSend, sendService, originalResolve, originalSegmentRender, stageSegmentRender;
  let stageUpdatesEnabled = false, runtimeEnabled = true;
  let pendingEdit = null;
  const editListeners = new Set(), notifyEdit = () => { for (const listener of editListeners) listener(pendingEdit); };
  function onEditChange(listener) { editListeners.add(listener); return () => editListeners.delete(listener); }

  const stageUpdateRule = 'During this task, communicate brief visible progress updates in the user-facing response alongside tool calls. Before the first substantial tool action, write one concise sentence explaining the immediate next action and its purpose. After a meaningful finding, change of direction, or a few execution steps, write one or two concise sentences stating the result and next action. These are intermediate updates, not final answers: continue executing the task after each update. Do not narrate every command. Do not put updates only in private thinking, tool summaries, task artifacts, or notify_user. Use the user language. Never invent progress or expose private reasoning.';

  function configureRequest(base) {
    try {
      const schemaI = typeof I === 'object' && I ? I : {};
      const config = cloneMsg(schemaI.CascadeConfigSchema, base);
      if (stageUpdatesEnabled) {
        config.plannerConfig ||= createMsg(schemaI.CascadePlannerConfigSchema, {});
        config.plannerConfig.noToolExplanation = false;
        config.plannerConfig.noToolSummary = false;
        const prompts = config.plannerConfig.promptSectionCustomizationConfig || createMsg(schemaI.PromptSectionCustomizationConfigSchema, {});
        const title = 'powertools_stage_updates';
        prompts.appendPromptSections = [
          ...(prompts.appendPromptSections || []).filter(p => p?.title !== title),
          createMsg(schemaI.PromptSectionSchema, { title, content: stageUpdateRule })
        ];
        config.plannerConfig.promptSectionCustomizationConfig = prompts;
      }
      return config;
    } catch {
      return base;
    }
  }

  function installRequestOverrides(source) {
    if (!sendService) {
      try {
        const resolved = service(source);
        sendService = resolved;
        originalSend = resolved.sendUserCascadeMessage;
      } catch { /* Conversation service may not be mounted yet during early boot (e.g. SSH window). */ }
    }
    const hasConfigOverride = stageUpdatesEnabled;
    if (hookNames.resolve && typeof globalThis[hookNames.resolve] === 'function') {
      originalResolve ||= globalThis[hookNames.resolve];
      globalThis[hookNames.resolve] = runtimeEnabled && hasConfigOverride
        ? function (...args) {
            const res = originalResolve(...args);
            return configureRequest(res);
          }
        : originalResolve;
    }
    if (originalSend) {
      wrappedSend ||= async function (payload, ...args) {
        const edit = runtimeEnabled && pendingEdit && payload?.cascadeId === pendingEdit.cascadeId ? pendingEdit : null;
        const activeConfigOverride = runtimeEnabled && stageUpdatesEnabled;
        const schemaI = typeof I === 'object' && I ? I : {};
        if (edit) {
          pendingEdit = null; suspendedEdits.delete(edit.cascadeId); restoreComposerHome(edit); installRequestOverrides(); notifyEdit();
          const optimisticRevert = edit.optimistic?.applyOptimisticRevert?.(edit.cascadeId, edit.stepIndex - 1);
          try {
            await (sendService || service()).cancelCascadeInvocation?.({ cascadeId: edit.cascadeId }).catch(() => {});
            await edit.stepHandler.revertToIndex(edit.cascadeId, edit.stepIndex - 1, { conversationOnly: true });
            const nextPayload = {
              ...payload,
              ...(payload.artifactComments?.length ? {} : { artifactComments: edit.comments.artifactComments }),
              ...(payload.fileDiffComments?.length ? {} : { fileDiffComments: edit.comments.fileDiffComments }),
              ...(payload.fileComments?.length ? {} : { fileComments: edit.comments.fileComments }),
              cascadeConfig: activeConfigOverride ? configureRequest(createMsg(schemaI.CascadeConfigSchema, payload.cascadeConfig || {})) : payload.cascadeConfig
            };
            delete nextPayload.deliveryStrategy;
            return await originalSend.call(this, nextPayload, ...args);
          } finally { optimisticRevert?.dispose?.(); }
        }
        const configured = activeConfigOverride
          ? { ...payload, cascadeConfig: configureRequest(createMsg(schemaI.CascadeConfigSchema, payload.cascadeConfig || {})) }
          : payload;
        return originalSend.call(this, configured, ...args);
      };
      sendService.sendUserCascadeMessage = runtimeEnabled ? wrappedSend : originalSend;
    }
  }

  function ensureRequestHook(source) {
    if (!runtimeEnabled) return;
    try { installRequestOverrides(source); } catch {}
  }

  function setEnabled(enabled) {
    runtimeEnabled = enabled !== false;
    if (!runtimeEnabled) { cancelEdit(); suspendedEdits.clear(); }
    setStageUpdates(stageUpdatesEnabled);
  }

  function setStageUpdates(enabled) {
    stageUpdatesEnabled = enabled === true;
    installRequestOverrides();
    if (hookNames.segment && typeof globalThis[hookNames.segment] === 'function') {
      originalSegmentRender ||= globalThis[hookNames.segment];
      stageSegmentRender ||= function (...args) {
        const result = originalSegmentRender(...args);
        try {
          if (!runtimeEnabled || !stageUpdatesEnabled || result?.body?.type !== 'collapsible') return result;
          const groups = result.body.content?.groups || [];
          const isUpdate = g => g?.type === 'step' && g.step?.step?.case === 'plannerResponse' && g.step.step.value?.response?.trim();
          const leading = result.leadingSteps || [], updates = leading.filter(isUpdate);
          if (!updates.length && !groups.some(isUpdate)) return result;
          const active = result.body.isActive || (args[0]?.isRunning && args[0]?.isLastTurn && args[0]?.segment?.isLatest);
          if (active) return { ...result, body: { type: 'inline', content: result.body.content } };
          return {
            ...result,
            leadingSteps: leading.filter(g => !isUpdate(g)),
            body: {
              ...result.body,
              defaultExpanded: false,
              isActive: false,
              triggerVisible: true,
              content: { ...result.body.content, groups: [...updates, ...groups] }
            }
          };
        } catch {
          return result;
        }
      };
      globalThis[hookNames.segment] = runtimeEnabled && stageUpdatesEnabled ? stageSegmentRender : originalSegmentRender;
    }
  }

  function findParentLayoutRoute(r) {
    const byId = r?.routesById;
    if (!byId || typeof byId !== 'object') return null;
    if (byId['/manager-layout/manager-landing-layout']) return byId['/manager-layout/manager-landing-layout'];
    for (const siblingPath of ['/customizations', '/automations']) {
      const match = Object.values(byId).find(rt => rt && (rt.options?.path === siblingPath || rt.fullPath === siblingPath || rt.path === siblingPath));
      if (match?.parentRoute && (typeof match.parentRoute.addChildren === 'function' || Array.isArray(match.parentRoute.children))) return match.parentRoute;
    }
    return Object.values(byId).find(rt => rt && Array.isArray(rt.children) && rt.id !== '__root__') || null;
  }

  function installPage(component) {
    try {
      const r = router();
      const routeFactory = typeof VD === 'function'
        ? VD
        : (typeof globalThis.createFileRoute === 'function'
          ? (opts => {
              const created = globalThis.createFileRoute('/powertools')(opts);
              if (created && !created.path) created.path = '/powertools';
              if (created && !created.fullPath) created.fullPath = '/powertools';
              return created;
            })
          : null);
      if (!r || typeof routeFactory !== 'function') return false;
      const existing = Object.values(r.routesById || {}).find(rt => rt && (rt.options?.path === '/powertools' || rt.fullPath === '/powertools' || rt.path === '/powertools'));
      if (existing && typeof existing.update === 'function') {
        existing.update({ component });
        if (typeof location === 'object' && location.pathname === '/powertools') {
          void r.navigate({ to: '/customizations', replace: true }).then(() => r.navigate({ to: '/powertools', replace: true })).catch(() => {});
        }
        return true;
      }
      const parent = findParentLayoutRoute(r);
      if (!parent || (typeof parent.addChildren !== 'function' && !Array.isArray(parent.children))) return false;
      const children = Array.isArray(parent.children) ? parent.children : [];
      const pending = children.find(route => route?.options?.path === '/powertools' || route?.path === '/powertools');
      if (pending && typeof pending.update === 'function') {
        pending.update({ component });
      } else {
        const nextRoute = routeFactory({ getParentRoute: () => parent, path: '/powertools', component });
        const nextChildren = [...children, nextRoute];
        if (typeof parent.addChildren === 'function') parent.addChildren(nextChildren);
        else parent.children = nextChildren;
      }
      r.routeTree = null;
      r.update?.({ routeTree: r.options?.routeTree });
      r.buildRouteTree?.();
      if (typeof location === 'object' && location.pathname === '/powertools') void r.load?.();
      return true;
    } catch {
      return false;
    }
  }

  function extractFinalResponseFromSteps(steps) {
    if (!Array.isArray(steps) || !steps.length) return { finalText: '', hasIntermediate: false };
    let trailing = [];
    let lastPlannerText = '';
    let hasIntermediate = false;
    let seenAnswerCount = 0;
    for (const item of steps) {
      const c = item?.step?.case;
      const v = item?.step?.value;
      if (!c || c === 'userInput' || c === 'systemMessage' || c === 'checkpoint' || c === 'ephemeralMessage') continue;
      if (c === 'plannerResponse') {
        const text = String(v?.modifiedResponse || v?.response || '').trim();
        const hasTools = Array.isArray(v?.toolCalls) && v.toolCalls.length > 0;
        if (text) {
          lastPlannerText = text;
          seenAnswerCount++;
        }
        if (hasTools) {
          hasIntermediate = true;
          trailing = [];
        } else if (text) {
          if (seenAnswerCount > 1) hasIntermediate = true;
          trailing.push(text);
        }
      } else if (c === 'notifyUser') {
        const text = String(v?.message || '').trim();
        if (text) {
          lastPlannerText = text;
          seenAnswerCount++;
          trailing.push(text);
        }
      } else {
        hasIntermediate = true;
        trailing = [];
      }
    }
    const finalText = (trailing.length ? trailing.join('\n\n') : lastPlannerText).trim();
    return { finalText, hasIntermediate };
  }

  function finalResponseText(element) {
    for (let node = fiber(element); node; node = node.return) {
      const steps = node.memoizedProps?.steps;
      if (Array.isArray(steps) && steps.length) {
        return extractFinalResponseFromSteps(steps);
      }
    }
    return { finalText: '', hasIntermediate: false };
  }

  function userMessage(element) {
    for (let node = fiber(element); node; node = node.return) {
      const props = node.memoizedProps;
      if (props?.step?.items && props.metadata && props.cascadeId) return props;
    }
    return null;
  }

  function navigateTurn(turn) {
    const source = document.querySelector?.('[data-testid="user-input-step"],[data-testid="agent-response"]');
    const nav = providers(source).find(p => typeof p.value?.jumpTo === 'function' && Array.isArray(p.value.turns))?.value;
    const index = nav?.turns.findIndex(item => item.startStepIndex === turn.stepIndexStart) ?? -1;
    if (index >= 0) { nav.jumpTo(index); return true; }
    for (const element of document.querySelectorAll?.('[data-testid="user-input-step"]') || []) {
      const message = userMessage(element);
      if (message && stepIndexOf(message.metadata) === turn.stepIndexStart) {
        element.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
        return true;
      }
    }
    return false;
  }

  function replaceText(items, text) {
    let inserted = false;
    const result = items.flatMap(item => {
      if (item.chunk?.case !== 'text') return [item];
      if (inserted) return [];
      inserted = true;
      return [{ ...item, chunk: { case: 'text', value: text } }];
    });
    if (!inserted) result.unshift({ chunk: { case: 'text', value: text } });
    return result;
  }

  async function editAndResend(element, text) {
    if (!text.trim()) throw new Error('请输入消息');
    const message = userMessage(element);
    const context = providers(element).find(p => typeof p.value?.sendMessage === 'function' && p.value?.stepHandler)?.value;
    if (!message || !context?.stepHandler?.revertToIndex) throw new Error('当前消息不支持编辑');
    const stepIndex = stepIndexOf(message.metadata);
    const items = replaceText(message.step.items, text);
    let reverted = false;
    try {
      await context.stepHandler.revertToIndex(message.cascadeId, stepIndex - 1, { conversationOnly: true });
      reverted = true;
      await context.sendMessage({
        type: 1,
        cascadeId: message.cascadeId,
        items,
        media: message.step.media || [],
        resend: 'edit',
        commentOverrides: {
          artifactComments: message.step.artifactComments || [],
          fileDiffComments: message.step.fileDiffComments || [],
          fileComments: message.step.fileComments || []
        }
      });
      return { conversationId: message.cascadeId, replacedStepIndex: stepIndex };
    } catch (error) {
      if (reverted) {
        const box = context.inputBoxRef?.current;
        const editor = box?.lexicalRef?.current;
        if (editor) {
          try {
            editor.setEditorState(parseEditorJson(editor, serializeUserItems(items)));
            box.setMediaAttachments?.(message.step.media || []);
          } catch {}
        }
      }
      throw error;
    }
  }

  async function forkPoint(conversationId, stepIndex) {
    if (stepIndex === -1) return -1;
    const data = await service().getCascadeTrajectory({ cascadeId: conversationId });
    const steps = data.trajectory.steps;
    const next = steps.find(step => stepIndexOf(step.metadata) > stepIndex && step.step?.case === 'userInput');
    return next ? stepIndexOf(next.metadata) - 1 : -1;
  }

  function nextBranchTitle(sourceTitle, existingTitles = []) {
    const base = String(sourceTitle || '').trim().replace(/\s*\(\d+\)$/, '').trim() || '分支会话';
    const taken = new Set((existingTitles || []).map(item => String(item || '').trim()).filter(Boolean));
    let index = 1;
    while (taken.has(`${base} (${index})`)) index++;
    return `${base} (${index})`;
  }

  async function renameForkedConversation(sourceId, newId, fallbackTitle = '') {
    if (!sourceId || !newId || sourceId === newId) return null;
    const svc = service();
    if (typeof svc.updateConversationAnnotations !== 'function') return null;
    const map = store()?.getState?.()?.trajectorySummaries?.summaries || {};
    const sourceEntry = map[sourceId];
    const domSourceTitle = typeof document !== 'undefined'
      ? document.querySelector?.(`a[href="/c/${sourceId}"],a[href^="/c/${sourceId}?"]`)?.textContent?.trim()
      : '';
    const sourceTitle = (sourceEntry?.annotations?.title || sourceEntry?.summary || domSourceTitle || fallbackTitle || '').trim();
    const summaryTitles = Object.values(map).map(entry => (entry?.annotations?.title || entry?.summary || '').trim());
    const domTitles = typeof document !== 'undefined'
      ? [...(document.querySelectorAll?.('a[href^="/c/"]') || [])].map(el => el.textContent?.trim())
      : [];
    const title = nextBranchTitle(sourceTitle, [...summaryTitles, ...domTitles]);
    const annotations = typeof YF === 'object' && YF?.ConversationAnnotationsSchema
      ? createMsg(YF.ConversationAnnotationsSchema, { title })
      : { title };
    const apply = () => svc.updateConversationAnnotations([newId], annotations, true);
    try { await apply(); } catch {}
    if (typeof setTimeout === 'function') setTimeout(() => { void Promise.resolve(apply()).catch(() => {}); }, 450);
    return title;
  }

  function isSubagentForkError(error) {
    return /invoked subagents/i.test(String(error?.message || error || ''));
  }

  async function forkViaSideQuestion(conversationId, targetStepIndex = -1) {
    const svc = service();
    if (typeof svc.startCascade !== 'function' || typeof svc.forkConversation !== 'function') {
      throw new Error('Side question fork promotion is unavailable');
    }
    const sqId = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now().toString(16)}-${Math.random().toString(16).slice(2, 10)}`;
    const schemaI = typeof I === 'object' && I ? I : {};
    const baseTrajectoryIdentifier = schemaI.BaseTrajectoryIdentifierSchema
      ? createMsg(schemaI.BaseTrajectoryIdentifierSchema, { identifier: { case: 'cascadeId', value: conversationId } })
      : { identifier: { case: 'cascadeId', value: conversationId } };
    let started = false;
    try {
      await svc.startCascade({
        cascadeId: sqId,
        trajectoryType: 22,
        source: 1,
        baseTrajectoryIdentifier
      });
      started = true;
      return await svc.forkConversation({
        sourceCascadeId: sqId,
        forkAtStepIndex: targetStepIndex,
        targetForkWorkspace: 1
      });
    } finally {
      if (started && typeof svc.deleteCascadeTrajectory === 'function') {
        try { await svc.deleteCascadeTrajectory(sqId); } catch {}
      }
    }
  }

  async function fork(conversationId, stepIndex = -1, { exact = false, autoRename = true, allowSideQuestionFallback = true } = {}) {
    if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,127}$/.test(conversationId || '') || !Number.isInteger(stepIndex) || stepIndex < -1) throw new Error('Invalid fork point');
    if (!exact) stepIndex = await forkPoint(conversationId, stepIndex);
    const svc = service();
    let response, promotedViaSideQuestion = false;
    try {
      response = await svc.forkConversation({ sourceCascadeId: conversationId, forkAtStepIndex: stepIndex, targetForkWorkspace: 1 });
    } catch (error) {
      if (!allowSideQuestionFallback || !isSubagentForkError(error) || typeof svc.startCascade !== 'function') throw error;
      response = await forkViaSideQuestion(conversationId, stepIndex);
      promotedViaSideQuestion = true;
    }
    if (!response?.newCascadeId) throw new Error('Antigravity returned no forked conversation');
    if (autoRename) await renameForkedConversation(conversationId, response.newCascadeId);
    return { conversationId: response.newCascadeId, projectId: response.newProjectId || '', forkedAtStepIndex: response.forkedAtStepIndex, warnings: response.warnings || [], promotedViaSideQuestion };
  }

  async function hydrateMedia(media, stepHandler) {
    return (await Promise.all((media || []).map(async item => {
      if (item?.uri && !(item.payload?.case === 'inlineData' && item.payload.value?.length > 0)) {
        const url = stepHandler?.resolveArtifactUrl?.(item.uri);
        if (url && typeof fetch === 'function') {
          try {
            const res = await fetch(url);
            if (res.ok) {
              const bytes = new Uint8Array(await res.arrayBuffer());
              return { ...item, uri: '', payload: { case: 'inlineData', value: bytes } };
            }
          } catch {}
        }
      }
      return item;
    }))).filter(Boolean);
  }

  const suspendedEdits = new Map();
  function snapshotEditorState(editor) {
    const state = editor?.getEditorState?.();
    let json = null;
    try { const raw = state?.toJSON?.(); if (raw && typeof raw === 'object') json = JSON.stringify(raw); } catch {}
    return { state, json };
  }

  function applyEditorSnapshot(editor, snapshot) {
    if (!editor?.setEditorState || !snapshot) return;
    try {
      if (snapshot.json) { editor.setEditorState(parseEditorJson(editor, snapshot.json)); return; }
    } catch {}
    try { if (snapshot.state) editor.setEditorState(snapshot.state); } catch {}
  }

  function restoreComposerHome(record) {
    if (!record) return;
    try {
      if (record.inputBox && record.homeParent && record.homeParent.isConnected !== false) {
        const refNode = record.homeNext?.parentNode === record.homeParent ? record.homeNext : null;
        if (record.inputBox.parentNode !== record.homeParent || record.inputBox.nextSibling !== refNode) {
          record.homeParent.insertBefore(record.inputBox, refNode);
        }
      }
      record.inlineHost?.remove?.();
      record.element?.removeAttribute?.('data-agy-editing-target');
    } catch {}
  }

  function extractInlineEditText(edit) {
    try {
      const editor = edit?.editor;
      const st = editor?.getEditorState?.();
      if (st && typeof st.toJSON === 'function') {
        const json = st.toJSON();
        const collect = node => {
          if (!node || typeof node !== 'object') return '';
          if (typeof node.text === 'string') return node.text;
          if (Array.isArray(node.children)) {
            const sep = node.type === 'root' ? '\n' : '';
            return node.children.map(collect).join(sep);
          }
          return '';
        };
        const t = collect(json?.root).trim();
        if (t) return t;
      }
    } catch {}
    try {
      const ce = edit?.inlineHost?.querySelector?.('[contenteditable="true"]') || edit?.inputBox?.querySelector?.('[contenteditable="true"]');
      const t = String(ce?.innerText ?? ce?.textContent ?? '').trim();
      if (t) return t;
    } catch {}
    return '';
  }

  async function submitPendingEditDirectly(edit) {
    if (!edit || edit.submitting || pendingEdit !== edit) return false;
    const text = extractInlineEditText(edit);
    const media = [...(edit.box?.getMediaAttachments?.() || [])];
    if (!text && !media.length) return false;
    edit.submitting = true;
    pendingEdit = null;
    suspendedEdits.delete(edit.cascadeId);
    const origItems = Array.isArray(edit.messageItems) ? edit.messageItems : [];
    const nextItems = replaceText(origItems, text);
    restoreComposerHome(edit);
    applyEditorSnapshot(edit.editor, edit.savedSnapshot);
    try { edit.box?.setMediaAttachments?.(edit.savedMedia || []); } catch {}
    installRequestOverrides();
    notifyEdit();
    const optimisticRevert = edit.optimistic?.applyOptimisticRevert?.(edit.cascadeId, edit.stepIndex - 1);
    let reverted = false;
    try {
      try { await (sendService || service(edit.element)).cancelCascadeInvocation?.({ cascadeId: edit.cascadeId }); } catch {}
      await edit.stepHandler.revertToIndex(edit.cascadeId, edit.stepIndex - 1, { conversationOnly: true });
      reverted = true;
      const sendFn = edit.sendMessage;
      if (typeof sendFn === 'function') {
        await sendFn({
          type: 1,
          cascadeId: edit.cascadeId,
          items: nextItems,
          media,
          resend: 'edit',
          commentOverrides: edit.comments
        });
      } else {
        throw new Error('当前会话发送控制器不可用');
      }
      return true;
    } catch (error) {
      if (reverted && edit.editor) {
        try {
          edit.editor.setEditorState(parseEditorJson(edit.editor, serializeUserItems(nextItems)));
          edit.box?.setMediaAttachments?.(media);
        } catch {}
      }
      throw error;
    } finally {
      optimisticRevert?.dispose?.();
    }
  }

  function mountInlineEdit({ element, cascadeId, stepIndex, messageItems, chatCtx, optCtx, box, editor, inputBox, homeParent, homeNext, savedSnapshot, savedMedia, comments, label, cancelLabel }) {
    let inlineHost = null;
    if (inputBox && homeParent && typeof document.createElement === 'function') {
      inlineHost = document.createElement('div');
      inlineHost.dataset.agyEditorSlot = '';
      inlineHost.dataset.testid = 'agy-inline-edit-host';
      inlineHost.className = 'w-full flex flex-col gap-1.5';
      const header = document.createElement('div');
      header.dataset.testid = 'agy-edit-banner';
      header.className = 'flex items-center justify-between gap-2 px-2 py-1 rounded-lg border border-border bg-secondary/70 text-sm text-secondary-foreground select-none';
      const title = document.createElement('span');
      title.className = 'truncate';
      title.textContent = label;
      const cancelButton = document.createElement('button');
      cancelButton.type = 'button';
      cancelButton.dataset.testid = 'agy-edit-cancel';
      cancelButton.className = 'shrink-0 px-2 py-0.5 rounded-md border border-border bg-card text-foreground hover:bg-secondary transition-colors cursor-pointer';
      cancelButton.textContent = cancelLabel;
      cancelButton.addEventListener('click', event => { event.stopPropagation(); cancelEdit(); });
      header.append(title, cancelButton);
      inlineHost.append(header);
      const hasOpenPopup = () => Boolean(document.querySelector?.('[role="listbox"],[role="menu"],[data-select-popup],[data-testid="agy-context-popup"],[data-testid="agy-stats-popup"]'));
      const requiresModEnter = target => {
        for (const el of [target, inputBox]) {
          for (let node = fiber(el); node; node = node.return) {
            const props = node.memoizedProps;
            if (!props || typeof props !== 'object') continue;
            if (typeof props.sendWithModEnter === 'boolean') return props.sendWithModEnter;
            if (typeof props.sendWithEnter === 'boolean') return !props.sendWithEnter;
          }
        }
        return false;
      };
      inlineHost.addEventListener('keydown', event => {
        if (event.key === 'Escape' && !event.defaultPrevented && !hasOpenPopup()) {
          event.preventDefault(); event.stopPropagation(); cancelEdit();
          return;
        }
        const hasMod = Boolean(event.ctrlKey) !== Boolean(event.metaKey);
        const plainEnter = !event.ctrlKey && !event.metaKey;
        const modRequired = requiresModEnter(event.target);
        const isSubmitCombo = !event.shiftKey && !event.altKey && (hasMod || (!modRequired && plainEnter));
        if (event.key === 'Enter' && isSubmitCombo && !event.isComposing && event.keyCode !== 229 && !hasOpenPopup() && pendingEdit && pendingEdit.inlineHost === inlineHost) {
          const inEditor = Boolean(event.target?.closest?.('[contenteditable="true"]'));
          if (inEditor && typeof pendingEdit.sendMessage === 'function') {
            event.preventDefault();
            event.stopImmediatePropagation?.();
            event.stopPropagation();
            void submitPendingEditDirectly(pendingEdit).catch(() => {});
          }
        }
      }, true);
      inlineHost.addEventListener('click', event => {
        if (!pendingEdit || pendingEdit.inlineHost !== inlineHost || typeof pendingEdit.sendMessage !== 'function') return;
        if (event.target?.closest?.('[data-testid="agy-edit-cancel"]')) return;
        const sendBtn = event.target?.closest?.('[data-testid="send-button"],button[aria-label="Send message"],button[aria-label="发送消息"],button[aria-label="傳送訊息"]');
        if (sendBtn && !sendBtn.disabled) {
          event.preventDefault();
          event.stopImmediatePropagation?.();
          event.stopPropagation();
          void submitPendingEditDirectly(pendingEdit).catch(() => {});
        }
      }, true);
      element.setAttribute?.('data-agy-editing-target', '');
      if (element.prepend) element.prepend(inlineHost); else element.insertBefore?.(inlineHost, element.firstChild || null);
      inlineHost.append(inputBox);
    }
    pendingEdit = { cascadeId, stepIndex, messageItems: Array.isArray(messageItems) ? messageItems : [], element, box, editor, inputBox, homeParent, homeNext, inlineHost, stepHandler: chatCtx.stepHandler, sendMessage: chatCtx.sendMessage, optimistic: optCtx, savedEditorState: savedSnapshot?.state, savedSnapshot, savedMedia, comments, label, cancelLabel };
    installRequestOverrides(element); notifyEdit();
    editor.focus?.(); (inlineHost || box.getInputCardElement?.())?.scrollIntoView?.({ behavior: 'smooth', block: 'nearest' });
    return pendingEdit;
  }

  function suspendEdit() {
    if (!pendingEdit) return null;
    const current = pendingEdit; pendingEdit = null;
    const editSnapshot = snapshotEditorState(current.editor);
    const editMedia = [...(current.box?.getMediaAttachments?.() || [])];
    const record = {
      cascadeId: current.cascadeId,
      stepIndex: current.stepIndex,
      messageItems: current.messageItems,
      editSnapshot,
      editMedia,
      savedSnapshot: current.savedSnapshot,
      savedMedia: current.savedMedia,
      comments: current.comments,
      label: current.label,
      cancelLabel: current.cancelLabel
    };
    suspendedEdits.set(current.cascadeId, record);
    restoreComposerHome(current);
    applyEditorSnapshot(current.editor, current.savedSnapshot);
    try { current.box?.setMediaAttachments?.(current.savedMedia || []); } catch {}
    installRequestOverrides(); notifyEdit();
    return record;
  }

  function getSuspendedEdit(cascadeId) { return cascadeId ? suspendedEdits.get(cascadeId) || null : null; }
  function clearSuspendedEdits(cascadeId) { if (cascadeId) suspendedEdits.delete(cascadeId); else suspendedEdits.clear(); }

  function cancelEdit({ restoreDraft = true } = {}) {
    if (!pendingEdit) return false;
    const current = pendingEdit; pendingEdit = null; suspendedEdits.delete(current.cascadeId); restoreComposerHome(current); installRequestOverrides();
    if (restoreDraft) {
      applyEditorSnapshot(current.editor, current.savedSnapshot);
      try { current.box?.setMediaAttachments?.(current.savedMedia || []); } catch {}
    }
    notifyEdit(); return true;
  }

  async function beginEdit(element, { label = '正在编辑此条消息（发送后将从此处重新生成）', cancelLabel = '取消' } = {}) {
    const message = userMessage(element);
    const list = providers(element);
    const chatCtx = list.find(p => p.value?.stepHandler?.revertToIndex)?.value;
    const ibCtx = list.find(p => p.value?.inputBoxRef && typeof p.value?.getLexicalEditor === 'function')?.value;
    const optCtx = list.find(p => typeof p.value?.applyOptimisticRevert === 'function')?.value;
    const box = ibCtx?.inputBoxRef?.current || chatCtx?.inputBoxRef?.current;
    const editor = box?.lexicalRef?.current || ibCtx?.getLexicalEditor?.();
    const canParse = typeof IJ === 'function' || typeof editor?.parseEditorState === 'function';
    if (!message || !chatCtx?.stepHandler?.revertToIndex || !box || !editor || !canParse) throw new Error('当前消息不支持编辑');
    const stepIndex = stepIndexOf(message.metadata);
    const view = element.closest?.('[data-testid="conversation-view"]');
    const inputBox = view?.querySelector?.('[data-testid="agent-input-box"]') || box.getInputCardElement?.()?.closest?.('[data-testid="agent-input-box"],.surface-composer-card') || null;
    const sameConvo = pendingEdit?.cascadeId === message.cascadeId;
    const priorSuspended = !sameConvo ? suspendedEdits.get(message.cascadeId) : null;
    suspendedEdits.delete(message.cascadeId);
    const savedSnapshot = sameConvo ? pendingEdit.savedSnapshot : priorSuspended ? priorSuspended.savedSnapshot : snapshotEditorState(editor);
    const savedMedia = sameConvo ? pendingEdit.savedMedia : priorSuspended ? priorSuspended.savedMedia : [...(box.getMediaAttachments?.() || [])];
    const homeParent = sameConvo && pendingEdit.homeParent ? pendingEdit.homeParent : inputBox?.parentElement || null;
    const homeNext = sameConvo && pendingEdit.homeParent ? pendingEdit.homeNext : inputBox?.nextSibling || null;
    if (pendingEdit) {
      if (pendingEdit.cascadeId !== message.cascadeId) suspendEdit();
      else { pendingEdit.inlineHost?.remove?.(); pendingEdit.element?.removeAttribute?.('data-agy-editing-target'); }
    }
    try {
      editor.setEditorState(parseEditorJson(editor, serializeUserItems(message.step.items || [])));
    } catch {
      editor.setEditorState(parseEditorJson(editor, fallbackSerializeItems(message.step.items || [])));
    }
    const media = await hydrateMedia(message.step.media, chatCtx.stepHandler);
    box.setMediaAttachments?.(media);
    chatCtx.restoreReviewComments?.({ cascadeId: message.cascadeId, comments: message.step });
    return mountInlineEdit({
      element, cascadeId: message.cascadeId, stepIndex, messageItems: message.step.items || [], chatCtx, optCtx, box, editor, inputBox, homeParent, homeNext, savedSnapshot, savedMedia,
      comments: { artifactComments: message.step.artifactComments || [], fileDiffComments: message.step.fileDiffComments || [], fileComments: message.step.fileComments || [] },
      label, cancelLabel
    });
  }

  function resumeEdit(element) {
    if (pendingEdit || !element) return null;
    const message = userMessage(element);
    if (!message) return null;
    const suspended = suspendedEdits.get(message.cascadeId);
    if (!suspended || stepIndexOf(message.metadata) !== suspended.stepIndex) return null;
    const list = providers(element);
    const chatCtx = list.find(p => p.value?.stepHandler?.revertToIndex)?.value;
    const ibCtx = list.find(p => p.value?.inputBoxRef && typeof p.value?.getLexicalEditor === 'function')?.value;
    const optCtx = list.find(p => typeof p.value?.applyOptimisticRevert === 'function')?.value;
    const box = ibCtx?.inputBoxRef?.current || chatCtx?.inputBoxRef?.current;
    const editor = box?.lexicalRef?.current || ibCtx?.getLexicalEditor?.();
    const view = element.closest?.('[data-testid="conversation-view"]');
    const inputBox = view?.querySelector?.('[data-testid="agent-input-box"]') || box?.getInputCardElement?.()?.closest?.('[data-testid="agent-input-box"],.surface-composer-card') || null;
    const homeParent = inputBox?.parentElement || null;
    const homeNext = inputBox?.nextSibling || null;
    if (!chatCtx?.stepHandler?.revertToIndex || !box || !editor || !inputBox || !homeParent) return null;
    suspendedEdits.delete(message.cascadeId);
    applyEditorSnapshot(editor, suspended.editSnapshot);
    try { box.setMediaAttachments?.(suspended.editMedia || []); } catch {}
    return mountInlineEdit({
      element, cascadeId: suspended.cascadeId, stepIndex: suspended.stepIndex, messageItems: suspended.messageItems || message.step.items || [], chatCtx, optCtx, box, editor, inputBox, homeParent, homeNext,
      savedSnapshot: suspended.savedSnapshot, savedMedia: suspended.savedMedia, comments: suspended.comments,
      label: suspended.label, cancelLabel: suspended.cancelLabel
    });
  }

  globalThis.__agyNativeAdapter = {
    version,
    get active() { return !disposed; },
    get stageUpdates() { return runtimeEnabled && stageUpdatesEnabled; },
    get pendingEdit() { return pendingEdit; },
    stepIndexOf,
    onEditChange, beginEdit, suspendEdit, resumeEdit, getSuspendedEdit, clearSuspendedEdits, cancelEdit,
    ensureRequestHook, fiber, providers, service, wrap, store, subscribeStore, router, overview, capabilities,
    executionState, runningConversationIds, unreadCount, conversationDirectory, subagents, openSubagent,
    composerCascadeId, fileTreeEntry, findComposer, attachFileToComposer, setEnabled, setStageUpdates,
    installPage, fork, forkViaSideQuestion, forkPoint, nextBranchTitle, renameForkedConversation,
    userMessage, extractFinalResponseFromSteps, finalResponseText, navigateTurn, replaceText, editAndResend,
    dispose() {
      disposed = true;
      suspendedEdits.clear();
      cancelEdit({ restoreDraft: false });
      editListeners.clear();
      if (sendService && originalSend) sendService.sendUserCascadeMessage = originalSend;
      if (originalResolve && hookNames.resolve) globalThis[hookNames.resolve] = originalResolve;
      if (originalSegmentRender && hookNames.segment && globalThis[hookNames.segment] === stageSegmentRender) globalThis[hookNames.segment] = originalSegmentRender;
    }
  };
  try { if (pageSource()) installRequestOverrides(); } catch {}
})();
