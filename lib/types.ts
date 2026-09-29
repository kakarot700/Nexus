export type EvidenceStatus = "USER_PROVIDED" | "DERIVED" | "PROPOSED" | "UNVERIFIED";
export type StrategyType = "SOFTWARE" | "HUMAN_SOFTWARE" | "BEHAVIORAL";
export type EvaluationStatus = "PASS" | "PARTIAL" | "FAIL" | "UNKNOWN";
export type Recommendation = "PROMISING" | "NEEDS_WORK" | "INCOMPATIBLE";

export interface Evidence {
  id: string;
  text: string;
  status: EvidenceStatus;
}

export interface Stakeholder {
  id: string;
  name: string;
  role: string;
}

export interface Constraint {
  id: string;
  category: string;
  description: string;
  source: "USER_PROVIDED" | "DERIVED";
}

export interface Problem {
  statement: string;
  stakeholders: Stakeholder[];
  goals: string[];
  evidence: Evidence[];
  constraints: Constraint[];
  unknowns: string[];
  assumptions: string[];
}

export interface Solution {
  id: string;
  name: string;
  strategyType: StrategyType;
  summary: string;
  mechanism: string[];
  requiredResources: string[];
  benefits: string[];
  risks: string[];
  assumptions: string[];
  evidenceIds: string[];
}

export const EVALUATION_CRITERIA = [
  "Constraint compatibility",
  "Feasibility",
  "Impact",
  "Accessibility",
  "Implementation complexity",
  "Risk",
] as const;

export type EvaluationCriterion = (typeof EVALUATION_CRITERIA)[number];

export interface CriterionAssessment {
  status: EvaluationStatus;
  explanation: string;
  evidenceIds: string[];
  constraintIds: string[];
}

export interface Evaluation {
  solutionId: string;
  criteria: Record<EvaluationCriterion, CriterionAssessment>;
  strengths: string[];
  weaknesses: string[];
  unknowns: string[];
  recommendation: Recommendation;
}

export interface Decision {
  id: string;
  solutionId: string;
  rationale: string;
  evidenceIds: string[];
  constraintIds: string[];
}

export interface DecisionTrailStep {
  id: string;
  stage: string;
  decision: string;
  evidenceIds: string[];
  constraintIds: string[];
  uncertainty?: string;
}

export interface Prototype {
  name: string;
  purpose: string;
  screens: Array<{ id: string; title: string; purpose: string; interactions: string[] }>;
  coreInteraction: string;
  requiredData: string[];
  knownLimitations: string[];
}
