import { Avatar, type SpecialistId } from "./Avatars";

export function Bar({ u }: { u: string }) {
  return (
    <div className="bar">
      <i style={{ background: "#FF5F57" }} /><i style={{ background: "#FEBC2E" }} /><i style={{ background: "#28C840" }} />
      <span className="u">{u}</span>
    </div>
  );
}

/** App side-rail with the four specialists, the active one highlighted. */
export function Rail({ on }: { on: SpecialistId }) {
  const ids: SpecialistId[] = ["scout", "ada", "iris", "quill"];
  return (
    <aside className="rail">
      <div className="lg">M</div>
      {ids.map((id) => (
        <div key={id} className={`ri${id === on ? " on" : ""}`}>
          <Avatar id={id} />
        </div>
      ))}
    </aside>
  );
}
