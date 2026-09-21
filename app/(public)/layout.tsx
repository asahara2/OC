import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { LiveMessageBanner } from "@/components/public/live-message-banner";
import { AutoScrollToggle } from "@/components/public/auto-scroll-toggle";
import { SiteVisuals } from "@/components/public/site-visuals";
import { getPublicSettings, listPublicMessages } from "@/lib/content";
import { publicIdentity } from "@/lib/presentation";
import "./public.css";
import "./journey.css";

export const dynamic = "force-dynamic";

export default async function PublicLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const [settings, messages] = await Promise.all([getPublicSettings(), listPublicMessages()]);
  const identity = publicIdentity(settings);
  return (
    <div className="public-site" id="top">
      <a className="oc-skip" href="#main-content">本文へスキップ</a>
      <SiteVisuals settings={settings} />
      <SiteHeader siteName={identity.displayName} />
      <LiveMessageBanner initialMessages={messages} />
      <AutoScrollToggle />
      <main className="oc-main" id="main-content">{children}</main>
      <SiteFooter siteName={identity.displayName} contactEmail={settings.contactEmail} />
    </div>
  );
}
