import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getPublicSettings } from "@/lib/content";
import { publicIdentity } from "@/lib/presentation";
import "./public.css";
import "./journey.css";

export const dynamic = "force-dynamic";

export default async function PublicLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const settings = await getPublicSettings();
  const identity = publicIdentity(settings);
  return (
    <div className="public-site" id="top">
      <a className="oc-skip" href="#main-content">本文へスキップ</a>
      <SiteHeader siteName={identity.displayName} />
      <main className="oc-main" id="main-content">{children}</main>
      <SiteFooter siteName={identity.displayName} contactEmail={settings.contactEmail} />
    </div>
  );
}
