import type { WizardDraft } from "@/lib/wizard-steps";

export type StepProps = {
  draft: WizardDraft;
  patch: (p: Partial<WizardDraft>) => void;
  aiDrafted?: boolean;
};
