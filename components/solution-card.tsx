import { SolutionCritiquePanel } from "@/components/solution-critique";
import type { Problem, Solution, SolutionCritique } from "@/lib/types";

interface SolutionCardProps {
  solution: Solution;
  critique: SolutionCritique;
  problem: Problem;
  index: number;
  isActive: boolean;
  recommendation: string;
  onReview: () => void;
}

export function SolutionCard({ solution, critique, problem, index, isActive, recommendation, onReview }: SolutionCardProps) {
  const constraints = new Map(problem.constraints.map((item) => [item.id, item]));
  return (
    <article className={`solution-card${isActive ? " solution-card-active" : ""}`} id={`solution-${solution.id}`}>
      <div className="solution-topline">
        <span className="solution-number">{String(index + 1).padStart(2, "0")}</span>
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
      {solution.constraintResponses.length > 0 && (
        <details className="constraint-responses">
          <summary>How it responds to {solution.constraintResponses.length} supplied constraint{solution.constraintResponses.length === 1 ? "" : "s"}</summary>
          <ul>
            {solution.constraintResponses.map((response) => {
              const constraint = constraints.get(response.constraintId);
              if (!constraint) return null;
              return (
                <li key={response.constraintId}>
                  <strong>{constraint.category.replaceAll("_", " ")} · {constraint.description}</strong>
                  <p>{response.designResponse}</p>
                  <p className="field-hint">Limit · {response.limitation}</p>
                </li>
              );
            })}
          </ul>
        </details>
      )}
      <details className="proposal-caveats">
        <summary>Benefits, risks &amp; assumptions</summary>
        <div className="caveat-columns">
          <div><strong>Possible benefits</strong><ul>{solution.benefits.map((item) => <li key={item}>{item}</li>)}</ul></div>
          <div><strong>Risks to examine</strong><ul>{solution.risks.map((item) => <li key={item}>{item}</li>)}</ul></div>
        </div>
        <p className="assumption"><strong>Assumptions to verify:</strong> {solution.assumptions.join(" ")}</p>
        <p className="source-caption">References: {solution.evidenceIds.length ? solution.evidenceIds.join(", ") : "none"}. A reference does not validate the proposal.</p>
      </details>
      <SolutionCritiquePanel critique={critique} problem={problem} />
      <div className="solution-actions">
        <button className="button button-secondary" type="button" aria-pressed={isActive} onClick={onReview}>
          {isActive ? "Selected for assessment" : "Assess this approach"}
        </button>
        <span className={`recommendation-tag recommendation-${recommendation.toLowerCase().replaceAll("_", "-")}`}>
          {recommendation.replaceAll("_", " ")}
        </span>
      </div>
    </article>
  );
}
