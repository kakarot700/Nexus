export type EvidenceState = 'USER_PROVIDED' | 'DERIVED' | 'PROPOSED' | 'UNVERIFIED';
export type Criterion = 'impact' | 'feasibility' | 'risk';
export type Rating = 'strong' | 'mixed' | 'unknown';
export type Option = { id: string; title: string; mechanism: string; ratings: Record<Criterion, Rating> };
export type Workspace = { problem: string; stakeholders: string; goal: string; evidence: string; constraints: string; unknowns: string; options: Option[]; selectedId: string; decisionReason: string };
export const blankOption = (id: string): Option => ({ id, title: '', mechanism: '', ratings: { impact: 'unknown', feasibility: 'unknown', risk: 'unknown' } });
export const initialWorkspace: Workspace = { problem: '', stakeholders: '', goal: '', evidence: '', constraints: '', unknowns: '', options: [blankOption('a'), blankOption('b')], selectedId: '', decisionReason: '' };
export const criteria: Criterion[] = ['impact', 'feasibility', 'risk'];
export const ratings: Rating[] = ['unknown', 'mixed', 'strong'];
export function evaluate(option: Option): string {
  const known = criteria.filter(key => option.ratings[key] !== 'unknown').length;
  if (!known) return 'Not evaluated yet — all criteria are unknown.';
  const strong = criteria.filter(key => option.ratings[key] === 'strong').length;
  return `${strong} strong, ${known - strong} mixed, ${3 - known} unknown. Review the reasoning before deciding.`;
}
export function isWorkspace(value: unknown): value is Workspace {
  if (!value || typeof value !== 'object') return false;
  const v = value as Partial<Workspace>;
  return ['problem', 'stakeholders', 'goal', 'evidence', 'constraints', 'unknowns', 'selectedId', 'decisionReason'].every(key => typeof v[key as keyof Workspace] === 'string') && Array.isArray(v.options) && v.options.length <= 12 && v.options.every(o => o && typeof o.id === 'string' && typeof o.title === 'string' && typeof o.mechanism === 'string' && o.ratings && criteria.every(k => ratings.includes(o.ratings[k])));
}
