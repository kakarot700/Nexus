import {
  EVALUATION_CRITERIA,
  type Constraint,
  type Evaluation,
  type EvaluationCriterion,
  type EvaluationStatus,
  type Evidence,
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
              <span className={`evidence-status status-${assessment.status.toLowerCase()}`}>{assessment.status}</span>
            </div>
            <div className="criterion-fields">
              <select id={`status-${evaluation.solutionId}-${index}`} value={assessment.status} onChange={(event) => onUpdate(criterion, { status: event.target.value as EvaluationStatus })} aria-describedby={`status-hint-${evaluation.solutionId}-${index}`}>
                {STATUSES.map((status) => <option key={status} value={status}>{status.replaceAll("_", " ")}</option>)}
              </select>
              <span id={`status-hint-${evaluation.solutionId}-${index}`} className="visually-hidden">Choose a qualitative status. Missing evidence should stay UNKNOWN.</span>
              <label className="visually-hidden" htmlFor={`reason-${evaluation.solutionId}-${index}`}>Explanation for {criterion}</label>
              <textarea
                id={`reason-${evaluation.solutionId}-${index}`}
                rows={2}
                maxLength={500}
                value={assessment.explanation}
                onChange={(event) => onUpdate(criterion, { explanation: event.target.value })}
                aria-describedby={`reason-hint-${evaluation.solutionId}-${index}`}
              />
              <span className="field-hint criterion-hint" id={`reason-hint-${evaluation.solutionId}-${index}`}>Explain why · cite real sources below · max 500 characters</span>
              <details className="source-picker">
                <summary>Link sources {assessment.evidenceIds.length + assessment.constraintIds.length > 0 ? `(${assessment.evidenceIds.length + assessment.constraintIds.length})` : "(optional)"}</summary>
                <fieldset>
                  <legend>Evidence considered</legend>
                  {evidence.length ? evidence.map((item) => (
                    <label className="check-label" key={item.id}>
                      <input type="checkbox" checked={assessment.evidenceIds.includes(item.id)} onChange={(event) => {
                        const evidenceIds = event.target.checked ? [...assessment.evidenceIds, item.id] : assessment.evidenceIds.filter((id) => id !== item.id);
                        onUpdate(criterion, { evidenceIds });
                      }} />
                      <span><code>{item.id}</code> · <span className="evidence-status">{item.status.replaceAll("_", " ")}</span> {item.text}</span>
                    </label>
                  )) : <p className="empty-note">No evidence objects are available.</p>}
                  <p className="source-section-heading">Constraints considered</p>
                  {constraints.length ? constraints.map((item) => (
                    <label className="check-label" key={item.id}>
                      <input type="checkbox" checked={assessment.constraintIds.includes(item.id)} onChange={(event) => {
                        const constraintIds = event.target.checked ? [...assessment.constraintIds, item.id] : assessment.constraintIds.filter((id) => id !== item.id);
                        onUpdate(criterion, { constraintIds });
                      }} />
                      <span><code>{item.id}</code> · <span className="evidence-status">{item.status.replaceAll("_", " ")}</span> {item.description}</span>
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
