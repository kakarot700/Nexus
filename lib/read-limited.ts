export async function readLimited(stream: ReadableStream<Uint8Array> | null, maxBytes: number): Promise<string> {
  if (!stream) throw new Error('Empty body');
  const reader = stream.getReader();
  const decoder = new TextDecoder('utf-8', { fatal: true });
  let size = 0;
  let output = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) throw new Error('Body too large');
      output += decoder.decode(value, { stream: true });
    }
    return output + decoder.decode();
  } finally { await reader.cancel().catch(() => undefined); reader.releaseLock(); }
}
