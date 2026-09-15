import "./marketing.css";
import { AvatarSprite } from "./_components/Avatars";

/**
 * Wraps every marketing route in the `.mkt` scope (so marketing.css never
 * collides with the app's globals.css) and renders the avatar sprite once.
 */
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mkt">
      <AvatarSprite />
      {children}
    </div>
  );
}
