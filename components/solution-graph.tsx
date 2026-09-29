import type { Decision, Evaluation, Problem, Prototype, Solution } from "@/lib/types";

interface SolutionGraphProps {
  problem: Problem;
  solutions: Solution[];
  evaluations: Record<string, Evaluation>;
  decision: Decision | null;
  prototype: Prototype | null;
}

export function SolutionGraph({ problem, solutions, evaluations, decision, prototype }: SolutionGraphProps) {
  const selected = solutions.find((solution) => solution.id === decision?.solutionId);
  const assessed = Object.values(evaluations).reduce((total, evaluation) => total + evaluation.strengths.length + evaluation.weaknesses.length, 0);
  const unresolved = Object.values(evaluations).reduce((total, evaluation) => total + evaluation.unknowns.length, 0);
  return (
    <section className="solution-graph-panel" id="solution-graph" aria-labelledby="solution-graph-heading">
      <div className="section-heading graph-heading">
        <div><p className="eyebrow">REASONING MAP</p><h2 id="solution-graph-heading">Solution graph</h2></div>
        <p className="graph-explanation">Follow the evidence, compare distinct routes, and see what still needs checking.</p>
      </div>
      <ol className="solution-graph" aria-label="NEXUS reasoning path">
        <li className="graph-node">
          <a href="#problem-map">
            <span className="graph-node-index">01 · INPUT</span>
            <strong>Problem</strong>
            <span className="graph-node-copy">{shorten(problem.problem.statement, 96)}</span>
            <span className="graph-node-meta">{problem.evidence.length} evidence items · {problem.evidence.filter((item) => item.status === "USER_PROVIDED").length} user provided</span>
          </a>
        </li>
        <li className="graph-node">
          <a href="#problem-map">
            <span className="graph-node-index">02 · CONDITIONS</span>
            <strong>Constraints</strong>
            <span className="graph-node-copy">{problem.constraints.length ? `${problem.constraints.length} supplied · ${[...new Set(problem.constraints.map((item) => item.category.replaceAll("_", " ").toLowerCase()))].join(", ")}` : "None supplied · compatibility unknown"}</span>
            <span className="graph-node-meta">Source status stays visible</span>
          </a>
        </li>
        <li className="graph-node graph-node-wide">
          <a className="graph-stage-link" href="#solutions">
            <span className="graph-node-index">03 · ALTERNATIVES</span>
            <strong>{solutions.length} distinct approaches</strong>
            <span className="graph-node-meta">All are proposals, not verified recommendations</span>
          </a>
          <ul className="graph-solution-links">
            {solutions.map((solution) => <li key={solution.id}><a href={`#solution-${solution.id}`}><span>{solution.strategyType.replaceAll("_", " ")}</span><strong>{solution.name}</strong></a></li>)}
          </ul>
        </li>
        <li className="graph-node">
          <a href="#evaluation">
            <span className="graph-node-index">04 · HUMAN REVIEW</span>
            <strong>Evaluation</strong>
            <span className="graph-node-copy">{assessed} criteria assessed · {unresolved} unknown or partial</span>
            <span className="graph-node-meta">Statuses and reasons are editable</span>
          </a>
        </li>
        <li className="graph-node">
          <a href="#decision">
            <span className="graph-node-index">05 · USER CHOICE</span>
            <strong>Selected direction</strong>
            <span className="graph-node-copy">{selected?.name ?? "Not selected yet"}</span>
            <span className="graph-node-meta">The recommendation does not choose</span>
          </a>
        </li>
        <li className="graph-node">
          <a href="#prototype">
            <span className="graph-node-index">06 · VERTICAL SLICE</span>
            <strong>Prototype</strong>
            <span className="graph-node-copy">{prototype?.name ?? "Ready after a direction is selected"}</span>
            <span className="graph-node-meta">One local interaction · no external action</span>
          </a>
        </li>
      </ol>
    </section>
  );
}

function shorten(value: string, max: number): string {
  return value.length <= max ? value : `${value.slice(0, max - 1).trimEnd()}…`;
}
