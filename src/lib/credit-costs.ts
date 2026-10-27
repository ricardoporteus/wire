/**
 * WIRE — credit price list. Pure constants, no imports.
 *
 * Deliberately separate from lib/credits: that module pulls in Drizzle, the
 * schema and the Neon driver, so anything importing it from a client component
 * dragged the whole ORM into the browser bundle. The marketing homepage quotes
 * these numbers, so they need to be reachable without any of that.
 *
 * Keep in sync with plan copy.
 */
export const CREDIT_COSTS = {
  intelligence_run: 100,
  diagnosis: 1,
  generation: 20,
  regeneration: 2,
  repurpose: 5, // one export pack (all requested kinds for one document)
  // Flat, charged up front before AssemblyAI runs and refunded if it fails.
  // Deliberately flat rather than per-minute: predictable for the user, and 3
  // credits (~a repurpose pack) comfortably covers the real AssemblyAI cost even
  // at the 4-hour ceiling. Diagnosis and generation are billed separately after.
  transcription: 3,
} as const;

export const PLAN_GRANTS = { launch: 500, growth: 1400, scale: 4000, trial: 150 } as const;

/** One bulk-written piece: diagnosis + generation, billed as for a single piece. */
export const PER_PIECE_CREDITS = CREDIT_COSTS.diagnosis + CREDIT_COSTS.generation;
