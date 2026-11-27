import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { renderAuxPaneHtml } from '../lib/sidecar-ui.mjs';

test('Powertools auxiliary web UI renders fixed Simplified Chinese without multi-language or multi-account modules', () => {
  assert.equal(existsSync(new URL('../lib/native-i18n.js', import.meta.url)), false);
  assert.equal(existsSync(new URL('../lib/zh-tw.mjs', import.meta.url)), false);
  assert.equal(existsSync(new URL('../lib/accounts.mjs', import.meta.url)), false);
  assert.equal(existsSync(new URL('../lib/credential-vault.mjs', import.meta.url)), false);
  assert.equal(existsSync(new URL('../lib/account-helpers.mjs', import.meta.url)), false);

  const html = renderAuxPaneHtml({ version: '2.16.8' });
  assert.match(html, /<html lang="zh-CN">/);
  assert.ok(html.includes('需要重启 Antigravity 以启用 Powertools 插件'));
  assert.ok(html.includes('检查插件更新'));
});
