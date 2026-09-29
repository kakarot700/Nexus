import type { Evidence, Problem } from "@/lib/types";

function statusLabel(status: string): string {
  return status.replaceAll("_", " ");
}

export function ProblemMap({ problem }: { problem: Problem }) {
  const evidenceByText = new Map(problem.evidence.map((item) => [item.text.toLocaleLowerCase(), item]));
  return (
    <section className="panel section-block" id="problem-map" aria-labelledby="map-heading">
      <div className="section-heading">
        <div>
          <p className="eyebrow">01 / PROBLEM MAP</p>
          <h2 id="map-heading">What is known so far</h2>
        </div>
        <span className="state-note">Source status stays visible</span>
      </div>
      <blockquote className="problem-quote">{problem.problem.statement}</blockquote>
      {problem.problem.context && <p className="context-summary"><span className="evidence-status">DERIVED</span> {problem.problem.context}</p>}
      <div className="map-grid">
        <div>
          <h3>People affected</h3>
          {problem.stakeholders.length ? (
            <ul className="plain-list">
              {problem.stakeholders.map((person) => (
                <li className="map-person" key={person.id}>
                  <span>{person.name}<span className="evidence-status">{statusLabel(person.status)}</span></span>
                  <span className="muted">{person.role} · role {statusLabel(person.roleStatus).toLowerCase()}</span>
                  {person.needs.length > 0 ? (
                    <span className="person-needs">Needs · {person.needs.join("; ")} <span className="evidence-status">{statusLabel(person.needsStatus)}</span></span>
                  ) : <span className="person-needs muted">Specific needs not supplied or independently established.</span>}
                </li>
              ))}
            </ul>
          ) : <p className="empty-note">No people or groups were supplied. NEXUS has not inferred a user group.</p>}
        </div>
        <div>
          <h3>Desired outcomes</h3>
          {problem.goals.length ? (
            <ul className="plain-list">{problem.goals.map((goal, index) => {
              const source = evidenceByText.get(goal.toLocaleLowerCase());
              return <li key={`${goal}-${index}`}><span>{goal}</span><span className="evidence-status">{source ? statusLabel(source.status) : "NEEDS VERIFICATION"}</span></li>;
            })}</ul>
          ) : <p className="empty-note">No outcome was supplied. An impact assessment remains unresolved.</p>}
        </div>
      </div>
      <div className="map-grid evidence-grid">
        <div>
          <h3>Evidence and proposals</h3>
          {problem.evidence.length ? (
            <ul className="source-list">
              {problem.evidence.map((item) => <EvidenceItem key={item.id} item={item} />)}
            </ul>
          ) : <p className="empty-note">No evidence objects are available.</p>}
        </div>
        <div>
          <h3>Constraints to check</h3>
          {problem.constraints.length ? (
            <ul className="source-list">
              {problem.constraints.map((constraint) => (
                <li key={constraint.id}>
                  <span className="source-id">{constraint.id}</span>
                  <span className="evidence-status">{statusLabel(constraint.status)}</span>
                  <span className="constraint-category">{constraint.category.replaceAll("_", " ")} <span className="evidence-status">{statusLabel(constraint.categoryStatus)} category</span></span>
                  <p>{constraint.description}</p>
                  {constraint.evidenceIds.length > 0 && <p className="field-hint">Source evidence: {constraint.evidenceIds.join(", ")}</p>}
                </li>
              ))}
            </ul>
          ) : <p className="empty-note">No constraints supplied. Any compatibility assessment remains unknown until constraints are added and checked.</p>}
        </div>
      </div>
      <div className="unknowns-block">
        <h3>Still needs verification</h3>
        {problem.unknowns.length ? (
          <ul className="plain-list">{problem.unknowns.map((item, index) => <li key={`${index}-${item}`}>{item}</li>)}</ul>
        ) : <p className="empty-note">The supplied context has not been independently checked for completeness.</p>}
        {problem.assumptions.length > 0 && <>
          <h3 className="assumption-heading">Proposed assumptions · not facts</h3>
          <ul className="plain-list">{problem.assumptions.map((item, index) => <li key={`${index}-${item}`}>{item}<span className="evidence-status">PROPOSED</span></li>)}</ul>
        </>}
      </div>
    </section>
  );
}

function EvidenceItem({ item }: { item: Evidence }) {
  return (
    <li>
      <span className="source-id">{item.id}</span>
      <span className="evidence-status">{statusLabel(item.status)}</span>
      <p>{item.text}</p>
      {item.sourceQuote && <p className="field-hint">Exact source text · {item.sourceField?.toLowerCase() ?? "input"}: “{item.sourceQuote}”</p>}
    </li>
  );
}
