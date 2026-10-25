/**
 * The full keyword browser now lives on the Research page, under "Keywords from
 * this run". Keep /keywords as a redirect so old links still land there.
 */
import { redirect } from "next/navigation";

export default function KeywordsPage() {
  redirect("/audit");
}
