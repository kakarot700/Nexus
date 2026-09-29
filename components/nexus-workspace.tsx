"use client";

import { useMemo, useState, type FormEvent } from "react";
import { CriterionReview } from "@/components/criterion-review";
import { ProblemMap } from "@/components/problem-map";
import { SolutionCard } from "@/components/solution-card";
import {
  buildProblem,
  sanitizeReferences,
  updateCriterion,
} from "@/lib/engine";
import { LocalGuidedProvider } from "@/lib/provider";
import {
  type Decision,
  type DecisionTrailStep,
  type Evaluation,
  type EvaluationCriterion,
  type EvaluationStatus,
  type Evidence,
  type Problem,
  type Prototype,
  type Solution,
} from "@/lib/types";

const localProvider = new LocalGuidedProvider();

export function NexusWorkspace() {
  const [problem, setProblem] = useState<Problem | null>(null);
  const [solutions, setSolutions] = useState<Solution[]>([]);
  const [evaluations, setEvaluations] = useState<Record<string, Evaluation>>({});
  const [activeId, setActiveId] = useState("");
  const [directionId, setDirectionId] = useState("");
  const [directionReferences, setDirectionReferences] = useState<string[]>([]);
  const [rationale, setRationale] = useState("");
  const [decision, setDecision] = useState<Decision | null>(null);
  const [prototype, setPrototype] = useState<Prototype | null>(null);
  const [isMapping, setIsMapping] = useState(false);
  const [decisionError, setDecisionError] = useState("");
  const [prototypeNote, setPrototypeNote] = useState("");
  const [savedObservation, setSavedObservation] = useState<Evidence | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const activeSolution = solutions.find((solution) => solution.id === activeId) ?? null;
  const referenceIds = useMemo(
    () => problem ? [...problem.evidence.map((item) => item.id), ...problem.constraints.map((item) => item.id)] : [],
    [problem],
  );
  const trail = useMemo(() => buildTrail(problem, solutions, evaluations, decision, savedObservation), [problem, solutions, evaluations, decision, savedObservation]);

  async function startMapping(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    setIsMapping(true);
    try {
      const form = new FormData(event.currentTarget);
      const mappedInput = {
        statement: String(form.get("problem") ?? ""),
        stakeholders: String(form.get("stakeholders") ?? ""),
        goals: String(form.get("goals") ?? ""),
        constraints: String(form.get("constraints") ?? ""),
      };
      const mapped = await localProvider.analyzeProblem(mappedInput);
      const proposals = await localProvider.generateSolutions(mapped);
      const initialEvaluations = await localProvider.evaluateSolutions(mapped, proposals);
      setProblem(mapped);
      setSolutions(proposals);
      setEvaluations(Object.fromEntries(initialEvaluations.map((evaluation) => [evaluation.solutionId, evaluation])));
      setActiveId(proposals[0]?.id ?? "");
      setDirectionId(proposals[0]?.id ?? "");
      setDirectionReferences([]);
      setRationale("");
      setDecision(null);
      setPrototype(null);
      setPrototypeNote("");
      setSavedObservation(null);
      setNotice("Problem mapped. Approaches are proposed starting points, not verified recommendations.");
      window.setTimeout(() => document.getElementById("problem-map")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The problem could not be mapped. Your text is still in the form.");
    } finally {
      setIsMapping(false);
    }
  }

  function updateAssessment(criterion: EvaluationCriterion, patch: { status?: EvaluationStatus; explanation?: string; evidenceIds?: string[]; constraintIds?: string[] }) {
    if (!activeSolution) return;
    setEvaluations((current) => ({
      ...current,
      [activeSolution.id]: updateCriterion(current[activeSolution.id], criterion, patch),
    }));
  }

  async function recordDirection(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!problem || !directionId) return;
    const selected = solutions.find((solution) => solution.id === directionId);
    let prototypeDraft: Prototype | null = null;
    if (selected) {
      try {
        prototypeDraft = await localProvider.generatePrototype(problem, selected);
        setDecisionError("");
      } catch {
        setDecisionError("Your selection is recorded locally, but its prototype could not be prepared. Retry by recording the direction again.");
        return;
      }
    }
    const next: Decision = {
      id: "decision-1",
      solutionId: directionId,
      rationale: rationale.trim(),
      evidenceIds: sanitizeReferences(directionReferences, problem.evidence.map((item) => item.id)),
      constraintIds: sanitizeReferences(directionReferences, problem.constraints.map((item) => item.id)),
    };
    setDecision(next);
    setPrototype(prototypeDraft);
    setPrototypeNote("");
    setSavedObservation(null);
    setNotice("Your selected direction is recorded separately from its qualitative recommendation.");
    window.setTimeout(() => document.getElementById("prototype")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  }

  function savePrototypeNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = prototypeNote.trim();
    if (!text) return;
    setSavedObservation({ id: "evidence-prototype-observation-1", text, status: "USER_PROVIDED" });
    setNotice("Observation recorded in this page session. It will not be saved after refresh.");
  }

  function resetWorkspace() {
    setProblem(null);
    setSolutions([]);
    setEvaluations({});
    setActiveId("");
    setDirectionId("");
    setDirectionReferences([]);
    setRationale("");
    setDecision(null);
    setPrototype(null);
    setPrototypeNote("");
    setSavedObservation(null);
    setError("");
    setNotice("Workspace reset. Your browser form fields may still contain text until you replace them.");
    const form = document.getElementById("problem-form") as HTMLFormElement | null;
    form?.reset();
    document.getElementById("problem-input")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <main className="site-shell">
      <header className="topbar">
        <a className="wordmark" href="#top" aria-label="NEXUS home"><span className="wordmark-mark" aria-hidden="true">N</span><span>NEXUS</span></a>
        <div className="mode-indicator"><span className="mode-dot" /> LOCAL GUIDED MODE <span className="mode-divider">·</span> NOT AI-VERIFIED</div>
      </header>

      <div className="hero" id="top">
        <div>
          <p className="eyebrow">A WORKSPACE FOR COMPLEX PROBLEMS</p>
          <h1>Think through the problem.<br /><em>Choose a direction you can explain.</em></h1>
          <p className="hero-copy">Map what is known. Compare distinct ways forward. Make uncertainty visible before committing.</p>
        </div>
        <aside className="hero-note" aria-label="NEXUS process">
          <span>PROBLEM</span><i aria-hidden="true">→</i><span>CONSTRAINTS</span><i aria-hidden="true">→</i><span>APPROACHES</span><i aria-hidden="true">→</i><span>DECISION</span>
        </aside>
      </div>

      {problem && <WorkflowMap hasDecision={Boolean(decision)} hasPrototype={Boolean(prototype)} />}
      <div className="sr-announcer" role="status" aria-live="polite">{notice}</div>

      <section className="panel input-panel" id="problem-input" aria-labelledby="input-heading">
        <div className="section-heading">
          <div><p className="eyebrow">START HERE</p><h2 id="input-heading">Describe the problem</h2></div>
          <span className="step-count">NO ACCOUNT · NO SETUP</span>
        </div>
        <p className="section-intro">Use your own context. NEXUS keeps it separate from proposals and does not add outside facts.</p>
        <form id="problem-form" onSubmit={startMapping}>
          <div className="field-group">
            <label htmlFor="problem-description">What are you trying to make sense of?</label>
            <textarea id="problem-description" name="problem" rows={4} maxLength={3000} required placeholder="Describe the situation, who is affected if you know, and what feels unresolved." aria-describedby="problem-hint" />
            <span className="field-hint" id="problem-hint">Keep it in your own words. Up to 3,000 characters.</span>
          </div>
          <div className="context-fields">
            <div className="field-group">
              <label htmlFor="stakeholders">People affected <span className="optional">· optional</span></label>
              <textarea id="stakeholders" name="stakeholders" rows={3} placeholder="One person or group per line · up to 20" />
            </div>
            <div className="field-group">
              <label htmlFor="goals">Useful outcomes <span className="optional">· optional</span></label>
              <textarea id="goals" name="goals" rows={3} placeholder="One outcome per line · up to 20" />
            </div>
            <div className="field-group context-wide">
              <label htmlFor="constraints">Known constraints <span className="optional">· optional</span></label>
              <textarea id="constraints" name="constraints" rows={3} placeholder="Time, cost, access, privacy, policy, or any other constraint — one per line · up to 20" />
            </div>
          </div>
          {error && <p className="error-message" id="problem-error" role="alert">{error} Your other inputs have been preserved.</p>}
          <div className="form-footer">
            <p>All supplied facts are labeled <strong>USER PROVIDED</strong>. The three approaches below are generic <strong>PROPOSED</strong> patterns.</p>
            <button className="button button-primary" type="submit">Map this problem <span aria-hidden="true">→</span></button>
          </div>
        </form>
      </section>

      {problem && (
        <>
          <ProblemMap problem={problem} />

          <section className="section-block" id="solutions" aria-labelledby="solutions-heading">
            <div className="section-heading">
              <div><p className="eyebrow">02 / POSSIBLE DIRECTIONS</p><h2 id="solutions-heading">Three different starting points</h2></div>
              <span className="state-note">All are proposals · none are verified</span>
            </div>
            <p className="section-intro">These broad strategies use no invented domain-specific details. Open each to inspect its mechanism and assumptions.</p>
            <div className="solution-grid">
              {solutions.map((solution, index) => (
                <SolutionCard
                  key={solution.id}
                  solution={solution}
                  index={index}
                  isActive={solution.id === activeId}
                  recommendation={evaluations[solution.id]?.recommendation ?? "NEEDS_WORK"}
                  onReview={() => { setActiveId(solution.id); setNotice(`Now assessing ${solution.name}.`); }}
                />
              ))}
            </div>
          </section>

          {activeSolution && evaluations[activeSolution.id] && (
            <section className="panel section-block" id="evaluation" aria-labelledby="evaluation-heading">
              <div className="section-heading">
                <div><p className="eyebrow">03 / EVALUATION · {activeSolution.name}</p><h2 id="evaluation-heading">Stress-test the approach</h2></div>
                <RecommendationStamp value={evaluations[activeSolution.id].recommendation} />
              </div>
              <p className="section-intro">You set each status and explain why. Link only sources that you considered; unassessed or incomplete criteria remain visible.</p>
              <CriterionReview
                evaluation={evaluations[activeSolution.id]}
                evidence={problem.evidence}
                constraints={problem.constraints}
                onUpdate={updateAssessment}
              />
              <div className="rule-note">
                <strong>Recommendation rule · no scores or weights</strong>
                <p>Any <b>FAIL</b> → <b>INCOMPATIBLE</b>. All six <b>PASS</b> → <b>PROMISING</b>. Any other combination, including an unknown → <b>NEEDS WORK</b>.</p>
                <p>This is a transparent summary of your statuses, not an independent expert verdict.</p>
              </div>
            </section>
          )}

          <section className="panel section-block" id="decision" aria-labelledby="decision-heading">
            <div className="section-heading">
              <div><p className="eyebrow">04 / YOUR DECISION</p><h2 id="decision-heading">Choose a direction</h2></div>
              <span className="state-note">Your choice stays yours</span>
            </div>
            <p className="section-intro">The recommendation summarizes assessments; it does not select for you. Record the direction you want to explore and the sources behind your choice.</p>
            <form className="decision-form" onSubmit={recordDirection}>
              {decisionError && <p className="error-message" role="alert">{decisionError} Your assessment and cited sources are preserved.</p>}
              <div className="field-group">
                <label htmlFor="direction-select">Direction to record</label>
                <select id="direction-select" value={directionId} onChange={(event) => setDirectionId(event.target.value)}>
                  {solutions.map((solution) => <option key={solution.id} value={solution.id}>{solution.name} · {evaluations[solution.id]?.recommendation.replaceAll("_", " ")}</option>)}
                </select>
              </div>
              <div className="field-group">
                <label htmlFor="decision-rationale">Why this direction? <span className="optional">· optional</span></label>
                <textarea id="decision-rationale" rows={3} maxLength={1000} value={rationale} onChange={(event) => setRationale(event.target.value)} placeholder="Your reason, or what you still need to learn." />
              </div>
              <fieldset className="reference-fieldset">
                <legend>Sources you want to cite for this choice</legend>
                <p className="field-hint">Only the sources you check will be linked in the decision trail.</p>
                <div className="reference-grid">
                  {problem.evidence.map((item) => <ReferenceCheckbox key={item.id} id={item.id} text={item.text} checked={directionReferences.includes(item.id)} onChange={() => toggleReference(item.id, directionReferences, setDirectionReferences)} />)}
                  {problem.constraints.map((item) => <ReferenceCheckbox key={item.id} id={item.id} text={item.description} checked={directionReferences.includes(item.id)} onChange={() => toggleReference(item.id, directionReferences, setDirectionReferences)} />)}
                </div>
                {!referenceIds.length && <p className="empty-note">No source objects are available to cite.</p>}
              </fieldset>
              <div className="decision-actions">
                <button className="button button-primary" type="submit">{decision ? "Update my direction" : "Record my direction"}</button>
                {decision && <span className="saved-inline">Recorded separately from the recommendation.</span>}
              </div>
            </form>
          </section>

          {prototype && decision && (
            <section className="prototype-section section-block" id="prototype" aria-labelledby="prototype-heading">
              <div className="section-heading">
                <div><p className="eyebrow">05 / PROTOTYPE · A SMALL VERTICAL SLICE</p><h2 id="prototype-heading">{prototype.name}</h2></div>
                <span className="state-note">Interaction sketch</span>
              </div>
              <div className="prototype-grid">
                <div className="prototype-brief">
                  <h3>Purpose</h3><p>{prototype.purpose}</p>
                  <h3>Core interaction</h3><p>{prototype.coreInteraction}</p>
                  <h3>Known limits</h3>
                  <ul>{prototype.knownLimitations.map((limitation) => <li key={limitation}>{limitation}</li>)}</ul>
                  <p className="prototype-data"><strong>Requires:</strong> {prototype.requiredData.join("; ")}.</p>
                </div>
                <div className="prototype-test">
                  <p className="eyebrow">TRY THE INTERACTION</p>
                  <h3>Record one observation</h3>
                  <p>Enter a note from your own test. Nothing is sent anywhere.</p>
                  <form onSubmit={savePrototypeNote}>
                    <label className="visually-hidden" htmlFor="prototype-note">Observation note</label>
                    <textarea id="prototype-note" rows={4} maxLength={600} value={prototypeNote} onChange={(event) => setPrototypeNote(event.target.value)} placeholder="What did you notice?" />
                    <button className="button button-secondary" type="submit" disabled={!prototypeNote.trim()}>Save note in this session</button>
                  </form>
                  {savedObservation && <p className="saved-observation"><span className="evidence-status">USER PROVIDED · NEEDS VERIFICATION</span><br /><code>{savedObservation.id}</code><br />{savedObservation.text}</p>}
                </div>
              </div>
            </section>
          )}

          <section className="panel section-block trail-section" id="decision-trail" aria-labelledby="trail-heading">
            <div className="section-heading">
              <div><p className="eyebrow">06 / TRACEABLE REASONS</p><h2 id="trail-heading">Decision trail</h2></div>
              <span className="state-note">Source IDs resolve to this workspace</span>
            </div>
            <ol className="trail-list">
              {trail.map((step) => <TrailEntry key={step.id} step={step} />)}
              {trail.length === 0 && <li className="empty-note">Map a problem to start a source-linked trail.</li>}
            </ol>
          </section>
          <div className="reset-row"><p>Work lives in this browser tab only; it is not saved after refresh.</p><button className="text-button" type="button" onClick={resetWorkspace}>Reset workspace</button></div>
        </>
      )}

      <footer className="footer"><span>NEXUS</span><span>Structure first. Uncertainty visible. The decision is yours.</span></footer>
    </main>
  );
}

