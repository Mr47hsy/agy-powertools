import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import vm from 'node:vm';
import { toZhTw } from '../lib/zh-tw.mjs';
import { renderAuxPaneHtml } from '../lib/sidecar-ui.mjs';
import { formatRelativeTime, formatResetCountdown } from '../lib/account-helpers.mjs';
import { createSettingsStore } from '../lib/settings.mjs';

test('Powertools internal dictionary translates plugin UI labels across zh-CN, zh-TW, and en without touching native DOM', () => {
  let domWalked = 0;
  let observerCreated = 0;
  const nativeNode = { nodeValue: 'Settings' };
  const document = {
    nodeType: 9,
    body: nativeNode,
    createTreeWalker: () => { domWalked++; return { nextNode: () => nativeNode }; },
    querySelectorAll: () => { domWalked++; return []; }
  };
  const context = vm.createContext({
    document,
    MutationObserver: class { constructor() { observerCreated++; } observe() {} disconnect() {} },
    __agyToZhTw: toZhTw
  });
  vm.runInContext(readFileSync('lib/native-i18n.js', 'utf8'), context);
  const t = context.__agyI18n.t;

  // Verify native DOM is never scanned, observed, or mutated
  assert.equal(domWalked, 0);
  assert.equal(observerCreated, 0);
  assert.equal(nativeNode.nodeValue, 'Settings');
  assert.equal(typeof context.__agyI18n.localizer, 'undefined');

  // Verify bidirectional plugin UI label translation
  assert.equal(t('输入', 'en'), 'Input');
  assert.equal(t('输出', 'en'), 'Output');
  assert.equal(t('缓存读取', 'en'), 'Cache read');
  assert.equal(t('上下文窗口', 'en'), 'Context window');
  assert.equal(t('上下文窗口', 'zh-TW'), '上下文視窗');
  assert.equal(t('当前会话', 'en'), 'Current conversation');
  assert.equal(t('当前会话', 'zh-TW'), '目前會話');
  assert.equal(t('设置', 'en'), 'Settings');
  assert.equal(t('设置', 'zh-TW'), '設定');
  assert.equal(t('恢复默认设置', 'en'), 'Restore defaults');
  assert.equal(t('恢复默认设置', 'zh-TW'), '恢復預設設定');
  assert.equal(t('分支会话', 'en'), 'Branch conversation');
  assert.equal(t('分支会话', 'zh-TW'), '分支會話');
  assert.equal(t('编辑消息', 'en'), 'Edit message');
  assert.equal(t('引用到输入框', 'en'), 'Attach to chat');
  assert.equal(t('引用到输入框', 'zh-TW'), '引用到輸入框');
});

test('Traditional Chinese (zh-TW) converts all Powertools UI strings cleanly and persists in settings', () => {
  assert.equal(toZhTw('复制文件并恢复默认设置，助手回复缓存异常'), '複製檔案並恢復預設設定，助手回覆快取異常');
  assert.equal(toZhTw('按实际规划 / 执行模型计价'), '按實際規劃 / 執行模型計價');
  assert.equal(formatRelativeTime(0, 30000, 'zh-TW'), '剛剛');
  assert.equal(formatRelativeTime(0, 120000, 'zh-TW'), '2 分鐘前');
  assert.equal(formatResetCountdown(7200000, 0, 'zh-TW'), '2 小時後重置');

  const html = renderAuxPaneHtml({ version: '2.16.6', language: 'zh-TW' });
  assert.match(html, /<html lang="zh-TW">/);
  assert.ok(html.includes('需要重啟 Antigravity 以啟用 Powertools 外掛'));
  assert.ok(html.includes('檢查外掛更新'));

  const dir = mkdtempSync(join(tmpdir(), 'agy-lang-tw-'));
  try {
    const store = createSettingsStore(dir);
    assert.equal(store.set({ language: 'zh-TW' }).language, 'zh-TW');
    assert.equal(store.get().language, 'zh-TW');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }

  const simplifiedOnly = /[万与个为义于产仅从仓们价优会传体余侧关内写准减凑凭击划则刚创删务动区协单占却历压参发变号后听启周响唤围图圆场声处备头夹实审对导将尝尽层带帮并广库应开异强归当录径忆态总战执扩扬抢护报担拦择挂换据数断无旧时昵显暂机权条来栏树样档检汇没洁浅测浏滚满点热状独环现电监盘码确碍离积称稳筛签简类紧级线组细织终结给络绝统继续缓编缩网联脑范营补装观规视览触计订认让议记许设访证识诊试话询该详语误说请读调败账费资转轮软载较辅辑输边过运这进远违连迟适选遥邮采钟钥钮链销错键长闭问闲间阅队阶际险随隐静页顶项顺顿预频题额风馈驻验骤麦标彻]/;
  for (const file of ['lib/native-i18n.js', 'lib/native-panels.js', 'lib/native-ui.js', 'lib/sidecar-ui.mjs']) {
    const converted = toZhTw(readFileSync(file, 'utf8')).replace(/简体中文|批准/g, '');
    const leftover = converted.match(simplifiedOnly);
    assert.equal(leftover, null, `Unexpected simplified glyph ${leftover?.[0]} in ${file}`);
  }
});
