import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Dependency-free contract checks; run typecheck and browser tests separately.
test('core flow and uncertainty labels are present', () => {
  const page = readFileSync(new URL('../app/page.tsx', import.meta.url), 'utf8');
  for (const stage of ['Problem', 'Evidence & constraints', 'Solutions', 'Evaluation', 'Prototype & decision']) assert.ok(page.includes(stage));
  for (const label of ['USER PROVIDED', 'UNVERIFIED', 'PROPOSED']) assert.ok(page.includes(label));
  assert.ok(page.includes('isWorkspace(parsed)'));
});
