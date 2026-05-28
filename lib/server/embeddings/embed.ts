// Embedding layer stub — Phase 4
// Produces 384-dim sentence embeddings for product and user preference text.
//
// Current implementation: throws if called, to prevent accidental use before
// the embedding package is approved and installed.
//
// To activate: install @xenova/transformers (or OpenAI text-embedding-3-small)
// and replace the stub below with the real pipeline call.
// See Phase 4 plan — P4-T3 for options and approval requirement.

export async function embed(_text: string): Promise<number[]> {
  throw new Error(
    'Embedding not yet configured. Install @xenova/transformers and implement embed() in lib/server/embeddings/embed.ts',
  );
}
