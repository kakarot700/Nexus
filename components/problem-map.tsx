import type { Problem } from "@/lib/types";

export function ProblemMap({ problem }: { problem: Problem }) {
  return (
    <section className="panel section-block" id="problem-map" aria-labelledby="map-heading">
      <div className="section-heading">
        <div>
          <p className="eyebrow">01 / PROBLEM MAP</p>
          <h2 id="map-heading">What is known so far</h2>
        </div>
        <span className="state-note">User-supplied context only</span>
      </div>
      <blockquote className="problem-quote">{problem.statement}</blockquote>
      <div className="map-grid">
        <div>
          <h3>People affected</h3>
          {problem.stakeholders.length ? (
            <ul className="plain-list">
              {problem.stakeholders.map((person) => (
                <li key={person.id}>
                  <span>{person.name}</span>
                  <span className="muted">{person.role}</span>
                </li>
              ))}
            </ul>
          ) : <p className="empty-note">No stakeholders supplied yet.</p>}
        </div>
        <div>
          <h3>Desired outcomes</h3>
          {problem.goals.length ? (
            <ul className="plain-list">{problem.goals.map((goal, index) => <li key={`${goal}-${index}`}>{goal}</li>)}</ul>
          ) : <p className="empty-note">No outcomes supplied yet.</p>}
        </div>
      </div>
      <div className="map-grid evidence-grid">
        <div>
          <h3>Evidence in this map</h3>
          <ul className="source-list">
            {problem.evidence.map((item) => (
              <li key={item.id}>
                <span className="source-id">{item.id}</span>
                <span className="evidence-status">USER PROVIDED</span>
                <p>{item.text}</p>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3>Constraints to check</h3>
          {problem.constraints.length ? (
            <ul className="source-list">
              {problem.constraints.map((constraint) => (
                <li key={constraint.id}>
                  <span className="source-id">{constraint.id}</span>
                  <span className="evidence-status">USER PROVIDED</span>
                  <p>{constraint.description}</p>
                </li>
              ))}
            </ul>
          ) : <p className="empty-note">No constraints supplied. Any compatibility assessment remains unknown until you add or verify them.</p>}
        </div>
      </div>
      <div className="unknowns-block">
        <h3>Still needs verification</h3>
        {problem.unknowns.length ? (
          <ul className="plain-list">{problem.unknowns.map((item) => <li key={item}>{item}</li>)}</ul>
        ) : <p className="empty-note">You supplied people, goals, and constraints. Their completeness has not been independently checked.</p>}
      </div>
    </section>
  );
}
