import type { Problem, SolutionCritique } from "@/lib/types";

const CATEGORY_LABELS: Record<SolutionCritique["findings"][number]["category"], string> = {
  HIDDEN_ASSUMPTION: "Hidden assumption",
  CONSTRAINT_PRESSURE: "Constraint pressure",
  IMPLEMENTATION_BARRIER: "Implementation barrier",
  EXCLUDED_USERS: "Who could be excluded",
  RELIABILITY: "Reliability",
  PRIVACY: "Privacy",
  ACCESSIBILITY: "Accessibility",
  UNKNOWN_INFORMATION: "Unknown information",
  DEPENDENCY: "Dependencies",
  FAILURE_MODE: "Failure modes",
};

export function SolutionCritiquePanel({ critique, problem }: { critique: SolutionCritique; problem: Problem }) {
  const evidence = new Map(problem.evidence.map((item) => [item.id, item]));
  const constraints = new Map(problem.constraints.map((item) => [item.id, item]));
  const checkCount = critique.findings.filter((item) => item.status === "CHECK").length;
  const unknownCount = critique.findings.filter((item) => item.status === "UNKNOWN").length;
  return (
    <details className="critic-panel">
      <summary>Stress-test · {checkCount} checks · {unknownCount} unknowns</summary>
      <p className="critic-intro">The critic looks for ways this proposal could fail. Findings are prompts to verify, not confirmed defects.</p>
      <ul className="critic-list">
        {critique.findings.map((finding) => (
          <li key={finding.id}>
            <div className="critic-heading"><strong>{CATEGORY_LABELS[finding.category]}</strong><span className="evidence-status">{finding.source} · {finding.status}</span></div>
            <p>{finding.finding}</p>
            {(finding.evidenceIds.length > 0 || finding.constraintIds.length > 0) && (
              <div className="critic-sources" aria-label="Sources considered">
                {finding.evidenceIds.map((id) => {
                  const item = evidence.get(id);
                  return item ? <span key={id}><code>{id}</code> · <span className="evidence-status">{item.status.replaceAll("_", " ")}</span> “{item.text}”</span> : null;
                })}
                {finding.constraintIds.map((id) => {
                  const item = constraints.get(id);
                  return item ? <span key={id}><code>{id}</code> · <span className="evidence-status">{item.status.replaceAll("_", " ")}</span> “{item.description}”</span> : null;
                })}
              </div>
            )}
          </li>
        ))}
      </ul>
    </details>
  );
}
