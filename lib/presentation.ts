import type { PublicSettings } from "@/lib/content";

export const INITIAL_SITE_NAME = "おっぱい共同体";
export const INITIAL_CATCHPHRASE = "おっぱいの起源を探り自由に進行する次世代宗教";
export const CONTACT_EMAIL = "OC2026@proton.me";

// Presentation defaults only; explicit admin-configured values take precedence.
export function publicIdentity(settings: PublicSettings) {
  return {
    name: !settings.siteName || settings.siteName === "Organization" ? INITIAL_SITE_NAME : settings.siteName,
    description: !settings.siteDescription || settings.siteDescription === "Official website"
      ? INITIAL_CATCHPHRASE : settings.siteDescription,
    email: settings.contactEmail || CONTACT_EMAIL,
  };
}
