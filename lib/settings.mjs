import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

export const OVERVIEW_RANGE_OPTIONS = Object.freeze(['weeklyQuota', 'today', '24h', 'yesterday', 'week', 'month', '30d', 'all']);
export const PRICING_MODES = Object.freeze(['standard', 'promo']);
export const USER_BUBBLE_PRESETS = Object.freeze(['accent', 'slate', 'ocean', 'sage', 'sand', 'plum', 'custom']);
const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/;

export const DEFAULT_SETTINGS = Object.freeze({
  enabled: true,
  sshCommandPaste: true,
  compact: true,
  userBubbleTint: false,
  userBubblePreset: 'accent',
  userBubbleColor: '#2F75C3',
  userBubbleStrength: 20,
  contextRing: true,
  speedStats: true,
  timing: true,
  toolDetails: true,
  turnMeta: false,
  responseBranch: true,
  messageEdit: true,
  fileContextMenu: true,
  progress: true,
  overviewQuota: false,
  composerQuotaHalo: false,
  composerQuotaHaloWindow: 'auto',
  subagentTelemetry: true,
  keepTurnOutline: true,
  keepOverviewOpen: true,
  taskbarBadge: true,
  autoRelaunch: true,
  macAutoRelaunch: true,
  autoCheckUpdates: true,
  autoInstallUpdates: false,
  stageUpdates: true,
  overviewRange: 'weeklyQuota',
  pricingMode: 'standard'
});

const validSetting = (key, value) =>
  key === 'overviewRange' ? OVERVIEW_RANGE_OPTIONS.includes(value)
  : key === 'pricingMode' ? PRICING_MODES.includes(value)
  : key === 'userBubblePreset' ? USER_BUBBLE_PRESETS.includes(value)
  : key === 'userBubbleColor' ? (typeof value === 'string' && HEX_COLOR_RE.test(value.trim()))
  : key === 'userBubbleStrength' ? (Number.isInteger(value) && value >= 10 && value <= 100)
  : key === 'composerQuotaHaloWindow' ? ['auto', 'weekly', '5h'].includes(value)
  : typeof value === 'boolean';

const coerceSetting = (key, value) =>
  key === 'userBubbleColor' ? value.trim().toUpperCase() : value;

export function normalizeSettings(value = {}) {
  const raw = value && typeof value === 'object' ? value : {};
  const merged = { ...raw };
  if (!('autoRelaunch' in merged) && typeof merged.macAutoRelaunch === 'boolean') {
    merged.autoRelaunch = merged.macAutoRelaunch;
  }
  if (!('macAutoRelaunch' in merged) && typeof merged.autoRelaunch === 'boolean') {
    merged.macAutoRelaunch = merged.autoRelaunch;
  }
  return Object.fromEntries(
    Object.entries(DEFAULT_SETTINGS).map(([key, fallback]) => [
      key,
      validSetting(key, merged[key]) ? coerceSetting(key, merged[key]) : fallback
    ])
  );
}

export function createSettingsStore(directory = join(homedir(), '.gemini', 'antigravity', 'plugin_data', 'agy-powertools')) {
  const path = join(directory, 'settings.json');
  return {
    get() {
      try { return normalizeSettings(existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : {}); }
      catch { return { ...DEFAULT_SETTINGS }; }
    },
    set(patch) {
      if (!patch || typeof patch !== 'object' || Array.isArray(patch)) throw new Error('设置格式无效');
      const normalizedPatch = { ...patch };
      for (const [key, value] of Object.entries(normalizedPatch)) {
        if (!Object.hasOwn(DEFAULT_SETTINGS, key) || !validSetting(key, value)) throw new Error('设置选项无效');
      }
      if ('autoRelaunch' in normalizedPatch && !('macAutoRelaunch' in normalizedPatch)) {
        normalizedPatch.macAutoRelaunch = normalizedPatch.autoRelaunch;
      } else if ('macAutoRelaunch' in normalizedPatch && !('autoRelaunch' in normalizedPatch)) {
        normalizedPatch.autoRelaunch = normalizedPatch.macAutoRelaunch;
      }
      const value = normalizeSettings({ ...this.get(), ...normalizedPatch });
      mkdirSync(directory, { recursive: true });
      writeFileSync(`${path}.tmp`, JSON.stringify(value, null, 2) + '\n', 'utf8');
      renameSync(`${path}.tmp`, path);
      return value;
    },
    reset() {
      return this.set({ ...DEFAULT_SETTINGS });
    }
  };
}
