import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getPublicSettings } from "@/lib/content";

export const dynamic = "force-dynamic";

export default async function PublicLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const settings = await getPublicSettings();
  return (
    <>
      <SiteHeader siteName={settings.siteName} />
      <main><div className="container">{children}</div></main>
      <SiteFooter siteName={settings.siteName} contactEmail={settings.contactEmail} />
    </>
  );
}
