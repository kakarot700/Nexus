'use client';
import { useEffect, useRef, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { blankOption, type Workspace } from '../lib/decision';
import { parseExploration, parsePrototype, type Exploration, type GeneratedPrototype } from '../lib/ai';

async function requestAI(action: 'explore' | 'prototype', workspace: Workspace): Promise<unknown> {
  const response = await fetch('/api/ai', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, workspace }) });
  const payload: unknown = await response.json();
  if (!response.ok) {
    const message = payload && typeof payload === 'object' && 'error' in payload && typeof payload.error === 'string' ? payload.error : 'AI is unavailable; your work is unchanged.';
    throw new Error(message);
  }
  return payload;
}

export function Explore({ workspace, setWorkspace }: { workspace: Workspace; setWorkspace: Dispatch<SetStateAction<Workspace>> }) {
  const [result, setResult] = useState<Exploration | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const current = useRef(JSON.stringify(workspace));
  current.current = JSON.stringify(workspace);
  useEffect(() => { setResult(null); }, [workspace]);
  async function explore() {
    const snapshot = current.current;
    setBusy(true); setError('');
    try {
      const payload = await requestAI('explore', workspace);
      if (snapshot !== current.current) throw new Error('Your notes changed while exploring. Generate again to use the latest version.');
      if (!payload || typeof payload !== 'object' || !('exploration' in payload)) throw new Error('Invalid result');
      setResult(parseExploration(payload.exploration));
    } catch (e) { setError(e instanceof Error ? e.message : 'Exploration failed.'); }
    finally { setBusy(false); }
  }
  function useApproaches() {
    if (!result) return;
    const generated = result.approaches.map(a => ({ ...blankOption(crypto.randomUUID()), title: a.name, mechanism: `${a.mechanism}\nPotential benefit: ${a.benefit}\nRisk: ${a.risk}\nAssumption to verify: ${a.assumption}` }));
    setWorkspace(w => ({ ...w, options: [...w.options.filter(o => o.title.trim()), ...generated].slice(0, 6) }));
    setResult(null);
  }
  return <aside className="aiPanel" aria-label="Optional AI exploration"><h3>Explore possible directions <span className="badge">OPTIONAL AI</span></h3><p>Send your current problem and notes to your configured AI provider. Review every proposal before using it; no evidence is independently verified.</p><button className="secondary" type="button" disabled={busy || !workspace.problem.trim()} onClick={explore}>{busy ? 'Exploring…' : 'Generate approaches'}</button>{error && <p role="alert" className="notice">{error}</p>}{result && <div aria-live="polite"><h4>Proposed directions</h4><p><strong>Inferred stakeholders:</strong> {result.stakeholders.join('; ') || 'Not identified'}</p><p><strong>Possible goals:</strong> {result.goals.join('; ') || 'Not identified'}</p><p><strong>Unknowns:</strong> {result.unknowns.join('; ') || 'Not identified'}</p><p><strong>Assumptions:</strong> {result.assumptions.join('; ') || 'Not identified'}</p><ol>{result.approaches.map(a => <li key={a.name}><strong>{a.name}</strong> · {a.strategyType}<p>{a.mechanism}</p><p>Benefit: {a.benefit} · Risk: {a.risk} · Assumption: {a.assumption}</p></li>)}</ol><button className="primary" type="button" onClick={useApproaches}>Use these proposed approaches</button><p className="hint">Existing named approaches are kept, up to six total. You can edit or remove proposals afterward.</p></div>}</aside>;
}

export function PrototypeExplorer({ workspace }: { workspace: Workspace }) {
  const [result, setResult] = useState<GeneratedPrototype | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [screen, setScreen] = useState(0);
  const current = useRef(JSON.stringify(workspace));
  current.current = JSON.stringify(workspace);
  useEffect(() => { setResult(null); setScreen(0); }, [workspace]);
  async function generate() {
    const snapshot = current.current;
    setBusy(true); setError(''); setResult(null); setScreen(0);
    try {
      const payload = await requestAI('prototype', workspace);
      if (snapshot !== current.current) throw new Error('Your decision changed while generating. Generate again using the latest version.');
      if (!payload || typeof payload !== 'object' || !('prototype' in payload)) throw new Error('Invalid result');
      setResult(parsePrototype(payload.prototype));
    } catch (e) { setError(e instanceof Error ? e.message : 'Prototype generation failed.'); }
    finally { setBusy(false); }
  }
  return <aside className="aiPanel" aria-label="Optional AI prototype"><h3>Prototype outline <span className="badge">PROPOSED</span></h3><p>A generated screen-by-screen interaction outline, not executable code or a deployed product. Your input is processed by your configured AI provider.</p><button className="secondary" type="button" disabled={busy || !workspace.selectedId} onClick={generate}>{busy ? 'Generating…' : 'Generate prototype outline'}</button>{error && <p role="alert" className="notice">{error}</p>}{result && <div><h4>{result.name}</h4><p>{result.purpose}</p><p>Step {screen + 1} of {result.screens.length}</p><section className="prototype" aria-live="polite"><h4>{result.screens[screen].title}</h4><p>{result.screens[screen].purpose}</p><p><strong>Proposed interaction:</strong> {result.screens[screen].interaction}</p><div className="actions"><button className="secondary" type="button" disabled={screen === 0} onClick={() => setScreen(s => s - 1)}>Previous</button><button className="primary" type="button" disabled={screen === result.screens.length - 1} onClick={() => setScreen(s => s + 1)}>Next screen</button></div></section><p><strong>Required data:</strong> {result.requiredData.join('; ') || 'Not specified'}</p><p><strong>Limitations:</strong> {result.limitations.join('; ') || 'Not specified'}</p></div>}</aside>;
}
