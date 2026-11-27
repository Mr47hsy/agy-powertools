import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createSettingsStore, DEFAULT_SETTINGS } from '../lib/settings.mjs';

test('settings persist, merge safely, sync autoRelaunch <-> macAutoRelaunch, ignore legacy disk keys on read, and reject removed or invalid keys', () => {
  const directory = mkdtempSync(join(tmpdir(), 'agy-settings-'));
  try {
    const store = createSettingsStore(directory);
    assert.deepEqual(store.get(), DEFAULT_SETTINGS);
    assert.equal('language' in DEFAULT_SETTINGS, false);
    assert.equal('multiAccount' in DEFAULT_SETTINGS, false);
    assert.equal('accountSwitcher' in DEFAULT_SETTINGS, false);
    assert.equal('autoSwitchAccount' in DEFAULT_SETTINGS, false);

    store.set({ compact: false, timing: false });
    assert.equal(createSettingsStore(directory).get().compact, false);
    assert.equal(createSettingsStore(directory).get().timing, false);

    assert.equal(store.get().userBubbleTint, false);
    assert.equal(store.get().userBubblePreset, 'accent');
    assert.equal(store.get().userBubbleColor, '#2F75C3');
    assert.equal(store.get().userBubbleStrength, 20);
    store.set({ userBubbleTint: true, userBubblePreset: 'sage', userBubbleColor: '#3d7a64', userBubbleStrength: 100 });
    assert.equal(store.get().userBubbleTint, true);
    assert.equal(store.get().userBubblePreset, 'sage');
    assert.equal(store.get().userBubbleColor, '#3D7A64');
    assert.equal(store.get().userBubbleStrength, 100);
    store.set({ userBubbleTint: false, userBubblePreset: 'accent', userBubbleColor: '#2F75C3', userBubbleStrength: 20 });

    assert.equal(store.get().overviewQuota, false);
    assert.equal(store.get().composerQuotaHalo, false);
    assert.equal(store.get().composerQuotaHaloWindow, 'auto');
    store.set({ overviewQuota: true, composerQuotaHalo: true, composerQuotaHaloWindow: 'weekly' });
    assert.equal(store.get().overviewQuota, true);
    assert.equal(store.get().composerQuotaHalo, true);
    assert.equal(store.get().composerQuotaHaloWindow, 'weekly');
    store.set({ composerQuotaHaloWindow: '5h' });
    assert.equal(store.get().composerQuotaHaloWindow, '5h');
    store.set({ overviewQuota: false, composerQuotaHalo: false, composerQuotaHaloWindow: 'auto' });

    assert.equal(store.get().messageEdit, true);
    assert.equal(store.get().fileContextMenu, true);
    assert.equal(store.get().autoRelaunch, true);
    assert.equal(store.get().macAutoRelaunch, true);
    store.set({ autoRelaunch: false });
    assert.equal(store.get().autoRelaunch, false);
    assert.equal(store.get().macAutoRelaunch, false);
    store.set({ macAutoRelaunch: true });
    assert.equal(store.get().autoRelaunch, true);
    assert.equal(store.get().macAutoRelaunch, true);

    assert.equal(store.get().sshCommandPaste, true);
    store.set({ sshCommandPaste: false });
    assert.equal(store.get().sshCommandPaste, false);
    store.set({ sshCommandPaste: true });

    assert.equal(store.get().subagentTelemetry, true);
    store.set({ subagentTelemetry: false }); assert.equal(store.get().subagentTelemetry, false);
    store.set({ subagentTelemetry: true }); assert.equal(store.get().subagentTelemetry, true);

    assert.equal(DEFAULT_SETTINGS.turnMeta, false);
    assert.equal(store.get().turnMeta, false);
    store.set({ turnMeta: true }); assert.equal(store.get().turnMeta, true);
    store.set({ turnMeta: false }); assert.equal(store.get().turnMeta, false);

    assert.equal(DEFAULT_SETTINGS.overviewRange, 'weeklyQuota');
    store.set({ overviewRange: '24h' }); assert.equal(store.get().overviewRange, '24h');
    store.set({ overviewRange: 'today' }); assert.equal(store.get().overviewRange, 'today');
    store.set({ overviewRange: 'weeklyQuota' }); assert.equal(store.get().overviewRange, 'weeklyQuota');

    assert.equal(DEFAULT_SETTINGS.pricingMode, 'standard');
    store.set({ pricingMode: 'promo' }); assert.equal(store.get().pricingMode, 'promo');
    store.set({ pricingMode: 'standard' }); assert.equal(store.get().pricingMode, 'standard');

    store.set({ enabled: false });
    assert.equal(store.get().enabled, false);

    const before = readFileSync(join(directory, 'settings.json'), 'utf8');
    for (const value of [
      { compact: 'false' },
      { turnMeta: 'yes' },
      { userBubbleTint: 'yes' },
      { userBubblePreset: 'neon' },
      { userBubbleColor: 'red' },
      { userBubbleColor: '#123;color:red' },
      { userBubbleStrength: 5 },
      { userBubbleStrength: 105 },
      { userBubbleStrength: 20.5 },
      { composerQuotaHaloWindow: '1d' },
      { autoRelaunch: 'yes' },
      { unknown: true },
      { toString: false },
      { language: 'en' },
      { language: 'zh-CN' },
      { multiAccount: true },
      { accountSwitcher: false },
      { accountViewMode: 'card' },
      { accountQuotaWindow: 'weekly' },
      { autoSwitchAccount: true },
      { overviewRange: 'custom' },
      { overviewRange: 'invalid' },
      { pricingMode: 'batch' },
      { pricingMode: true },
      []
    ]) {
      assert.throws(() => store.set(value), /设置/);
    }
    assert.equal(readFileSync(join(directory, 'settings.json'), 'utf8'), before);

    // Unknown legacy keys in existing settings.json must be safely ignored on get()
    writeFileSync(join(directory, 'settings.json'), JSON.stringify({
      compact: false,
      macAutoRelaunch: false,
      language: 'en',
      multiAccount: true,
      accountSwitcher: true,
      customFont: 'Maple Mono',
      proxyEnabled: true,
      contextLimit: 1000000
    }, null, 2));
    const legacyLoaded = createSettingsStore(directory).get();
    assert.equal(legacyLoaded.compact, false);
    assert.equal(legacyLoaded.autoRelaunch, false);
    assert.equal(legacyLoaded.macAutoRelaunch, false);
    assert.equal('language' in legacyLoaded, false);
    assert.equal('multiAccount' in legacyLoaded, false);
    assert.equal('accountSwitcher' in legacyLoaded, false);
    assert.equal('customFont' in legacyLoaded, false);
    assert.equal('proxyEnabled' in legacyLoaded, false);

    store.set(DEFAULT_SETTINGS);
    assert.deepEqual(store.get(), DEFAULT_SETTINGS);
    store.set({ compact: false, pricingMode: 'promo' });
    assert.deepEqual(store.reset(), DEFAULT_SETTINGS);
    assert.deepEqual(store.get(), DEFAULT_SETTINGS);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
