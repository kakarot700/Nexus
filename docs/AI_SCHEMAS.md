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
    source: "USER_PROVIDED" | "DERIVED" | "ASSUMED";
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
  }>;
  strengths: string[];
  weaknesses: string[];
  unknowns: string[];
  recommendation: "PROMISING" | "NEEDS_WORK" | "INCOMPATIBLE";
};

type DecisionTrail = {
  steps: Array<{ stage: string; decision: string; evidence: string[]; uncertainty?: string }>;
};

type Prototype = {
  name: string;
  purpose: string;
  screens: Array<{ id: string; title: string; purpose: string; interactions: string[] }>;
  coreInteraction: string;
};
```

Boundary: parse → validate → normalize → sanity-check → render.
