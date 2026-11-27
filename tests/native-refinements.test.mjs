import test from 'node:test';
import assert from 'node:assert/strict';
import { requestEvents } from '../lib/analytics.mjs';
import { pricedSession } from '../lib/native-host.mjs';

test('prices request events at both turn boundaries and distinguishes a priced zero from unavailable rates', () => {
  const generation = (stepIndices, inputTokens, modelName = 'Gemini 4 Neon') => ({ stepIndices, inputTokens, modelName, cacheReadTokens: 0, outputTokens: 0 });
  const requests = requestEvents({
    times: new Map(),
    generations: [
      generation([7], 0),
      generation([4, 2], 1e6),
      generation([4], 1e6),
      generation([5], 1e6),
      generation([], 1e6),
      generation([10], 1e6, 'Unknown')
    ]
  }, 'fixture');
  const parsed = { requests, turns: [[2, 4], [6, 7], [8, 9], [10, 10]].map(([stepIndexStart, stepIndexEnd]) => ({ stepIndexStart, stepIndexEnd })) };
  const rate = { model: 'gemini-4-neon', input: 1, output: 1, cache: 1, until: '2100-01-01', next: { input: 3, output: 1, cache: 1 } };
  for (const [pricingMode, expected] of [['standard', 6], ['promo', 2]]) {
    const result = pricedSession(parsed, [rate], { pricingMode });
    assert.deepEqual(result.turns.map(t => t.costUsd), [expected, 0, null, null]);
    assert.equal(result.costUsd, 2 * expected);
  }
});
