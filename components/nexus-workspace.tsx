"use client";

import { useMemo, useState, type FormEvent } from "react";
import { CriterionReview } from "@/components/criterion-review";
import { ProblemMap } from "@/components/problem-map";
import { SolutionCard } from "@/components/solution-card";
import { SolutionGraph } from "@/components/solution-graph";
import { buildPrototype, sanitizeReferences, updateCriterion } from "@/lib/engine";
import { LocalGuidedProvider } from "@/lib/provider";
import type {
  Decision,
  DecisionTrailStep,
  Evaluation,
  EvaluationCriterion,
  EvaluationStatus,
  Evidence,
  Problem,
  ProblemInput,
  ProviderMode,
  Prototype,
  Solution,
  SolutionCritique,
} from "@/lib/types";

const localProvider = new LocalGuidedProvider();
const WORKFLOW_STAGES = ["Analyzing problem", "Generating approaches", "Stress-testing approaches", "Evaluating constraints"] as const;

type ApiEnvelope<T> = { data: T; mode: ProviderMode; notice?: string };

async function postJson<T>(path: string, body: unknown): Promise<{ payload: T; mode: ProviderMode; notice?: string }> {
  const response = await fetch(path, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  let payload: unknown;
  try {
    payload = await response.json() as unknown;
  } catch {
    throw new Error("The server returned an unreadable response.");
  }
  const envelope = payload as Partial<ApiEnvelope<T>> & { error?: { message?: string } };
  if (!response.ok) throw new Error(envelope.error?.message ?? "The server could not complete this stage.");
  if (!envelope.data || (envelope.mode !== "demo" && envelope.mode !== "openai")) throw new Error("The server response did not match the expected structure.");
  return { payload: envelope.data, mode: envelope.mode, notice: envelope.notice };
}

export function NexusWorkspace({ initialMode, configurationNotice }: { initialMode: ProviderMode; configurationNotice?: string }) {
  const [problem, setProblem] = useState<Problem | null>(null);
  const [solutions, setSolutions] = useState<Solution[]>([]);
  const [critiques, setCritiques] = useState<SolutionCritique[]>([]);
  const [evaluations, setEvaluations] = useState<Record<string, Evaluation>>({});
  const [activeId, setActiveId] = useState("");
  const [directionId, setDirectionId] = useState("");
  const [directionReferences, setDirectionReferences] = useState<string[]>([]);
  const [rationale, setRationale] = useState("");
  const [decision, setDecision] = useState<Decision | null>(null);
  const [prototype, setPrototype] = useState<Prototype | null>(null);
  const [isWorking, setIsWorking] = useState(false);
  const [loadingStage, setLoadingStage] = useState<string>(WORKFLOW_STAGES[0]);
  const [decisionError, setDecisionError] = useState("");
  const [prototypeNote, setPrototypeNote] = useState("");
  const [savedObservation, setSavedObservation] = useState<Evidence | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(configurationNotice ?? "");
  const [providerModes, setProviderModes] = useState<{ analysis: ProviderMode; solutions: ProviderMode }>({ analysis: initialMode, solutions: initialMode });
  const [hasRun, setHasRun] = useState(false);
  const [lastInput, setLastInput] = useState<ProblemInput | null>(null);

  const activeSolution = solutions.find((solution) => solution.id === activeId) ?? null;
  const referenceIds = useMemo(
    () => problem ? [...problem.evidence.map((item) => item.id), ...problem.constraints.map((item) => item.id)] : [],
    [problem],
  );
  const critiqueBySolution = useMemo(() => Object.fromEntries(critiques.map((item) => [item.solutionId, item])), [critiques]);
  const evidenceById = useMemo(() => new Map(problem?.evidence.map((item) => [item.id, item]) ?? []), [problem]);
  const constraintById = useMemo(() => new Map(problem?.constraints.map((item) => [item.id, item]) ?? []), [problem]);
  const trail = useMemo(() => buildTrail(problem, solutions, evaluations, decision, savedObservation), [problem, solutions, evaluations, decision, savedObservation]);

  function addNotice(message: string | undefined) {
    if (!message) return;
    setNotice((current) => current.includes(message) ? current : [current, message].filter(Boolean).join(" "));
  }

  function updateMode(stage: "analysis" | "solutions", mode: ProviderMode) {
    setProviderModes((current) => ({ ...current, [stage]: mode }));
  }

  async function runWorkflow(input: ProblemInput) {
    setError("");
    setNotice(configurationNotice ?? "");
    setProviderModes({ analysis: initialMode, solutions: initialMode });
    setHasRun(true);
    setIsWorking(true);
    let mapped: Problem;
    try {
      setLoadingStage(WORKFLOW_STAGES[0]);
      try {
        const response = await postJson<Problem>("/api/nexus/analyze", input);
        mapped = response.payload;
        updateMode("analysis", response.mode);
        addNotice(response.notice);
      } catch (cause) {
        mapped = await localProvider.analyzeProblem(input);
        updateMode("analysis", "demo");
        addNotice(`Server analysis was unavailable (${safeMessage(cause)}). Your text was preserved and mapped by the deterministic local demo.`);
      }

      setProblem(mapped);
      setSolutions([]);
      setCritiques([]);
      setEvaluations({});
      setDecision(null);
      setPrototype(null);
      setSavedObservation(null);
      setDirectionReferences([]);
      setRationale("");

      setLoadingStage(WORKFLOW_STAGES[1]);
      let generated: Solution[];
      try {
        const response = await postJson<Solution[]>("/api/nexus/solutions", { problem: mapped, input });
        generated = response.payload;
        updateMode("solutions", response.mode);
        addNotice(response.notice);
      } catch (cause) {
        generated = await localProvider.generateSolutions(mapped);
        updateMode("solutions", "demo");
        addNotice(`Solution generation was unavailable (${safeMessage(cause)}). The completed map is preserved; distinct deterministic proposal templates were used instead.`);
      }
      setSolutions(generated);
      setActiveId(generated[0]?.id ?? "");
      setDirectionId("");

      setLoadingStage(WORKFLOW_STAGES[2]);
      let critic: SolutionCritique[];
      try {
        const response = await postJson<SolutionCritique[]>("/api/nexus/critic", { problem: mapped, input, solutions: generated });
        critic = response.payload;
        addNotice(response.notice);
      } catch (cause) {
        critic = await localProvider.critiqueSolutions(mapped, generated);
        addNotice(`The critic stage could not reach the server (${safeMessage(cause)}). The deterministic critic used the completed map and proposals.`);
      }
      setCritiques(critic);

      setLoadingStage(WORKFLOW_STAGES[3]);
      const assessments = await localProvider.evaluateSolutions(mapped, generated);
      setEvaluations(Object.fromEntries(assessments.map((item) => [item.solutionId, item])));
      addNotice("Problem map, five distinct approaches, critic checks, and explained qualitative evaluation are ready. All generated paths remain proposals until reviewed.");
      window.setTimeout(() => document.getElementById("solution-graph")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
    } catch (cause) {
      setError(`WHAT HAPPENED: ${safeMessage(cause)}. WHAT WAS PRESERVED: your form text and any completed stages. WHAT YOU CAN DO NEXT: retry the same analysis or continue with the deterministic demo.`);
    } finally {
      setIsWorking(false);
    }
  }

  async function startMapping(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const input: ProblemInput = {
      statement: String(form.get("problem") ?? ""),
      stakeholders: String(form.get("stakeholders") ?? ""),
      goals: String(form.get("goals") ?? ""),
      constraints: String(form.get("constraints") ?? ""),
    };
    setLastInput(input);
    await runWorkflow(input);
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
    if (!selected) return;
    try {
      const prototypeDraft = buildPrototype(selected);
      const next: Decision = {
        id: "decision-1",
        solutionId: directionId,
        rationale: rationale.trim(),
        evidenceIds: sanitizeReferences(directionReferences, problem.evidence.map((item) => item.id)),
        constraintIds: sanitizeReferences(directionReferences, problem.constraints.map((item) => item.id)),
        selectionKind: "USER_SELECTED",
      };
      setDecision(next);
      setPrototype(prototypeDraft);
      setPrototypeNote("");
      setSavedObservation(null);
      setDecisionError("");
      addNotice("Your selected direction is recorded separately from its qualitative recommendation. The prototype is an interaction sketch, not a validated service.");
      window.setTimeout(() => document.getElementById("prototype")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
    } catch {
      setDecisionError("Your selected direction and assessments are preserved, but the prototype could not be prepared. Retry recording the direction.");
    }
  }

  function savePrototypeNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = prototypeNote.trim();
    if (!text) return;
    setSavedObservation({ id: "evidence-prototype-observation-1", text, status: "USER_PROVIDED", sourceField: "PROTOTYPE", sourceQuote: text });
    addNotice("Observation recorded in this page session only. It is user-provided and still needs verification.");
  }

  function resetWorkspace() {
    setProblem(null);
    setSolutions([]);
    setCritiques([]);
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
    setProviderModes({ analysis: initialMode, solutions: initialMode });
    setHasRun(false);
    const form = document.getElementById("problem-form") as HTMLFormElement | null;
    form?.reset();
    setLastInput(null);
    document.getElementById("problem-input")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <main className="site-shell" id="top">
      <header className="topbar">
        <a className="wordmark" href="#top" aria-label="NEXUS home"><span className="wordmark-mark" aria-hidden="true">N</span><span>NEXUS</span></a>
        <div className={`mode-indicator ${getModeTone(initialMode, providerModes, hasRun)}`} role="status">
          <span className="mode-dot" /> {getModeLabel(initialMode, providerModes, hasRun)}
        </div>
      </header>

      <div className="hero">
        <div>
          <p className="eyebrow">A WORKSPACE FOR COMPLEX PROBLEMS</p>
          <h1>Think through the problem.<br /><em>Choose a direction you can explain.</em></h1>
          <p className="hero-copy">Map what is known. Compare structurally different routes. Stress-test each one, then make uncertainty visible before deciding.</p>
        </div>
        <aside className="hero-note" aria-label="NEXUS process">
          <span>PROBLEM</span><i aria-hidden="true">→</i><span>EVIDENCE</span><i aria-hidden="true">→</i><span>CRITIQUE</span><i aria-hidden="true">→</i><span>DECISION</span>
        </aside>
      </div>

      {initialMode === "openai" ? (
        <p className="privacy-note">Problem text is sent server-side when live provider mode is configured, even if a stage later falls back. NEXUS does not save it; provider data handling depends on your provider account and settings.</p>
      ) : (
        <p className="privacy-note">No live model is configured for this deployment. The deterministic demo uses no external AI and marks its strategy templates as proposals.</p>
      )}
      {notice && <aside className="notice-panel" aria-label="Pipeline status"><strong>Pipeline status</strong><p>{notice}</p>{lastInput && !isWorking && <button className="text-button" type="button" onClick={() => void runWorkflow(lastInput)}>Run again with same input</button>}</aside>}

      {problem && <SolutionGraph problem={problem} solutions={solutions} evaluations={evaluations} decision={decision} prototype={prototype} />}
      <div className="sr-announcer" role="status" aria-live="polite">{notice}</div>

      <section className="panel input-panel" id="problem-input" aria-labelledby="input-heading">
        <div className="section-heading">
          <div><p className="eyebrow">START HERE</p><h2 id="input-heading">Describe the problem</h2></div>
          <span className="step-count">NO ACCOUNT · NO SETUP</span>
        </div>
        <p className="section-intro">Keep your wording and sources visible. Add people, goals, and constraints if you know them; NEXUS leaves missing detail unresolved.</p>
        <form id="problem-form" onSubmit={startMapping} aria-busy={isWorking}>
          <div className="field-group">
            <label htmlFor="problem-description">What are you trying to make sense of?</label>
            <textarea id="problem-description" name="problem" rows={4} maxLength={3000} required placeholder="Describe the situation, who is affected if you know, and what feels unresolved." aria-describedby={error ? "problem-hint problem-error" : "problem-hint"} />
            <span className="field-hint" id="problem-hint">Keep it in your own words. Up to 3,000 characters.</span>
          </div>
          <div className="context-fields">
            <div className="field-group">
              <label htmlFor="stakeholders">People affected <span className="optional">· optional</span></label>
              <textarea id="stakeholders" name="stakeholders" rows={3} maxLength={6020} placeholder="One person or group per line · up to 20" />
            </div>
            <div className="field-group">
              <label htmlFor="goals">Useful outcomes <span className="optional">· optional</span></label>
              <textarea id="goals" name="goals" rows={3} maxLength={6020} placeholder="One outcome per line · up to 20" />
            </div>
            <div className="field-group context-wide">
              <label htmlFor="constraints">Known constraints <span className="optional">· optional</span></label>
              <textarea id="constraints" name="constraints" rows={3} maxLength={6020} placeholder="Time, cost, access, privacy, or other constraints — one per line · up to 20" />
            </div>
          </div>
          {error && <div className="error-panel" id="problem-error" role="alert"><strong>Recovery details</strong><p>{error}</p><button className="button button-secondary" type="button" onClick={() => lastInput && void runWorkflow(lastInput)} disabled={!lastInput || isWorking}>Retry with preserved input</button></div>}
          {isWorking && <WorkflowProgress stage={loadingStage} />}
          <div className="form-footer">
            <p>Direct inputs retain <strong>USER PROVIDED</strong> status. Generated analysis, approaches, and critic prompts remain labeled and source-checked.</p>
            <button className="button button-primary" type="submit" disabled={isWorking}>
              {isWorking ? `${loadingStage}…` : "Analyze problem"} <span aria-hidden="true">→</span>
            </button>
          </div>
        </form>
      </section>

      {problem && (
        <>
          <ProblemMap problem={problem} />

          <section className="section-block" id="solutions" aria-labelledby="solutions-heading">
            <div className="section-heading">
              <div><p className="eyebrow">02 / POSSIBLE DIRECTIONS</p><h2 id="solutions-heading">Five different starting points</h2></div>
              <span className="state-note">All are proposals · none are verified</span>
            </div>
            <p className="section-intro">Compare software, human-supported, infrastructure, behavioral, and hybrid approaches. Each path names its mechanism, resource needs, constraint response, risks, and assumptions.</p>
            {solutions.length ? <div className="solution-grid">
              {solutions.map((solution, index) => (
                <SolutionCard
                  key={solution.id}
                  solution={solution}
                  critique={critiqueBySolution[solution.id] ?? { solutionId: solution.id, findings: [] }}
                  problem={problem}
                  index={index}
                  isActive={solution.id === activeId}
                  recommendation={evaluations[solution.id]?.recommendation ?? "NEEDS_WORK"}
                  onReview={() => { setActiveId(solution.id); addNotice(`Now assessing ${solution.name}.`); }}
                />
              ))}
            </div> : <p className="empty-note">No solution paths are available yet. Retry the workflow above; the completed problem map is preserved.</p>}
          </section>

          {activeSolution && evaluations[activeSolution.id] && (
            <section className="panel section-block" id="evaluation" aria-labelledby="evaluation-heading">
              <div className="section-heading">
                <div><p className="eyebrow">04 / EVALUATION · {activeSolution.name}</p><h2 id="evaluation-heading">Review what the evidence supports</h2></div>
                <RecommendationStamp value={evaluations[activeSolution.id].recommendation} />
              </div>
              <p className="section-intro">Every criterion starts <strong>UNKNOWN</strong>. You set the status, explain why, and cite only source objects in this map. The critic&apos;s challenge is not a verified evaluation.</p>
              <CriterionReview evaluation={evaluations[activeSolution.id]} evidence={problem.evidence} constraints={problem.constraints} onUpdate={updateAssessment} />
              <div className="rule-note">
                <strong>Deterministic recommendation rule · no scores or weights</strong>
                <p>Any <b>FAIL</b> → <b>INCOMPATIBLE</b>. All six <b>PASS</b> → <b>PROMISING</b>. Any other combination, including an unknown → <b>NEEDS WORK</b>.</p>
                <p>This calculation summarizes the statuses you entered; it is not an independent expert verdict.</p>
              </div>
            </section>
          )}

          <section className="panel section-block" id="decision" aria-labelledby="decision-heading">
            <div className="section-heading">
              <div><p className="eyebrow">05 / YOUR DECISION</p><h2 id="decision-heading">Choose a direction</h2></div>
              <span className="state-note">Your choice stays yours</span>
            </div>
            <p className="section-intro">The qualitative recommendation summarizes your assessments; it does not select for you. Record your reason, cited evidence, and affected constraints.</p>
            <form className="decision-form" onSubmit={recordDirection}>
              {decisionError && <p className="error-message" role="alert">{decisionError}</p>}
              <div className="field-group">
                <label htmlFor="direction-select">Direction to record</label>
                <select id="direction-select" required value={directionId} onChange={(event) => setDirectionId(event.target.value)}>
                  <option value="" disabled>Choose a direction</option>
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
                  {problem.evidence.map((item) => <ReferenceCheckbox key={item.id} id={item.id} text={item.text} status={item.status} checked={directionReferences.includes(item.id)} onChange={() => toggleReference(item.id, directionReferences, setDirectionReferences)} />)}
                  {problem.constraints.map((item) => <ReferenceCheckbox key={item.id} id={item.id} text={item.description} status={item.status} checked={directionReferences.includes(item.id)} onChange={() => toggleReference(item.id, directionReferences, setDirectionReferences)} />)}
                </div>
                {!referenceIds.length && <p className="empty-note">No source objects are available to cite.</p>}
              </fieldset>
              <div className="decision-actions">
                <button className="button button-primary" type="submit" disabled={!directionId}>{decision ? "Update my direction" : "Record my direction"}</button>
                {decision && <span className="saved-inline">Recorded separately from the recommendation.</span>}
              </div>
            </form>
          </section>

          {prototype && decision && (
            <section className="prototype-section section-block" id="prototype" aria-labelledby="prototype-heading">
              <div className="section-heading">
                <div><p className="eyebrow">06 / PROTOTYPE · A SMALL VERTICAL SLICE</p><h2 id="prototype-heading">{prototype.name}</h2></div>
                <span className="state-note">Interactive sketch · local only</span>
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
                  <h3>{prototype.interaction.title}</h3>
                  <p>{prototype.interaction.prompt}</p>
                  <form onSubmit={savePrototypeNote}>
                    <div className="field-group">
                      <label htmlFor="prototype-note">{prototype.interaction.inputLabel}</label>
                      <textarea id="prototype-note" rows={4} maxLength={600} value={prototypeNote} onChange={(event) => setPrototypeNote(event.target.value)} placeholder={prototype.interaction.placeholder} />
                    </div>
                    <button className="button button-secondary" type="submit" disabled={!prototypeNote.trim()}>{prototype.interaction.actionLabel}</button>
                  </form>
                  {savedObservation && <p className="saved-observation"><span className="evidence-status">USER PROVIDED · NEEDS VERIFICATION</span><br /><code>{savedObservation.id}</code><br />{savedObservation.text}</p>}
                </div>
              </div>
            </section>
          )}

          <section className="panel section-block trail-section" id="decision-trail" aria-labelledby="trail-heading">
            <div className="section-heading">
              <div><p className="eyebrow">07 / TRACEABLE REASONS</p><h2 id="trail-heading">Decision trail</h2></div>
              <span className="state-note">Evidence and constraints resolve to this map</span>
            </div>
            <ol className="trail-list">
              {trail.map((step) => <TrailEntry key={step.id} step={step} evidence={evidenceById} constraints={constraintById} observation={savedObservation} />)}
              {trail.length === 0 && <li className="empty-note">Map a problem to start a source-linked trail.</li>}
            </ol>
          </section>
          <div className="reset-row"><p>Work lives in this page session only; it is not saved after refresh.</p><button className="text-button" type="button" onClick={resetWorkspace}>Reset workspace</button></div>
        </>
      )}

      <footer className="footer"><span>NEXUS</span><span>Structure first. Uncertainty visible. The decision is yours.</span></footer>
    </main>
  );
}

function WorkflowProgress({ stage }: { stage: string }) {
  const currentIndex = WORKFLOW_STAGES.indexOf(stage as (typeof WORKFLOW_STAGES)[number]);
  return (
    <div className="workflow-progress" role="status" aria-live="polite" aria-label={`Workflow progress: ${stage}`}>
      <strong>{stage}</strong>
      <ol>{WORKFLOW_STAGES.map((label, index) => <li key={label} className={index < currentIndex ? "progress-done" : index === currentIndex ? "progress-current" : ""} aria-current={index === currentIndex ? "step" : undefined}><span>{index < currentIndex ? "✓" : String(index + 1).padStart(2, "0")}</span>{label}</li>)}</ol>
    </div>
  );
}

function RecommendationStamp({ value }: { value: string }) {
  const copy: Record<string, string> = { PROMISING: "PROMISING", NEEDS_WORK: "NEEDS WORK", INCOMPATIBLE: "INCOMPATIBLE" };
  return <span className={`recommendation-stamp recommendation-${value.toLowerCase().replaceAll("_", "-")}`} aria-live="polite">{copy[value] ?? value}</span>;
}

function ReferenceCheckbox({ id, text, status, checked, onChange }: { id: string; text: string; status: string; checked: boolean; onChange: () => void }) {
  return <label className="check-label reference-item"><input type="checkbox" checked={checked} onChange={onChange} /><span><code>{id}</code> · <span className="evidence-status">{status.replaceAll("_", " ")}</span> {text}</span></label>;
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
  const steps: DecisionTrailStep[] = [{
    id: "trail-problem-map",
    stage: "Problem and evidence",
    decision: "Captured the supplied problem and context. Direct user text is preserved; model-generated inferences remain labeled and source-checked.",
    evidenceIds: problem.evidence.filter((item) => item.status === "USER_PROVIDED").map((item) => item.id),
    constraintIds: problem.constraints.map((item) => item.id),
    uncertainty: problem.unknowns.length ? problem.unknowns.join(" ") : "The completeness of supplied information has not been independently checked.",
  }];
  for (const solution of solutions) {
    const evaluation = evaluations[solution.id];
    if (!evaluation) continue;
    for (const criterion of Object.keys(evaluation.criteria) as EvaluationCriterion[]) {
      const item = evaluation.criteria[criterion];
      if (item.status === "UNKNOWN" && item.explanation.startsWith("Not assessed.") && !item.evidenceIds.length && !item.constraintIds.length) continue;
      steps.push({
        id: `trail-${solution.id}-${criterion}`,
        stage: "Human assessment",
        decision: `${solution.name} · ${criterion}: ${item.status}${item.explanation ? ` — ${item.explanation}` : ""}`,
        evidenceIds: item.evidenceIds,
        constraintIds: item.constraintIds,
        uncertainty: item.status === "UNKNOWN" || item.status === "PARTIAL" ? "This criterion remains uncertain or only partly supported." : undefined,
      });
    }
  }
  if (decision) {
    const selected = solutions.find((solution) => solution.id === decision.solutionId);
    steps.push({
      id: decision.id,
      stage: "User decision",
      decision: `${decision.selectionKind === "USER_SELECTED" ? "User selected" : "Selected"} ${selected?.name ?? "a direction"}${decision.rationale ? ` — ${decision.rationale}` : ""}`,
      evidenceIds: decision.evidenceIds,
      constraintIds: decision.constraintIds,
      uncertainty: "This records user intent, not proof that the approach will work.",
    });
  }
  if (observation) {
    steps.push({
      id: "trail-prototype-observation",
      stage: "Prototype note",
      decision: `User-recorded observation: ${observation.text}`,
      evidenceIds: [observation.id],
      constraintIds: [],
      uncertainty: "Self-reported and unverified; held only in page memory.",
    });
  }
  return steps;
}

function TrailEntry({ step, evidence, constraints, observation }: { step: DecisionTrailStep; evidence: Map<string, Evidence>; constraints: Map<string, Problem["constraints"][number]>; observation: Evidence | null }) {
  const citedEvidence = step.evidenceIds.map((id) => id === observation?.id ? observation : evidence.get(id)).filter((item): item is Evidence => Boolean(item));
  const citedConstraints = step.constraintIds.map((id) => constraints.get(id)).filter((item): item is Problem["constraints"][number] => Boolean(item));
  return (
    <li className="trail-entry">
      <span className="trail-marker" aria-hidden="true" />
      <div className="trail-content">
        <span className="trail-stage">{step.stage}</span>
        <p>{step.decision}</p>
        <div className="trail-sources">
          <span>Evidence: {citedEvidence.length ? citedEvidence.map((item) => <span className="trail-source-item" key={item.id}><code>{item.id}</code> · <span className="evidence-status">{item.status.replaceAll("_", " ")}</span><span className="trail-source-text">{item.text}</span></span>) : <i>none cited</i>}</span>
          <span>Constraints: {citedConstraints.length ? citedConstraints.map((item) => <span className="trail-source-item" key={item.id}><code>{item.id}</code> · <span className="evidence-status">{item.status.replaceAll("_", " ")}</span><span className="trail-source-text">{item.description}</span></span>) : <i>none cited</i>}</span>
        </div>
        {step.uncertainty && <p className="trail-uncertainty">Needs verification · {step.uncertainty}</p>}
      </div>
    </li>
  );
}

function safeMessage(cause: unknown): string {
  return cause instanceof Error ? cause.message : "an unexpected error";
}

function getModeTone(initialMode: ProviderMode, modes: { analysis: ProviderMode; solutions: ProviderMode }, hasRun: boolean): string {
  if (!hasRun) return initialMode === "openai" ? "mode-live" : "mode-demo";
  if (modes.analysis !== modes.solutions) return "mode-mixed";
  return modes.analysis === "openai" ? "mode-live" : "mode-demo";
}

function getModeLabel(initialMode: ProviderMode, modes: { analysis: ProviderMode; solutions: ProviderMode }, hasRun: boolean): string {
  if (!hasRun) return initialMode === "openai" ? "LIVE AI CONFIGURED · NOT YET USED" : "DETERMINISTIC DEMO · NOT LIVE AI";
  if (modes.analysis === "openai" && modes.solutions === "openai") return "LIVE AI · ANALYSIS + SOLUTIONS";
  if (modes.analysis === "demo" && modes.solutions === "demo") return "DETERMINISTIC DEMO · NO LIVE AI USED";
  return modes.analysis === "openai" ? "MIXED · ANALYSIS LIVE / SOLUTIONS DEMO" : "MIXED · ANALYSIS DEMO / SOLUTIONS LIVE";
}
