/**
 * Plans & billing now live under Settings. Keep /billing as a redirect so old
 * links and post-checkout returns land there.
 */
import { redirect } from "next/navigation";

export default function BillingPage() {
  redirect("/settings");
}
