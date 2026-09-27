import type { Workspace } from './decision';

export type GeneratedApproach = { name: string; strategyType: 'SOFTWARE' | 'HUMAN_SOFTWARE' | 'INFRASTRUCTURE' | 'BEHAVIORAL' | 'HYBRID'; mechanism: string; benefit: string; risk: string; assumption: string };
export type Exploration = { stakeholders: string[]; goals: string[]; unknowns: string[]; assumptions: string[]; approaches: GeneratedApproach[] };
export type GeneratedPrototype = { name: string; purpose: string; screens: { title: string; purpose: string; interaction: string }[]; requiredData: string[]; limitations: string[] };
const strategyTypes = ['SOFTWARE', 'HUMAN_SOFTWARE', 'INFRASTRUCTURE', 'BEHAVIORAL', 'HYBRID'];
const record = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const text = (v: unknown, max = 500): v is string => typeof v === 'string' && v.trim().length > 0 && v.length <= max;
const strings = (v: unknown, max = 8): v is string[] => Array.isArray(v) && v.length <= max && v.every(x => text(x));
export function parseExploration(v: unknown): Exploration {
  if (!record(v) || !strings(v.stakeholders) || !strings(v.goals) || !strings(v.unknowns) || !strings(v.assumptions) || !Array.isArray(v.approaches) || v.approaches.length < 3 || v.approaches.length > 5) throw new Error('Invalid exploration response');
  const approaches = v.approaches.map((a: unknown) => {
    if (!record(a) || !text(a.name, 160) || !strategyTypes.includes(String(a.strategyType)) || !text(a.mechanism) || !text(a.benefit) || !text(a.risk) || !text(a.assumption)) throw new Error('Invalid approach');
    return { name: a.name, strategyType: a.strategyType, mechanism: a.mechanism, benefit: a.benefit, risk: a.risk, assumption: a.assumption } as GeneratedApproach;
  });
  if (new Set(approaches.map(a => a.name.toLowerCase())).size !== approaches.length) throw new Error('Approaches must be distinct');
  return { stakeholders: v.stakeholders, goals: v.goals, unknowns: v.unknowns, assumptions: v.assumptions, approaches };
}
export function parsePrototype(v: unknown): GeneratedPrototype {
  if (!record(v) || !text(v.name, 160) || !text(v.purpose) || !strings(v.requiredData) || !strings(v.limitations) || !Array.isArray(v.screens) || v.screens.length < 1 || v.screens.length > 4) throw new Error('Invalid prototype response');
  const screens = v.screens.map((s: unknown) => {
    if (!record(s) || !text(s.title, 160) || !text(s.purpose) || !text(s.interaction)) throw new Error('Invalid screen');
    return { title: s.title, purpose: s.purpose, interaction: s.interaction };
  });
  return { name: v.name, purpose: v.purpose, screens, requiredData: v.requiredData, limitations: v.limitations };
}
export function validInput(v: unknown): v is { action: 'explore' | 'prototype'; workspace: Workspace } {
  if (!record(v) || (v.action !== 'explore' && v.action !== 'prototype') || !record(v.workspace)) return false;
  const w = v.workspace;
  return ['problem', 'stakeholders', 'goal', 'evidence', 'constraints', 'unknowns', 'selectedId', 'decisionReason'].every(k => typeof w[k] === 'string' && (w[k] as string).length <= 3000) && text(w.problem, 3000) && Array.isArray(w.options) && w.options.length <= 6 && w.options.every((o: unknown) => record(o) && text(o.id, 160) && typeof o.title === 'string' && o.title.length <= 160 && typeof o.mechanism === 'string' && o.mechanism.length <= 3000);
}
