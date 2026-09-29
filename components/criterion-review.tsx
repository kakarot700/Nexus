import {
  EVALUATION_CRITERIA,
  type Evaluation,
  type EvaluationCriterion,
  type EvaluationStatus,
  type Evidence,
  type Constraint,
} from "@/lib/types";

const STATUSES: EvaluationStatus[] = ["UNKNOWN", "PASS", "PARTIAL", "FAIL"];

interface CriterionReviewProps {
  evaluation: Evaluation;
  evidence: Evidence[];
  constraints: Constraint[];
  onUpdate: (criterion: EvaluationCriterion, patch: { status?: EvaluationStatus; explanation?: string; evidenceIds?: string[]; constraintIds?: string[] }) => void;
}

export function CriterionReview({ evaluation, evidence, constraints, onUpdate }: CriterionReviewProps) {
  return (
    <div className="evaluation-list">
      {EVALUATION_CRITERIA.map((criterion, index) => {
        const assessment = evaluation.criteria[criterion];
        return (
          <article className="criterion-row" key={criterion}>
            <div className="criterion-title">
              <span className="criterion-index">{String(index + 1).padStart(2, "0")}</span>
              <label htmlFor={`status-${evaluation.solutionId}-${index}`}>{criterion}</label>
            </div>
            <div className="criterion-fields">
              <select
                id={`status-${evaluation.solutionId}-${index}`}
                value={assessment.status}
                onChange={(event) => onUpdate(criterion, { status: event.target.value as EvaluationStatus })}
              >
                {STATUSES.map((status) => <option key={status} value={status}>{status.replaceAll("_", " ")}</option>)}
              </select>
              <label className="visually-hidden" htmlFor={`reason-${evaluation.solutionId}-${index}`}>Reason for {criterion}</label>
              <textarea
                id={`reason-${evaluation.solutionId}-${index}`}
                rows={2}
                value={assessment.explanation}
                onChange={(event) => onUpdate(criterion, { explanation: event.target.value })}
                aria-describedby={`source-hint-${evaluation.solutionId}-${index}`}
              />
              <details className="source-picker">
                <summary id={`source-hint-${evaluation.solutionId}-${index}`}>
                  Link sources {assessment.evidenceIds.length + assessment.constraintIds.length > 0 ? `(${assessment.evidenceIds.length + assessment.constraintIds.length})` : "(optional)"}
                </summary>
                <fieldset>
                  <legend>Evidence considered</legend>
                  {evidence.map((item) => (
                    <label className="check-label" key={item.id}>
                      <input
                        type="checkbox"
                        checked={assessment.evidenceIds.includes(item.id)}
                        onChange={(event) => {
                          const evidenceIds = event.target.checked
                            ? [...assessment.evidenceIds, item.id]
                            : assessment.evidenceIds.filter((id) => id !== item.id);
                          onUpdate(criterion, { evidenceIds });
                        }}
                      />
                      <span><code>{item.id}</code> · {item.text}</span>
                    </label>
                  ))}
                  <legend>Constraints considered</legend>
                  {constraints.length ? constraints.map((item) => (
                    <label className="check-label" key={item.id}>
                      <input
                        type="checkbox"
                        checked={assessment.constraintIds.includes(item.id)}
                        onChange={(event) => {
                          const constraintIds = event.target.checked
                            ? [...assessment.constraintIds, item.id]
                            : assessment.constraintIds.filter((id) => id !== item.id);
                          onUpdate(criterion, { constraintIds });
                        }}
                      />
                      <span><code>{item.id}</code> · {item.description}</span>
                    </label>
                  )) : <p className="empty-note">No constraints have been supplied.</p>}
                </fieldset>
              </details>
            </div>
          </article>
        );
      })}
    </div>
  );
}
