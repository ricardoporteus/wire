/**
 * /write now lives inside Content (the compose form + the Drafts/Published
 * lists are all there). Keep the route as a redirect so old links still land
 * somewhere sensible. The writer itself is /write/[id].
 */
import { redirect } from "next/navigation";

export default function WritePage() {
  redirect("/content");
}
