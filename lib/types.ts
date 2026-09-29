export type EvidenceStatus = "USER_PROVIDED" | "DERIVED" | "PROPOSED" | "UNVERIFIED";
export type StrategyType = "SOFTWARE" | "HUMAN_SOFTWARE" | "INFRASTRUCTURE" | "BEHAVIORAL" | "HYBRID";
export type EvaluationStatus = "PASS" | "PARTIAL" | "FAIL" | "UNKNOWN";
export type Recommendation = "PROMISING" | "NEEDS_WORK" | "INCOMPATIBLE";
export type ProviderMode = "demo" | "openai";
export type ConstraintCategory =
  | "COST" | "TIME" | "INFRASTRUCTURE" | "TECHNOLOGY" | "CONNECTIVITY"
  | "GEOGRAPHY" | "ACCESSIBILITY" | "PRIVACY" | "RELIABILITY" | "USERS"
  | "ENVIRONMENT" | "IMPLEMENTATION_COMPLEXITY" | "OTHER";

export interface ProblemInput {
  statement: string;
  stakeholders?: string;
  goals?: string;
  constraints?: string;
}

export interface Evidence {
  id: string;
  text: string;
  status: EvidenceStatus;
  sourceField?: "PROBLEM" | "STAKEHOLDERS" | "GOALS" | "CONSTRAINTS" | "PROTOTYPE";
  sourceQuote?: string;
}

export interface Stakeholder {
  id: string;
  name: string;
  role: string;
  needs: string[];
  status: EvidenceStatus;
  roleStatus: EvidenceStatus;
  needsStatus: EvidenceStatus;
  evidenceIds: string[];
  needsEvidenceIds: string[];
}

export interface Constraint {
  id: string;
  category: ConstraintCategory;
  categoryStatus: EvidenceStatus;
  description: string;
  source: "USER_PROVIDED" | "DERIVED";
  status: EvidenceStatus;
  evidenceIds: string[];
}

export interface Problem {
  problem: { statement: string; context: string };
  stakeholders: Stakeholder[];
  goals: string[];
  evidence: Evidence[];
  constraints: Constraint[];
  unknowns: string[];
  assumptions: string[];
}

export interface ConstraintResponse {
  constraintId: string;
  designResponse: string;
  limitation: string;
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
  constraintIds: string[];
  constraintResponses: ConstraintResponse[];
}

export type CritiqueCategory =
  | "HIDDEN_ASSUMPTION" | "CONSTRAINT_PRESSURE" | "IMPLEMENTATION_BARRIER"
  | "EXCLUDED_USERS" | "RELIABILITY" | "PRIVACY" | "ACCESSIBILITY"
  | "UNKNOWN_INFORMATION" | "DEPENDENCY" | "FAILURE_MODE";

export interface CritiqueFinding {
  id: string;
  category: CritiqueCategory;
  status: "CHECK" | "UNKNOWN";
  finding: string;
  evidenceIds: string[];
  constraintIds: string[];
  source: "PROPOSED" | "DERIVED";
}

export interface SolutionCritique {
  solutionId: string;
  findings: CritiqueFinding[];
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
  selectionKind: "USER_SELECTED";
}

export interface DecisionTrailStep {
  id: string;
  stage: string;
  decision: string;
  evidenceIds: string[];
  constraintIds: string[];
  uncertainty?: string;
}

export interface PrototypeInteraction {
  title: string;
  prompt: string;
  inputLabel: string;
  placeholder: string;
  actionLabel: string;
  savedLabel: string;
}

export interface Prototype {
  name: string;
  purpose: string;
  screens: Array<{ id: string; title: string; purpose: string; interactions: string[] }>;
  coreInteraction: string;
  requiredData: string[];
  knownLimitations: string[];
  interaction: PrototypeInteraction;
}
