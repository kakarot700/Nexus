# NEXUS AI SCHEMAS

Use runtime validation. AI output is untrusted.

```ts
type EvidenceStatus = "USER_PROVIDED" | "DERIVED" | "PROPOSED" | "UNVERIFIED";

type ProblemAnalysis = {
  problem: { statement: string; context: string };
  stakeholders: Array<{ id: string; name: string; role: string; needs: string[] }>;
  goals: string[];
  evidence: Array<{ id: string; text: string; status: EvidenceStatus }>;
  constraints: Array<{
    id: string;
    category: string;
    description: string;
    source: "USER_PROVIDED" | "DERIVED";
  }>;
  unknowns: string[];
  assumptions: string[];
};

type Solution = {
  id: string;
  name: string;
  strategyType: "SOFTWARE" | "HUMAN_SOFTWARE" | "INFRASTRUCTURE" | "BEHAVIORAL" | "HYBRID";
  summary: string;
  mechanism: string[];
  requiredResources: string[];
  benefits: string[];
  risks: string[];
  assumptions: string[];
};

type Evaluation = {
  solutionId: string;
  criteria: Array<{
    criterion: string;
    status: "PASS" | "PARTIAL" | "FAIL" | "UNKNOWN";
    explanation: string;
    evidenceIds: string[];
    constraintIds: string[];
  }>;
  strengths: string[];
  weaknesses: string[];
  unknowns: string[];
  recommendation: "PROMISING" | "NEEDS_WORK" | "INCOMPATIBLE";
};

type DecisionTrail = {
  steps: Array<{
    stage: string;
    decision: string;
    evidenceIds: string[];
    constraintIds: string[];
    uncertainty?: string;
  }>;
};

type Prototype = {
  name: string;
  purpose: string;
  screens: Array<{ id: string; title: string; purpose: string; interactions: string[] }>;
  coreInteraction: string;
};
```

Boundary: parse → validate → normalize → sanity-check → render.

References in `evidenceIds` and `constraintIds` must identify existing objects in the
current analysis; never invent IDs. Use empty arrays when no source supports a claim,
and represent the resulting uncertainty in the status and explanation.

## Open domain decision

ADR-003 names `Decision` as a domain object, but no serialized `Decision` schema is
specified here. **TODO/question for the product owner:** should a `Decision` represent
the user's selected direction, a system recommendation, or both, and what fields must
distinguish those cases? Resolve this before defining or persisting a `Decision`; do
not infer its shape from `DecisionTrail`.
