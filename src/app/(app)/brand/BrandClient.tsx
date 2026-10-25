"use client";

/**
 * Brand — Iris's knowledge base (the Brand Brain). Promoted out of Settings
 * into its own area: company & ICP, voice, values, approved facts and formats.
 * This is what both agents read at runtime.
 */
import { useRef, useState, useTransition } from "react";
import { savePartial } from "../onboarding/actions";
import { requestFactsRefresh, getApprovedFacts } from "../settings/actions";
import { CompanyIcpStep } from "../onboarding/steps/CompanyIcpStep";
import { CompetitorsStep } from "../onboarding/steps/CompetitorsStep";
import { VoiceStep } from "../onboarding/steps/VoiceStep";
import { ValuesStep } from "../onboarding/steps/ValuesStep";
import { FormatsStep } from "../onboarding/steps/FormatsStep";
import type { WizardDraft } from "@/lib/wizard-steps";

const SECTIONS = [
  { title: "Company & ICP", Step: CompanyIcpStep },
  { title: "Competitors", Step: CompetitorsStep },
  { title: "Voice & vocabulary", Step: VoiceStep },
  { title: "Values & facts", Step: ValuesStep },
  { title: "Formats", Step: FormatsStep },
] as const;

export function BrandClient({
  brainId, brainName, initialDraft,
}: {
  brainId: string;
  brainName: string;
  initialDraft: WizardDraft;
}) {
  const [draft, setDraft] = useState<WizardDraft>(initialDraft);
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();

  const patch = (p: Partial<WizardDraft>) => { setDraft((d) => ({ ...d, ...p })); setSaved(false); };

  // "Refresh facts from live site" — fires the web-search job, then polls until
  // the approved-fact list changes (or times out) and folds it into the draft.
  const [refreshing, setRefreshing] = useState(false);
  const [refreshMsg, setRefreshMsg] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refreshFacts = async () => {
    if (refreshing) return;
    const baseline = JSON.stringify(draft.approvedFacts ?? []);
    setRefreshing(true);
    setRefreshMsg("Reading your live site — this takes a minute or two…");
    try {
      await requestFactsRefresh(brainId);
    } catch {
      setRefreshing(false);
      setRefreshMsg("Couldn’t start the refresh. Try again in a moment.");
      return;
    }
    const startedAt = Date.now();
    pollRef.current = setInterval(async () => {
      if (Date.now() - startedAt > 240_000) {
        if (pollRef.current) clearInterval(pollRef.current);
        setRefreshing(false);
        setRefreshMsg("Still running. Reload this page shortly to see the updated facts.");
        return;
      }
      const { approvedFacts } = await getApprovedFacts(brainId);
      if (JSON.stringify(approvedFacts) !== baseline) {
        if (pollRef.current) clearInterval(pollRef.current);
        patch({ approvedFacts });
        setRefreshing(false);
        setRefreshMsg(`Updated — ${approvedFacts.length} verified fact${approvedFacts.length === 1 ? "" : "s"} pulled from your site. Review below, then Save.`);
      }
    }, 4000);
  };

  const save = () =>
    start(async () => {
      await savePartial(brainId, {
        whatTheyDo: draft.whatTheyDo,
        differentiator: draft.differentiator || undefined,
        icp: draft.icp,
        competitors: draft.competitors,
        voice: draft.voice,
        vocabulary: draft.vocabulary,
        values: draft.values,
        approvedFacts: draft.approvedFacts,
        ethicsRules: draft.ethicsRules,
        formats: draft.formats,
      });
      setSaved(true);
    });

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <span className="eyebrow">Brand Brain · Iris</span>
      <h1 className="mt-4 text-h2 text-ink-green">Brand</h1>
      <p className="mt-2 text-body-sm text-muted">
        {brainName}&apos;s knowledge base. This is what both agents read at runtime — edits apply to the next research run and every new piece.
      </p>

      <div className="mt-8 grid gap-12 pb-24">
        <section className="card">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-xl">
              <h2 className="text-h4 text-ink-green">Approved facts</h2>
              <p className="mt-1 text-body-sm text-muted">
                The writer may only state specifics — prices, program names, ages, awards — that appear in this list.
                Refresh it to pull the current figures straight from your live site so nothing goes out of date.
              </p>
            </div>
            <button className="btn-primary shrink-0" disabled={refreshing} onClick={refreshFacts}>
              {refreshing ? "Refreshing…" : "Refresh facts from live site"}
            </button>
          </div>
          {refreshMsg && <p className="mt-3 text-caption text-ink">{refreshMsg}</p>}
        </section>

        {SECTIONS.map(({ title, Step }) => (
          <section key={title}>
            <h2 className="mb-4 text-h4 text-ink-green">{title}</h2>
            <Step draft={draft} patch={patch} />
          </section>
        ))}

        <div className="fixed inset-x-0 bottom-0 border-t border-line bg-card/95 backdrop-blur">
          <div className="mx-auto flex max-w-5xl items-center gap-3 px-6 py-3">
            <button className="btn-accent" disabled={pending} onClick={save}>
              {pending ? "Saving…" : saved ? "Saved ✓" : "Save changes"}
            </button>
            <span className="text-micro text-muted">Edits apply to the next run and every new piece.</span>
          </div>
        </div>
      </div>
    </main>
  );
}
