import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';

function load(path) {
  const source = readFileSync(new URL(path, import.meta.url), 'utf8');
  const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const module = { exports: {} };
  new Function('module', 'exports', 'require', js)(module, module.exports, createRequire(import.meta.url));
  return module.exports;
}
const { parseExploration, parsePrototype, validInput } = load('../lib/ai.ts');
const { initialWorkspace, evaluate } = load('../lib/decision.ts');

test('accepts a bounded, distinct exploration', () => {
  const approach = (name) => ({ name, strategyType: 'HYBRID', mechanism: 'Combine service and outreach', benefit: 'Wider access', risk: 'Higher operating load', assumption: 'Partners participate' });
  assert.equal(parseExploration({ stakeholders: [], goals: [], unknowns: ['Budget'], assumptions: [], approaches: [approach('A'), approach('B'), approach('C')] }).approaches.length, 3);
  assert.throws(() => parseExploration({ stakeholders: [], goals: [], unknowns: [], assumptions: [], approaches: [approach('A'), approach('A'), approach('C')] }));
  assert.throws(() => parseExploration({ stakeholders: [], goals: [], unknowns: [], assumptions: [], approaches: [approach('A')] }));
});
test('rejects malformed prototype and oversized input', () => {
  assert.throws(() => parsePrototype({ name: 'Demo', purpose: 'Try it', screens: [], requiredData: [], limitations: [] }));
  assert.equal(validInput({ action: 'explore', workspace: { ...initialWorkspace, problem: 'a'.repeat(3001) } }), false);
  assert.equal(validInput({ action: 'explore', workspace: { ...initialWorkspace, problem: 'A real problem' } }), true);
});
test('unknown criteria are not presented as scored facts', () => {
  assert.match(evaluate(initialWorkspace.options[0]), /all criteria are unknown/);
});
