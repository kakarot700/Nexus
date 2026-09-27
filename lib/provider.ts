export interface AIProvider { generate(system: string, input: unknown): Promise<unknown> }

// OpenAI-compatible chat completions adapter. Secrets and endpoint stay on the server.
export class ChatCompletionsProvider implements AIProvider {
  async generate(system: string, input: unknown): Promise<unknown> {
    const endpoint = process.env.NEXUS_AI_URL;
    const key = process.env.NEXUS_AI_KEY;
    const model = process.env.NEXUS_AI_MODEL;
    if (!endpoint || !key || !model) throw new Error('AI provider is not configured');
    const url = new URL(endpoint);
    if (url.protocol !== 'https:' && !(url.hostname === 'localhost' && url.protocol === 'http:')) throw new Error('AI endpoint must use HTTPS');
    const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` }, body: JSON.stringify({ model, temperature: 0.3, response_format: { type: 'json_object' }, messages: [{ role: 'system', content: system }, { role: 'user', content: JSON.stringify(input) }] }), signal: AbortSignal.timeout(25000), cache: 'no-store' });
    if (!response.ok) throw new Error('AI provider request failed');
    const raw = await response.text();
    if (raw.length > 100000) throw new Error('AI response too large');
    const payload: unknown = JSON.parse(raw);
    if (!payload || typeof payload !== 'object' || !('choices' in payload)) throw new Error('Invalid provider response');
    const choices = (payload as { choices: unknown }).choices;
    if (!Array.isArray(choices) || typeof choices[0]?.message?.content !== 'string') throw new Error('Missing provider output');
    return JSON.parse(choices[0].message.content);
  }
}
