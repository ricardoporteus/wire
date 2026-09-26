/**
 * Marketing avatar art: the four "specialist" characters (scout/ada/iris/quill),
 * original geometric mascots, referenced by <use> from a single hidden sprite
 * rendered once per page via <AvatarSprite/>.
 */
import type { CSSProperties } from "react";

export type SpecialistId = "scout" | "ada" | "iris" | "quill";

export function Avatar({ id, className, style }: { id: SpecialistId; className?: string; style?: CSSProperties }) {
  return (
    <svg className={className} style={style} aria-hidden="true" role="img">
      <use href={`#mk-${id}`} />
    </svg>
  );
}

export function AvatarSprite() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
      <symbol id="mk-scout" viewBox="0 0 128 128"><rect width="128" height="128" rx="30" fill="#A9DBFF" /><ellipse cx="64" cy="122" rx="34" ry="7" fill="#0B66A8" opacity="0.14" /><path d="M22 128 C22 103 41 93 64 93 C87 93 106 103 106 128 Z" fill="#0E0E12" /><path d="M53 95 L64 105 L75 95" fill="none" stroke="#A9DBFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /><line x1="64" y1="34" x2="64" y2="23" stroke="#0E0E12" strokeWidth="3" strokeLinecap="round" /><circle cx="64" cy="20" r="4.5" fill="#0B66A8" /><rect x="40" y="34" width="48" height="46" rx="17" fill="#0E0E12" /><rect x="46" y="42" width="36" height="30" rx="12" fill="#050506" /><circle cx="57" cy="55" r="3.6" fill="#DBFE7A" /><circle cx="71" cy="55" r="3.6" fill="#DBFE7A" /><path d="M56.5 63 Q64 69 71.5 63" fill="none" stroke="#DBFE7A" strokeWidth="3" strokeLinecap="round" /><circle cx="97" cy="95" r="17" fill="#fff" /><circle cx="94" cy="92" r="6.5" fill="none" stroke="#0B66A8" strokeWidth="3" /><line x1="99" y1="97" x2="104" y2="102" stroke="#0B66A8" strokeWidth="3.4" strokeLinecap="round" /></symbol>
      <symbol id="mk-ada" viewBox="0 0 128 128"><rect width="128" height="128" rx="30" fill="#DBFE7A" /><ellipse cx="64" cy="122" rx="34" ry="7" fill="#3F6212" opacity="0.14" /><path d="M22 128 C22 103 41 93 64 93 C87 93 106 103 106 128 Z" fill="#0E0E12" /><path d="M53 95 L64 105 L75 95" fill="none" stroke="#DBFE7A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /><line x1="64" y1="34" x2="64" y2="24" stroke="#0E0E12" strokeWidth="3" strokeLinecap="round" /><path d="M59 24 L64 18 L69 24" fill="none" stroke="#3F6212" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /><rect x="40" y="34" width="48" height="46" rx="17" fill="#0E0E12" /><rect x="46" y="42" width="36" height="30" rx="12" fill="#050506" /><circle cx="57" cy="55" r="3.6" fill="#DBFE7A" /><circle cx="71" cy="55" r="3.6" fill="#DBFE7A" /><rect x="49" y="50" width="30" height="9" rx="4.5" fill="none" stroke="#DBFE7A" strokeWidth="2.2" opacity="0.85" /><path d="M56.5 63 Q64 69 71.5 63" fill="none" stroke="#DBFE7A" strokeWidth="3" strokeLinecap="round" /><circle cx="97" cy="95" r="17" fill="#fff" /><rect x="89" y="94" width="4" height="6" rx="1" fill="#3F6212" /><rect x="95" y="90" width="4" height="10" rx="1" fill="#3F6212" /><rect x="101" y="86" width="4" height="14" rx="1" fill="#3F6212" /></symbol>
      <symbol id="mk-iris" viewBox="0 0 128 128"><rect width="128" height="128" rx="30" fill="#FFECD3" /><ellipse cx="64" cy="122" rx="34" ry="7" fill="#8A5A1B" opacity="0.14" /><path d="M22 128 C22 103 41 93 64 93 C87 93 106 103 106 128 Z" fill="#0E0E12" /><path d="M53 95 L64 105 L75 95" fill="none" stroke="#FFECD3" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /><ellipse cx="64" cy="24" rx="16" ry="5" fill="none" stroke="#8A5A1B" strokeWidth="3" /><rect x="40" y="34" width="48" height="46" rx="17" fill="#0E0E12" /><rect x="46" y="42" width="36" height="30" rx="12" fill="#050506" /><circle cx="57" cy="55" r="3.6" fill="#DBFE7A" /><circle cx="71" cy="55" r="3.6" fill="#DBFE7A" /><path d="M56.5 63 Q64 69 71.5 63" fill="none" stroke="#DBFE7A" strokeWidth="3" strokeLinecap="round" /><circle cx="97" cy="95" r="17" fill="#fff" /><path d="M97 84 L106 88 V95 C106 100 102 104 97 106 C92 104 88 100 88 95 V88 Z" fill="#8A5A1B" /><path d="M93 95 L96 98 L101.5 92" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></symbol>
      <symbol id="mk-quill" viewBox="0 0 128 128"><rect width="128" height="128" rx="30" fill="#C5EFD4" /><ellipse cx="64" cy="122" rx="34" ry="7" fill="#1E7A44" opacity="0.14" /><path d="M22 128 C22 103 41 93 64 93 C87 93 106 103 106 128 Z" fill="#0E0E12" /><path d="M53 95 L64 105 L75 95" fill="none" stroke="#C5EFD4" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /><path d="M64 34 C64 27 68 22 74 20 C73 27 70 32 64 34 Z" fill="#1E7A44" /><rect x="40" y="34" width="48" height="46" rx="17" fill="#0E0E12" /><rect x="46" y="42" width="36" height="30" rx="12" fill="#050506" /><circle cx="57" cy="55" r="3.6" fill="#DBFE7A" /><circle cx="71" cy="55" r="3.6" fill="#DBFE7A" /><path d="M56.5 63 Q64 69 71.5 63" fill="none" stroke="#DBFE7A" strokeWidth="3" strokeLinecap="round" /><circle cx="97" cy="95" r="17" fill="#fff" /><path d="M97 84 L104 100 L97 96 L90 100 Z" fill="#1E7A44" /><circle cx="97" cy="93" r="2" fill="#fff" /></symbol>
    </svg>
  );
}
