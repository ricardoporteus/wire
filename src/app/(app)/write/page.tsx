import { NewDocument } from "./NewDocument";

export default function WritePage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <span className="eyebrow">Write</span>
      <h1 className="mt-4 text-h2 text-ink-green">Start a new piece</h1>
      <p className="mt-2 text-muted">
        Paste your material or drop in a URL. Wire diagnoses what it should become — grounded in your live
        keyword intelligence and Brand Brain — before it writes a word.
      </p>
      <NewDocument />
    </main>
  );
}
