import type { Solution } from "@/lib/types";

interface SolutionCardProps {
  solution: Solution;
  index: number;
  isActive: boolean;
  recommendation: string;
  onReview: () => void;
}

export function SolutionCard({ solution, index, isActive, recommendation, onReview }: SolutionCardProps) {
  return (
    <article className={`solution-card${isActive ? " solution-card-active" : ""}`}>
      <div className="solution-topline">
        <span className="solution-number">0{index + 1}</span>
        <span className="evidence-status proposed-label">PROPOSED · {solution.strategyType.replaceAll("_", " ")}</span>
      </div>
      <h3>{solution.name}</h3>
      <p className="solution-summary">{solution.summary}</p>
      <div className="solution-details">
        <div>
          <h4>How it might work</h4>
          <ul>{solution.mechanism.map((item) => <li key={item}>{item}</li>)}</ul>
        </div>
        <div>
          <h4>What it would need</h4>
          <ul>{solution.requiredResources.map((item) => <li key={item}>{item}</li>)}</ul>
        </div>
      </div>
      <details className="proposal-caveats">
        <summary>Benefits, risks &amp; assumptions</summary>
        <div className="caveat-columns">
          <div><strong>Possible benefits</strong><ul>{solution.benefits.map((item) => <li key={item}>{item}</li>)}</ul></div>
          <div><strong>Risks to examine</strong><ul>{solution.risks.map((item) => <li key={item}>{item}</li>)}</ul></div>
        </div>
        <p className="assumption"><strong>Assumption to verify:</strong> {solution.assumptions[0]}</p>
        <p className="source-caption">Inspired by {solution.evidenceIds.join(", ")}; this link does not validate the proposal.</p>
      </details>
      <div className="solution-actions">
        <button className="button button-secondary" type="button" aria-pressed={isActive} onClick={onReview}>
          {isActive ? "Assessing this approach" : "Assess this approach"}
        </button>
        <span className={`recommendation-tag recommendation-${recommendation.toLowerCase().replaceAll("_", "-")}`}>
          {recommendation.replaceAll("_", " ")}
        </span>
      </div>
    </article>
  );
}