function WorkflowMap({ hasDecision, hasPrototype }: { hasDecision: boolean; hasPrototype: boolean }) {
  const stages = [
    { label: "Problem", target: "problem-map", done: true },
    { label: "Constraints", target: "problem-map", done: true },
    { label: "Approaches", target: "solutions", done: true },
    { label: "Evaluation", target: "evaluation", done: true },
    { label: "Your direction", target: "decision", done: hasDecision },
    { label: "Prototype", target: "prototype", done: hasPrototype },
  ];
  return (
    <nav className="workflow-map" aria-label="Solution Graph · problem-solving stages">
      <p className="eyebrow">SOLUTION GRAPH</p>
      <ol>
        {stages.map((stage, index) => (
          <li className={stage.done ? "graph-stage-done" : ""} key={stage.label}>
            <a href={`#${stage.target}`} aria-current={index === 0 ? "step" : undefined}><span className="graph-index">{String(index + 1).padStart(2, "0")}</span><span>{stage.label}</span></a>
            {index < stages.length - 1 && <span className="graph-connector" aria-hidden="true">→</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}

function RecommendationStamp({ value }: { value: string }) {
  const copy: Record<string, string> = { PROMISING: "PROMISING", NEEDS_WORK: "NEEDS WORK", INCOMPATIBLE: "INCOMPATIBLE" };
  return <span className={`recommendation-stamp recommendation-${value.toLowerCase().replaceAll("_", "-")}`} aria-live="polite">{copy[value] ?? value}</span>;
}

function ReferenceCheckbox({ id, text, checked, onChange }: { id: string; text: string; checked: boolean; onChange: () => void }) {
  return (
    <label className="check-label reference-item">
      <input type="checkbox" checked={checked} onChange={onChange} />
      <span><code>{id}</code> · {text}</span>
    </label>
  );
}

function toggleReference(id: string, selected: string[], setter: (value: string[]) => void) {
  setter(selected.includes(id) ? selected.filter((entry) => entry !== id) : [...selected, id]);
}

function buildTrail(
  problem: Problem | null,
  solutions: Solution[],
  evaluations: Record<string, Evaluation>,
  decision: Decision | null,
  observation: Evidence | null,
): DecisionTrailStep[] {
  if (!problem) return [];
  const sourceIds = problem.evidence.map((item) => item.id);
  const constraintIds = problem.constraints.map((item) => item.id);
  const steps: DecisionTrailStep[] = [{
    id: "trail-problem-map",
    stage: "Problem map",
    decision: "Captured the supplied problem and context without adding outside facts.",
    evidenceIds: sourceIds,
    constraintIds,
    uncertainty: problem.unknowns.length ? problem.unknowns.join(" ") : "The completeness of supplied information has not been independently checked.",
  }];
  for (const solution of solutions) {
    const evaluation = evaluations[solution.id];
    if (!evaluation) continue;
    for (const criterion of Object.keys(evaluation.criteria) as EvaluationCriterion[]) {
      const item = evaluation.criteria[criterion];
      const defaultText = "Not assessed yet. Add a reason and link any sources you considered.";
      if (item.status === "UNKNOWN" && item.explanation === defaultText && !item.evidenceIds.length && !item.constraintIds.length) continue;
      steps.push({
        id: `trail-${solution.id}-${criterion}`,
        stage: "Human assessment",
        decision: `${solution.name} · ${criterion}: ${item.status}${item.explanation ? ` — ${item.explanation}` : ""}`,
        evidenceIds: item.evidenceIds,
        constraintIds: item.constraintIds,
        uncertainty: item.status === "UNKNOWN" || item.status === "PARTIAL" ? "This criterion remains uncertain." : undefined,
      });
    }
  }
  if (decision) {
    const selected = solutions.find((solution) => solution.id === decision.solutionId);
    steps.push({
      id: decision.id,
      stage: "User decision",
      decision: `User selected ${selected?.name ?? "a direction"}${decision.rationale ? ` — ${decision.rationale}` : ""}`,
      evidenceIds: decision.evidenceIds,
      constraintIds: decision.constraintIds,
      uncertainty: "Selection records user intent, not proof that the approach will work.",
    });
  }
  if (observation) {
    steps.push({
      id: "trail-prototype-observation",
      stage: "Prototype note",
      decision: `User-recorded observation: ${observation.text}`,
      evidenceIds: [observation.id],
      constraintIds: [],
      uncertainty: "Self-reported and unverified; this note is held only in page memory.",
    });
  }
  return steps;
}

function TrailEntry({ step }: { step: DecisionTrailStep }) {
  return (
    <li className="trail-entry">
      <span className="trail-marker" aria-hidden="true" />
      <div className="trail-content">
        <span className="trail-stage">{step.stage}</span>
        <p>{step.decision}</p>
        <div className="trail-sources">
          <span>Evidence: {step.evidenceIds.length ? step.evidenceIds.map((id) => <code key={id}>{id}</code>) : <i>none cited</i>}</span>
          <span>Constraints: {step.constraintIds.length ? step.constraintIds.map((id) => <code key={id}>{id}</code>) : <i>none cited</i>}</span>
        </div>
        {step.uncertainty && <p className="trail-uncertainty">Needs verification · {step.uncertainty}</p>}
      </div>
    </li>
  );
}
