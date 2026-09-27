'use client';
import { useRef, useState } from 'react';
import { isWorkspace } from '../lib/decision';

const key = 'nexus-workspace-v1';
export default function DraftTools() {
  const picker = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState('');
  function exportDraft() {
    try {
      const saved = localStorage.getItem(key);
      if (!saved || !isWorkspace(JSON.parse(saved))) throw new Error('No valid draft to export.');
      const url = URL.createObjectURL(new Blob([saved], { type: 'application/json' }));
      const link = document.createElement('a');
      link.href = url; link.download = 'nexus-draft.json'; link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setStatus('Draft exported. Keep the file private if it contains sensitive information.');
    } catch (e) { setStatus(e instanceof Error ? e.message : 'Could not export the draft.'); }
  }
  async function importDraft(file?: File) {
    if (!file) return;
    try {
      if (file.size > 100000) throw new Error('Draft exceeds the 100 KB import limit.');
      const value: unknown = JSON.parse(await file.text());
      if (!isWorkspace(value)) throw new Error('Not a valid NEXUS draft. No changes were made.');
      if (!window.confirm('Replace the current browser draft with this file?')) return;
      localStorage.setItem(key, JSON.stringify(value));
      window.location.reload();
    } catch (e) { setStatus(e instanceof Error ? e.message : 'Could not restore the draft.'); }
    finally { if (picker.current) picker.current.value = ''; }
  }
  function clearDraft() {
    if (!window.confirm('Permanently remove the NEXUS draft from this browser? Export it first to keep a copy.')) return;
    try { localStorage.removeItem(key); window.location.reload(); }
    catch { setStatus('Could not clear the browser draft.'); }
  }
  return <section className="draftTools shell" aria-label="Draft management"><h2>Manage this draft</h2><p>Export a copy, restore a saved file, or remove this browser’s draft. Files may contain sensitive problem details.</p><div className="draftActions"><button type="button" className="secondary" onClick={exportDraft}>Export JSON</button><button type="button" className="secondary" onClick={() => picker.current?.click()}>Restore JSON</button><button type="button" className="quiet" onClick={clearDraft}>Clear browser draft</button></div><input ref={picker} className="visuallyHidden" type="file" accept="application/json,.json" aria-label="Choose NEXUS draft JSON" onChange={e => { void importDraft(e.target.files?.[0]); }}/>{status && <p role="status">{status}</p>}</section>;
}
